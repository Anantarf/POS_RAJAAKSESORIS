# Laravel + MySQL Migration Foundation

Dokumen ini menjadi acuan agar migrasi POS Raja Aksesoris tidak melebar. Tujuan migrasi adalah mengganti fondasi teknis dari React/Vite + Supabase/PostgreSQL ke Laravel + MySQL, sambil mempertahankan perilaku bisnis yang sudah berjalan.

## Prinsip Utama

- Migrasi ini adalah migrasi teknologi, bukan redesign produk.
- App lama tetap menjadi referensi perilaku sampai Laravel terbukti lengkap.
- Database MySQL baru harus dibuat dari schema target yang rapi, bukan hasil copy mentah dari migration Supabase lama.
- Setiap modul wajib punya acceptance criteria sebelum dikerjakan.
- Fitur uang, stok, shift, retur, dan audit harus diprioritaskan dibanding polish UI.
- Jangan memindahkan bug, fallback lama, atau nama kolom legacy jika tidak dibutuhkan.

## Arah Produk

Tujuan app baru adalah sederhana dipakai, tetapi kuat di fondasi operasional. Sederhana berarti layar tidak ramai, alur kasir pendek, istilah jelas, dan fitur yang jarang dipakai tidak mengganggu kerja harian. Kuat berarti uang, stok, shift, audit, permission, dan laporan tidak boleh rapuh.

### Sederhana Di Permukaan

- Kasir hanya melihat fitur yang dipakai saat kerja.
- Owner melihat ringkasan penting dulu, detail belakangan.
- Menu utama harus sedikit dan stabil.
- Form harus pendek, dengan default yang aman.
- Istilah harus konsisten: jangan campur Owner/Pemilik, Kasir/Karyawan, produk/barang tanpa aturan.
- Halaman tidak perlu banyak kartu jika satu tabel atau satu ringkasan sudah cukup.
- Fitur arsip, audit, konfigurasi, dan laporan detail boleh ada, tetapi tidak memenuhi navigasi utama.

### Kuat Di Dalam

- Semua transaksi uang dan stok wajib atomic.
- Semua aksi sensitif wajib tercatat di audit log.
- Role dan permission wajib aktif sejak awal.
- Submit transaksi harus idempotent agar tidak double transaksi.
- Report harus punya sumber angka yang jelas.
- Error harus eksplisit, bukan diam-diam pakai fallback yang menutupi masalah.
- Validasi harus ada di request dan service, bukan hanya di UI.

### Batas Kesederhanaan

- Sederhana bukan berarti tanpa audit.
- Sederhana bukan berarti stok bisa diubah manual tanpa jejak.
- Sederhana bukan berarti semua role melihat semua menu.
- Sederhana bukan berarti laporan dihitung seadanya.
- Sederhana bukan berarti satu controller menangani semua flow.
- Sederhana bukan berarti menghapus guard untuk uang dan shift.

## Target Stack

- Backend: Laravel
- Database: MySQL 8
- Auth: Laravel session auth untuk full-stack, atau Laravel Sanctum jika frontend React dipertahankan
- Frontend awal: pilih salah satu sebelum build dimulai
  - Laravel Blade/Livewire untuk maintenance sederhana
  - React/Vite untuk UI POS yang lebih interaktif
- Queue: Laravel queue dengan database driver di awal
- Scheduler: Laravel scheduler untuk auto close shift, cleanup, dan job berkala
- Export/import: Laravel job/service, bukan logic berat langsung di controller
- Deployment: VPS atau hosting Laravel yang mendukung queue, scheduler, storage, dan MySQL

## Arsitektur Yang Disarankan

Gunakan Laravel modular monolith. Jangan pecah menjadi banyak service, jangan pakai repository pattern generik, dan jangan membuat abstraction layer yang belum dibutuhkan. Struktur harus mengikuti fitur toko, bukan mengikuti teknologi.

### Pilihan Paling Sederhana

Rekomendasi utama:

- Laravel full-stack.
- Blade untuk halaman umum.
- Livewire untuk halaman interaktif seperti kasir, produk, shift, dan laporan.
- MySQL sebagai satu source of truth.
- Laravel queue database driver di awal.
- Laravel scheduler untuk job berkala.

Pilihan ini lebih sederhana daripada Laravel API + React karena tidak perlu mengurus dua app, token auth, CORS, deploy frontend/backend terpisah, dan state client yang terlalu besar.

### Bentuk Modul

Gunakan modul berbasis domain operasional:

- `Auth`: login, role, permission, PIN.
- `Catalog`: produk fisik, produk layanan, kategori.
- `Stock`: stok, mutasi, stock opname.
- `Sales`: transaksi, item, pembayaran, struk, void.
- `Shift`: buka shift, tutup shift, koreksi closing.
- `Returns`: retur supplier dan customer.
- `Reports`: laporan harian, shift, pembayaran, produk.
- `Audit`: audit log dan activity log.
- `Notifications`: WhatsApp/Fonnte dan job notifikasi.

Modul ini tidak harus menjadi package terpisah. Cukup pisahkan folder, service/action, request, policy, dan test berdasarkan domain.

### Pola Kode

Controller harus tipis:

- validasi request
- cek authorization
- panggil action/service
- return response/view

Action/service memegang aturan bisnis:

- `CreateSaleTransaction`
- `VoidTransaction`
- `OpenShift`
- `CloseShift`
- `AdjustStock`
- `CreateSupplierReturn`
- `CreateCustomerReturn`
- `GenerateDailySalesReport`

Model hanya untuk relasi, cast, scope sederhana, dan accessor yang aman. Jangan taruh flow transaksi besar di model.

### Flow Kritis

Semua flow berikut wajib dibungkus `DB::transaction()`:

- transaksi kasir
- void/reversal transaksi
- perubahan stok
- stock opname final
- retur
- buka/tutup shift
- cash entry
- perubahan payroll atau saldo jika berdampak uang

### Yang Bisa Disederhanakan

- Tidak perlu React dulu jika tujuan utama adalah sederhana dan maintainable.
- Tidak perlu API-first kecuali ada mobile app atau integrasi eksternal.
- Tidak perlu repository pattern untuk semua model.
- Tidak perlu event sourcing.
- Tidak perlu microservice.
- Tidak perlu realtime untuk semua data; cukup refresh/Livewire polling di area yang memang butuh.
- Tidak perlu dashboard kompleks di awal; cukup laporan yang angkanya benar.

### Satu Ide Utama

Buat satu `TransactionService`/`Sales` domain yang sangat kuat, lalu fitur lain mengikuti. POS ini gagal bukan karena kurang halaman, tetapi akan gagal kalau transaksi, stok, shift, dan laporan tidak konsisten.

## Batas Migrasi

Yang termasuk:

- Membangun Laravel app baru di folder terpisah.
- Mendesain ulang schema MySQL canonical.
- Memindahkan fitur bisnis inti dari app lama.
- Membuat API/controller/service/action yang aman untuk transaksi uang dan stok.
- Migrasi data dari Supabase/PostgreSQL ke MySQL setelah schema stabil.

Yang tidak termasuk di fase awal:

- Redesign besar UI.
- Menambah fitur baru di luar POS yang sudah ada.
- Menghapus app lama sebelum Laravel lolos validasi.
- Optimasi kompleks seperti microservice, event sourcing, atau multi-tenant.

## Struktur Folder Disarankan

```text
C:\Users\Ananta Raihan\Downloads\
+-- POS-RAJA-AKSESORIS-REVISI-main\   # app lama, referensi
+-- pos-raja-laravel\                 # app Laravel + MySQL baru
```

Jangan install Laravel di folder app lama. Struktur Laravel dan React/Vite lama berbeda, dan mencampurnya akan membuat dependency, environment, build, serta deployment sulit dikontrol.

## Checklist Sebelum Pindah Folder

Sebelum membuat folder Laravel baru, siapkan keputusan dan bahan berikut agar rebuild tidak ngawur sejak hari pertama.

### Keputusan Teknis

- Nama folder project baru.
- Versi Laravel yang dipakai.
- Versi PHP lokal dan production.
- Versi MySQL lokal dan production.
- Frontend awal: Blade/Livewire atau React.
- Auth: session Laravel atau Sanctum.
- Deployment target: VPS, shared hosting, Plesk/cPanel, atau platform lain.
- Apakah WhatsApp/Fonnte langsung dibawa di fase awal atau ditunda.

### Bahan Dari App Lama

- Logo dan asset brand.
- Daftar menu aktif.
- Daftar role dan permission aktif.
- Contoh produk fisik.
- Contoh produk digital/layanan.
- Contoh transaksi normal.
- Contoh transaksi split payment.
- Contoh retur.
- Contoh closing shift.
- Contoh laporan harian yang dianggap benar.

### Data Awal Untuk Laravel

- User owner pertama.
- User kasir contoh.
- Kategori produk awal.
- Metode pembayaran final.
- Cashier station final.
- Shift type final.
- Format nomor transaksi.
- Format struk.
- Saldo awal jika wallet/dompet tetap dipakai.

### File Yang Perlu Dibuat Di Awal

- `.env.example`
- README setup lokal.
- Dokumen schema MySQL draft.
- Dokumen flow kasir.
- Dokumen role dan permission.
- Seeder data minimal.
- Backup/export data lama sebelum eksperimen migrasi.

### Stop Rule

Jangan mulai coding Laravel jika belum ada:

- Pilihan frontend.
- Schema draft.
- Flow kasir utama.
- Metode pembayaran final.
- Aturan shift.
- Aturan stok minus.
- Kebijakan void dan retur.

## Modul Yang Wajib Dipertahankan

### Core

- Login username.
- Role Owner dan Kasir.
- Permission karyawan.
- PIN untuk aksi sensitif.
- Session/presence karyawan jika masih dibutuhkan.

### Inventory

- Produk fisik.
- Produk layanan/digital.
- Kategori produk.
- Harga beli dan harga jual.
- Stok aktif.
- Mutasi stok.
- Recycle bin atau soft delete produk.
- Stock opname.

### Kasir

- Transaksi produk fisik.
- Transaksi layanan digital.
- Transaksi dompet/saldo.
- Transaksi logistik jika masih dipakai.
- Split payment.
- Cash, QRIS, e-wallet, transfer, dan metode pembayaran lain yang aktif.
- Cetak struk.
- Void/batal transaksi dengan audit.

### Shift

- Buka shift.
- Tutup shift.
- Koreksi closing.
- Auto close shift.
- Multi cashier station.
- Relasi shift ke transaksi.

### Retur

- Retur supplier.
- Retur customer.
- Warranty claim jika masih aktif.
- Dampak retur ke stok dan laporan.

### Finance & Report

- Laporan penjualan harian.
- Rekap shift.
- Rekap metode pembayaran.
- Rekap produk terjual.
- Kas masuk/keluar.
- Financial log.
- Export laporan.

### Audit & Operational Safety

- Audit log untuk aksi sensitif.
- Product activity log.
- Operational event log.
- Money operation request/idempotency.
- Retention untuk data non-kritis.
- Guard agar transaksi uang tidak double-submit.

## Arsitektur Database

Arsitektur database belum boleh dibuat terlalu kompleks. Gunakan pola ledger sederhana: data master terpisah dari dokumen transaksi, semua perubahan stok/uang tercatat sebagai mutasi, dan laporan membaca dari transaksi final.

### Kelompok Tabel

- Identity: `users`, `roles`, `permissions`, `permission_user`, `employee_profiles`, `employee_sessions`.
- Catalog: `products`, `product_categories`, `service_products`.
- Stock ledger: `product_stock_mutations`, `stock_opname_sessions`, `stock_opname_items`.
- Sales document: `transactions`, `transaction_items`, `transaction_payments`.
- Specialized transactions: `digital_transactions`, `wallet_transactions`, `cash_entries`.
- Shift: `shifts`.
- Returns: `supplier_returns`, `supplier_return_items`, `customer_returns`, `customer_return_items`.
- Audit: `audit_logs`, `financial_logs`, `product_activity_logs`, `operational_events`.
- System: `notification_jobs`, `app_settings`, `idempotency_keys`.

### Relasi Inti

```text
users
+-- employee_profiles
+-- employee_sessions
+-- shifts
+-- transactions
+-- audit_logs

products
+-- transaction_items
+-- product_stock_mutations
+-- stock_opname_items
+-- supplier_return_items
+-- customer_return_items

shifts
+-- transactions
+-- cash_entries

transactions
+-- transaction_items
+-- transaction_payments
+-- digital_transactions
+-- wallet_transactions
+-- audit_logs
```

### Source Of Truth

- Stok saat ini berasal dari `products.current_stock`, tetapi setiap perubahan wajib punya pasangan di `product_stock_mutations`.
- Nilai penjualan berasal dari `transactions` dan `transaction_payments`.
- Detail barang terjual berasal dari `transaction_items`.
- Closing shift berasal dari `shifts`, `transactions`, `transaction_payments`, dan `cash_entries`.
- Laporan boleh punya summary/cache, tetapi summary bukan sumber utama.
- Audit sensitif berasal dari `audit_logs`, bukan dari membaca perubahan row mentah.

### Tabel Yang Harus Paling Dijaga

- `transactions`
- `transaction_items`
- `transaction_payments`
- `product_stock_mutations`
- `shifts`
- `cash_entries`
- `audit_logs`
- `idempotency_keys`

Tabel ini wajib punya foreign key, index, validasi status, dan test. Jangan mulai dari dashboard sebelum tabel ini stabil.

### Aturan Status

Gunakan status eksplisit dan sedikit:

- `transactions.status`: `draft`, `completed`, `voided`.
- `shifts.status`: `open`, `closed`, `corrected`.
- `products.status`: `active`, `inactive`, `deleted`.
- `stock_opname_sessions.status`: `draft`, `completed`, `cancelled`.
- `supplier_returns.status`: `draft`, `completed`, `cancelled`.
- `customer_returns.status`: `draft`, `completed`, `cancelled`.

Hindari status bebas berbasis text input. Status menentukan laporan, permission, dan audit.

### Index Minimum

- `users.username` unique.
- `products.sku` atau `products.code` unique jika dipakai.
- `transactions.transaction_number` unique.
- `transactions.shift_id`.
- `transactions.cashier_id`.
- `transactions.created_at`.
- `transaction_items.transaction_id`.
- `transaction_items.product_id`.
- `transaction_payments.transaction_id`.
- `product_stock_mutations.product_id`.
- `product_stock_mutations.created_at`.
- `audit_logs.user_id`.
- `audit_logs.created_at`.
- `idempotency_keys.key` unique.

### Anti-Overengineering Database

- Jangan pecah payment menjadi banyak tabel per metode bayar.
- Jangan buat tabel report terlalu awal.
- Jangan simpan JSON besar untuk data yang sering difilter.
- Jangan membuat semua kolom nullable agar cepat jalan.
- Jangan simpan harga hanya dari relasi produk; snapshot harga harus masuk ke item transaksi.
- Jangan mengandalkan cascade delete untuk data transaksi.
- Jangan membuat trigger kompleks kecuali benar-benar perlu. Untuk Laravel, aturan bisnis utama lebih mudah diuji di service/action.

### Snapshot Wajib

Transaksi harus menyimpan snapshot agar laporan historis tidak berubah saat data master berubah:

- `transaction_items.product_name`
- `transaction_items.product_code`
- `transaction_items.unit_price`
- `transaction_items.cost_price`
- `transaction_items.quantity`
- `transaction_items.subtotal`
- `transaction_payments.method`
- `transaction_payments.amount`
- `transactions.cashier_name`
- `transactions.shift_code` atau referensi shift yang stabil

Jangan hanya mengandalkan join ke produk/user saat membuat laporan historis.

## Schema MySQL Awal

Schema final harus diputuskan sebelum coding modul besar. Tabel awal yang disarankan:

- `users`
- `roles`
- `permissions`
- `permission_user`
- `employee_profiles`
- `employee_sessions`
- `products`
- `product_categories`
- `product_stock_mutations`
- `service_products`
- `shifts`
- `transactions`
- `transaction_items`
- `transaction_payments`
- `digital_transactions`
- `wallet_transactions`
- `cash_entries`
- `supplier_returns`
- `supplier_return_items`
- `customer_returns`
- `customer_return_items`
- `stock_opname_sessions`
- `stock_opname_items`
- `audit_logs`
- `financial_logs`
- `product_activity_logs`
- `operational_events`
- `notification_jobs`
- `app_settings`
- `idempotency_keys`

Nama tabel boleh disesuaikan, tapi gunakan satu bahasa dan satu pola. Hindari campuran `produk`, `product`, `barang`, dan `inventory` dalam level schema yang sama.

## Aturan Desain Database

- Semua nilai uang simpan sebagai integer minor unit, bukan float.
- Gunakan foreign key untuk relasi inti.
- Gunakan enum terbatas atau lookup table untuk status penting.
- Gunakan soft delete hanya untuk data yang memang perlu dipulihkan.
- Transaksi penjualan harus immutable setelah final, koreksi dilakukan lewat void/reversal.
- Perubahan stok harus lewat mutation log, bukan update stok tanpa catatan.
- Payment dipisah dari transaksi agar split payment aman.
- Audit log tidak boleh terhapus oleh cleanup rutin.
- Report boleh memakai query/table summary, tetapi source of truth tetap transaksi asli.

## Urutan Build

### Phase 0 - Discovery

- Freeze fitur app lama yang wajib dipertahankan.
- Tulis daftar route/menu aktif.
- Tulis flow kasir dari login sampai cetak struk.
- Tulis contoh transaksi fisik, digital, wallet, retur, dan closing shift.
- Putuskan frontend: Blade/Livewire atau React.

Exit criteria:

- Ada daftar fitur wajib.
- Ada ERD/schema draft MySQL.
- Ada contoh data transaksi untuk testing.

### Phase 1 - Laravel Foundation

- Buat Laravel project baru.
- Setup MySQL, `.env`, migration, seeder, auth, role, permission.
- Buat layout dasar dan login.
- Buat audit log foundation.
- Buat service pattern untuk aksi bisnis penting.

Exit criteria:

- Owner dan Kasir bisa login.
- Role dan permission berjalan.
- Audit log mencatat login dan aksi penting dasar.

### Phase 2 - Inventory Foundation

- Buat produk, kategori, harga, stok, dan mutasi stok.
- Buat import/export produk jika dibutuhkan.
- Buat stock opname dasar.

Exit criteria:

- Produk bisa dibuat, diedit, soft delete, dan dicari.
- Perubahan stok selalu menghasilkan mutation log.
- Tidak ada update stok diam-diam.

### Phase 3 - Cashier Core

- Buat cart/kasir.
- Buat transaksi produk fisik.
- Buat payment cash, QRIS, e-wallet, transfer.
- Buat struk.
- Buat idempotency guard untuk submit transaksi.

Exit criteria:

- Transaksi sukses mengurangi stok.
- Payment tercatat benar.
- Double-click submit tidak membuat transaksi ganda.
- Struk bisa dicetak.

### Phase 4 - Shift & Finance

- Buat buka/tutup shift.
- Hubungkan transaksi ke shift dan cashier station.
- Buat cash entry.
- Buat closing summary.
- Buat auto close jika masih diperlukan.

Exit criteria:

- Transaksi hanya masuk ke shift aktif.
- Closing menghitung cash dan non-cash dengan benar.
- Koreksi closing tercatat di audit.

### Phase 5 - Digital, Wallet, Retur

- Migrasikan produk/layanan digital.
- Migrasikan transaksi wallet/saldo.
- Migrasikan retur supplier dan customer.
- Pastikan dampak ke stok, kas, dan laporan konsisten.

Exit criteria:

- Semua jenis transaksi aktif punya flow Laravel.
- Retur tidak merusak laporan penjualan.
- Wallet/digital tidak mengubah stok fisik secara keliru.

### Phase 6 - Report & Audit

- Buat dashboard owner.
- Buat laporan penjualan.
- Buat laporan shift.
- Buat audit log viewer.
- Buat export laporan.

Exit criteria:

- Angka dashboard cocok dengan transaksi sumber.
- Laporan harian cocok dengan closing shift.
- Owner bisa menelusuri aksi sensitif.

### Phase 7 - Data Migration

- Export data lama dari Supabase/PostgreSQL.
- Mapping ke schema MySQL.
- Import ke staging MySQL.
- Bandingkan total transaksi, total omzet, stok, dan user aktif.
- Ulangi sampai selisih jelas dan bisa dijelaskan.

Exit criteria:

- Data user aktif masuk.
- Produk dan stok cocok.
- Total transaksi dan laporan cocok dalam toleransi yang disepakati.
- Ada rollback plan.

### Phase 8 - Cutover

- Freeze input di app lama.
- Jalankan migrasi final.
- Smoke test Laravel production.
- Arahkan domain ke app Laravel.
- Simpan app lama read-only untuk audit sementara.

Exit criteria:

- Owner dan Kasir bisa menjalankan alur harian.
- Tidak ada transaksi test tertinggal di production.
- Backup database tersedia.

## Acceptance Criteria Per Modul

Setiap modul baru minimal harus punya:

- Tujuan modul.
- Role yang boleh akses.
- Data yang dibuat/diubah.
- Efek ke stok/uang/laporan.
- Error state yang mungkin terjadi.
- Audit event yang harus dicatat.
- Test case manual.
- Test otomatis jika menyentuh uang, stok, atau permission.

## Testing Minimum

- Auth: login, logout, role guard, permission guard.
- Produk: create, update, soft delete, restore, stock mutation.
- Kasir: transaksi normal, stok habis, split payment, submit ganda.
- Shift: buka, tutup, transaksi tanpa shift aktif, koreksi closing.
- Retur: retur supplier/customer dan efek stok.
- Report: total penjualan, metode pembayaran, total per shift.
- Audit: aksi sensitif tercatat.

## Pelajaran Dari App Lama

### Yang Kurang Baik

- Schema terlalu banyak tumbuh lewat repair migration dan fallback.
- Nama field masih bercampur antara istilah lama dan istilah baru, seperti variasi field produk, transaksi, station, dan layanan.
- Banyak aturan bisnis penting berada di beberapa tempat sekaligus: frontend, RPC, migration, normalizer, dan verifier.
- Frontend terlalu tahu detail schema database.
- Report punya fallback perhitungan client-side dan server-side, sehingga sumber angka bisa membingungkan.
- Flow uang dan stok baru aman setelah banyak hardening tambahan, bukan sejak desain awal.
- App punya jejak stack lama: Supabase production, Express/backend legacy, dan MySQL legacy route yang harus dimatikan.
- Migration chain panjang membuat deployment database rentan salah urutan.
- Fallback schema membantu bertahan saat development, tetapi membuat bug schema lebih lama tersembunyi.

### Yang Tidak Boleh Diulang Di Laravel

- Jangan desain schema sambil jalan tanpa baseline final.
- Jangan membuat migration repair sebagai pola utama.
- Jangan biarkan UI langsung menulis ke tabel uang atau stok.
- Jangan taruh aturan transaksi di controller besar.
- Jangan buat dua sumber kebenaran untuk laporan.
- Jangan membuat fallback untuk nama kolom lama di app baru.
- Jangan membawa semua istilah lama jika nama baru lebih jelas.
- Jangan campur backend legacy dengan backend production.
- Jangan menunda idempotency, audit log, dan permission sampai akhir.
- Jangan anggap build berhasil berarti data production aman.

### Prinsip Perbaikan

- Laravel harus punya service/action khusus untuk setiap aksi bisnis penting.
- MySQL schema harus menjadi kontrak utama, bukan hasil akumulasi patch.
- Controller hanya validasi request, panggil service, dan kembalikan response.
- Semua perubahan uang, stok, shift, dan retur harus berada dalam database transaction.
- Setiap transaksi final bersifat immutable; koreksi lewat void, reversal, atau adjustment.
- Report harus punya query canonical yang disetujui dan dites dengan data contoh.
- Compatibility layer boleh ada saat migrasi data, tetapi tidak boleh menjadi fondasi app baru.

## Risiko Utama

- Aturan bisnis kecil hilang karena tidak didokumentasikan.
- Data lama tidak cocok dengan schema baru.
- Transaksi uang dibuat terlalu cepat tanpa idempotency.
- Stok langsung diupdate tanpa mutation log.
- Report dihitung dari field yang salah.
- UI baru terlihat selesai, tapi flow kasir harian belum aman.
- Terlalu banyak fitur tambahan masuk sebelum core POS stabil.

## Catatan Tambahan

### Hal Yang Tidak Boleh Dinegosiasikan

- Jangan mulai dari UI. Mulai dari schema, transaksi, stok, shift, dan audit.
- Jangan pakai float untuk uang.
- Jangan izinkan transaksi tanpa shift aktif jika operasional toko wajib berbasis shift.
- Jangan update stok langsung dari controller tanpa stock mutation.
- Jangan hapus atau edit transaksi final. Gunakan void, reversal, atau adjustment.
- Jangan membuat report dari cache/summary sebelum query source of truth benar.
- Jangan migrasi semua data lama sebelum mapping data diuji di staging.
- Jangan campur data test dan data production.

### Strategi Data Lama

Putuskan sejak awal data mana yang benar-benar perlu dibawa:

- Data wajib: user aktif, produk aktif, stok terakhir, saldo/wallet aktif, transaksi periode berjalan.
- Data opsional: transaksi historis lama, audit lama, operational events lama, produk deleted.
- Data yang boleh diarsipkan: log teknis, event debug, data repair sementara, fallback schema lama.

Untuk data historis, opsi paling aman adalah import sebagai arsip read-only jika mapping detail terlalu mahal. Jangan paksa semua data lama masuk ke tabel transaksi baru jika struktur lamanya sudah terlalu banyak patch.

### Kontrak Angka

Sebelum cutover, angka berikut harus dibandingkan antara app lama dan Laravel:

- Total produk aktif.
- Total stok per kategori.
- Total transaksi harian.
- Total omzet harian.
- Total cash, QRIS, e-wallet, transfer.
- Total transaksi per shift.
- Total retur.
- Saldo wallet/dompet jika masih digunakan.

Selisih harus dicatat dengan alasan. Jangan lanjut cutover hanya karena halaman terlihat normal.

### Anti-Pattern Rebuild

- Membuat banyak tabel dulu tanpa flow transaksi yang jelas.
- Menyalin nama kolom lama tanpa memahami fungsinya.
- Menganggap laporan benar hanya karena query tidak error.
- Menggabungkan semua jenis transaksi dalam satu controller besar.
- Menunda audit log sampai akhir.
- Menunda permission sampai semua halaman selesai.
- Membuat fitur baru saat core kasir belum stabil.
- Menggunakan seed dummy yang tidak mirip operasional toko.

### Pertanyaan Yang Harus Dijawab Sebelum Build

- Apakah kasir boleh transaksi jika belum buka shift?
- Apakah owner juga boleh menjadi kasir?
- Apakah satu kasir bisa pindah station dalam satu hari?
- Apakah stok boleh minus?
- Apakah harga jual boleh diedit saat transaksi?
- Apakah produk digital mengurangi stok atau hanya mencatat layanan?
- Apakah retur customer mengembalikan uang, stok, atau keduanya?
- Apakah transaksi bisa void setelah shift ditutup?
- Apakah audit lama wajib dibawa atau cukup mulai dari app Laravel?
- Berapa lama app lama harus disimpan read-only setelah cutover?

## Keputusan Yang Harus Dikunci Sebelum Coding

- Frontend akan pakai Blade/Livewire atau React.
- Auth memakai session biasa atau Sanctum.
- Apakah data lama wajib dimigrasikan semua atau hanya data aktif.
- Apakah app lama tetap online selama Laravel dibangun.
- Format nomor transaksi.
- Format cashier station.
- Metode pembayaran final.
- Kebijakan void, retur, dan koreksi shift.
- Retention data audit dan operational events.

## Definisi Selesai

Migrasi dianggap selesai hanya jika:

- Laravel + MySQL bisa menjalankan operasional harian tanpa Supabase.
- Semua flow kasir kritis berjalan.
- Data production berhasil dimigrasikan atau strategi data lama sudah disetujui.
- Owner bisa membaca laporan utama.
- Kasir bisa transaksi tanpa akses admin.
- Audit log tersedia untuk aksi sensitif.
- Backup, restore, queue, scheduler, dan deployment sudah dites.

## Dokumen Pendukung

- `PRODUCT.md` untuk batas produk dan prinsip UI.
- `docs/database-target.md` untuk memahami kontrak database lama.
- `docs/database-migration-map.md` untuk membaca sejarah schema Supabase/PostgreSQL.
