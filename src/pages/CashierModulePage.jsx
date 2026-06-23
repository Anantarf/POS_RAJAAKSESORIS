import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import LoadingState from "../components/LoadingState";

const CashierPage = lazy(() => import("./CashierPage"));
const DigitalPage = lazy(() => import("./DigitalPage"));
const ShiftPage = lazy(() => import("./ShiftPage"));

const TABS = [
  {
    id: "physical",
    label: "Item fisik",
    description: "Aksesoris, stok barang, pembayaran, dan cetak struk.",
  },
  {
    id: "digital",
    label: "Item digital",
    description: "Pulsa, kuota, voucher, token, transfer, dan tagihan.",
  },
  {
    id: "shift",
    label: "Shift",
    description: "Buka, tutup, dan cek shift kerja kasir.",
  },
];

export default function CashierModulePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = normalizeCashierTab(searchParams.get("tab"));
  const [activeTab, setActiveTab] = useState(requestedTab);
  const activeTabMeta = useMemo(
    () => TABS.find((tab) => tab.id === activeTab) || TABS[0],
    [activeTab]
  );

  useEffect(() => {
    setActiveTab(requestedTab);
  }, [requestedTab]);

  function selectTab(tabId) {
    setActiveTab(tabId);
    setSearchParams(tabId === "physical" ? {} : { tab: tabId });
  }

  return (
    <div className="min-h-full bg-[var(--brand-bg)]">
      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-3 flex flex-col gap-3 rounded-lg border border-[var(--brand-border)] bg-white px-3 py-3 shadow-[var(--brand-shadow-sm)] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-gold)] text-sm font-black text-slate-950">
              POS
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--brand-gold-strong)]">
                Mode kasir aktif
              </p>
              <h1 className="truncate text-lg font-black text-slate-950">{activeTabMeta.label}</h1>
            </div>
          </div>

          <div
            className="brand-segmented w-full lg:w-auto"
            role="tablist"
            aria-label="Mode kasir"
          >
              {TABS.map((tab) => {
                const active = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => selectTab(tab.id)}
                    role="tab"
                    aria-selected={active}
                    className={`brand-segmented-button flex-1 lg:flex-none ${
                      active ? "brand-segmented-button-active" : ""
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
          </div>
        </div>

        <Suspense fallback={<LoadingState text={`Memuat ${activeTabMeta.label}...`} size={96} />}>
          <div role="tabpanel">
            {activeTab === "digital" ? <DigitalPage /> : null}
            {activeTab === "shift" ? <ShiftPage /> : null}
            {activeTab === "physical" ? <CashierPage /> : null}
          </div>
        </Suspense>
      </div>
    </div>
  );
}

function normalizeCashierTab(tab) {
  if (["physical", "digital", "shift"].includes(tab)) return tab;
  return "physical";
}
