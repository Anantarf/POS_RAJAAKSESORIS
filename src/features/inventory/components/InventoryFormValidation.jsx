export function InventoryFormValidation({ form, touched = {} }) {
  const errors = [];

  // Product name validation
  if (touched.nama && !form.nama?.trim()) {
    errors.push("Nama produk wajib diisi");
  }

  // Category validation
  if (touched.kategori && !form.kategori?.trim()) {
    errors.push("Kategori wajib dipilih");
  }

  // Price validation
  if (touched.harga_jual) {
    const harga = Number(form.harga_jual || 0);
    if (harga <= 0) {
      errors.push("Harga jual harus lebih dari 0");
    }
  }

  if (touched.harga_beli) {
    const harga = Number(form.harga_beli || 0);
    if (harga <= 0) {
      errors.push("Harga modal harus lebih dari 0");
    }
  }

  // Stock validation
  if (touched.stok) {
    const stok = Number(form.stok || 0);
    if (!Number.isFinite(stok) || stok < 0) {
      errors.push("Stok harus berupa angka non-negatif");
    }
  }

  // Minimum stock validation
  if (touched.stok_minimum) {
    const min = Number(form.stok_minimum || 0);
    if (!Number.isFinite(min) || min < 0) {
      errors.push("Stok minimum harus berupa angka non-negatif");
    }
  }

  if (!errors.length) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
        <p className="text-sm font-semibold text-emerald-700">✓ Siap disimpan</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
      <p className="text-sm font-semibold text-rose-700 mb-2">⚠ Ada kesalahan:</p>
      <ul className="space-y-1">
        {errors.map((error, idx) => (
          <li key={idx} className="text-sm text-rose-600">
            • {error}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MutationFormValidation({ mutation, selectedProduct }) {
  const errors = [];

  if (!selectedProduct) {
    errors.push("Pilih produk terlebih dahulu");
  }

  const qty = Number(mutation.jumlah || 0);
  if (!Number.isFinite(qty) || qty <= 0) {
    errors.push("Jumlah harus lebih dari 0");
  }

  if (selectedProduct && mutation.tipe === "keluar") {
    if (qty > selectedProduct.stok) {
      errors.push(`Stok tidak cukup. Tersedia: ${selectedProduct.stok}`);
    }
  }

  if (!errors.length && selectedProduct && qty > 0) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
        <p className="text-sm font-semibold text-emerald-700">✓ Siap disimpan</p>
      </div>
    );
  }

  if (errors.length) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
        <p className="text-sm font-semibold text-rose-700 mb-2">⚠ Ada kesalahan:</p>
        <ul className="space-y-1">
          {errors.map((error, idx) => (
            <li key={idx} className="text-sm text-rose-600">
              • {error}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-sm text-slate-600">Isi form untuk lanjut</p>
    </div>
  );
}
