import {
  cashierRoute,
  getRouteMeta,
  normalizePathname,
  routeMeta,
} from "./routeMeta.js";
import {
  filterNavigationByFeatureFlags,
  filterNavigationByPermissions,
} from "./navigationFilters.js";

export { cashierRoute, getRouteMeta, normalizePathname, routeMeta };
export { filterNavigationByFeatureFlags, filterNavigationByPermissions };

export const ownerNavigationSections = [
  {
    title: "Operasional",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: "chart", feature: "reports" },
      { to: "/kasir", label: "Kasir", icon: "pos", feature: "cashier" },
      {
        to: "/inventory",
        label: "Inventory",
        icon: "box",
        feature: "products",
        children: [
          { to: "/inventory?tab=fisik", label: "Item fisik", feature: "products" },
          { to: "/inventory?tab=digital", label: "Item digital", feature: "serviceProducts" },
          { to: "/inventory?tab=opname", label: "Cek stok fisik", feature: "stockOpname" },
          { to: "/inventory?tab=retur", label: "Retur", feature: "returns" },
          { to: "/inventory?tab=saldo", label: "Saldo toko", feature: "wallet" },
        ],
      },
      {
        to: "/riwayat-transaksi",
        label: "Riwayat Transaksi",
        icon: "history",
        feature: "history",
        children: [
          { to: "/riwayat-transaksi", label: "Riwayat", feature: "history" },
          { to: "/riwayat-transaksi?tab=laporan", label: "Laporan penjualan", feature: "reports" },
        ],
      },
    ],
  },
  {
    title: "Admin",
    items: [
      {
        to: "/admin/users",
        label: "User & Audit",
        icon: "users",
        feature: "employees",
        children: [
          { to: "/admin/users", label: "Manajemen user", feature: "employees" },
          { to: "/karyawan", label: "Karyawan", feature: "employees" },
          { to: "/admin/audit", label: "Audit log", feature: "audit" },
        ],
      },
    ],
  },
];

export const cashierNavigationSections = [
  {
    title: "MVP",
    items: [
      { to: "/kasir", label: "Kasir", icon: "pos", feature: "cashier" },
      { to: "/inventory", label: "Inventory", icon: "box", feature: "products" },
      { to: "/riwayat-transaksi", label: "Riwayat Transaksi", icon: "history", feature: "history" },
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
  if (role === "pemilik") return "/kasir";
  return cashierRoute;
}
