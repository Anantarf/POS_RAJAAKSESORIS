import { useMemo } from "react";
import AppIcon from "../../../components/app/AppIcon";
import { formatRupiah } from "../../../utils/format";

function groupRestockAlerts(products) {
  const habis = products.filter((p) => p.stok === 0);
  const menipis = products.filter((p) => p.stok > 0 && p.stok <= p.stok_minimum);

  return [
    habis.length && { key: "habis", label: "Stok Habis", rows: habis, badgeClassName: "brand-badge-danger" },
    menipis.length && { key: "menipis", label: "Stok Menipis", rows: menipis, badgeClassName: "brand-badge-warning" },
  ].filter(Boolean);
}

export function RestockAlertsSidebar({
  products,
  onOpenMutation,
  canAddStock,
}) {
  const restockAlertProducts = useMemo(
    () =>
      products
        .filter(
          (product) =>
            product.status === "active" &&
            Number(product.stok || 0) <= Number(product.stok_minimum || 0)
        )
        .sort((a, b) => Number(a.stok || 0) - Number(b.stok || 0)),
    [products]
  );

  const alertGroups = useMemo(() => groupRestockAlerts(restockAlertProducts), [restockAlertProducts]);

  if (!restockAlertProducts.length) {
    return (
      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
        <p className="text-sm font-semibold text-emerald-900">✓ Tidak ada stok kritis</p>
        <p className="mt-1 text-xs text-emerald-800">Semua produk aktif dalam kondisi baik.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-950">Perlu Restock Segera</p>
        <span className="brand-badge-danger">{restockAlertProducts.length}</span>
      </div>

      {alertGroups.map((group) => (
        <div key={group.key}>
          <div className="mb-2 flex items-center gap-2">
            <span className={`text-xs font-semibold ${group.badgeClassName}`}>{group.label}</span>
            <span className="text-[11px] text-slate-500">{group.rows.length} produk</span>
          </div>
          <div className="space-y-2">
            {group.rows.slice(0, 5).map((product) => (
              <div key={product.id} className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 text-sm">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-950 text-xs">{product.nama}</p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">{product.kategori || "Tanpa kategori"}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-bold ${product.stok === 0 ? "text-red-600" : "text-amber-700"}`}>
                    {product.stok} {product.satuan || "pcs"}
                  </span>
                </div>
                {canAddStock && (
                  <button
                    type="button"
                    onClick={() => onOpenMutation(product)}
                    className="w-full rounded-md bg-slate-950 px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800 transition"
                  >
                    <AppIcon name="package-plus" className="inline h-3 w-3 mr-1" />
                    Tambah
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
