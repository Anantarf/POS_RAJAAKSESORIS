import { formatRupiah } from "../../../utils/format";

const paymentCategories = [
  {
    label: "Tunai",
    methods: [{ value: "cash", label: "Cash" }],
  },
  {
    label: "Digital",
    methods: [
      { value: "qris", label: "QRIS" },
      { value: "transfer_bank", label: "Transfer Bank" },
      { value: "ewallet", label: "E-Wallet" },
    ],
  },
  {
    label: "Lainnya",
    methods: [{ value: "pasar_kuota", label: "PASAR KUOTA" }],
  },
];

export function PaymentMethodSelector({
  paymentGroup,
  onChangePaymentGroup,
  bankWallet,
  onChangeBankWallet,
  ewalletWallet,
  onChangeEwalletWallet,
  bankWalletOptions,
  ewalletOptions,
  cartTotal,
  selectedWalletBalance,
  walletPlatformLabelMap,
}) {
  const selectedCategory = paymentCategories.find((cat) =>
    cat.methods.some((m) => m.value === paymentGroup)
  );

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="grid grid-cols-3 gap-2">
        {paymentCategories.map((category) => (
          <button
            key={category.label}
            type="button"
            onClick={() => {
              const firstMethod = category.methods[0].value;
              onChangePaymentGroup(firstMethod);
            }}
            className={`py-3 px-3 rounded-lg font-semibold text-sm transition-all ${
              selectedCategory?.label === category.label
                ? "bg-slate-950 text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Methods in Category */}
      <div className="grid grid-cols-2 gap-2">
        {selectedCategory?.methods.map((method) => (
          <button
            key={method.value}
            type="button"
            onClick={() => onChangePaymentGroup(method.value)}
            className={`py-3 px-3 rounded-lg font-semibold text-sm transition-all border-2 ${
              paymentGroup === method.value
                ? "border-slate-950 bg-slate-950 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            {method.label}
          </button>
        ))}
      </div>

      {/* Conditional Sub-selection */}
      {paymentGroup === "transfer_bank" && (
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Pilih Bank Tujuan
          </label>
          <select
            value={bankWallet}
            onChange={(e) => onChangeBankWallet(e.target.value)}
            className="brand-select"
          >
            {bankWalletOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {paymentGroup === "ewallet" && (
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Pilih E-Wallet
          </label>
          <select
            value={ewalletWallet}
            onChange={(e) => onChangeEwalletWallet(e.target.value)}
            className="brand-select"
          >
            {ewalletOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Non-cash payment info */}
      {paymentGroup !== "cash" && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
          <div className="text-sm">
            <p className="font-semibold text-slate-700">Informasi Saldo</p>
            <p className="mt-2 text-slate-600">
              Saldo sekarang: <span className="font-bold text-slate-950">{formatRupiah(selectedWalletBalance)}</span>
            </p>
            <p className="mt-1 text-slate-600">
              Setelah transaksi: <span className="font-bold text-slate-950">{formatRupiah(selectedWalletBalance + cartTotal)}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
