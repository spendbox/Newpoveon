-- =====================================================================================
-- Voice notes on doctor bookings (run AFTER the earlier scripts). Safe to run more than once.
-- Recordings go in a PRIVATE storage bucket. Only our server can read or write them; the team
-- listens through short-lived links in Admin → Doctor bookings.
-- =====================================================================================
alter table public.bookings add column if not exists voice_note_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('voice-notes', 'voice-notes', false, 3145728, array['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/aac', 'audio/wav'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
-- No storage policies on purpose: the public and logged-in people cannot list, read or upload.
