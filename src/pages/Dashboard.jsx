import { lazy, Suspense, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Panel from "../components/app/Panel";
import { useProducts } from "../hooks/useProducts";
import { useReports } from "../hooks/useReports";
import { useShift } from "../hooks/useShift";
import {
  formatDateInput,
  formatDisplayDate,
  formatRupiah,
} from "../utils/format";
import {
  buildOperationalInsights,
  formatCount,
  getComparisonLabel,
  getDashboardRange,
  getMetricComparison,
  getPreviousRange,
  getTrendTextClass,
  isActiveProduct,
  isLowStockProduct,
} from "../features/dashboard/services/dashboardInsights";

const SalesTrendChart = lazy(() => import("../features/dashboard/components/SalesTrendChart"));

const periodOptions = [
  { value: "today", label: "Hari Ini" },
  { value: "7", label: "7 Hari" },
  { value: "30", label: "30 Hari" },
  { value: "custom", label: "Custom" },
];

function KpiCard({ label, value, trend, accent = "default" }) {
  const panelVariant =
    accent === "success"
      ? "success"
      : accent === "danger"
        ? "danger"
        : accent === "info"
          ? "info"
          : "accent";
  const valueClass =
    accent === "success"
      ? "text-emerald-700"
      : accent === "danger"
        ? "text-red-700"
        : accent === "info"
          ? "text-blue-700"
          : "text-slate-950";

  return (
    <Panel variant={panelVariant} className="p-4">
      <p className="text-xs font-semibold text-slate-500">
        {label}
      </p>
      <p className={`brand-metric-value-lg mt-2 ${valueClass}`}>
        {value}
      </p>
      <p className={`mt-2 truncate text-xs font-semibold ${getTrendTextClass(trend?.tone)}`}>
        {trend?.label || "Stabil"}
        {trend?.detail ? <span className="font-medium text-slate-500"> - {trend.detail}</span> : null}
      </p>
    </Panel>
  );
}

function TrendBars({ data }) {
  if (!data.length) {
    return (
      <div className="brand-empty-state">
        <p className="text-base font-semibold text-slate-950">Belum ada tren penjualan</p>
        <p className="mt-2 max-w-md text-sm leading-7 text-slate-500">
          Simpan transaksi untuk melihat tren penjualan.
        </p>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="brand-skeleton h-[280px] w-full" aria-label="Memuat grafik tren" />}>
      <SalesTrendChart data={data} />
    </Suspense>
  );
}

export default function Dashboard() {
  const {
    coreLoading,
    coreError,
    walletBalances = [],
    supplierReturns = [],
    customerReturns = [],
    getDashboardSummary,
  } = useReports();
  const { products } = useProducts();
  const { shifts = [] } = useShift();
  const [period, setPeriod] = useState("today");
  const [customRange, setCustomRange] = useState({
    startDate: formatDateInput(new Date()),
    endDate: formatDateInput(new Date()),
  });

  const range = useMemo(() => getDashboardRange(period, customRange), [customRange, period]);
  const previousRange = useMemo(() => getPreviousRange(range), [range]);
  const todayRange = useMemo(() => getDashboardRange("today", customRange), [customRange]);

  const summary = useMemo(() => getDashboardSummary(range), [getDashboardSummary, range]);
  const todaySummary = useMemo(
    () => getDashboardSummary(todayRange),
    [getDashboardSummary, todayRange]
  );
  const previousSummary = useMemo(
    () => getDashboardSummary(previousRange),
    [getDashboardSummary, previousRange]
  );
  const comparisonLabel = getComparisonLabel(period);
  const metricTrends = useMemo(
    () => ({
      omzet: getMetricComparison(summary.omzet, previousSummary.omzet, formatRupiah, comparisonLabel),
      labaBersih: getMetricComparison(
        summary.labaBersih,
        previousSummary.labaBersih,
        formatRupiah,
        comparisonLabel
      ),
      totalTransaksi: getMetricComparison(
        summary.totalTransaksi,
        previousSummary.totalTransaksi,
        formatCount,
        comparisonLabel
      ),
      produkTerjual: getMetricComparison(
        summary.produkTerjual,
        previousSummary.produkTerjual,
        (value) => `${formatCount(value)} pcs`,
        comparisonLabel
      ),
    }),
    [comparisonLabel, previousSummary, summary]
  );

  const trendSeries = useMemo(() => summary.trendSeries.slice(-7), [summary.trendSeries]);

  const lowStockProducts = useMemo(
    () =>
      products
        .filter((product) => isActiveProduct(product) && isLowStockProduct(product))
        .sort((left, right) => Number(left.stok || 0) - Number(right.stok || 0)),
    [products]
  );
  const criticalStockCount = useMemo(
    () => lowStockProducts.filter((product) => Number(product.stok || 0) <= 0).length,
    [lowStockProducts]
  );
  const pendingShiftCount = useMemo(
    () => shifts.filter((shift) => shift.status === "pending" || shift.status === "flagged").length,
    [shifts]
  );
  const shiftDifferenceAlerts = useMemo(
    () =>
      shifts.filter(
        (shift) =>
          (shift.status === "pending" || shift.status === "flagged") &&
          Math.abs(Number(shift.difference || 0)) >= 50000
      ),
    [shifts]
  );
  const criticalWallets = useMemo(
    () =>
      (walletBalances || [])
        .filter((wallet) => wallet.id !== "cash" && Number(wallet.balance || 0) <= 0)
        .sort((left, right) => Number(left.balance || 0) - Number(right.balance || 0)),
    [walletBalances]
  );
  const pendingReturnCount = useMemo(() => {
    const supplierPending = (supplierReturns || []).filter((row) =>
      ["draft", "pending", "open", "waiting"].includes(String(row.status || "").toLowerCase())
    ).length;
    const customerPending = (customerReturns || []).filter((row) =>
      ["draft", "pending", "open", "waiting"].includes(String(row.status || "").toLowerCase())
    ).length;

    return supplierPending + customerPending;
  }, [customerReturns, supplierReturns]);
  const cashWalletBalance = Number(walletBalances.find((wallet) => wallet.id === "cash")?.balance || 0);

  const cashSnapshots = useMemo(
    () =>
      [...summary.cashDailySummary]
        .sort((left, right) => String(right.tanggal).localeCompare(String(left.tanggal)))
        .slice(0, 5),
    [summary.cashDailySummary]
  );

  const rangeLabel =
    period === "today"
      ? formatDisplayDate(range.startDate)
      : `${formatDisplayDate(range.startDate)} - ${formatDisplayDate(range.endDate)}`;
  const ownerAlerts = [
    shiftDifferenceAlerts.length
      ? {
          title: "Selisih shift besar",
          value: `${shiftDifferenceAlerts.length} shift`,
          detail: "Ada selisih saldo. Perlu keputusan sebelum laporan dikunci.",
          tone: "danger",
          urgency: "BLOCKER",
          action: "Cek shift",
          to: "/shift?status=pending&risk=mismatch",
        }
      : null,
    criticalWallets.length
      ? {
          title: "Saldo perlu dicek",
          value: criticalWallets
            .slice(0, 2)
            .map((wallet) => wallet.name || wallet.id)
            .join(", "),
          detail: `${criticalWallets.length} saldo perlu dicek atau diisi.`,
          tone: "danger",
          urgency: "BLOCKER",
          action: "Buka saldo",
          to: "/saldo?filter=critical",
        }
      : null,
    pendingShiftCount && !shiftDifferenceAlerts.length
      ? {
          title: "Shift menunggu persetujuan",
          value: `${pendingShiftCount} shift`,
          detail: "Cek tutup shift sebelum laporan harian dikunci.",
          tone: "warning",
          urgency: "FINANCE",
          action: "Cek shift",
          to: "/shift?status=pending",
        }
      : null,
    lowStockProducts.length
      ? {
          title: "Stok minimum",
          value: `${lowStockProducts.length} item`,
          detail: `${criticalStockCount} habis, cek rak dan rekomendasi reorder.`,
          tone: criticalStockCount ? "danger" : "warning",
          urgency: "STOCK",
          action: "Lihat stok minimum",
          to: "/stok-barang?status=minimum#tambah-kelola",
        }
      : null,
    pendingReturnCount
      ? {
          title: "Retur pending",
          value: `${pendingReturnCount} retur`,
          detail: "Retur belum selesai dapat mengganggu stok dan laba.",
          tone: "warning",
          urgency: "RETURN",
          action: "Proses retur",
          to: "/retur-supplier?status=pending",
        }
      : null,
  ].filter(Boolean);
  const operationalInsights = useMemo(
    () =>
      buildOperationalInsights({
        summary,
        lowStockProducts,
        criticalWallets,
        shiftDifferenceAlerts,
        pendingReturnCount,
      }),
    [criticalWallets, lowStockProducts, pendingReturnCount, shiftDifferenceAlerts, summary]
  );
  const insightAttention = operationalInsights.filter((insight) => insight.tone !== "success");
  const attentionItems = ownerAlerts.length ? ownerAlerts : insightAttention;

  return (

    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Dashboard Toko</h1>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500">
            Periode laporan
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-950">
            {rangeLabel} - pembanding {comparisonLabel}
          </p>
        </div>

        <div className="brand-segmented w-full self-start md:w-auto md:self-auto">
          {periodOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPeriod(option.value)}
              className={`brand-segmented-button ${
                period === option.value ? "brand-segmented-button-active" : ""
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {period === "custom" ? (
        <Panel variant="muted" className="grid gap-3 p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Dari tanggal</label>
            <input
              type="date"
              value={customRange.startDate}
              onChange={(event) =>
                setCustomRange((prev) => ({ ...prev, startDate: event.target.value }))
              }
              className="brand-input"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Sampai tanggal
            </label>
            <input
              type="date"
              value={customRange.endDate}
              onChange={(event) =>
                setCustomRange((prev) => ({ ...prev, endDate: event.target.value }))
              }
              className="brand-input"
            />
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold text-slate-500">
              Pembanding
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {formatDisplayDate(previousRange.startDate)} sampai{" "}
              {formatDisplayDate(previousRange.endDate)}
            </p>
          </div>
        </Panel>
      ) : null}

      {coreLoading || coreError ? (
        <Panel className={`p-4 ${coreError ? "border-amber-200 bg-amber-50" : ""}`}>
          <p className="text-sm font-semibold text-slate-700">
            {coreError
              ? `Gagal memuat ringkasan: ${coreError}`
              : "Sistem sedang menyiapkan data laporan."}
          </p>
        </Panel>
      ) : null}

      <section className="grid gap-4 md:grid-cols-[1.5fr_1fr_1fr]" aria-label="Ringkasan hari ini">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Omzet hari ini</p>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--brand-gold)]">
            {formatRupiah(todaySummary.omzet)}
          </p>
          <p className="mt-2 text-sm text-slate-600">{formatCount(todaySummary.totalTransaksi)} transaksi</p>
        </div>
        <KpiCard
          label="Laba Bersih"
          value={formatRupiah(todaySummary.labaBersih)}
          accent={todaySummary.labaBersih >= 0 ? "success" : "danger"}
        />
        <KpiCard label="Saldo Kas" value={formatRupiah(cashWalletBalance)} />
      </section>

      <Panel variant={attentionItems.length ? "warning" : "success"} className="p-4">
        <div className="flex flex-col gap-1 border-b border-slate-200 pb-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-950">Perlu dicek</p>
            <p className="text-xs text-slate-500">Yang perlu dicek hari ini.</p>
          </div>
          <span className={attentionItems.length ? "brand-badge-warning" : "brand-badge-success"}>
            {attentionItems.length ? `${attentionItems.length} item` : "Aman"}
          </span>
        </div>

        {attentionItems.length ? (
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            {attentionItems.map((item) => (
              <div
                key={item.title}
                className={`brand-control-alert brand-control-alert-${item.tone || "warning"}`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-950">{item.title}</p>
                    {item.value ? (
                      <p className="brand-metric-value mt-1">{item.value}</p>
                    ) : null}
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
                  </div>
                  {item.to ? (
                    <Link to={item.to} className="brand-button-secondary shrink-0 px-4 py-2 text-xs">
                      {item.action}
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-700">
            Semua aman. Tidak ada prioritas aktif.
          </div>
        )}
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel variant="accent" className="p-4">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="brand-section-label">Penjualan</p>
              <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                Pergerakan omzet
              </h3>
            </div>
            <p className="text-sm text-slate-500">
              Dibanding {comparisonLabel}:{" "}
              <span className="font-semibold text-slate-700">
                {metricTrends.omzet.detail}
              </span>
            </p>
          </div>
          <TrendBars data={trendSeries} />
        </Panel>

        <Panel variant="info" className="p-4">
          <div className="mb-4">
            <p className="brand-section-label">Kategori</p>
            <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
              Kategori dan produk terlaris
            </h3>
          </div>

          {summary.topCategories.length === 0 ? (
            <div className="brand-empty-state">
              <p className="text-base font-semibold text-slate-950">Belum ada penjualan aksesoris</p>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                Belum ada data penjualan di periode ini.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                {summary.topCategories.map((item, index) => (
                  <div key={item.nama} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-gold)]/14 text-sm font-bold text-[var(--brand-gold-strong)]">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-950">{item.nama}</p>
                          <p className="text-sm text-slate-500">
                            {item.qty} pcs - {formatRupiah(item.omzet)}
                          </p>
                        </div>
                      </div>
                      <span className="brand-badge-neutral">{item.kontribusi}%</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full bg-[var(--brand-gold)]"
                        style={{ width: `${Math.max(item.kontribusi, 8)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {summary.topProducts.length ? (
                <div>
                  <p className="brand-section-label mb-3">Produk teratas</p>
                  <div className="space-y-3">
                    {summary.topProducts.slice(0, 3).map((item, index) => (
                      <div
                        key={item.nama}
                        className="flex items-center justify-between gap-4 border-t border-slate-200 pt-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-600">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-950">{item.nama}</p>
                            <p className="text-sm text-slate-500">{item.category || "Aksesoris"}</p>
                          </div>
                        </div>
                        <span className="brand-badge-neutral shrink-0">{item.qty} pcs</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel className="p-4">
          <div className="mb-4">
            <p className="brand-section-label">Jenis penjualan</p>
            <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
              Ringkasan jenis penjualan
            </h3>
          </div>

          <div className="space-y-2">
            {summary.breakdown.map((item) => (
              <div key={item.key} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-950">{item.label}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.transaksi} transaksi - laba {formatRupiah(item.keuntungan)}
                    </p>
                  </div>
                  <span className="brand-badge-neutral">{item.kontribusi}%</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-[var(--brand-gold)]"
                    style={{ width: `${Math.max(item.kontribusi, item.omzet ? 8 : 0)}%` }}
                  />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  {formatRupiah(item.omzet)}
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel variant="strong" className="p-4">
          <div className="mb-4">
            <p className="brand-section-label">Saldo harian</p>
            <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
              Pergerakan saldo harian
            </h3>
          </div>

          {cashSnapshots.length === 0 ? (
            <div className="brand-empty-state">
              <p className="text-base font-semibold text-slate-950">Belum ada catatan saldo hari ini</p>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                Data akan muncul setelah ada transaksi masuk atau keluar.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {cashSnapshots.map((item) => (
                <div
                  key={item.tanggal}
                  className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3"
                >
                  <div>
                    <p className="font-semibold text-slate-950">{item.tanggal}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Masuk {formatRupiah(item.total_pemasukan)} - Keluar{" "}
                      {formatRupiah(item.total_pengeluaran)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-400">
                      Sisa saldo
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {formatRupiah(item.sisa_saldo)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
