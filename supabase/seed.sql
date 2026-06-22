-- =============================================================================
-- SEED DATA - POS Raja Aksesoris
-- =============================================================================
--
-- Login di aplikasi ini HANYA menggunakan USERNAME + PASSWORD.
-- Email hanya dipakai secara internal oleh Supabase Auth (auth.users),
-- dan TIDAK disimpan di tabel profil public.users.
--
-- AKUN LOGIN:
-- ┌──────────────┬──────────────┬──────────┐
-- │ Username     │ Password     │ Role     │
-- ├──────────────┼──────────────┼──────────┤
-- │ owner        │ owner123     │ pemilik  │
-- │ kasir1       │ kasir123     │ kasir    │
-- └──────────────┴──────────────┴──────────┘
--
-- PIN (untuk konfirmasi aksi di dalam aplikasi):
-- Semua akun default PIN: 1234
--
-- CARA MENJALANKAN:
-- 1. Buka Supabase Dashboard → Authentication → Users → Add user
--    Buat 2 user berikut (email hanya untuk keperluan internal Supabase Auth):
--      • Email: owner@internal   Password: owner123
--      • Email: kasir1@internal  Password: kasir123
-- 2. Jalankan SQL ini di Supabase Dashboard → SQL Editor
-- =============================================================================

create extension if not exists pgcrypto;

-- =============================================================================
-- LANGKAH 1: Pastikan tipe & tabel sudah ada (aman dijalankan berulang)
-- =============================================================================

do $$ begin
  create type public.user_role as enum ('pemilik', 'kasir');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  nama        text not null,
  role        public.user_role not null default 'kasir',
  created_at  timestamptz default now()
);

-- Tambah kolom yang dibutuhkan (tidak ada kolom email)
alter table public.users
  add column if not exists username    text,
  add column if not exists phone       text,
  add column if not exists pin_hash    text,
  add column if not exists status      text not null default 'active',
  add column if not exists archived_at timestamptz;

-- Hapus kolom email jika masih ada (migrasi dari sistem lama)
do $$ begin
  alter table public.users drop column if exists email;
exception
  when others then null; -- abaikan jika sudah tidak ada
end $$;

-- Index unik untuk username
create unique index if not exists idx_users_username_unique
  on public.users (lower(username))
  where username is not null and archived_at is null;

-- =============================================================================
-- LANGKAH 2: Fungsi resolve username → email internal (untuk Supabase Auth)
-- =============================================================================
-- Fungsi ini menjembatani username (yang dipakai user) ke email internal
-- yang dibutuhkan Supabase Auth saat signInWithPassword.

create or replace function public.resolve_login_email(p_identifier text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_identifier text := lower(btrim(coalesce(p_identifier, '')));
  v_email      text;
begin
  if v_identifier = '' then
    return null;
  end if;

  -- Cari berdasarkan username saja (tidak lagi mendukung login via email)
  select lower(auth_user.email)
  into v_email
  from public.users as u
  join auth.users as auth_user on auth_user.id = u.id
  where
    u.archived_at is null
    and coalesce(u.status, 'active') = 'active'
    and lower(u.username) = v_identifier
  limit 1;

  return v_email;
end;
$$;

grant execute on function public.resolve_login_email(text) to anon, authenticated;

-- =============================================================================
-- LANGKAH 3: Insert profil ke public.users (tanpa kolom email)
-- =============================================================================

-- ── OWNER ────────────────────────────────────────────────────────────────────
-- Supabase Auth email : owner@internal
-- Login username      : owner
-- Login password      : owner123
-- PIN                 : 1234
insert into public.users (id, nama, username, role, pin_hash, status, archived_at)
select
  auth_user.id,
  'Owner Raja Aksesoris',
  'owner',
  'pemilik',
  crypt('1234', gen_salt('bf')),
  'active',
  null
from auth.users as auth_user
where lower(auth_user.email) = lower('owner@internal')
on conflict (id) do update
set
  nama        = excluded.nama,
  username    = excluded.username,
  role        = excluded.role,
  pin_hash    = excluded.pin_hash,
  status      = 'active',
  archived_at = null;

-- ── KASIR 1 ──────────────────────────────────────────────────────────────────
-- Supabase Auth email : kasir1@internal
-- Login username      : kasir1
-- Login password      : kasir123
-- PIN                 : 1234
insert into public.users (id, nama, username, role, pin_hash, status, archived_at)
select
  auth_user.id,
  'Kasir Satu',
  'kasir1',
  'kasir',
  crypt('1234', gen_salt('bf')),
  'active',
  null
from auth.users as auth_user
where lower(auth_user.email) = lower('kasir1@internal')
on conflict (id) do update
set
  nama        = excluded.nama,
  username    = excluded.username,
  role        = excluded.role,
  pin_hash    = excluded.pin_hash,
  status      = 'active',
  archived_at = null;

-- =============================================================================
-- LANGKAH 4: Update metadata role di auth.users
-- =============================================================================

update auth.users
set raw_user_meta_data =
  (coalesce(raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', 'pemilik', 'name', 'Owner Raja Aksesoris')) - 'pin'
where lower(email) = 'owner@internal';

update auth.users
set raw_user_meta_data =
  (coalesce(raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', 'kasir', 'name', 'Kasir Satu')) - 'pin'
where lower(email) = 'kasir1@internal';

-- =============================================================================
-- VERIFIKASI HASIL
-- =============================================================================

select
  u.username,
  u.nama,
  u.role,
  u.status,
  u.archived_at
from public.users u
order by u.role, u.nama;
