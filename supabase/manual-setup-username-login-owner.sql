-- 1) Buat user dulu di Supabase Dashboard > Authentication > Users:
--    Email    : owner@raja.pos
--    Password : isi password yang kamu mau
--
-- 2) Setelah Auth user dibuat, jalankan SQL ini di Supabase SQL Editor.

create extension if not exists pgcrypto;

do $$
begin
  create type public.user_role as enum ('pemilik', 'kasir');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null,
  role public.user_role not null default 'kasir',
  created_at timestamptz default now()
);

alter table public.users
  add column if not exists email text,
  add column if not exists username text,
  add column if not exists status text not null default 'active',
  add column if not exists archived_at timestamptz;

create unique index if not exists idx_users_email_unique
on public.users (lower(email))
where email is not null and archived_at is null;

create unique index if not exists idx_users_username_unique
on public.users (lower(username))
where username is not null and archived_at is null;

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
      or lower(u.username) = v_identifier
    )
  limit 1;

  return v_email;
end;
$$;

grant execute on function public.resolve_login_email(text) to anon, authenticated;

insert into public.users (
  id,
  nama,
  email,
  username,
  role,
  status,
  archived_at
)
select
  auth_user.id,
  'Owner Raja',
  null,
  'owner',
  'pemilik',
  'active',
  null
from auth.users as auth_user
where lower(auth_user.email) = lower('owner@raja.pos')
on conflict (id) do update
set
  nama = excluded.nama,
  email = null,
  username = excluded.username,
  role = excluded.role,
  status = excluded.status,
  archived_at = null;

select
  id,
  nama,
  username,
  role,
  status,
  archived_at
from public.users
where username = 'owner';
