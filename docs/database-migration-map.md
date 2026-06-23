# Database Migration Map

Peta ini mengelompokkan migration agar production tidak lagi bergantung pada tebakan.

## Wajib Untuk Production Saat Ini

Base POS dan modul utama:

- `20260412_raja_aksesoris_pos.sql`
- `20260412_pos_v2_modules.sql`
- `20260412_product_code_and_stock_mutations.sql`
- `20260412_layanan_fields.sql`
- `20260416_01_wallet_manual_control_enums.sql`
- `20260416_02_wallet_manual_control_backfill.sql`
- `20260416_03_logistics_service_recording.sql`
- `20260417_01_split_payment_method.sql`
- `20260417_02_shift_management.sql`
- `20260417_03_atomic_pos_consistency.sql`
- `20260417_05_product_recycle_bin.sql`
- `20260417_06_digital_service_cashier_fields.sql`
- `20260417_07_service_products_and_transaction_fields.sql`
- `20260417_08_digital_wallet_payment_validation.sql`
- `20260417_09_digital_services_complete.sql`

Digital, wallet, report, and hardening:

- `20260418_01_digital_services_pasarkuota_deduction.sql`
- `20260418_02_service_product_transaction_views.sql`
- `20260418_03_shift_approve_with_correction.sql`
- `20260418_04_service_product_service_type.sql`
- `20260418_05_digital_services_flexible_pricing_wallet_deduction.sql`
- `20260418_06_security_lockdown_views.sql`
- `20260418_07_shift_rls_fix.sql`
- `20260418_09_digital_payment_source_fix.sql`
- `20260418_10_digital_customer_payment_split.sql`
- `20260418_11_transfer_manual_transactions.sql`
- `20260419_05_fix_metode_bayar_wallet_values.sql`
- `20260419_07_security_hardening_review_fixes.sql`
- `20260419_08_service_transactions_recording_only.sql`
- `20260419_09_dual_service_payment_recording.sql`
- `20260419_99_fix_shift_reporting_and_triggers.sql`
- `20260419_99_z_pasarkuota_qris_wallet_flow.sql`
- `20260419_99_zz_global_sales_report_item_snapshots.sql`

Owner/admin, audit, and production safety:

- `20260420_01_delete_service_product_atomic.sql`
- `20260420_02_transaction_recycle_bin.sql`
- `20260420_03_stock_opname.sql`
- `20260421_01_product_activity_logs_permissions.sql`
- `20260425_01_supplier_returns.sql`
- `20260425_02_customer_payment_methods.sql`
- `20260426_01_shift_auto_close_0500.sql`
- `20260512_01_audit_logs_and_summary_views.sql`
- `20260512_02_transaction_history_summary_view.sql`
- `20260514_01_sales_report_server_queries.sql`
- `20260514_02_employee_management_production.sql`
- `20260514_03_pin_requirement_setting.sql`
- `20260514_04_security_controls.sql`
- `20260514_05_employee_session_presence.sql`
- `20260514_05a_repair_missing_logistics_table.sql`
- `20260514_06_production_hardening_activation.sql`
- `20260523_01_get_my_profile_rpc.sql`
- `20260524_01_employee_intelligence_foundation.sql`
- `20260526_01_add_emoney_payment_method.sql`
- `20260526_02_digital_service_category_expansion.sql`
- `20260526_03_security_boundary_enforcement.sql`
- `20260527_01_money_flow_idempotency.sql`
- `20260527_02_audit_storage_retention_foundation.sql`
- `20260531_01_warranty_claims_customer_return.sql`
- `20260619_01_multi_cashier_station_shift.sql`
- `20260622191910_drop_email_from_users.sql`
- `20260623_01_integration_rate_limits.sql`
- `20260623_02_username_login.sql`
- `20260623_03_username_login_auth_join.sql`
- `20260623_10_schema_cleanup_phase1.sql`
- `20260623_11_recreate_views_after_cleanup.sql`
- `20260623_12_enforce_username_not_null_unique.sql`
- `20260623_13_repair_digital_transaction_category_fields.sql`

## Repair / Backfill Migration

Migration ini tetap penting untuk database lama, tetapi idealnya tidak lagi menjadi pola kerja utama setelah schema production stabil:

- `20260418_08_runtime_schema_repair.sql`
- `20260419_01_fix_financial_logs_typo.sql`
- `20260419_02_lockdown_shift_views.sql`
- `20260419_03_fix_produk_aktif_column.sql`
- `20260419_04_repair_mutations_products_services.sql`
- `20260419_99_repair_product_service_write_paths.sql`
- `20260623_13_repair_digital_transaction_category_fields.sql`

## Legacy / Historical

- `20241002_shift_system.sql`

Gunakan hanya jika database awal memang berasal dari schema lama itu. Jangan jadikan titik awal untuk deployment baru tanpa review.

## Cleanup Phase

- `20260623_10_schema_cleanup_phase1.sql`
- `20260623_11_recreate_views_after_cleanup.sql`
- `20260623_12_enforce_username_not_null_unique.sql`
- `20260623_13_repair_digital_transaction_category_fields.sql`

Cleanup ini menandai schema mulai dirapikan. Setelah production terverifikasi, fallback schema lama di kode bisa dikurangi bertahap.

## Deployment Rule

- Jalankan migration sesuai urutan filename.
- Jangan skip repair migration pada database lama.
- Setelah migration selesai, jalankan `npm run verify:database`.
- Jika `verify:database` gagal, buat migration kecil idempotent. Jangan edit migration lama yang sudah pernah diterapkan production.
