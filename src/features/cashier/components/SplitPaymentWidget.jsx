import { useMemo } from "react";
import { formatRupiah } from "../../../utils/format";
import { getSplitPaymentAmount, createSplitPaymentRow } from "../utils/paymentCalculations";
import { walletPlatformLabelMap } from "../../../data/businessOptions";

export function SplitPaymentWidget({
  cartTotal,
  splitPayments,
  onUpdatePayment,
  onAddPayment,
  onRemovePayment,
  splitPaymentOptions,
}) {
  const normalizedSplitPayments = useMemo(
    () => splitPayments.map((p) => ({ ...p, amount: Number(p.amount || 0) })),
    [splitPayments]
  );

  const splitPaidTotal = useMemo(
    () => normalizedSplitPayments.reduce((sum, p) => sum + p.amount, 0),
    [normalizedSplitPayments]
  );

  const splitRemaining = useMemo(
    () => Math.max(0, cartTotal - splitPaidTotal),
    [cartTotal, splitPaidTotal]
  );

  const splitOverpay = useMemo(
    () => Math.max(0, splitPaidTotal - cartTotal),
    [splitPaidTotal, cartTotal]
  );

  const progressPercent = useMemo(
    () => (splitPaidTotal > 0 ? Math.min(100, (splitPaidTotal / cartTotal) * 100) : 0),
    [splitPaidTotal, cartTotal]
  );

  const isReady = splitRemaining === 0 && splitOverpay === 0;

  const handleAutoFillRemaining = (paymentId) => {
    const otherTotal = normalizedSplitPayments.reduce((sum, p) => {
      return p.id === paymentId ? sum : sum + p.amount;
    }, 0);
    const remaining = Math.max(0, cartTotal - otherTotal);
    onUpdatePayment(paymentId, { amount: remaining ? String(remaining) : "" });
  };

  const handleSmartSplit = () => {
    const itemCount = splitPayments.length;
    const perItem = Math.round(cartTotal / itemCount);
    const updated = splitPayments.map((p, idx) => ({
      ...p,
      amount: idx === itemCount - 1 ? String(cartTotal - perItem * (itemCount - 1)) : String(perItem),
    }));
    // Update all at once (caller handles batch update)
    updated.forEach((p) => {
      onUpdatePayment(p.id, { amount: p.amount });
    });
  };

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="rounded-lg bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">Total split</p>
            <p className="text-2xl font-bold text-slate-950 mt-1">
              {formatRupiah(splitPaidTotal)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-500">Target</p>
            <p className="text-lg font-bold text-slate-950 mt-1">
              {formatRupiah(cartTotal)}
            </p>
          </div>
        </div>

        {/* Visual Progress */}
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isReady ? "bg-emerald-500" : splitOverpay > 0 ? "bg-red-500" : "bg-amber-500"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Status Message */}
        <div className="mt-3 text-sm font-semibold">
          {isReady ? (
            <span className="text-emerald-700">✓ Pembayaran split sudah pas</span>
          ) : splitOverpay > 0 ? (
            <span className="text-red-700">Nominal split lebih {formatRupiah(splitOverpay)}</span>
          ) : (
            <span className="text-amber-700">Sisa {formatRupiah(splitRemaining)} perlu diisi</span>
          )}
        </div>
      </div>

      {/* Split Rows */}
      <div className="space-y-3">
        {splitPayments.map((payment, index) => (
          <div
            key={payment.id}
            className="border border-slate-200 rounded-lg p-3 bg-white hover:border-slate-300 transition-colors"
          >
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Metode {index + 1}
                </label>
                <select
                  value={payment.method}
                  onChange={(e) => onUpdatePayment(payment.id, { method: e.target.value })}
                  className="brand-select text-sm"
                  aria-label={`Metode split ${index + 1}`}
                >
                  {splitPaymentOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nominal
                </label>
                <input
                  type="number"
                  min="0"
                  value={payment.amount}
                  onChange={(e) => onUpdatePayment(payment.id, { amount: e.target.value })}
                  className="brand-input text-sm font-bold w-full"
                  placeholder="0"
                  aria-label={`Nominal split ${index + 1}`}
                />
              </div>

              <button
                type="button"
                onClick={() => handleAutoFillRemaining(payment.id)}
                className="brand-button-secondary h-10 px-3 py-2 text-xs whitespace-nowrap"
                title="Isi sisa pembayaran otomatis"
              >
                Isi Sisa
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 mt-2 pt-2 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500">
                {walletPlatformLabelMap[payment.method] || payment.method}
              </p>
              {splitPayments.length > 2 && (
                <button
                  type="button"
                  onClick={() => onRemovePayment(payment.id)}
                  className="text-xs font-bold text-red-600 hover:text-red-700 disabled:text-slate-300"
                >
                  Hapus
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onAddPayment}
          className="brand-button-secondary flex-1 text-sm"
        >
          + Tambah Metode
        </button>
        {splitPayments.length > 1 && (
          <button
            type="button"
            onClick={handleSmartSplit}
            className="brand-button-secondary px-3 text-sm"
            title="Bagi rata total antara metode pembayaran"
          >
            Bagi Rata
          </button>
        )}
      </div>
    </div>
  );
}
