-- =============================================================================
-- QUERY SETUP AKUN: Pemilik (ananta) + Kasir Baru
-- Jalankan di: Supabase Dashboard > SQL Editor
-- Jalankan SATU blok sekaligus (pisahkan per bagian).
-- =============================================================================


-- =============================================================================
-- BAGIAN 1: AUDIT / LIHAT DATA USER YANG ADA DULU
-- Jalankan ini dulu sebelum apapun untuk melihat kondisi awal.
-- =============================================================================
select
  u.id,
  u.nama,
  u.username,
  u.role::text,
  u.status,
  u.archived_at,
  au.email,
  au.created_at as auth_created_at,
  au.last_sign_in_at
from public.users as u
join auth.users as au on au.id = u.id
order by u.role, u.nama;


-- =============================================================================
-- BAGIAN 2: UPDATE USER PEMILIK (ANANTA)
-- Ganti username menjadi 'pemilik' dan update password di auth.users.
--
-- CATATAN: Ganti <UUID_PEMILIK> dengan id asli dari hasil query BAGIAN 1.
--          Contoh: '550e8400-e29b-41d4-a716-446655440000'
-- =============================================================================

-- 2a. Set username 'pemilik' di tabel public.users
update public.users
set
  username = 'pemilik',
  updated_at = now()
where id = '<UUID_PEMILIK>'       -- ← ganti dengan UUID pemilik dari BAGIAN 1
  and role = 'pemilik'::public.user_role;

-- Verifikasi update username
select id, nama, username, role from public.users where username = 'pemilik';

-- 2b. Update password pemilik di Supabase Auth menjadi 'password'
update auth.users
set
  encrypted_password = crypt('password', gen_salt('bf')),
  updated_at         = now()
where id = '<UUID_PEMILIK>';      -- ← ganti dengan UUID yang sama

-- Verifikasi: baris terupdate harus 1
-- (tidak ada output nilai, tapi pastikan "1 row affected")


-- =============================================================================
-- BAGIAN 3: TAMBAH USER KASIR BARU
-- Buat akun kasir dengan username 'kasir' dan password 'password'.
--
-- Langkah: buat di auth.users dulu, lalu insert ke public.users.
-- =============================================================================

-- 3a. Buat auth user untuk kasir
-- Email fiktif dipakai karena sistem ini login via username, bukan email.
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
values (
  gen_random_uuid(),                             -- id baru otomatis
  '00000000-0000-0000-0000-000000000000',        -- instance_id default Supabase
  'authenticated',
  'authenticated',
  'kasir@pos.internal',                          -- email internal (tidak dipakai untuk login)
  crypt('password', gen_salt('bf')),             -- password: 'password'
  now(),                                         -- langsung konfirmasi
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
)
on conflict (email) do nothing;                 -- amankan jika email sudah ada

-- Ambil UUID kasir yang baru dibuat
select id, email from auth.users where email = 'kasir@pos.internal';


-- 3b. Insert profil kasir ke public.users
-- Ganti <UUID_KASIR_BARU> dengan id dari hasil query di atas.
insert into public.users (
  id,
  nama,
  username,
  role,
  status,
  base_salary,
  default_bonus,
  default_deduction,
  created_at,
  updated_at
)
values (
  '26a14c54-1dd8-4cd8-a94f-c90bc5a7e287',            -- ← ganti dengan UUID dari step 3a
  'Kasir',                        -- nama tampil
  'kasir',                        -- username untuk login
  'kasir'::public.user_role,      -- role kasir
  'active',
  0,
  0,
  0,
  now(),
  now()
)
on conflict (id) do update
set
  nama     = excluded.nama,
  username = excluded.username,
  role     = excluded.role,
  status   = excluded.status,
  updated_at = now();

-- Verifikasi kasir berhasil ditambahkan
select
  u.id,
  u.nama,
  u.username,
  u.role::text,
  u.status,
  au.email
from public.users as u
join auth.users as au on au.id = u.id
where u.username in ('pemilik', 'kasir')
order by u.role;


-- =============================================================================
-- BAGIAN 4: VERIFIKASI FUNGSI LOGIN
-- Cek apakah resolve_login_email bisa menemukan kedua user via username.
-- =============================================================================
  select public.resolve_login_email('pemilik') as email_pemilik;
  select public.resolve_login_email('kasir')   as email_kasir;

-- Jika hasilnya bukan NULL, berarti username login sudah berfungsi.
-- Login dari UI menggunakan username: 'pemilik' / 'kasir', password: 'password'
-- =============================================================================
