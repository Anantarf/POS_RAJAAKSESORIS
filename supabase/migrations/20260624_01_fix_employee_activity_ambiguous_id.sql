-- Fix: owner_get_employee_activity - "column reference id is ambiguous"
-- Root cause: after schema cleanup (20260623_10 + 20260623_11), the planner could not
-- resolve the bare "id" references inside the UNION ALL CTE because several tables
-- in scope all expose a column called "id". Using unambiguous internal aliases
-- (event_id, event_at …) throughout the CTE and then projecting them back to the
-- declared return-type names in the final SELECT resolves the issue permanently.

create or replace function public.owner_get_employee_activity(
  p_employee_id uuid,
  p_limit integer default 30,
  p_before_created_at timestamptz default null,
  p_before_id text default null,
  p_days integer default 30
)
returns table (
  id text,
  created_at timestamptz,
  action text,
  title text,
  detail text,
  tone text,
  source text,
  metadata jsonb
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 30), 1), 50);
  v_days  integer := least(greatest(coalesce(p_days, 30), 1), 90);
begin
  perform public.ensure_owner_employee_access();

  if not exists (
    select 1
    from public.users as u
    where u.id = p_employee_id
      and u.archived_at is null
  ) then
    raise exception 'Karyawan tidak ditemukan.';
  end if;

  return query
  with raw_events as (
    -- Audit log entries where this employee is the actor or target
    select
      audit.id::text                                         as event_id,
      audit.created_at                                       as event_at,
      audit.action                                           as event_action,
      case
        when audit.action like 'employee.%'                         then 'Perubahan data karyawan'
        when audit.action like 'settings.%'                         then 'Pengaturan keamanan'
        when audit.action like '%void%'                             then 'Void transaksi'
        when audit.action like '%return%'
          or audit.action like '%retur%'                            then 'Retur/refund'
        else audit.action
      end                                                    as event_title,
      coalesce(
        nullif(audit.reason, ''),
        audit.incident_code,
        audit.target_table
      )                                                      as event_detail,
      case
        when audit.action like '%void%'
          or audit.action like '%delete%'                           then 'danger'
        when audit.action like '%pin%'
          or audit.action like '%security%'                         then 'warning'
        when audit.action like '%payroll%'                          then 'success'
        else 'neutral'
      end                                                    as event_tone,
      'audit'::text                                          as event_source,
      jsonb_build_object(
        'target_table',  audit.target_table,
        'target_id',     audit.target_id,
        'incident_code', audit.incident_code
      )                                                      as event_metadata
    from public.audit_logs as audit
    where audit.actor_id = p_employee_id
       or audit.target_id = p_employee_id

    union all

    -- Session-start events
    select
      ('session-start:' || sess.session_id)::text           as event_id,
      sess.started_at                                        as event_at,
      'session.login'::text                                  as event_action,
      'Login POS'::text                                      as event_title,
      coalesce(sess.device_summary, 'Device belum tercatat') as event_detail,
      'success'::text                                        as event_tone,
      'session'::text                                        as event_source,
      jsonb_build_object(
        'route',      sess.route,
        'session_id', sess.session_id
      )                                                      as event_metadata
    from public.employee_sessions as sess
    where sess.user_id = p_employee_id

    union all

    -- Session-end / revoke events
    select
      ('session-end:' || sess.session_id)::text             as event_id,
      sess.ended_at                                          as event_at,
      case
        when sess.revoked_at is not null then 'session.revoked'
        else 'session.logout'
      end                                                    as event_action,
      case
        when sess.revoked_at is not null then 'Session direvoke owner'
        else 'Logout POS'
      end                                                    as event_title,
      coalesce(
        sess.revoke_reason,
        sess.device_summary,
        'Session selesai'
      )                                                      as event_detail,
      case
        when sess.revoked_at is not null then 'danger'
        else 'neutral'
      end                                                    as event_tone,
      'session'::text                                        as event_source,
      jsonb_build_object(
        'route',      sess.route,
        'session_id', sess.session_id
      )                                                      as event_metadata
    from public.employee_sessions as sess
    where sess.user_id = p_employee_id
      and sess.ended_at is not null

    union all

    -- Shift-open events
    select
      ('shift-open:' || sh.id::text)::text                  as event_id,
      sh.start_time                                          as event_at,
      'shift.open'::text                                     as event_action,
      'Opening shift'::text                                  as event_title,
      coalesce(sh.status::text, 'Shift dibuka')             as event_detail,
      'success'::text                                        as event_tone,
      'shift'::text                                          as event_source,
      jsonb_build_object('shift_id', sh.id, 'status', sh.status) as event_metadata
    from public.shifts as sh
    where sh.cashier_id = p_employee_id

    union all

    -- Shift-close events
    select
      ('shift-close:' || sh.id::text)::text                 as event_id,
      sh.end_time                                            as event_at,
      'shift.close'::text                                    as event_action,
      'Closing shift'::text                                  as event_title,
      'Selisih ' || coalesce(sh.difference, 0)::text        as event_detail,
      case
        when coalesce(sh.difference, 0) = 0 then 'success'
        else 'warning'
      end                                                    as event_tone,
      'shift'::text                                          as event_source,
      jsonb_build_object('shift_id', sh.id, 'status', sh.status) as event_metadata
    from public.shifts as sh
    where sh.cashier_id = p_employee_id
      and sh.end_time is not null

    union all

    -- Accessory transactions
    select
      ('trx:' || trx.id::text)::text                        as event_id,
      trx.created_at                                         as event_at,
      case
        when trx.voided_at is not null then 'transaction.voided'
        else 'transaction.accessory'
      end                                                    as event_action,
      case
        when trx.voided_at is not null then 'Transaksi void'
        else 'Transaksi aksesoris'
      end                                                    as event_title,
      coalesce(trx.no_transaksi, trx.id::text)
        || ' - Rp ' || coalesce(trx.total_bayar, 0)::text  as event_detail,
      case
        when trx.voided_at is not null then 'danger'
        else 'success'
      end                                                    as event_tone,
      'transaction'::text                                    as event_source,
      jsonb_build_object('transaction_id', trx.id, 'status', trx.status) as event_metadata
    from public.transaksi as trx
    where trx.kasir_id = p_employee_id
      and trx.deleted_at is null

    union all

    -- Digital service transactions
    select
      ('digital:' || dg.id::text)::text                     as event_id,
      dg.created_at                                          as event_at,
      case
        when dg.voided_at is not null then 'transaction.voided'
        else 'transaction.digital'
      end                                                    as event_action,
      case
        when dg.voided_at is not null then 'Transaksi digital void'
        else 'Transaksi digital'
      end                                                    as event_title,
      coalesce(dg.no_transaksi, dg.provider, dg.jenis::text, dg.id::text)
        || ' - Rp ' || coalesce(dg.harga_jual, 0)::text    as event_detail,
      case
        when dg.voided_at is not null then 'danger'
        else 'success'
      end                                                    as event_tone,
      'transaction'::text                                    as event_source,
      jsonb_build_object('transaction_id', dg.id, 'status', dg.status) as event_metadata
    from public.transaksi_digital as dg
    where dg.kasir_id = p_employee_id
      and dg.deleted_at is null

    union all

    -- Customer returns / warranty claims
    select
      ('return:' || ret.id::text)::text                     as event_id,
      ret.created_at                                         as event_at,
      'return.customer'::text                                as event_action,
      'Retur/refund konsumen'::text                          as event_title,
      coalesce(ret.no_retur, ret.transaction_no, ret.id::text)
        || ' - Rp ' || coalesce(ret.total_refund_amount, 0)::text as event_detail,
      'warning'::text                                        as event_tone,
      'return'::text                                         as event_source,
      jsonb_build_object('return_id', ret.id, 'status', ret.status) as event_metadata
    from public.customer_returns as ret
    where ret.created_by = p_employee_id
  ),
  bounded as (
    select
      raw_events.event_id,
      raw_events.event_at,
      raw_events.event_action,
      raw_events.event_title,
      raw_events.event_detail,
      raw_events.event_tone,
      raw_events.event_source,
      raw_events.event_metadata
    from raw_events
    where raw_events.event_at is not null
      and raw_events.event_at >= now() - make_interval(days => v_days)
      and (
        p_before_created_at is null
        or raw_events.event_at < p_before_created_at
        or (
          raw_events.event_at = p_before_created_at
          and raw_events.event_id < coalesce(p_before_id, '')
        )
      )
  )
  select
    bounded.event_id       as id,
    bounded.event_at       as created_at,
    bounded.event_action   as action,
    bounded.event_title    as title,
    bounded.event_detail   as detail,
    bounded.event_tone     as tone,
    bounded.event_source   as source,
    bounded.event_metadata as metadata
  from bounded
  order by bounded.event_at desc, bounded.event_id desc
  limit v_limit;
end;
$$;

notify pgrst, 'reload schema';
