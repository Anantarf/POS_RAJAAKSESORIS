import { formatRupiah } from "../../../utils/format";

export function CartMobileSheet({ cart, cartTotal, cartItemCount, onSetQty, onContinue, disabled }) {
  if (!cartItemCount) return null;

  return (
    <>
      {/* Floating Cart Button (md:hidden) */}
      <button
        type="button"
        onClick={onContinue}
        disabled={disabled}
        className="fixed bottom-6 left-4 right-4 z-40 md:hidden brand-button-primary py-4 rounded-lg shadow-lg"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-700">Checkout</p>
            <p className="text-xl font-bold mt-1">{formatRupiah(cartTotal)}</p>
          </div>
          <div className="bg-slate-950 text-white rounded-md px-3 py-2 text-sm font-bold">
            {cartItemCount} item
          </div>
        </div>
      </button>

      {/* Cart Peek Sheet (sm & md) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white border-t border-slate-200 rounded-t-2xl shadow-lg max-h-[45vh] overflow-hidden flex flex-col">
        {/* Handle Bar */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="h-1 w-12 bg-slate-300 rounded-full" />
        </div>

        {/* Cart Summary */}
        <div className="px-4 py-2 border-b border-slate-100 flex-shrink-0">
          <p className="text-sm font-bold text-slate-950">Keranjang ({cartItemCount})</p>
          <p className="text-base font-bold text-slate-950 mt-1">{formatRupiah(cartTotal)}</p>
        </div>

        {/* Scrollable Cart Items */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {cart.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-950 line-clamp-1">{item.nama}</p>
                <p className="text-xs text-slate-500 mt-0.5">{formatRupiah(item.harga_jual)}</p>
              </div>

              {/* Qty Controls */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => onSetQty(item.id, item.qty - 1)}
                  disabled={Boolean(item.unavailableReason)}
                  className="brand-icon-button brand-icon-button-sm brand-icon-button-muted disabled:opacity-40"
                >
                  −
                </button>
                <span className="w-6 text-center text-xs font-bold">{item.qty}</span>
                <button
                  type="button"
                  onClick={() => onSetQty(item.id, item.qty + 1)}
                  disabled={Boolean(item.unavailableReason)}
                  className="brand-icon-button brand-icon-button-sm brand-icon-button-primary disabled:opacity-40"
                >
                  +
                </button>
              </div>

              {/* Subtotal */}
              <div className="text-right flex-shrink-0 min-w-[60px]">
                <p className="text-xs font-bold text-slate-950">{formatRupiah(item.subtotal)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Spacer untuk floating button */}
      <div className="h-24 md:hidden" />
    </>
  );
}
