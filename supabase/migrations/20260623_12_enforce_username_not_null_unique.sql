-- Enforce username as primary identity: NOT NULL + UNIQUE
-- Verify no nulls or duplicates exist before adding constraints

do $$ begin
  if exists (select 1 from public.users where username is null) then
    raise exception 'Ada user dengan username NULL. Isi dulu sebelum enforce NOT NULL.';
  end if;

  if exists (
    select username from public.users group by username having count(*) > 1
  ) then
    raise exception 'Ada username duplikat. Perbaiki dulu sebelum enforce UNIQUE.';
  end if;
end $$;

alter table public.users
  alter column username set not null,
  add constraint users_username_unique unique (username);

notify pgrst, 'reload schema';
