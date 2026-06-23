export const cashierRoute = "/kasir";

export const routeMeta = {
  "/dashboard": {
    title: "Dashboard",
    description: "Ringkasan harian pemilik untuk omzet, shift, stok, saldo, dan alert operasional.",
  },
  "/kasir": {
    title: "Kasir",
    description: "Transaksi aksesoris dan layanan digital dengan checkout cepat.",
  },
  "/inventory": {
    title: "Inventory",
    description: "Kelola aksesoris, layanan digital, stok, retur, dan saldo toko.",
  },
  "/riwayat-transaksi": {
    title: "Riwayat Transaksi",
    description: "Cari transaksi dengan cepat dan lihat detail pemasukan, pengeluaran, serta laba.",
  },
  "/shift": {
    title: "Shift",
    description: "Buka, tutup, dan cek shift kerja kasir.",
  },
  "/stok-barang": {
    title: "Inventory",
    description: "Kelola stok barang fisik dan batas minimum toko.",
  },
  "/saldo": {
    title: "Saldo Toko",
    description: "Pantau saldo per dompet dan catat pemasukan atau pengeluaran.",
  },
  "/retur-supplier": {
    title: "Retur",
    description: "Proses retur supplier dan garansi konsumen.",
  },
  "/karyawan": {
    title: "User & Audit",
    description: "Kelola karyawan, role, akses kerja, dan aktivitas sensitif.",
  },
  "/admin/users": {
    title: "User & Audit",
    description: "Kelola akun, role, akses kerja, sesi, catatan user, dan kontrol aktivitas sensitif.",
  },
  "/admin/audit": {
    title: "Riwayat Aktivitas",
    description: "Jejak aksi sensitif pemilik toko, kasir, dan sistem untuk kontrol operasional.",
  },
};

export const defaultRouteMeta = {
  title: "Raja Aksesoris",
  description: "Tempat kerja harian untuk operasional Raja Aksesoris.",
};

export function normalizePathname(pathname = "") {
  const rawPathname = String(pathname || "").trim();
  if (!rawPathname) return "/";

  let normalizedPathname = rawPathname;
  const hashIndex = normalizedPathname.indexOf("#");
  if (hashIndex >= 0) normalizedPathname = normalizedPathname.slice(0, hashIndex);

  const queryIndex = normalizedPathname.indexOf("?");
  if (queryIndex >= 0) normalizedPathname = normalizedPathname.slice(0, queryIndex);

  if (!normalizedPathname.startsWith("/")) {
    normalizedPathname = `/${normalizedPathname}`;
  }

  normalizedPathname = normalizedPathname.replace(/\/+$/, "");
  return normalizedPathname || "/";
}

export function getRouteMeta(pathname) {
  return routeMeta[normalizePathname(pathname)] || defaultRouteMeta;
}
