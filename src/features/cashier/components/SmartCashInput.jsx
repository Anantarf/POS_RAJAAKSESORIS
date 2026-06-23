import { useMemo } from "react";
import { formatRupiah } from "../../../utils/format";

function getSuggestedDenominations(cartTotal) {
  // Suggest common cash denominations based on invoice total
  const denominations = [50000, 100000, 200000, 500000, 1000000];
  const suggestions = new Set();

  // Add exact amount
  suggestions.add(cartTotal);

  // Add round up to nearest denomination
  for (const denom of denominations) {
    if (cartTotal % denom === 0) {
      suggestions.add(cartTotal);
      break;
    }
    if (cartTotal < denom) {
      suggestions.add(denom);
      break;
    }
    if (cartTotal % denom !== 0) {
      const rounded = Math.ceil(cartTotal / denom) * denom;
      suggestions.add(rounded);
    }
  }

  // Remove amounts less than cartTotal and duplicates
  return Array.from(suggestions)
    .filter((amount) => amount >= cartTotal)
    .sort((a, b) => a - b)
    .slice(0, 4); // Keep top 4 suggestions
}

export function SmartCashInput({
  cartTotal,
  cashReceived,
  onChangeCashReceived,
  inputRef,
}) {
  const cashValue = Number(cashReceived || 0);
  const suggestions = useMemo(() => getSuggestedDenominations(cartTotal), [cartTotal]);

  const cashDisplay = useMemo(() => {
    if (!cashReceived) {
      return {
        label: "Masukkan uang diterima",
        tone: "border-slate-200 bg-slate-50 text-slate-600",
      };
    }

    const shortage = cartTotal - cashValue;
    if (shortage > 0) {
      return {
        label: `Kurang ${formatRupiah(shortage)}`,
        tone: "border-rose-200 bg-rose-50 text-rose-700",
      };
    }

    const change = cashValue - cartTotal;
    return {
      label: change === 0 ? "Uang pas" : `Kembalian ${formatRupiah(change)}`,
      tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }, [cashReceived, cartTotal, cashValue]);

  return (
    <div className="space-y-3">
      {/* Input Field */}
      <div>
        <label
          htmlFor="cash-payment-received"
          className="block text-sm font-semibold text-slate-700 mb-2"
        >
          Uang Diterima
        </label>
        <input
          id="cash-payment-received"
          ref={inputRef}
          type="number"
          min="0"
          value={cashReceived}
          onChange={(e) => onChangeCashReceived(e.target.value)}
          className="brand-input h-12 text-base font-bold w-full"
          placeholder="0"
          aria-describedby="cash-payment-validation"
          aria-invalid={cashReceived !== "" && cashValue < cartTotal}
        />
      </div>

      {/* Smart Suggestions */}
      {suggestions.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {suggestions.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => onChangeCashReceived(String(amount))}
              className={`py-2.5 px-3 rounded-lg font-semibold text-sm transition-all border-2 ${
                cashValue === amount
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              {formatRupiah(amount)}
            </button>
          ))}
        </div>
      )}

      {/* Status Display */}
      <div
        id="cash-payment-validation"
        className={`rounded-lg border px-4 py-3 text-sm font-semibold ${cashDisplay.tone}`}
        aria-live="polite"
        role="status"
      >
        {cashDisplay.label}
      </div>
    </div>
  );
}
