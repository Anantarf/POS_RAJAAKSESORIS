import AppIcon from "../../../components/app/AppIcon";
import { formatRupiah } from "../../../utils/format";

// Stock health indicator
function StockSignal({ product }) {
  const stock = Number(product.stok || 0);
  const minimum = Number(product.stok_minimum || 0);

  if (stock <= 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex h-2 w-2 rounded-full bg-red-600" aria-hidden="true" />
        <span className="text-sm font-bold text-red-700">Habis</span>
      </div>
    );
  }

  if (stock <= minimum) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
        <span className="text-sm font-bold text-amber-700">Menipis ({stock})</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex h-2 w-2 rounded-full bg-emerald-600" aria-hidden="true" />
      <span className="text-sm font-semibold text-slate-600">{stock}</span>
    </div>
  );
}

export function ProductTableCompact({
  products,
  canAddStock,
  canManageProducts,
  onAddStock,
  onEdit,
  onDelete,
  onToggleStatus,
}) {
  if (!products.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-500">Produk kosong</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">Produk</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">Stok</th>
            <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-600">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-slate-50 transition">
              {/* Product Info */}
              <td className="px-4 py-3 min-w-0">
                <div className="flex flex-col gap-1">
                  <p className="font-semibold text-slate-950 truncate">{product.nama}</p>
                  <div className="flex flex-wrap gap-1 text-xs text-slate-500">
                    <span className="bg-slate-100 px-2 py-0.5 rounded">
                      {product.kategori || "No cat"}
                    </span>
                    <span className="font-mono">
                      {product.kode_produk || "—"}
                    </span>
                  </div>
                </div>
              </td>

              {/* Stock Signal */}
              <td className="px-4 py-3">
                <StockSignal product={product} />
              </td>

              {/* Actions */}
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  {canAddStock && (
                    <button
                      type="button"
                      onClick={() => onAddStock(product)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700 transition"
                      title="Tambah stok"
                      aria-label={`Tambah stok ${product.nama}`}
                    >
                      <AppIcon name="package-plus" className="h-4 w-4" />
                    </button>
                  )}

                  {canManageProducts && (
                    <>
                      <button
                        type="button"
                        onClick={() => onEdit(product)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 transition"
                        title="Edit produk"
                        aria-label={`Edit ${product.nama}`}
                      >
                        <AppIcon name="edit-2" className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(product)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-700 transition"
                        title="Hapus produk"
                        aria-label={`Hapus ${product.nama}`}
                      >
                        <AppIcon name="trash-2" className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleStatus(product.id, product.status !== "active")}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${
                          product.status === "active"
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                        }`}
                        title={product.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                        aria-label={`${product.status === "active" ? "Nonaktifkan" : "Aktifkan"} ${product.nama}`}
                      >
                        <AppIcon name={product.status === "active" ? "eye" : "eye-off"} className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
