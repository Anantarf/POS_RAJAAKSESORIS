import { useDeferredValue, useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import PageHeader from "../components/app/PageHeader";
import Panel from "../components/app/Panel";
import FeatureLoadPanel from "../components/FeatureLoadPanel";
import { showNotification } from "../contexts/NotificationContext";
import { useEmployeeActivity } from "../hooks/useEmployeeActivity";
import { useEmployeePermissions } from "../hooks/useEmployeePermissions";
import { useEmployees } from "../hooks/useEmployees";

const ROLE_OPTIONS = [
  { value: "all", label: "Semua role" },
  { value: "pemilik", label: "Pemilik" },
  { value: "kasir", label: "Kasir" },
];

const ROLE_LABELS = { pemilik: "Pemilik", kasir: "Kasir" };

function StatusBadge({ status }) {
  return status === "active" ? (
    <span className="brand-badge-success">Aktif</span>
  ) : (
    <span className="brand-badge-neutral">Nonaktif</span>
  );
}

function SummaryTile({ label, value, helper, icon: Icon }) {
  return (
    <Panel className="flex items-start gap-4 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          {label}
        </span>
        <span className="mt-1 block text-2xl font-black text-slate-950">{value}</span>
        <span className="mt-1 block text-sm text-slate-600">{helper}</span>
      </span>
    </Panel>
  );
}

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none";

function UserFormModal({ user, onClose, onSave, submitting }) {
  const isEdit = Boolean(user);
  const [form, setForm] = useState({
    name: user?.nama || "",
    username: user?.username || "",
    role: user?.role || "kasir",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = "Nama wajib diisi.";
    if (!form.username.trim()) errs.username = "Username wajib diisi.";
    if (!isEdit && form.password.length < 8) errs.password = "Password minimal 8 karakter.";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({ id: user?.id, name: form.name.trim(), username: form.username.trim(), role: form.role, password: form.password });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 backdrop-blur-sm sm:items-center sm:p-4">
      <div role="dialog" aria-modal="true" className="flex max-h-[100dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-slate-200/60 bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:max-w-lg sm:rounded-3xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-[var(--brand-surface-soft)] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-[var(--brand-gold)]">
              <UserRound className="h-5 w-5" strokeWidth={1.9} />
            </div>
            <h3 className="text-lg font-black tracking-tight text-slate-950">
              {isEdit ? "Edit Pengguna" : "Tambah Pengguna"}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-950">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto p-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Nama lengkap</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} className={`${fieldClass} ${errors.name ? "border-rose-300" : ""}`} placeholder="Nama kasir" />
            {errors.name && <p className="text-xs font-semibold text-rose-600">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Username</label>
            <input value={form.username} onChange={(e) => set("username", e.target.value)} className={`${fieldClass} ${errors.username ? "border-rose-300" : ""}`} placeholder="kasir.raja" autoComplete="username" />
            {errors.username && <p className="text-xs font-semibold text-rose-600">{errors.username}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Role</label>
            <select value={form.role} onChange={(e) => set("role", e.target.value)} className={fieldClass}>
              <option value="kasir">Kasir</option>
              <option value="pemilik">Pemilik</option>
            </select>
          </div>

          {!isEdit && (
            <>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => set("password", e.target.value)} className={`${fieldClass} pr-12 ${errors.password ? "border-rose-300" : ""}`} placeholder="Minimal 8 karakter" autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute inset-y-1 right-1 flex w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs font-semibold text-rose-600">{errors.password}</p>}
              </div>

            </>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="brand-button-secondary flex-1" disabled={submitting}>Batal</button>
            <button type="submit" className="brand-button-primary flex-1" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? "Simpan" : "Tambah"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EmployeeManagementPage() {
  const { coreLoading, coreError, staffUsers = [], createEmployee, updateEmployeeProfile, setEmployeeStatus } = useEmployees();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return staffUsers.filter((u) => {
      const matchQ = !q || u.nama?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q);
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      return matchQ && matchRole;
    });
  }, [staffUsers, deferredQuery, roleFilter]);

  const selectedEmployee = useMemo(
    () => staffUsers.find((user) => user.id === selectedEmployeeId) || filtered[0] || null,
    [filtered, selectedEmployeeId, staffUsers]
  );
  const hasActiveFilter = Boolean(query.trim()) || roleFilter !== "all";
  const access = useEmployeePermissions(selectedEmployee?.id, Boolean(selectedEmployee));
  const activity = useEmployeeActivity(selectedEmployee?.id, Boolean(selectedEmployee));
  const permissionDataReady = access.loaded;

  const resetFilter = () => {
    setQuery("");
    setRoleFilter("all");
  };

  const openAdd = () => { setEditingUser(null); setShowForm(true); };
  const openEdit = (u) => { setEditingUser(u); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingUser(null); };

  const handleSave = async ({ id, name, username, role, password }) => {
    setSubmitting(true);
    try {
      if (id) {
        await updateEmployeeProfile({ employeeId: id, name, username, role });
        showNotification("success", "Pengguna diperbarui.");
      } else {
        await createEmployee({ name, username, password, role });
        showNotification("success", "Pengguna ditambahkan.");
      }
      closeForm();
    } catch (err) {
      showNotification("error", err?.message || "Gagal menyimpan pengguna.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (u) => {
    const next = u.status === "active" ? "inactive" : "active";
    try {
      await setEmployeeStatus({ employeeId: u.id, status: next });
      showNotification("success", next === "active" ? "Pengguna diaktifkan." : "Pengguna dinonaktifkan.");
    } catch (err) {
      showNotification("error", err?.message || "Gagal mengubah status.");
    }
  };

  if (coreLoading) return <FeatureLoadPanel label="Memuat data pengguna…" />;
  if (coreError) return <FeatureLoadPanel label={coreError} error />;

  const activeCount = staffUsers.filter((user) => user.status === "active").length;
  const cashierCount = staffUsers.filter((user) => user.role === "kasir").length;
  const ownerCount = staffUsers.filter((user) => user.role === "pemilik").length;
  const allowedPermissionCount = access.rows.filter((row) => row.allowed).length;

  return (
    <div className="brand-page-layout">
      <PageHeader
        title="Karyawan"
        description="Tambah atau nonaktifkan akun kasir dan atur akses mereka."
        icon="users"
        actions={
          <button type="button" onClick={openAdd} className="brand-button-primary">
            <Plus className="h-4 w-4" />
            Tambah Pengguna
          </button>
        }
      />

      <div className="brand-page-content">
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryTile
            label="Akun aktif"
            value={activeCount}
            helper={`${staffUsers.length} pengguna terdaftar`}
            icon={Users}
          />
          <SummaryTile
            label="Kasir"
            value={cashierCount}
            helper={`${ownerCount} owner terdaftar`}
            icon={UserRound}
          />
          <SummaryTile
            label="Akses aktif"
            value={selectedEmployee ? allowedPermissionCount : "-"}
            helper={selectedEmployee ? `Untuk ${selectedEmployee.nama}` : "Pilih pengguna dulu"}
            icon={ShieldCheck}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama atau username…" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none" />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 focus:border-slate-400 focus:outline-none">
            {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {filtered.length === 0 && hasActiveFilter ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            <span className="font-semibold text-slate-950">Tidak ada hasil filter.</span>{" "}
            <button type="button" onClick={resetFilter} className="font-semibold text-[var(--brand-gold-strong)]">
              Reset filter
            </button>
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel className="overflow-hidden p-0">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-black text-slate-950">Daftar pengguna</h2>
              <p className="mt-1 text-sm text-slate-600">Pilih satu pengguna untuk cek akses dan aktivitas.</p>
            </div>
            <span className="brand-badge-neutral">{filtered.length} tampil</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Nama</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Username</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Role</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">
                      {staffUsers.length === 0 ? "Belum ada pengguna." : "Tidak ada yang cocok dengan filter."}
                    </td>
                  </tr>
                )}
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    className={`hover:bg-slate-50/60 ${selectedEmployee?.id === u.id ? "bg-[var(--brand-gold-soft)]" : ""}`}
                  >
                    <td className="px-5 py-3.5 font-semibold text-slate-900">{u.nama}</td>
                    <td className="px-5 py-3.5 text-slate-600">{u.username}</td>
                    <td className="px-5 py-3.5 text-slate-600">{ROLE_LABELS[u.role] ?? u.role}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={u.status} /></td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedEmployeeId(u.id)}
                          className={selectedEmployee?.id === u.id ? "brand-button-primary text-xs" : "brand-button-secondary text-xs"}
                        >
                          Detail
                        </button>
                        <button type="button" onClick={() => openEdit(u)} className="brand-button-secondary text-xs">Edit</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel className="space-y-5 p-5">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Detail pengguna
                </p>
                <h2 className="mt-2 text-lg font-black text-slate-950">
                  {selectedEmployee?.nama || "Pilih pengguna"}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Akses dan aktivitas dimuat dari backend.
                </p>
              </div>
              {selectedEmployee ? <StatusBadge status={selectedEmployee.status} /> : null}
            </div>
          </div>

          {selectedEmployee ? (
            <>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => openEdit(selectedEmployee)}
                  className="brand-button-primary text-xs"
                >
                  Edit Pengguna
                </button>
                <button
                  type="button"
                  onClick={() => void access.refresh()}
                  className="brand-button-secondary text-xs"
                  disabled={access.loading}
                >
                  {access.loading ? "Memuat akses..." : "Refresh akses"}
                </button>
                <button
                  type="button"
                  onClick={() => void activity.refresh()}
                  className="brand-button-secondary text-xs"
                  disabled={activity.loading}
                >
                  {activity.loading ? "Memuat aktivitas..." : "Refresh aktivitas"}
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleStatus(selectedEmployee)}
                  className={selectedEmployee.status === "active" ? "brand-button-danger text-xs ml-auto" : "brand-button-success text-xs ml-auto"}
                >
                  {selectedEmployee.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                </button>
              </div>

              {access.error ? (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                  {access.error}
                </p>
              ) : null}

              {permissionDataReady ? <div className="grid gap-3">
                {access.groups.map((group) => (
                  <div key={group.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                    <p className="text-sm font-bold text-slate-950">{group.label}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {group.permissions.map((permission) => (
                        <span
                          key={permission.key}
                          className={permission.allowed ? "brand-badge-success" : "brand-badge-neutral"}
                        >
                          {permission.label}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div> : (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
                  Data akses belum siap.
                </p>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-bold text-slate-950">Aktivitas terakhir</p>
                </div>
                {activity.error ? (
                  <p className="mt-2 text-sm font-semibold text-rose-700">{activity.error}</p>
                ) : null}
                <div className="mt-2 space-y-2">
                  {activity.rows.slice(0, 4).map((row) => (
                    <div key={row.id} className="rounded-lg border border-slate-200 px-3 py-2">
                      <p className="text-sm font-semibold text-slate-950">{row.title}</p>
                      {row.detail ? <p className="mt-1 text-xs text-slate-500">{row.detail}</p> : null}
                    </div>
                  ))}
                  {activity.loading ? (
                    <p className="text-sm text-slate-500">Memuat aktivitas...</p>
                  ) : null}
                  {!activity.loading && activity.rows.length === 0 ? (
                    <p className="text-sm text-slate-500">Belum ada aktivitas.</p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3">
                <div className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                  <p className="text-sm font-semibold text-emerald-800">
                    Aksi sensitif tetap dicek oleh backend sebelum disimpan.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">Belum ada pengguna.</p>
          )}
        </Panel>
        </div>
      </div>

      {showForm && (
        <UserFormModal user={editingUser} onClose={closeForm} onSave={handleSave} submitting={submitting} />
      )}
    </div>
  );
}
