import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import LoadingState from "../components/LoadingState";

const CashierPage = lazy(() => import("./CashierPage"));
const DigitalPage = lazy(() => import("./DigitalPage"));
const ShiftPage = lazy(() => import("./ShiftPage"));

const TABS = [
  {
    id: "physical",
    label: "Fisik",
  },
  {
    id: "digital",
    label: "Digital",
  },
  {
    id: "shift",
    label: "Shift",
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
        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-[var(--brand-border)] bg-white px-3 py-2 shadow-[var(--brand-shadow-sm)]">
          <h1 className="min-w-0 truncate text-sm font-black text-slate-950">
            Kasir {activeTabMeta.label}
          </h1>
          <div
            className="brand-segmented shrink-0"
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
                  className={`brand-segmented-button ${
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
