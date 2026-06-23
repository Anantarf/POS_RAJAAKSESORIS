import { lazy, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import LoadingState from "../components/LoadingState";

const RiwayatTransaksiPage = lazy(() => import("./RiwayatTransaksiPage"));
const SalesReportPage = lazy(() => import("./SalesReportPage"));

const BASE_TABS = [
  {
    id: "riwayat",
    label: "Riwayat Transaksi",
    ownerOnly: false,
    description: "Cari transaksi, lihat detail, cetak struk, dan batalkan transaksi.",
  },
  {
    id: "laporan",
    label: "Laporan Penjualan",
    ownerOnly: true,
    description: "Laporan laba, omset, dan tren penjualan per periode.",
  },
];

export default function HistoryModulePage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabs = BASE_TABS.filter((t) => !t.ownerOnly || user?.role === "pemilik");
  const requested = searchParams.get("tab") === "laporan" ? "laporan" : "riwayat";
  const [activeTab, setActiveTab] = useState(requested);
  const activeTabMeta = tabs.find((t) => t.id === activeTab) || tabs[0];

  useEffect(() => {
    setActiveTab(requested);
  }, [requested]);

  function selectTab(tabId) {
    setActiveTab(tabId);
    setSearchParams(tabId === "riwayat" ? {} : { tab: tabId });
  }

  return (
    <div className="min-h-full bg-[var(--brand-bg)]">
      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-4 rounded-lg border border-[var(--brand-border)] bg-white p-4 shadow-[var(--brand-shadow-sm)]">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--brand-gold-strong)]">
                Laporan & Riwayat
              </p>
              <h1 className="mt-1 text-xl font-black text-slate-950">Riwayat Transaksi</h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                {activeTabMeta.description}
              </p>
            </div>
            {tabs.length > 1 && (
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
            )}
          </div>
        </div>

        <Suspense fallback={<LoadingState text={`Memuat ${activeTabMeta.label}...`} size={96} />}>
          {activeTabMeta.id === "laporan" ? <SalesReportPage /> : <RiwayatTransaksiPage />}
        </Suspense>
      </div>
    </div>
  );
}
