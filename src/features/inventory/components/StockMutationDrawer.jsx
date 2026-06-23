import { useMemo } from "react";
import { Drawer } from "../../../components/ui/Primitives";
import { SearchableProductSelect } from "./SearchableProductSelect";
import { formatRupiah } from "../../../utils/format";

const quickMutationAmounts = [1, 5, 10, 20];

export function StockMutationDrawer({
  open,
  onClose,
  products,
  mutation,
  onMutationChange,
  onSubmit,
  canAddStock,
  isSubmitting,
}) {
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === mutation.productId) || null,
    [mutation.productId, products]
  );

  const mutationQuantity = Number(mutation.jumlah);
  const mutationDeltaPreview =
    selectedProduct && Number.isFinite(mutationQuantity) && mutationQuantity > 0
      ? mutation.tipe === "keluar"
        ? -Math.abs(mutationQuantity)
        : Math.abs(mutationQuantity)
      : null;
  const mutationStockAfter =
    mutationDeltaPreview === null
      ? null
      : Number(selectedProduct?.stok || 0) + mutationDeltaPreview;

  const handleQuickAmount = (amount) => {
    const currentAmount = Number(mutation.jumlah);
    const baseAmount = Number.isFinite(currentAmount) && currentAmount > 0 ? currentAmount : 0;
    onMutationChange({ jumlah: String(baseAmount + amount) });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canAddStock || !selectedProduct || !Number.isFinite(mutationQuantity) || mutationQuantity <= 0) {
      return;
    }
    onSubmit();
  };

  return (
    <Drawer open={open} title="Mutasi Stok" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Product Select */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Pilih Produk</label>
          <SearchableProductSelect
            products={products}
            value={mutation.productId}
            onChange={(productId) => onMutationChange({ productId })}
            disabled={!canAddStock}
            placeholder="Cari nama, barcode, atau kategori..."
          />
        </div>

        {/* Product Summary */}
        {selectedProduct && (
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <p className="text-sm font-semibold text-slate-950">{selectedProduct.nama}</p>
            <p className="mt-1 text-xs text-slate-600">{selectedProduct.kategori || "Tanpa kategori"}</p>
            <p className="mt-2 text-xs text-slate-500">
              Stok sekarang: <strong className="text-slate-950">{selectedProduct.stok} {selectedProduct.satuan || "pcs"}</strong>
            </p>
          </div>
        )}

        {/* Mutation Type */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Jenis Mutasi</label>
          <select
            value={mutation.tipe}
            onChange={(e) => onMutationChange({ tipe: e.target.value })}
            disabled={!canAddStock || !selectedProduct}
            className="brand-select"
          >
            <option value="masuk">Stok Masuk</option>
            <option value="keluar">Stok Keluar</option>
            <option value="penyesuaian">Penyesuaian</option>
          </select>
        </div>

        {/* Quantity Input */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Jumlah Mutasi</label>
          <input
            type="number"
            min="0"
            step="1"
            value={mutation.jumlah}
            onChange={(e) => onMutationChange({ jumlah: e.target.value })}
            disabled={!canAddStock || !selectedProduct}
            className="brand-input text-lg font-bold"
            placeholder="0"
          />
        </div>

        {/* Quick Buttons */}
        {selectedProduct && (
          <div className="flex flex-wrap gap-2">
            {quickMutationAmounts.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => handleQuickAmount(amount)}
                disabled={!canAddStock}
                className="rounded-lg px-3 py-2 text-sm font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                +{amount}
              </button>
            ))}
          </div>
        )}

        {/* Stock Preview */}
        {mutationDeltaPreview !== null && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm">
            <p className="font-semibold text-blue-950">Preview Stok</p>
            <p className="mt-2 text-blue-900">
              {selectedProduct.stok} → <strong>{mutationStockAfter}</strong> {selectedProduct.satuan || "pcs"}
            </p>
          </div>
        )}

        {/* Reference & Notes */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Referensi (Opsional)</label>
          <input
            type="text"
            value={mutation.referensi}
            onChange={(e) => onMutationChange({ referensi: e.target.value })}
            disabled={!canAddStock || !selectedProduct}
            className="brand-input"
            placeholder="Nota supplier atau nomor opname..."
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Catatan (Opsional)</label>
          <textarea
            value={mutation.catatan}
            onChange={(e) => onMutationChange({ catatan: e.target.value })}
            disabled={!canAddStock || !selectedProduct}
            className="brand-input min-h-24"
            placeholder="Alasan atau detail penyesuaian..."
          />
        </div>

        {/* Submit */}
        <div className="flex gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="brand-button-secondary flex-1"
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button
            type="submit"
            className="brand-button-success flex-1 disabled:opacity-60"
            disabled={!canAddStock || !selectedProduct || !Number.isFinite(mutationQuantity) || mutationQuantity <= 0 || isSubmitting}
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Mutasi"}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
