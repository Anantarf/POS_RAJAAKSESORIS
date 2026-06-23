import { useDeferredValue, useMemo, useState } from "react";
import { Eye, EyeOff, Loader2, Plus, Search, UserRound, X } from "lucide-react";
import PageHeader from "../components/app/PageHeader";
import Panel from "../components/app/Panel";
import FeatureLoadPanel from "../components/FeatureLoadPanel";
import { showNotification } from "../contexts/NotificationContext";
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

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none";

function UserFormModal({ user, onClose, onSave, submitting }) {
  const isEdit = Boolean(user);
  const [form, setForm] = useState({
    name: user?.nama || "",
    username: user?.username || "",
    role: user?.role || "kasir",
    password: "",
    pin: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
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
    if (!isEdit && !/^[0-9]{4,8}$/.test(form.pin)) errs.pin = "PIN 4–8 digit angka.";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({ id: user?.id, name: form.name.trim(), username: form.username.trim(), role: form.role, password: form.password, pin: form.pin });
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

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">PIN (4–8 digit)</label>
                <div className="relative">
                  <input type={showPin ? "text" : "password"} inputMode="numeric" value={form.pin} onChange={(e) => set("pin", e.target.value)} className={`${fieldClass} pr-12 ${errors.pin ? "border-rose-300" : ""}`} placeholder="Contoh: 1234" autoComplete="new-password" maxLength={8} />
                  <button type="button" onClick={() => setShowPin((s) => !s)} className="absolute inset-y-1 right-1 flex w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.pin && <p className="text-xs font-semibold text-rose-600">{errors.pin}</p>}
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
  const { coreLoading, coreError, staffUsers = [], createEmployee, updateEmployeeProfile, setEmployeeStatus, resetEmployeePin } = useEmployees();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
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

  const openAdd = () => { setEditingUser(null); setShowForm(true); };
  const openEdit = (u) => { setEditingUser(u); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingUser(null); };

  const handleSave = async ({ id, name, username, role, password, pin }) => {
    setSubmitting(true);
    try {
      if (id) {
        await updateEmployeeProfile({ employeeId: id, name, username, role });
        showNotification("success", "Pengguna diperbarui.");
      } else {
        await createEmployee({ name, username, password, role, pin });
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

  const handleResetPin = async (u) => {
    const pin = window.prompt(`PIN baru untuk ${u.nama} (4–8 digit angka):`);
    if (!pin) return;
    if (!/^[0-9]{4,8}$/.test(pin)) { showNotification("warning", "PIN harus 4–8 digit angka."); return; }
    try {
      await resetEmployeePin({ employeeId: u.id, newPin: pin });
      showNotification("success", "PIN berhasil diatur ulang.");
    } catch (err) {
      showNotification("error", err?.message || "Gagal reset PIN.");
    }
  };

  if (coreLoading) return <FeatureLoadPanel label="Memuat data pengguna…" />;
  if (coreError) return <FeatureLoadPanel label={coreError} error />;

  return (
    <div className="brand-page-layout">
      <PageHeader title="Pengguna" helper={`${staffUsers.length} pengguna terdaftar`}>
        <button type="button" onClick={openAdd} className="brand-button-primary">
          <Plus className="h-4 w-4" />
          Tambah Pengguna
        </button>
      </PageHeader>

      <div className="brand-page-content">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama atau username…" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none" />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 focus:border-slate-400 focus:outline-none">
            {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <Panel className="overflow-hidden p-0">
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
                  <tr key={u.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">{u.nama}</td>
                    <td className="px-5 py-3.5 text-slate-600">{u.username}</td>
                    <td className="px-5 py-3.5 text-slate-600">{ROLE_LABELS[u.role] ?? u.role}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={u.status} /></td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => openEdit(u)} className="brand-button-secondary text-xs">Edit</button>
                        <button type="button" onClick={() => handleResetPin(u)} className="brand-button-secondary text-xs">Reset PIN</button>
                        <button type="button" onClick={() => handleToggleStatus(u)} className={u.status === "active" ? "brand-button-danger text-xs" : "brand-button-success text-xs"}>
                          {u.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {showForm && (
        <UserFormModal user={editingUser} onClose={closeForm} onSave={handleSave} submitting={submitting} />
      )}
    </div>
  );
}
