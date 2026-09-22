-- APNA BAZAAR FINAL RIDER SYSTEM SETUP
-- Run this entire file once in Supabase SQL Editor.

alter table public.riders add column if not exists last_seen_at timestamptz;
alter table public.orders add column if not exists assigned_rider_id uuid references public.riders(id) on delete set null;
alter table public.orders add column if not exists assigned_at timestamptz;
alter table public.orders add column if not exists rider_status text default 'Waiting for Rider';
alter table public.orders add column if not exists rider_status_updated_at timestamptz;

create index if not exists idx_orders_assigned_rider on public.orders(assigned_rider_id);
create index if not exists idx_riders_online on public.riders(is_online, approval_status, is_active);

grant select, update on public.riders to authenticated;
grant select, update on public.orders to authenticated;

alter table public.riders enable row level security;
alter table public.orders enable row level security;

drop policy if exists "Approved riders can read rider rows" on public.riders;
create policy "Approved riders can read rider rows" on public.riders for select to authenticated using (true);

drop policy if exists "Rider can update own presence" on public.riders;
create policy "Rider can update own presence" on public.riders for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Authenticated can read delivery orders" on public.orders;
create policy "Authenticated can read delivery orders" on public.orders for select to authenticated using (true);

-- Atomic first-rider-wins claim. Only an approved, active, online rider can claim.
create or replace function public.claim_delivery_order(p_order_id bigint)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed_count integer;
begin
  if not exists (
    select 1 from public.riders r
    where r.id = auth.uid()
      and r.approval_status = 'approved'
      and r.is_active = true
      and r.is_online = true
  ) then
    raise exception 'Rider must be approved and online';
  end if;

  update public.orders
  set assigned_rider_id = auth.uid(),
      assigned_at = now(),
      rider_status = 'Accepted',
      rider_status_updated_at = now(),
      order_status = case when coalesce(order_status,'Pending') in ('Pending','Accepted','Preparing') then 'Out for Delivery' else order_status end
  where id = p_order_id
    and assigned_rider_id is null
    and coalesce(rider_status,'Waiting for Rider') in ('Waiting for Rider','Unassigned','');

  get diagnostics claimed_count = row_count;
  return claimed_count = 1;
end;
$$;

grant execute on function public.claim_delivery_order(bigint) to authenticated;

create or replace function public.update_rider_order_status(p_order_id bigint, p_new_status text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_new_status not in ('Accepted','Picked Up','On The Way','Delivered') then
    raise exception 'Invalid rider status';
  end if;

  update public.orders
  set rider_status = p_new_status,
      rider_status_updated_at = now(),
      order_status = case
        when p_new_status = 'Delivered' then 'Delivered'
        when p_new_status in ('Picked Up','On The Way') then 'Out for Delivery'
        else order_status
      end
  where id = p_order_id
    and assigned_rider_id = auth.uid();

  return found;
end;
$$;

grant execute on function public.update_rider_order_status(bigint,text) to authenticated;

-- Add tables to realtime publication when possible.
do $$ begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.riders;
exception when duplicate_object then null; end $$;