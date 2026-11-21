-- =====================================================================================
-- Simpler "Get help" (run AFTER the earlier scripts). Safe to run more than once.
--  * A general "Talk to a doctor" consult, used when someone just records what's going on
--    (no categories to choose). It asks the safety questions first and starts at the same fee
--    as "Help me understand my results". Change the fee in Admin → Consults and fees.
--  * Lets people attach up to 3 photos or PDFs (lab results, a prescription, a photo of a rash),
--    kept in a PRIVATE storage folder that only the admin panel can open.
-- =====================================================================================

insert into public.consult_types (code, name, description, grp, doctor_type, duration_min, price_naira, urgent_check, sort, active)
select 'doctor-consult', 'Talk to a doctor', 'Tell us what''s going on in a voice note or a few words.', 'Common', 'General physician', 20,
       coalesce((select price_naira from public.consult_types where code = 'results-review'),
                (select price_naira from public.consult_types where code = 'new-symptom')),
       true, 5, true
on conflict (code) do nothing;

alter table public.bookings add column if not exists attachment_paths text[] not null default '{}';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('attachments', 'attachments', false, 3145728,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
