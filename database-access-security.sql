-- Apna Bazaar: database access and order privacy hardening
-- Run this AFTER rider-runtime-fixes.sql in Supabase SQL Editor.
-- This migration keeps existing admin/rider flows working while limiting
-- customer order reads to the signed-in owner.

-- 1) Bind every new customer order to the authenticated customer.
alter table public.orders
    add column if not exists customer_user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_orders_customer_user_id
    on public.orders(customer_user_id);

-- 2) Order reads: admin sees all; customer sees only own; rider sees assigned
-- orders and waiting orders only while approved, active, and online.
drop policy if exists "Authenticated can read delivery orders" on public.orders;
drop policy if exists "Scoped order reads" on public.orders;
create policy "Scoped order reads"
on public.orders
for select
to authenticated
using (
    (auth.jwt() ->> 'email') = 'saifyounas112@gmail.com'
    or customer_user_id = auth.uid()
    or assigned_rider_id = auth.uid()
    or (
        assigned_rider_id is null
        and coalesce(delivery_request_status, '') = 'waiting'
        and exists (
            select 1
            from public.riders r
            where r.id = auth.uid()
              and r.approval_status = 'approved'
              and r.is_active = true
              and r.is_online = true
        )
    )
);

-- Restrictive guard prevents another old permissive SELECT policy from
-- accidentally opening every order to every authenticated account.
drop policy if exists "Order read privacy guard" on public.orders;
create policy "Order read privacy guard"
on public.orders
as restrictive
for select
to authenticated
using (
    (auth.jwt() ->> 'email') = 'saifyounas112@gmail.com'
    or customer_user_id = auth.uid()
    or assigned_rider_id = auth.uid()
    or (
        assigned_rider_id is null
        and coalesce(delivery_request_status, '') = 'waiting'
        and exists (
            select 1
            from public.riders r
            where r.id = auth.uid()
              and r.approval_status = 'approved'
              and r.is_active = true
              and r.is_online = true
        )
    )
);

-- 3) Customers may create orders only for their own authenticated account.
drop policy if exists "Customers can create their own orders" on public.orders;
create policy "Customers can create their own orders"
on public.orders
for insert
to authenticated
with check (customer_user_id = auth.uid());

drop policy if exists "Order insert privacy guard" on public.orders;
create policy "Order insert privacy guard"
on public.orders
as restrictive
for insert
to authenticated
with check (customer_user_id = auth.uid());

-- 4) Only the admin account may directly assign/update or delete orders.
drop policy if exists "Admin can update orders" on public.orders;
create policy "Admin can update orders"
on public.orders
for update
to authenticated
using ((auth.jwt() ->> 'email') = 'saifyounas112@gmail.com')
with check ((auth.jwt() ->> 'email') = 'saifyounas112@gmail.com');

drop policy if exists "Order update privacy guard" on public.orders;
create policy "Order update privacy guard"
on public.orders
as restrictive
for update
to authenticated
using ((auth.jwt() ->> 'email') = 'saifyounas112@gmail.com')
with check ((auth.jwt() ->> 'email') = 'saifyounas112@gmail.com');

drop policy if exists "Admin can delete orders" on public.orders;
create policy "Admin can delete orders"
on public.orders
for delete
to authenticated
using ((auth.jwt() ->> 'email') = 'saifyounas112@gmail.com');

drop policy if exists "Order delete privacy guard" on public.orders;
create policy "Order delete privacy guard"
on public.orders
as restrictive
for delete
to authenticated
using ((auth.jwt() ->> 'email') = 'saifyounas112@gmail.com');

grant select, insert, update, delete on public.orders to authenticated;

-- 5) Rider profiles: a rider can read only their own row; admin can read all.
drop policy if exists "Approved riders can read rider rows" on public.riders;
drop policy if exists "Scoped rider reads" on public.riders;
create policy "Scoped rider reads"
on public.riders
for select
to authenticated
using (
    (auth.jwt() ->> 'email') = 'saifyounas112@gmail.com'
    or id = auth.uid()
);

drop policy if exists "Rider read privacy guard" on public.riders;
create policy "Rider read privacy guard"
on public.riders
as restrictive
for select
to authenticated
using (
    (auth.jwt() ->> 'email') = 'saifyounas112@gmail.com'
    or id = auth.uid()
);

-- Rider registration: only create a pending, inactive profile tied to own auth UID.
drop policy if exists "Rider can register own profile" on public.riders;
create policy "Rider can register own profile"
on public.riders
for insert
to authenticated
with check (
    id = auth.uid()
    and coalesce(approval_status, 'pending') = 'pending'
    and coalesce(is_active, false) = false
    and coalesce(is_online, false) = false
);

drop policy if exists "Rider insert privacy guard" on public.riders;
create policy "Rider insert privacy guard"
on public.riders
as restrictive
for insert
to authenticated
with check (
    id = auth.uid()
    and coalesce(approval_status, 'pending') = 'pending'
    and coalesce(is_active, false) = false
    and coalesce(is_online, false) = false
);

-- Riders can update presence only. Revoke broad table UPDATE to prevent a rider
-- from approving or activating their own account.
drop policy if exists "Rider can update own presence" on public.riders;
create policy "Rider can update own presence"
on public.riders
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Rider update privacy guard" on public.riders;
create policy "Rider update privacy guard"
on public.riders
as restrictive
for update
to authenticated
using (
    (auth.jwt() ->> 'email') = 'saifyounas112@gmail.com'
    or id = auth.uid()
)
with check (
    (auth.jwt() ->> 'email') = 'saifyounas112@gmail.com'
    or id = auth.uid()
);

revoke update on public.riders from authenticated;
grant select, insert on public.riders to authenticated;
grant update (is_online, last_seen_at) on public.riders to authenticated;

-- Admin-only RPC replaces direct client-side changes to approval fields.
create or replace function public.admin_set_rider_status(
    p_rider_id uuid,
    p_status text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
    if (auth.jwt() ->> 'email') is distinct from 'saifyounas112@gmail.com' then
        raise exception 'Only the Apna Bazaar admin can change rider approval.';
    end if;

    if p_status not in ('approved', 'rejected') then
        raise exception 'Invalid rider approval status.';
    end if;

    update public.riders
    set approval_status = p_status,
        is_active = (p_status = 'approved'),
        is_online = false,
        approved_at = case when p_status = 'approved' then now() else null end
    where id = p_rider_id;

    return found;
end;
$$;

revoke all on function public.admin_set_rider_status(uuid, text) from public, anon;
grant execute on function public.admin_set_rider_status(uuid, text) to authenticated;

-- 6) Rider documents: permit authenticated riders to upload only inside
-- their own user-id folder. Existing bucket visibility is not changed here.
drop policy if exists "Riders upload own documents" on storage.objects;
create policy "Riders upload own documents"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'rider-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
);
