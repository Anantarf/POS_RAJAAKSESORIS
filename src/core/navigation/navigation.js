import {
  cashierRoute,
  dashboardRoute,
  getRouteMeta,
  normalizePathname,
  routeMeta,
  shiftRoute,
} from "./routeMeta.js";
import {
  filterNavigationByFeatureFlags,
  filterNavigationByPermissions,
} from "./navigationFilters.js";

export { cashierRoute, dashboardRoute, getRouteMeta, normalizePathname, routeMeta, shiftRoute };
export { filterNavigationByFeatureFlags, filterNavigationByPermissions };

export const ownerNavigationSections = [
  {
    title: "Operasional",
    items: [
      { to: "/dashboard", label: "Ringkasan", icon: "dashboard" },
      { to: "/kasir", label: "POS", icon: "pos", feature: "cashier" },
      { to: "/shift", label: "Shift", icon: "history", feature: "shift" },
    ],
  },
  {
    title: "Kontrol Toko",
    items: [
      {
        to: "/stok-barang",
        label: "Stok",
        icon: "box",
        feature: "products",
        children: [
          { to: "/stok-barang#tambah-kelola", label: "Tambah & Kelola", feature: "products" },
          { to: "/stock-opname", label: "Stock Opname", feature: "stockOpname" },
          { to: "/retur-supplier", label: "Retur & Garansi", feature: "returns" },
          { to: "/history-produk", label: "History Produk", feature: "products" },
        ],
      },
      { to: "/keuangan", label: "Layanan Digital", icon: "wallet", feature: "digital" },
      {
        to: "/saldo",
        label: "Keuangan",
        icon: "coins",
        feature: "wallet",
        children: [
          { to: "/operasional", label: "Catat Operasional", feature: "cash" },
          { to: "/layanan-produk", label: "Kelola Layanan", feature: "serviceProducts" },
        ],
      },
      { to: "/karyawan", label: "Karyawan", icon: "users", feature: "employees" },
    ],
  },
  {
    title: "Cek & Bantuan",
    items: [
      {
        to: "/laporan-keuangan",
        label: "Laporan",
        icon: "chart",
        feature: "reports",
        children: [
          { to: "/laporan-penjualan", label: "Laporan Penjualan", feature: "reports" },
          { to: "/riwayat-transaksi", label: "Riwayat Transaksi", feature: "history" },
          { to: "/audit-log", label: "Riwayat Aktivitas", feature: "audit" },
        ],
      },
      { to: "/bantuan", label: "Bantuan", icon: "help" },
    ],
  },
];

export const cashierNavigationSections = [
  {
    title: "Kerja Kasir",
    items: [
      { to: "/kasir", label: "POS", icon: "pos", feature: "cashier" },
      { to: "/shift", label: "Shift", icon: "history", feature: "shift" },
      { to: "/keuangan", label: "Layanan Digital", icon: "wallet", feature: "digital" },
    ],
  },
  {
    title: "Cek Data",
    items: [
      {
        to: "/stok-barang",
        label: "Stok",
        icon: "box",
        feature: "products",
        children: [
          { to: "/stok-barang#tambah-kelola", label: "Tambah & Kelola", feature: "products" },
        ],
      },
      { to: "/riwayat-transaksi", label: "Riwayat", icon: "history", feature: "history" },
      { to: "/bantuan", label: "Bantuan", icon: "help" },
    ],
  },
];

export const navigationSections = {
  pemilik: ownerNavigationSections,
  kasir: cashierNavigationSections,
};

export function buildNavigationSections(role, flags, permissions) {
  const baseSections = navigationSections[role] || [];
  const featureFilteredSections = filterNavigationByFeatureFlags(baseSections, flags);
  return filterNavigationByPermissions(featureFilteredSections, permissions);
}

export function getDefaultRoute(role) {
  return role === "pemilik" ? dashboardRoute : cashierRoute;
}
