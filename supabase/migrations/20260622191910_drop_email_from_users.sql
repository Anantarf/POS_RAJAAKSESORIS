-- =============================================================================
-- MIGRATION: Drop email column from public.users
-- =============================================================================
-- Karena sistem login sekarang sepenuhnya mengandalkan username,
-- kolom email di public.users tidak lagi diperlukan.
--
-- Catatan: Supabase Auth (auth.users) tetap menyimpan email secara internal.

do $$ begin
  alter table public.users drop column if exists email;
exception
  when others then null; -- abaikan jika kolom sudah tidak ada
end $$;
