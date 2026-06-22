create table if not exists public.integration_rate_limits (
  key text primary key,
  count integer not null default 0 check (count >= 0),
  window_start timestamptz not null default now(),
  reset_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.integration_rate_limits enable row level security;

create or replace function public.consume_integration_rate_limit(
  p_key text,
  p_limit integer default 10,
  p_window_seconds integer default 60
)
returns table (
  allowed boolean,
  count integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text := nullif(trim(coalesce(p_key, '')), '');
  v_limit integer := greatest(coalesce(p_limit, 10), 1);
  v_window interval := make_interval(secs => greatest(coalesce(p_window_seconds, 60), 1));
  v_now timestamptz := now();
  v_count integer;
  v_reset_at timestamptz;
begin
  if v_key is null then
    raise exception 'Rate limit key wajib diisi.';
  end if;

  insert into public.integration_rate_limits as limits (
    key,
    count,
    window_start,
    reset_at,
    updated_at
  )
  values (
    v_key,
    1,
    v_now,
    v_now + v_window,
    v_now
  )
  on conflict (key) do update
  set
    count = case
      when limits.reset_at <= v_now then 1
      else limits.count + 1
    end,
    window_start = case
      when limits.reset_at <= v_now then v_now
      else limits.window_start
    end,
    reset_at = case
      when limits.reset_at <= v_now then v_now + v_window
      else limits.reset_at
    end,
    updated_at = v_now
  returning limits.count, limits.reset_at
  into v_count, v_reset_at;

  return query select v_count <= v_limit, v_count, v_reset_at;
end;
$$;

grant execute on function public.consume_integration_rate_limit(text, integer, integer) to authenticated;
