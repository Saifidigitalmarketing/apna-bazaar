-- Apna Bazaar rider runtime fixes
-- Run once in Supabase SQL Editor.
-- These fixes match the current rider.html without requiring a frontend rewrite.

-- 1) New orders need a delivery_request_status value because rider.html only
-- lists unassigned orders where this value is 'waiting'.
alter table public.orders
    add column if not exists delivery_request_status text;

alter table public.orders
    alter column delivery_request_status set default 'waiting';

-- Make every new unassigned order visible to riders automatically.
create or replace function public.set_new_order_delivery_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if new.assigned_rider_id is null and new.delivery_request_status is null then
        new.delivery_request_status := 'waiting';
    end if;
    return new;
end;
$$;

drop trigger if exists trg_set_new_order_delivery_request on public.orders;
create trigger trg_set_new_order_delivery_request
before insert on public.orders
for each row execute function public.set_new_order_delivery_request();

-- Fix existing unassigned orders too.
update public.orders
set delivery_request_status = 'waiting'
where assigned_rider_id is null
  and coalesce(delivery_request_status, '') = '';

-- 2) The old rider SQL gave rider_status a default of 'Waiting for Rider',
-- while rider.html looks for NULL on new/unassigned orders. Remove that default
-- so new orders can be discovered by the current rider query.
alter table public.orders
    alter column rider_status drop default;

update public.orders
set rider_status = null,
    rider_status_updated_at = null
where assigned_rider_id is null
  and coalesce(rider_status, 'Waiting for Rider') in ('Waiting for Rider', 'Unassigned', '');

-- 3) rider.html currently calls update_delivery_status(...), while the original
-- rider SQL created update_rider_order_status(...). Add a compatibility wrapper so
-- the existing Mark Picked Up / On The Way / Delivered buttons work.
create or replace function public.update_delivery_status(
    p_order_id bigint,
    p_status text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
    return public.update_rider_order_status(p_order_id, p_status);
end;
$$;

grant execute on function public.update_delivery_status(bigint, text) to authenticated;
