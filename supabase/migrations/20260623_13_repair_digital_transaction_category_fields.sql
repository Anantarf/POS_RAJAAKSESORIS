-- Repair production databases that missed digital transaction category fields.
-- `jenis` stays for legacy enum compatibility; `category` and `service_type`
-- are the canonical reporting/catalog fields used by current UI flows.

alter table public.transaksi_digital
  add column if not exists category text not null default '',
  add column if not exists service_type text not null default '';

update public.transaksi_digital
set
  category = coalesce(nullif(category, ''), jenis::text, ''),
  service_type = coalesce(
    nullif(service_type, ''),
    nullif(transaction_items->0->>'service_type', ''),
    ''
  )
where category = ''
   or service_type = '';

create index if not exists idx_transaksi_digital_category_type
on public.transaksi_digital (category, service_type, created_at desc);

drop view if exists public.service_transactions;

create view public.service_transactions as
select
  id,
  service_product_id as product_id,
  coalesce(transaction_items->0->>'product_name_snapshot', catatan, '') as product_name,
  coalesce(nullif(category, ''), jenis::text, '') as category,
  provider,
  coalesce(nullif(service_type, ''), transaction_items->0->>'service_type', '') as service_type,
  cost,
  selling_price,
  profit,
  target_number,
  customer_name,
  payment_method::text as payment_method,
  created_at
from public.transaksi_digital;

grant select on public.service_transactions to authenticated;

notify pgrst, 'reload schema';
