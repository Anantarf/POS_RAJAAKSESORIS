import { useMemo, useRef, useState } from "react";
import AppIcon from "../../../components/app/AppIcon";

export function SearchableProductSelect({
  products,
  value,
  onChange,
  placeholder = "Cari produk...",
  disabled = false,
  className = "",
}) {
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = React.useState(false);

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        const keyword = search.toLowerCase();
        return (
          p.nama.toLowerCase().includes(keyword) ||
          p.kode_produk?.toLowerCase().includes(keyword) ||
          p.kategori?.toLowerCase().includes(keyword)
        );
      }),
    [products, search]
  );

  const selected = products.find((p) => p.id === value);

  const handleSelect = (product) => {
    onChange(product.id);
    setSearch("");
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <button
          type="button"
          ref={inputRef}
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="brand-input w-full text-left flex items-center justify-between px-4 py-3"
        >
          <span className={selected ? "text-slate-950 font-semibold" : "text-slate-500"}>
            {selected ? `${selected.nama} (${selected.kode_produk || "no code"})` : placeholder}
          </span>
          <AppIcon name="chevron-down" className="h-4 w-4 text-slate-400" />
        </button>

        {isOpen && (
          <>
            <div className="absolute inset-x-0 top-full z-50 mt-1 rounded-lg border border-slate-200 bg-white shadow-lg">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, barcode, atau kategori..."
                className="brand-input m-2 w-[calc(100%-16px)]"
                autoFocus
              />

              <div
                ref={listRef}
                className="brand-scrollbar max-h-64 overflow-y-auto space-y-1 p-2"
              >
                {filtered.length > 0 ? (
                  filtered.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleSelect(product)}
                      className="w-full text-left rounded-lg px-3 py-2.5 hover:bg-slate-100 transition flex flex-col gap-1"
                    >
                      <p className="font-semibold text-slate-950 text-sm">{product.nama}</p>
                      <p className="text-xs text-slate-500">
                        {product.kategori || "Tanpa kategori"} • {product.kode_produk || "no code"} • Stok: {product.stok}
                      </p>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-4 text-center text-sm text-slate-500">
                    Produk tidak ditemukan
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
          </>
        )}
      </div>
    </div>
  );
}
