# Database Target

Dokumen ini adalah kontrak database yang dipakai aplikasi POS Raja Aksesoris saat ini. Tujuannya membuat database production bisa diverifikasi, bukan hanya diasumsikan sudah cocok dengan kode.

## Runtime Boundary

- Frontend dan Vercel serverless memakai Supabase PostgreSQL sebagai source of truth.
- MySQL/Express legacy bukan jalur production.
- Semua mutation penting harus lewat RPC/flow terkontrol, bukan update bebas dari UI.

## Core Tables

Wajib ada di schema `public`:

- `users`
- `produk`
- `stok_mutasi`
- `transaksi`
- `item_transaksi`
- `transaksi_digital`
- `transaksi_dompet`
- `transaksi_logistik`
- `kas`
- `shifts`
- `app_settings`
- `audit_logs`
- `financial_logs`
- `product_activity_logs`
- `employee_payrolls`
- `employee_sessions`
- `employee_notes`
- `notification_jobs`
- `operational_events`
- `money_operation_requests`
- `stock_opname_sessions`
- `stock_opname_items`
- `supplier_returns`
- `supplier_return_items`
- `customer_returns`
- `customer_return_items`
- `services_products`

## Compatibility Views

Wajib ada:

- `transaction_history_summary`
- `sales_report_items`
- `daily_sales_summary`
- `employee_roster_operational`
- `shift_transactions`
- `service_products`

## Required Columns

Kolom yang pernah menjadi sumber schema drift dan wajib dipastikan:

- `users.username`
- `users.role`
- `users.status`
- `users.pin_hash`
- `users.cashier_station`
- `users.station_name`
- `users.base_salary`
- `users.default_bonus`
- `users.default_deduction`
- `shifts.employee_name`
- `shifts.cashier_station`
- `shifts.station_name`
- `shifts.shift_type`
- `services_products.service_type`
- `services_products.default_price`
- `produk.kode_produk`
- `produk.harga_beli`
- `produk.harga_jual`
- `produk.status`
- `produk.deleted_at`
- `transaksi.total_bayar`
- `transaksi.void_reversal_id`
- `transaksi_dompet.reversal_of`
- `transaksi_digital.category`
- `transaksi_digital.service_type`
- `stock_opname_sessions.status`
- `stock_opname_sessions.completed_at`
- `stock_opname_items.real_stock`

## Required RPC / Functions

Authentication and profile:

- `resolve_login_email`
- `get_my_profile`
- `verify_user_pin`

Employee and owner controls:

- `owner_update_employee_profile`
- `owner_set_employee_status`
- `owner_reset_employee_pin`
- `owner_save_employee_payroll`
- `owner_set_employee_permissions`
- `owner_get_employee_permissions`
- `owner_get_employee_activity`
- `owner_save_employee_note`
- `owner_revoke_employee_session`
- `current_user_has_employee_permission`
- `touch_employee_session`
- `end_employee_session`

Money and transaction safety:

- `create_accessory_transaction_atomic`
- `create_digital_transaction_atomic`
- `create_wallet_transaction_atomic`
- `create_cash_entry_atomic`
- `create_supplier_return_atomic`
- `create_customer_return_atomic`
- `close_shift_atomic`
- `void_transaction_atomic`
- `auto_close_expired_active_shifts`

Cleanup and monitoring:

- `purge_expired_deleted_products`
- `purge_expired_deleted_transactions`
- `owner_get_audit_storage_summary`
- `owner_get_audit_storage_breakdown`
- `get_sales_report_summary`

## Required Policies / Security Expectations

- Owner-only RPC guards for employee, audit, payroll, permission, and security controls.
- Cashier access must be restricted by role/permission and RLS where applicable.
- Direct write access to sensitive money tables must be guarded by RPC or policy.
- Audit and product activity logs must not be auto-deleted by retention helpers.
- PostgREST schema reload should be triggered by migrations that alter tables, views, or RPC.

## Realtime Tables

Realtime listeners expect these public tables:

- `produk`
- `stok_mutasi`
- `services_products`
- `transaksi`
- `item_transaksi`
- `transaksi_digital`
- `transaksi_dompet`
- `transaksi_logistik`
- `kas`
- `shifts`
- `users`
- `employee_payrolls`
- `employee_sessions`
- `app_settings`
- `product_activity_logs`
- `stock_opname_sessions`
- `stock_opname_items`
- `supplier_returns`
- `supplier_return_items`
- `customer_returns`
- `customer_return_items`

## Current Risk Notes

- Kode masih punya fallback untuk `cashier_station`, `service_type`, dan schema cache error. Fallback ini boleh dihapus hanya setelah production lulus `npm run verify:database`.
- `produk.aktif`, `produk.harga`, `produk.modal`, `transaksi.total`, `stock_opname_sessions.applied_at`, dan `stock_opname_items.counted_stock` bukan target canonical. Gunakan `status`, `harga_jual`, `harga_beli`, `total_bayar`, `completed_at`, dan `real_stock`.
- Migration repair lama masih dipertahankan untuk database yang belum pernah melewati semua fase schema.
- README database deploy harus mengacu ke seluruh migration chain, bukan hanya dua migration awal.
