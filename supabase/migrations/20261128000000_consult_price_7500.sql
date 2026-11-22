-- =====================================================================================
-- Consultation fee: ₦7,500 (run AFTER the earlier scripts). Safe to run more than once.
-- Sets every consult type that people can book (those with a fee) to ₦7,500.
-- You can still change any fee later in Admin → Consults and fees.
-- =====================================================================================

update public.consult_types set price_naira = 7500, updated_at = now() where price_naira is not null;
