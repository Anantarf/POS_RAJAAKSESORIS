-- Phase 1: Drop legacy artifacts
-- stok_masuk: data migrated to stok_mutasi in 20260412; table is dead
-- produk.aktif: duplicate of status enum added in 20260417_05; all writes maintain both
-- pending_close: shift_status value never set by any code path

-- 1. Drop stok_masuk
drop table if exists public.stok_masuk;

-- 2. Drop produk.aktif boolean (status enum is the source of truth)
-- Verify sync before drop: aktif should match status
do $$
declare
  mismatch_count int;
begin
  select count(*) into mismatch_count
  from public.produk
  where (aktif = true and status not in ('active'))
     or (aktif = false and status not in ('inactive', 'deleted'));
  if mismatch_count > 0 then
    raise exception 'produk.aktif dan status tidak sinkron pada % baris. Perbaiki dulu.', mismatch_count;
  end if;
end$$;

alter table public.produk drop column if exists aktif;

-- 3. Drop pending_close from shift_status enum
do $$
begin
  if exists (select 1 from public.shifts where status::text = 'pending_close') then
    raise exception 'Ada shift dengan status pending_close. Tidak bisa drop enum value ini.';
  end if;
end$$;

alter type public.shift_status rename to shift_status_old;
create type public.shift_status as enum ('active', 'closed', 'approved', 'flagged');
alter table public.shifts
  alter column status type public.shift_status
  using status::text::public.shift_status;
drop type public.shift_status_old;
