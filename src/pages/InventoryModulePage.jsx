import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import LoadingState from "../components/LoadingState";

const ProductsPage = lazy(() => import("./ProductsPage"));
const ServiceProductsPage = lazy(() => import("./ServiceProductsPage"));
const StockOpnamePage = lazy(() => import("./StockOpnamePage"));
const SupplierReturnsPage = lazy(() => import("./SupplierReturnsPage"));
const ProductHistoryPage = lazy(() => import("./ProductHistoryPage"));
const WalletPage = lazy(() => import("./WalletPage"));

const BASE_TABS = [
  {
    id: "physical",
    label: "Produk",
    ownerOnly: false,
  },
  {
    id: "digital",
    label: "Digital",
    ownerOnly: true,
  },
  {
    id: "opname",
    label: "Opname",
    ownerOnly: true,
  },
  {
    id: "returns",
    label: "Retur",
    ownerOnly: true,
  },
  {
    id: "saldo",
    label: "Saldo",
    ownerOnly: true,
  },
  {
    id: "archive",
    label: "Arsip",
    ownerOnly: true,
  },
];

function renderInventoryTab(activeTab) {
  if (activeTab === "digital") return <ServiceProductsPage />;
  if (activeTab === "opname") return <StockOpnamePage />;
  if (activeTab === "returns") return <SupplierReturnsPage />;
  if (activeTab === "saldo") return <WalletPage />;
  if (activeTab === "archive") return <ProductHistoryPage />;
  return <ProductsPage />;
}

export default function InventoryModulePage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabs = useMemo(
    () => BASE_TABS.filter((tab) => !tab.ownerOnly || user?.role === "pemilik"),
    [user?.role]
  );
  const requestedTab = normalizeInventoryTab(searchParams.get("tab"));
  const [activeTab, setActiveTab] = useState(requestedTab);
  const activeTabMeta = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  useEffect(() => {
    if (activeTabMeta?.id && activeTabMeta.id !== activeTab) {
      setActiveTab(activeTabMeta.id);
    }
  }, [activeTab, activeTabMeta?.id]);

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
        <div className="mb-3 flex flex-col gap-3 rounded-lg border border-[var(--brand-border)] bg-white px-3 py-2 shadow-[var(--brand-shadow-sm)] lg:flex-row lg:items-center lg:justify-between">
          <h1 className="min-w-0 truncate text-sm font-black text-slate-950">
            Inventory {activeTabMeta.label}
          </h1>
          <div
            className="brand-segmented w-full lg:w-auto"
            role="tablist"
            aria-label="Mode inventory"
          >
            {tabs.map((tab) => {
              const active = tab.id === activeTabMeta.id;
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
          <div role="tabpanel">{renderInventoryTab(activeTabMeta.id)}</div>
        </Suspense>
      </div>
    </div>
  );
}

function normalizeInventoryTab(tab) {
  if (tab === "fisik") return "physical";
  if (tab === "retur") return "returns";
  if (["physical", "digital", "opname", "returns", "saldo", "archive"].includes(tab)) return tab;
  return "physical";
}
