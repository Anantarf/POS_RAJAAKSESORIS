-- =============================================================================
-- SEED DATA - POS Raja Aksesoris
-- =============================================================================
--
-- File ini menyiapkan akun pengguna awal untuk sistem POS.
-- Jalankan di: Supabase Dashboard > SQL Editor
--
-- AKUN LOGIN YANG TERSEDIA:
-- ┌──────────────┬───────────────────┬──────────────┬──────────┐
-- │ Username     │ Email             │ Password     │ Role     │
-- ├──────────────┼───────────────────┼──────────────┼──────────┤
-- │ owner        │ owner@raja.pos    │ owner123     │ pemilik  │
-- │ kasir1       │ kasir1@raja.pos   │ kasir123     │ kasir    │
-- └──────────────┴───────────────────┴──────────────┴──────────┘
--
-- CARA MENJALANKAN:
-- 1. Buka Supabase Dashboard > Authentication > Users
-- 2. Buat user secara MANUAL dengan email & password sesuai tabel di atas
--    (karena Supabase tidak memperbolehkan insert langsung ke auth.users via SQL biasa)
-- 3. Setelah user Auth dibuat, jalankan SQL ini di SQL Editor
--
-- ALTERNATIF (jika pakai Supabase CLI / local dev):
-- Untuk local dev, kamu bisa uncomment bagian INSERT auth.users di bawah.
-- =============================================================================

-- Pastikan ekstensi tersedia
create extension if not exists pgcrypto;

-- =============================================================================
-- LANGKAH 1: Pastikan tabel & kolom sudah ada (idempotent)
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

alter table public.users
  add column if not exists email       text,
  add column if not exists username    text,
  add column if not exists pin_hash    text,
  add column if not exists status      text not null default 'active',
  add column if not exists archived_at timestamptz;

create unique index if not exists idx_users_email_unique
  on public.users (lower(email))
  where email is not null and archived_at is null;

create unique index if not exists idx_users_username_unique
  on public.users (lower(username))
  where username is not null and archived_at is null;

-- =============================================================================
-- LANGKAH 2: Fungsi resolve username → email (untuk login pakai username)
-- =============================================================================

create or replace function public.resolve_login_email(p_identifier text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_identifier text := lower(btrim(coalesce(p_identifier, '')));
  v_email text;
begin
  if v_identifier = '' then
    return null;
  end if;

  select lower(auth_user.email)
  into v_email
  from public.users as u
  join auth.users as auth_user on auth_user.id = u.id
  where
    u.archived_at is null
    and coalesce(u.status, 'active') = 'active'
    and (
      lower(auth_user.email) = v_identifier
      or lower(u.username)   = v_identifier
    )
  limit 1;

  return v_email;
end;
$$;

grant execute on function public.resolve_login_email(text) to anon, authenticated;

-- =============================================================================
-- LANGKAH 3: Insert profil ke public.users
--            (auth.users sudah harus ada terlebih dahulu via Dashboard)
-- =============================================================================

-- ── OWNER ────────────────────────────────────────────────────────────────────
-- Email    : owner@raja.pos
-- Password : owner123  (set saat buat user di Supabase Authentication)
-- Username : owner
-- PIN      : 1234
insert into public.users (id, nama, email, username, role, pin_hash, status, archived_at)
select
  auth_user.id,
  'Owner Raja Aksesoris',
  null,           -- email disimpan di auth.users, tidak perlu duplikasi
  'owner',
  'pemilik',
  crypt('1234', gen_salt('bf')),
  'active',
  null
from auth.users as auth_user
where lower(auth_user.email) = lower('owner@raja.pos')
on conflict (id) do update
set
  nama        = excluded.nama,
  username    = excluded.username,
  role        = excluded.role,
  pin_hash    = excluded.pin_hash,
  status      = 'active',
  archived_at = null;

-- ── KASIR 1 ──────────────────────────────────────────────────────────────────
-- Email    : kasir1@raja.pos
-- Password : kasir123  (set saat buat user di Supabase Authentication)
-- Username : kasir1
-- PIN      : 1234
insert into public.users (id, nama, email, username, role, pin_hash, status, archived_at)
select
  auth_user.id,
  'Kasir Satu',
  null,
  'kasir1',
  'kasir',
  crypt('1234', gen_salt('bf')),
  'active',
  null
from auth.users as auth_user
where lower(auth_user.email) = lower('kasir1@raja.pos')
on conflict (id) do update
set
  nama        = excluded.nama,
  username    = excluded.username,
  role        = excluded.role,
  pin_hash    = excluded.pin_hash,
  status      = 'active',
  archived_at = null;

-- =============================================================================
-- LANGKAH 4: Update metadata role di auth.users (opsional tapi direkomendasikan)
-- =============================================================================

update auth.users
set raw_user_meta_data =
  (coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'pemilik', 'name', 'Owner Raja Aksesoris')) - 'pin'
where lower(email) = 'owner@raja.pos';

update auth.users
set raw_user_meta_data =
  (coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'kasir', 'name', 'Kasir Satu')) - 'pin'
where lower(email) = 'kasir1@raja.pos';

-- =============================================================================
-- VERIFIKASI - Lihat hasil seed
-- =============================================================================

select
  u.username,
  u.nama,
  u.role,
  u.status,
  au.email  as auth_email,
  au.created_at
from public.users u
join auth.users au on au.id = u.id
order by u.role, u.nama;
