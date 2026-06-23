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
    label: "Item fisik",
    ownerOnly: false,
    description: "Produk aksesoris, harga, stok, tambah produk, dan hapus produk.",
  },
  {
    id: "digital",
    label: "Item digital",
    ownerOnly: true,
    description: "Katalog layanan digital, provider, modal, harga jual, dan status layanan.",
  },
  {
    id: "opname",
    label: "Cek stok fisik",
    ownerOnly: true,
    description: "Cek stok real, selisih, dan penyesuaian stok.",
  },
  {
    id: "returns",
    label: "Retur",
    ownerOnly: true,
    description: "Retur supplier dan klaim garansi yang berdampak ke stok.",
  },
  {
    id: "saldo",
    label: "Saldo Toko",
    ownerOnly: true,
    description: "Saldo toko, perubahan saldo, dan transaksi keuangan internal.",
  },
  {
    id: "archive",
    label: "Arsip",
    ownerOnly: true,
    description: "Produk terhapus dan pemulihan data produk.",
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
        <div className="mb-4 rounded-lg border border-[var(--brand-border)] bg-white p-4 shadow-[var(--brand-shadow-sm)]">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--brand-gold-strong)]">
                Master Barang
              </p>
              <h1 className="mt-1 text-xl font-black text-slate-950">Inventory</h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                Satu modul untuk item fisik dan digital: tambah, ubah, stok keluar masuk,
                hapus, opname, retur, dan arsip.
              </p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {tabs.map((tab) => {
                const active = tab.id === activeTabMeta.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => selectTab(tab.id)}
                    className={`min-w-[160px] rounded-lg border px-4 py-3 text-left transition ${
                      active
                        ? "border-[var(--brand-gold)] bg-[rgba(212,175,55,0.14)] text-slate-950"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                    aria-pressed={active}
                  >
                    <span className="block text-sm font-extrabold">{tab.label}</span>
                    <span className="mt-1 block text-xs leading-5">{tab.description}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <Suspense fallback={<LoadingState text={`Memuat ${activeTabMeta.label}...`} size={96} />}>
          {renderInventoryTab(activeTabMeta.id)}
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
