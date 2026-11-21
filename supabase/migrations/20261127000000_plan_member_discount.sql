-- =====================================================================================
-- Health plan perks (run AFTER the earlier scripts). Safe to run more than once.
--  * The yearly plan price, editable in Admin → Consults and fees (default ₦1,500).
--  * A discount on doctor consults while someone's plan is active: a fixed amount or a
--    percentage (default ₦2,500 off). Consults never go below ₦100, so Paystack can charge them.
--  * Each booking records the discount it got.
-- =====================================================================================

alter table public.booking_settings add column if not exists plan_price_naira int not null default 1500 check (plan_price_naira between 100 and 1000000);
alter table public.booking_settings add column if not exists plan_discount_type text not null default 'fixed' check (plan_discount_type in ('none', 'percent', 'fixed'));
alter table public.booking_settings add column if not exists plan_discount_value int not null default 2500 check (plan_discount_value between 0 and 1000000);
alter table public.booking_settings drop constraint if exists booking_settings_percent_ok;
alter table public.booking_settings add constraint booking_settings_percent_ok check (plan_discount_type <> 'percent' or plan_discount_value <= 100);

alter table public.bookings add column if not exists discount_kobo int not null default 0 check (discount_kobo >= 0);
