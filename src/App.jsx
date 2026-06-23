import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import LoadingState from "./components/LoadingState";
import { ROLE_GROUPS, ROUTE_ACCESS } from "./core/auth/rbac";
import { getDefaultRoute } from "./core/navigation/navigation";
import { getRuntimeFlags, isFeatureEnabled } from "./core/runtime/runtimeFlags";
import { AppModeProvider } from "./contexts/AppModeContext";
import { AuthProvider } from "./contexts/AuthProvider";
import { NotificationProvider } from "./contexts/NotificationContext";
import { useAuth } from "./contexts/useAuth";
import AppShell from "./layouts/AppShell";
import ConnectionStatusBanner from "./components/ConnectionStatusBanner";
import ErrorBoundary from "./components/ErrorBoundary";
import Login from "./pages/Login";

const DataProvider = lazy(() =>
  import("./contexts/DataProvider").then((module) => ({ default: module.DataProvider }))
);
const EmployeePresenceProvider = lazy(() =>
  import("./contexts/EmployeePresenceProvider").then((module) => ({
    default: module.EmployeePresenceProvider,
  }))
);
const PAGE_LOAD_TIMEOUT_MS = 20000;

function lazyPage(importer, label) {
  return lazy(() => {
    let timeoutId;
    const timeout = new Promise((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error(`Memuat ${label} terlalu lama. Kemungkinan chunk fitur berat atau gagal dimuat.`));
      }, PAGE_LOAD_TIMEOUT_MS);
    });

    return Promise.race([importer(), timeout]).finally(() => {
      window.clearTimeout(timeoutId);
    });
  });
}

const AuditLogPage = lazyPage(() => import("./pages/AuditLogPage"), "Audit Log");
const CashierModulePage = lazyPage(() => import("./pages/CashierModulePage"), "Kasir");
const Dashboard = lazyPage(() => import("./pages/Dashboard"), "Dashboard");
const HistoryPage = lazyPage(() => import("./pages/HistoryPage"), "Riwayat Transaksi");
const EmployeeManagementPage = lazyPage(() => import("./pages/EmployeeManagementPage"), "User & Audit");
const InventoryModulePage = lazyPage(() => import("./pages/InventoryModulePage"), "Inventory");

const ISOLATION_STORAGE_KEY = "pos_debug_isolation_mode";
const DEFAULT_ISOLATION_MODE = "full";
const ISOLATION_MODES = new Set(["auth-only", "data-static", "data-realtime", "full"]);

function getIsolationMode() {
  if (typeof window === "undefined") return "full";

  const params = new URLSearchParams(window.location.search);
  const requestedMode = params.get("isolate");

  if (requestedMode === "off" || requestedMode === "full") {
    window.localStorage?.removeItem(ISOLATION_STORAGE_KEY);
    return "full";
  }

  if (ISOLATION_MODES.has(requestedMode)) {
    return requestedMode;
  }

  return DEFAULT_ISOLATION_MODE;
}

function MinimalAuthenticatedScreen({ mode, onLogout, user }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--brand-bg)] px-4">
      <div className="brand-panel max-w-md px-8 py-8 text-center">
        <p className="brand-kicker text-[var(--brand-gold)]/90">Debug Isolation</p>
        <h1 className="mt-3 font-display text-2xl font-bold text-slate-950">
          Auth stabil, data layer dimatikan
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Mode: {mode}. User: {user?.email || user?.id || "-"} ({user?.role || "-"}).
        </p>
        <button type="button" className="brand-button-primary mt-6 w-full" onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

function FeatureDisabledPage({ title, message, flagName }) {
  return (
    <div className="min-h-screen bg-[var(--brand-bg)] px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="brand-panel p-8">
          <p className="brand-kicker text-[var(--brand-gold)]/90">Feature Isolation</p>
          <h1 className="mt-3 font-display text-2xl font-bold text-slate-950">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{message}</p>
          {flagName ? (
            <p className="mt-4 inline-flex rounded-lg bg-slate-100 px-3 py-2 font-mono text-xs font-semibold text-slate-700">
              ?{flagName}=true
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PageBoundary({ label, variant, children }) {
  return (
    <Suspense
      fallback={
        <LoadingState
          text={`Memuat ${label}...`}
          fullScreen={!variant}
          size={120}
          variant={variant || "default"}
        />
      }
    >
      {children}
    </Suspense>
  );
}

function pageElement(Page, label, variant) {
  return (
    <PageBoundary label={label} variant={variant}>
      <Page />
    </PageBoundary>
  );
}

function featureFlagName(featureName) {
  return `enable${featureName.charAt(0).toUpperCase()}${featureName.slice(1)}`;
}

function featureElement(runtimeFlags, featureName, label, element) {
  if (isFeatureEnabled(runtimeFlags, featureName)) {
    return element;
  }

  return (
    <FeatureDisabledPage
      title={`${label} sementara dimatikan`}
      message={`Fitur ${label} sedang disembunyikan oleh runtime flag untuk isolasi atau rollout bertahap.`}
      flagName={featureFlagName(featureName)}
    />
  );
}

function AuthIssuePanel({ title, message, onRetry, onLogout }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--brand-bg)] px-4">
      <div className="brand-panel max-w-sm px-8 py-8 text-center">
        <h2 className="text-base font-bold text-slate-950">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        <div className="mt-5 grid gap-3">
          <button type="button" className="brand-button-primary w-full" onClick={onRetry}>
            Coba Lagi
          </button>
          <button
            type="button"
            className="w-full text-center text-xs font-semibold text-slate-500 underline-offset-4 hover:text-slate-800 hover:underline"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

function AuthenticatedDataGate() {
  const {
    user,
    authState,
    profileError,
    retryProfileVerification,
    logout,
  } = useAuth();
  const location = useLocation();
  const isolationMode = getIsolationMode();
  const runtimeFlags = getRuntimeFlags();

  if (authState === "checking_session" && !user) {
    return <LoadingState text="Memuat sesi..." fullScreen />;
  }

  if (authState === "verifying_profile" && !user) {
    return <LoadingState text="Memverifikasi profil pengguna..." fullScreen />;
  }

  if (authState === "profile_error") {
    return (
      <AuthIssuePanel
        title="Gagal memverifikasi profil pengguna"
        message={profileError || "Profil pengguna tidak bisa diverifikasi."}
        onRetry={() => {
          void retryProfileVerification().catch((error) => {
            console.error("Retry profile verification failed:", error);
          });
        }}
        onLogout={() => {
          void logout();
        }}
      />
    );
  }

  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (isolationMode === "auth-only") {
    return (
      <MinimalAuthenticatedScreen
        mode={isolationMode}
        user={user}
        onLogout={() => {
          void logout();
        }}
      />
    );
  }

  const realtimeEnabled =
    isFeatureEnabled(runtimeFlags, "realtime") && isolationMode !== "data-static";
  const presenceEnabled =
    isFeatureEnabled(runtimeFlags, "presence") &&
    isolationMode === "full" &&
    realtimeEnabled;

  return (
    <Suspense fallback={<LoadingState text="Menyiapkan data toko..." fullScreen size={120} />}>
      <DataProvider
        activePath={location.pathname}
        minimalDataMode={runtimeFlags.safeMode || runtimeFlags.minimalDataProvider}
        realtimeEnabled={realtimeEnabled}
      >
        {presenceEnabled ? (
          <EmployeePresenceProvider>
            <Outlet />
          </EmployeePresenceProvider>
        ) : (
          <Outlet />
        )}
      </DataProvider>
    </Suspense>
  );
}

function App() {
  const runtimeFlags = getRuntimeFlags();

  return (
    <BrowserRouter>
      <AppModeProvider>
        <NotificationProvider>
          <AuthProvider>
            <ErrorBoundary>
              <ConnectionStatusBanner />
              <Routes>
                <Route path="/" element={<Login />} />

                <Route element={<AuthenticatedDataGate />}>
                  <Route
                    element={
                      <ProtectedRoute allowedRoles={ROLE_GROUPS.AUTHENTICATED}>
                        <AppShell />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/shift" element={<Navigate to="/kasir?tab=shift" replace />} />
                    <Route
                      path="/kasir"
                      element={featureElement(
                        runtimeFlags,
                        "cashier",
                        "Kasir POS",
                        pageElement(CashierModulePage, "Kasir", "cashier")
                      )}
                    />
                    <Route
                      path="/inventory"
                      element={featureElement(
                        runtimeFlags,
                        "products",
                        "Inventory",
                        pageElement(InventoryModulePage, "Inventory")
                      )}
                    />
                    <Route
                      path="/riwayat-transaksi"
                      element={featureElement(
                        runtimeFlags,
                        "history",
                        "Riwayat Transaksi",
                        pageElement(HistoryPage, "Riwayat Transaksi")
                      )}
                    />
                  </Route>

                  <Route
                    element={
                      <ProtectedRoute allowedRoles={ROUTE_ACCESS.ADMIN}>
                        <AppShell />
                      </ProtectedRoute>
                    }
                  >
                    <Route
                      path="/admin/users"
                      element={featureElement(
                        runtimeFlags,
                        "employees",
                        "User & Audit",
                        pageElement(EmployeeManagementPage, "User & Audit")
                      )}
                    />
                    <Route
                      path="/admin/audit"
                      element={featureElement(
                        runtimeFlags,
                        "audit",
                        "Audit Log",
                        pageElement(AuditLogPage, "Audit Log")
                      )}
                    />
                    <Route
                      path="/dashboard"
                      element={featureElement(
                        runtimeFlags,
                        "reports",
                        "Dashboard",
                        pageElement(Dashboard, "Dashboard")
                      )}
                    />
                    <Route path="/shift" element={<Navigate to="/kasir?tab=shift" replace />} />
                    <Route path="/stok-barang" element={<Navigate to="/inventory?tab=fisik" replace />} />
                    <Route path="/saldo" element={<Navigate to="/inventory?tab=saldo" replace />} />
                    <Route path="/retur-supplier" element={<Navigate to="/inventory?tab=retur" replace />} />
                    <Route path="/karyawan" element={<Navigate to="/admin/users" replace />} />
                  </Route>
                </Route>

                <Route path="*" element={<Navigate to={getDefaultRoute("kasir")} replace />} />
              </Routes>
            </ErrorBoundary>
          </AuthProvider>
        </NotificationProvider>
      </AppModeProvider>
    </BrowserRouter>
  );
}

export default App;
