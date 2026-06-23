export function PaymentValidationFeedback({
  isSplitPayment,
  splitPayments,
  cartTotal,
  splitPaidTotal,
  cashReceived,
  cartValue,
  isReadyToCheckout,
}) {
  const cashValue = Number(cashReceived || 0);
  const shortage = Math.max(0, cartTotal - cashValue);

  if (isSplitPayment) {
    const splitRemaining = Math.max(0, cartTotal - splitPaidTotal);
    const splitOverpay = Math.max(0, splitPaidTotal - cartTotal);

    if (!isReadyToCheckout) {
      return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-700">
            {splitPayments.length < 2
              ? "✓ Minimal 2 metode pembayaran diperlukan"
              : splitRemaining > 0
                ? `✓ Sisa ${cartTotal - splitPaidTotal} perlu diisi`
                : `✗ Total split lebih ${splitOverpay}`}
          </p>
        </div>
      );
    }

    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
        <p className="text-sm font-semibold text-emerald-700">
          ✓ Pembayaran split siap
        </p>
      </div>
    );
  }

  // Single payment validation
  if (shortage > 0) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
        <p className="text-sm font-semibold text-rose-700">
          ✗ Uang kurang {new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          }).format(shortage)}
        </p>
      </div>
    );
  }

  if (!cashReceived) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm font-semibold text-slate-600">
          Masukkan nominal uang untuk lanjut
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
      <p className="text-sm font-semibold text-emerald-700">
        ✓ Pembayaran valid, siap checkout
      </p>
    </div>
  );
}
