-- =====================================================================
-- APNA BAZAAR — SECURITY SETUP
-- Supabase → SQL Editor → New query → poora paste → Run.
-- Dobara chalana safe hai.
--
-- Is ke baad:
--   • Bahar ka koi bhi (bina login) orders / riders nahi dekh sakta.
--   • Customer sirf APNE orders dekhta hai.
--   • Rider sirf apna data aur apne orders; delivered orders mein customer
--     ka naam / phone / address / location nahi milta. Naye orders mein
--     sirf area aur distance.
--   • Rider khud ko approve nahi kar sakta (sirf online/offline).
--   • Admin (saifyounas112@gmail.com) sab dekh / badal / delete kar sakta hai.
--   • Products sab dekh sakte hain, badal sirf admin sakta hai.
--   • Rider ke CNIC / documents private (sirf admin, signed link se).
-- =====================================================================


-- 0) Admin pehchan
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'saifyounas112@gmail.com'
$$;


-- 1) Har order ke saath customer ka account (naye orders khud bharenge)
alter table public.orders add column if not exists customer_user_id uuid default auth.uid();
alter table public.orders alter column customer_user_id set default auth.uid();
create index if not exists idx_orders_customer_user on public.orders(customer_user_id);


-- 2) Purani khuli policies hatao (riders ki INSERT policy registration ke liye rehne do)
do $$
declare p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in ('orders', 'products')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;

  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'riders' and cmd <> 'INSERT'
  loop
    execute format('drop policy %I on public.riders', p.policyname);
  end loop;
end $$;

alter table public.orders   enable row level security;
alter table public.riders   enable row level security;
alter table public.products enable row level security;


-- 3) ORDERS
revoke all on public.orders from anon;
grant select, insert, update, delete on public.orders to authenticated;

create policy "Customer places own order" on public.orders
  for insert to authenticated with check (customer_user_id = auth.uid());
create policy "Customer reads own orders" on public.orders
  for select to authenticated using (customer_user_id = auth.uid());
create policy "Admin reads orders" on public.orders
  for select to authenticated using (public.is_admin());
create policy "Admin updates orders" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admin deletes orders" on public.orders
  for delete to authenticated using (public.is_admin());


-- 4) RIDERS
revoke select, update, delete on public.riders from anon;
grant select, insert, update, delete on public.riders to authenticated;

drop policy if exists "Rider creates own row" on public.riders;
create policy "Rider creates own row" on public.riders
  for insert to authenticated with check (id = auth.uid());
create policy "Rider reads own row" on public.riders
  for select to authenticated using (id = auth.uid());
create policy "Admin reads riders" on public.riders
  for select to authenticated using (public.is_admin());
create policy "Admin updates riders" on public.riders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admin deletes riders" on public.riders
  for delete to authenticated using (public.is_admin());

-- Rider sirf online/offline badal sakta hai (approval nahi)
create or replace function public.set_rider_presence(p_online boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.riders
  set is_online = (p_online and approval_status = 'approved' and coalesce(is_active, false)),
      last_seen_at = now()
  where id = auth.uid();
end;
$$;


-- 5) Rider ke orders (sirf zaroori columns)
create or replace function public.get_available_orders()
returns setof json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'id', o.id, 'created_at', o.created_at, 'customer_area', o.customer_area,
    'distance_km', o.distance_km, 'delivery_charge', o.delivery_charge,
    'subtotal', o.subtotal, 'grand_total', o.grand_total, 'items', o.items,
    'order_status', o.order_status, 'rider_status', o.rider_status,
    'delivery_request_status', o.delivery_request_status,
    'assigned_rider_id', o.assigned_rider_id)
  from public.orders o
  where o.assigned_rider_id is null
    and o.rider_status is null
    and o.delivery_request_status = 'waiting'
    and exists (
      select 1 from public.riders r
      where r.id = auth.uid() and r.approval_status = 'approved' and coalesce(r.is_active, false))
  order by o.created_at desc
  limit 50
$$;

create or replace function public.get_my_rider_orders()
returns setof json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'id', o.id, 'created_at', o.created_at, 'customer_area', o.customer_area,
    'distance_km', o.distance_km, 'delivery_charge', o.delivery_charge,
    'subtotal', o.subtotal, 'grand_total', o.grand_total, 'items', o.items,
    'order_status', o.order_status, 'rider_status', o.rider_status,
    'delivery_request_status', o.delivery_request_status,
    'assigned_rider_id', o.assigned_rider_id, 'assigned_at', o.assigned_at,
    'rider_status_updated_at', o.rider_status_updated_at,
    -- Delivery ke baad customer ki details khatam
    'customer_name',      case when o.rider_status = 'Delivered' then null else o.customer_name end,
    'customer_phone',     case when o.rider_status = 'Delivered' then null else o.customer_phone end,
    'customer_address',   case when o.rider_status = 'Delivered' then null else o.customer_address end,
    'customer_latitude',  case when o.rider_status = 'Delivered' then null else o.customer_latitude end,
    'customer_longitude', case when o.rider_status = 'Delivered' then null else o.customer_longitude end)
  from public.orders o
  where o.assigned_rider_id = auth.uid()
  order by o.created_at desc
  limit 100
$$;

revoke execute on function public.set_rider_presence(boolean) from public, anon;
revoke execute on function public.get_available_orders() from public, anon;
revoke execute on function public.get_my_rider_orders() from public, anon;
grant execute on function public.set_rider_presence(boolean) to authenticated;
grant execute on function public.get_available_orders() to authenticated;
grant execute on function public.get_my_rider_orders() to authenticated;


-- 6) PRODUCTS
grant select on public.products to anon, authenticated;
revoke insert, update, delete on public.products from anon;
grant insert, update, delete on public.products to authenticated;

create policy "Anyone reads products" on public.products
  for select to anon, authenticated using (true);
create policy "Admin adds products" on public.products
  for insert to authenticated with check (public.is_admin());
create policy "Admin updates products" on public.products
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admin deletes products" on public.products
  for delete to authenticated using (public.is_admin());


-- 7) STORAGE: rider documents private, product images sirf admin upload kare
update storage.buckets set public = false where id = 'rider-documents';

drop policy if exists "Admin reads rider documents" on storage.objects;
create policy "Admin reads rider documents" on storage.objects
  for select to authenticated using (bucket_id = 'rider-documents' and public.is_admin());

drop policy if exists "Admin uploads product images" on storage.objects;
create policy "Admin uploads product images" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());


-- 8) Realtime (admin ko live orders / naye riders)
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  begin alter publication supabase_realtime add table public.orders; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.riders; exception when duplicate_object then null; end;
end $$;


-- 9) Check: neeche policies ki list aani chahiye
select tablename, policyname, cmd from pg_policies
where schemaname = 'public' and tablename in ('orders', 'riders', 'products')
order by tablename, cmd, policyname;
