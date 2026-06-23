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
    title: "Menu",
    items: [
      { to: "/kasir", label: "Kasir", icon: "pos", feature: "cashier" },
      { to: "/dashboard", label: "Dashboard", icon: "chart", feature: "reports" },
      { to: "/inventory", label: "Stok", icon: "box", feature: "products" },
      { to: "/riwayat-transaksi", label: "Riwayat Aktivitas", icon: "history", feature: "history" },
      { to: "/karyawan", label: "Karyawan & Akses", icon: "users", feature: "employees" },
    ],
  },
];

export const cashierNavigationSections = [
  {
    title: "Menu",
    items: [
      { to: "/kasir", label: "Kasir", icon: "pos", feature: "cashier" },
      { to: "/inventory", label: "Stok", icon: "box", feature: "products" },
      { to: "/riwayat-transaksi", label: "Riwayat Aktivitas", icon: "history", feature: "history" },
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
