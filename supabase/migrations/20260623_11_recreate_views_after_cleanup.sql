-- Recreate views that were cascade-dropped by 20260623_10_schema_cleanup_phase1.sql
-- Fixes: cashier_shift_summary had 'pending' which no longer exists in shift_status enum
-- Fixes: employee_roster_operational had users.email which was dropped

-- 1. current_shifts
create or replace view public.current_shifts
with (security_invoker = true)
as
select
  cashier_id,
  id,
  start_time,
  status,
  end_time
from public.shifts
where status = 'active'::public.shift_status
  and start_time >= public.shift_auto_close_cutoff(now());

-- 2. shift_transactions (no changes, recreate after enum migration)
create or replace view public.shift_transactions
with (security_invoker = true)
as
select
  s.id as shift_id,
  s.cashier_id,
  s.start_time,
  s.end_time,
  s.status as shift_status,
  t.id as transaksi_id,
  t.kasir_id,
  t.no_transaksi,
  t.total_bayar,
  t.uang_diterima,
  t.kembalian,
  t.metode_bayar,
  t.catatan,
  t.created_at
from public.shifts s
join public.transaksi t on t.shift_id = s.id;

-- 3. shift_reports (depends on shift_transactions)
create or replace view public.shift_reports
with (security_invoker = true)
as
select
  s.id,
  s.cashier_id,
  s.start_time,
  s.end_time,
  s.status,
  s.opening_cash,
  s.total_cash,
  s.total_digital,
  s.total_transactions,
  s.total_items,
  s.expected_cash,
  s.actual_cash,
  s.difference,
  s.notes,
  s.approval_notes,
  s.approved_by,
  s.closed_by,
  s.created_at,
  s.updated_at,
  count(distinct t.transaksi_id)::integer as system_transactions,
  coalesce(sum(
    case when t.metode_bayar::text in ('cash', 'tunai') then t.total_bayar else 0 end
  ), 0)::integer as system_cash_total,
  coalesce(sum(
    case when t.metode_bayar::text not in ('cash', 'tunai') then t.total_bayar else 0 end
  ), 0)::integer as system_digital,
  coalesce(sum(it.qty), 0)::integer as system_items
from public.shifts s
left join public.shift_transactions t on t.shift_id = s.id
left join public.item_transaksi it on it.transaksi_id = t.transaksi_id
group by
  s.id, s.cashier_id, s.start_time, s.end_time, s.status,
  s.opening_cash, s.total_cash, s.total_digital, s.total_transactions,
  s.total_items, s.expected_cash, s.actual_cash, s.difference, s.notes,
  s.approval_notes, s.approved_by, s.closed_by, s.created_at, s.updated_at
order by s.start_time desc;

-- 4. cashier_shift_summary — fixed: removed 'pending' (not in new enum), kept 'flagged'
create or replace view public.cashier_shift_summary as
select
  s.id as shift_id,
  s.cashier_id,
  u.nama as cashier_name,
  s.start_time,
  s.end_time,
  s.status,
  s.total_cash,
  s.total_digital,
  s.total_transactions,
  s.total_items,
  s.actual_cash,
  s.difference,
  case
    when abs(coalesce(s.difference, 0)) >= 50000 then 'large_difference'
    when s.status = 'flagged'::public.shift_status then 'needs_review'
    else 'normal'
  end as anomaly_status
from public.shifts s
left join public.users u on u.id = s.cashier_id;

-- 5. employee_roster_operational — removed users.email (column dropped in 20260622)
create or replace view public.employee_roster_operational
with (security_invoker = true)
as
with latest_session as (
  select distinct on (session_row.user_id)
    session_row.*
  from public.employee_sessions as session_row
  order by session_row.user_id, session_row.last_seen_at desc, session_row.started_at desc
),
active_shift as (
  select distinct on (shift_row.cashier_id)
    shift_row.id,
    shift_row.cashier_id,
    shift_row.start_time,
    shift_row.status
  from public.shifts as shift_row
  where shift_row.status = 'active'::public.shift_status
  order by shift_row.cashier_id, shift_row.start_time desc
),
today_performance as (
  select
    performance.employee_id,
    performance.transactions,
    performance.revenue,
    performance.items,
    performance.refund,
    performance.closing_difference
  from public.employee_performance_daily as performance
  where performance.period_date = (now() at time zone 'Asia/Jakarta')::date
)
select
  users.id,
  users.nama,
  users.username,
  users.phone,
  users.role,
  users.status as account_status,
  users.pin_hash is not null as pin_enabled,
  users.base_salary,
  users.default_bonus,
  users.default_deduction,
  users.last_login,
  users.last_device,
  users.created_at,
  users.updated_at,
  latest_session.session_id,
  latest_session.status as session_status_raw,
  latest_session.device_summary,
  latest_session.user_agent,
  latest_session.route,
  latest_session.activity_status,
  latest_session.activity_updated_at,
  latest_session.started_at as session_started_at,
  latest_session.last_seen_at,
  latest_session.ended_at,
  latest_session.revoked_at,
  latest_session.revoked_by,
  latest_session.revoke_reason,
  case
    when users.status <> 'active' then 'blocked'
    when latest_session.session_id is null then 'offline'
    when latest_session.revoked_at is not null then 'offline'
    when latest_session.ended_at is not null then 'offline'
    when latest_session.last_seen_at >= now() - interval '60 seconds' then 'online'
    when latest_session.last_seen_at >= now() - interval '5 minutes' then 'idle'
    else 'offline'
  end as session_status,
  active_shift.id as active_shift_id,
  active_shift.start_time as active_shift_started_at,
  case
    when active_shift.id is not null then 'on_shift'
    else 'no_shift'
  end as shift_status,
  coalesce(today_performance.transactions, 0)::integer as today_transactions,
  coalesce(today_performance.revenue, 0)::bigint as today_revenue,
  coalesce(today_performance.items, 0)::integer as today_items,
  coalesce(today_performance.refund, 0)::bigint as today_refund,
  coalesce(today_performance.closing_difference, 0)::bigint as today_closing_difference
from public.users
left join latest_session on latest_session.user_id = users.id
left join active_shift on active_shift.cashier_id = users.id
left join today_performance on today_performance.employee_id = users.id
where users.archived_at is null;

-- Grants
revoke all on public.current_shifts from anon, public;
revoke all on public.shift_transactions from anon, public;
revoke all on public.shift_reports from anon, public;
revoke all on public.cashier_shift_summary from anon, public;
revoke all on public.employee_roster_operational from anon, public;

grant select on public.current_shifts to authenticated;
grant select on public.shift_transactions to authenticated;
grant select on public.shift_reports to authenticated;
grant select on public.cashier_shift_summary to authenticated;
grant select on public.employee_roster_operational to authenticated;

notify pgrst, 'reload schema';
