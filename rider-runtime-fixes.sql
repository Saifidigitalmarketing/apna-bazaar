-- Apna Bazaar rider runtime fixes
-- Run once in Supabase SQL Editor.
-- These fixes match the current rider.html without requiring a frontend rewrite.

-- 1) New unassigned orders are discovered by rider.html with rider_status IS NULL.
-- The old schema defaulted rider_status to 'Waiting for Rider', so new orders could
-- disappear from the New Orders tab. Keep Waiting for Rider supported by the claim
-- function, but make unassigned orders NULL so the existing rider query can see them.
alter table public.orders
    alter column rider_status drop default;

update public.orders
set rider_status = null,
    rider_status_updated_at = null
where assigned_rider_id is null
  and coalesce(rider_status, 'Waiting for Rider') in ('Waiting for Rider', 'Unassigned', '');

-- 2) rider.html currently calls update_delivery_status(...), while the original
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
