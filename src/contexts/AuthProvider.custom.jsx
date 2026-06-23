import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toClientMessage } from "../utils/clientMessages";
import { AuthContext } from "./auth-context";
import { AUTH_STATUS } from "./auth-status";

const LOGIN_TIMEOUT_MS = 8_000;
const VALID_ROLES = new Set(["pemilik", "kasir"]);
const AUTH_SNAPSHOT_KEY = "__RAJA_AKSESORIS_AUTH_SNAPSHOT__";
const AUTH_USER_CACHE_KEY = "raja_pos_last_auth_user";
const AUTH_TOKEN_KEY = "raja_pos_auth_token";

function getBackendUrl() {
  // Use relative /api path for Vercel deployments
  return window.location.origin;
}

function readCachedToken() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage?.getItem(AUTH_TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

function writeCachedToken(token) {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      window.localStorage?.setItem(AUTH_TOKEN_KEY, token);
    } else {
      window.localStorage?.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {
    // Cache is optional
  }
}

function readCachedUser() {
  if (typeof window === "undefined") return null;
  try {
    const rawValue = window.localStorage?.getItem(AUTH_USER_CACHE_KEY);
    if (!rawValue) return null;

    const cachedUser = JSON.parse(rawValue);
    const role = normalizeRole(cachedUser?.role);
    if (!cachedUser?.id || !role) return null;

    return {
      id: String(cachedUser.id),
      name: String(cachedUser.name || cachedUser.username || "Pengguna"),
      role,
      profile: cachedUser.profile || { id: cachedUser.id, role, username: cachedUser.username },
      pinHash: null,
      recheckingSession: true,
    };
  } catch {
    return null;
  }
}

function writeCachedUser(nextUser) {
  if (typeof window === "undefined") return;
  try {
    if (!nextUser?.id) {
      window.localStorage?.removeItem(AUTH_USER_CACHE_KEY);
      return;
    }

    window.localStorage?.setItem(
      AUTH_USER_CACHE_KEY,
      JSON.stringify({
        id: nextUser.id,
        name: nextUser.name || nextUser.profile?.username || "Pengguna",
        role: nextUser.role,
        username: nextUser.profile?.username || nextUser.name || "",
        profile: {
          id: nextUser.profile?.id || nextUser.id,
          username: nextUser.profile?.username || "",
          role: nextUser.role,
        },
      })
    );
  } catch {
    // Cache is optional
  }
}

function getAuthSnapshotStore() {
  if (typeof globalThis === "undefined") {
    return {
      authState: AUTH_STATUS.CHECKING_SESSION,
      user: null,
      profileError: "",
      token: null,
    };
  }

  globalThis[AUTH_SNAPSHOT_KEY] ||= {
    authState: AUTH_STATUS.CHECKING_SESSION,
    user: null,
    profileError: "",
    token: null,
  };

  return globalThis[AUTH_SNAPSHOT_KEY];
}

function updateAuthSnapshot(patch) {
  Object.assign(getAuthSnapshotStore(), patch);
}

function normalizeRole(role) {
  const normalized = String(role || "").trim().toLowerCase();
  return VALID_ROLES.has(normalized) ? normalized : "";
}

function withTimeout(promise, timeoutMs, message) {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => window.clearTimeout(timeoutId));
  });
}

function toReadableError(error) {
  const message = String(error?.message || error?.error || error || "");
  const lowered = message.toLowerCase();

  if (lowered.includes("invalid") || lowered.includes("tidak sesuai")) {
    return "Username atau password tidak sesuai.";
  }

  if (lowered.includes("tidak aktif") || lowered.includes("tidak ditemukan")) {
    return "Akun tidak ditemukan atau tidak aktif.";
  }

  if (lowered.includes("terlalu banyak")) {
    return "Terlalu banyak percobaan login. Tunggu sebentar lalu coba lagi.";
  }

  return toClientMessage(message, "Login gagal. Coba lagi.");
}

function getInitialAuthSnapshot() {
  const snapshot = getAuthSnapshotStore();
  const hasAuthenticatedUser =
    snapshot.authState === AUTH_STATUS.AUTHENTICATED && snapshot.user?.id;

  if (hasAuthenticatedUser) {
    return snapshot;
  }

  const cachedUser = readCachedUser();
  const cachedToken = readCachedToken();

  if (cachedUser && cachedToken) {
    return {
      authState: AUTH_STATUS.AUTHENTICATED,
      user: cachedUser,
      profileError: "",
      token: cachedToken,
    };
  }

  return {
    authState: AUTH_STATUS.CHECKING_SESSION,
    user: null,
    profileError: "",
    token: null,
  };
}

function AuthProvider({ children }) {
  const initialSnapshotRef = useRef(null);
  if (!initialSnapshotRef.current) {
    initialSnapshotRef.current = getInitialAuthSnapshot();
  }

  const [authState, setAuthState] = useState(initialSnapshotRef.current.authState);
  const [user, setUserState] = useState(initialSnapshotRef.current.user);
  const [profileError, setProfileErrorState] = useState(initialSnapshotRef.current.profileError);
  const tokenRef = useRef(initialSnapshotRef.current.token);
  const authStateRef = useRef(initialSnapshotRef.current.authState);
  const userRef = useRef(initialSnapshotRef.current.user);

  const setState = useCallback((nextState) => {
    const previousState = authStateRef.current;
    authStateRef.current = nextState;
    updateAuthSnapshot({ authState: nextState });
    if (previousState !== nextState && import.meta.env.DEV) {
      console.info("Auth transition", { from: previousState, to: nextState });
    }
    setAuthState(nextState);
  }, []);

  const commitUser = useCallback((nextUser) => {
    userRef.current = nextUser;
    updateAuthSnapshot({ user: nextUser });
    writeCachedUser(nextUser);
    setUserState(nextUser);
  }, []);

  const commitToken = useCallback((nextToken) => {
    tokenRef.current = nextToken;
    updateAuthSnapshot({ token: nextToken });
    writeCachedToken(nextToken);
  }, []);

  const commitProfileError = useCallback((nextError) => {
    const safeError = nextError || "";
    updateAuthSnapshot({ profileError: safeError });
    setProfileErrorState(safeError);
  }, []);

  const goSignedOut = useCallback(() => {
    tokenRef.current = null;
    updateAuthSnapshot({ token: null });
    commitUser(null);
    commitToken(null);
    commitProfileError("");
    setState(AUTH_STATUS.SIGNED_OUT);
  }, [commitProfileError, commitUser, commitToken, setState]);

  // Verify token on mount
  useEffect(() => {
    const verify = async () => {
      const token = readCachedToken();
      if (!token) {
        setState(AUTH_STATUS.SIGNED_OUT);
        return;
      }

      commitToken(token);
      setState(AUTH_STATUS.VERIFYING_PROFILE);

      try {
        const response = await withTimeout(
          fetch(`${getBackendUrl()}/api/auth/verify`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          LOGIN_TIMEOUT_MS,
          "Verifikasi sesi terlalu lama. Coba lagi atau login ulang."
        );

        if (!response.ok) {
          throw new Error("Token tidak valid atau sudah kadaluarsa.");
        }

        const data = await response.json();
        const nextUser = {
          id: data.user.id,
          name: data.user.username,
          role: data.user.role,
          profile: { id: data.user.id, username: data.user.username, role: data.user.role },
        };

        commitUser(nextUser);
        commitProfileError("");
        setState(AUTH_STATUS.AUTHENTICATED);
      } catch (error) {
        console.warn("Verifikasi sesi gagal:", error);
        goSignedOut();
      }
    };

    verify();
  }, [setState, commitUser, commitToken, commitProfileError, goSignedOut]);

  const login = useCallback(
    async (username, password) => {
      setState(AUTH_STATUS.VERIFYING_PROFILE);

      try {
        const response = await withTimeout(
          fetch(`${getBackendUrl()}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          }),
          LOGIN_TIMEOUT_MS,
          "Login terlalu lama. Periksa koneksi internet."
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Login gagal");
        }

        const token = data.token;
        commitToken(token);

        const nextUser = {
          id: data.user.id,
          name: data.user.username,
          role: data.user.role,
          profile: { id: data.user.id, username: data.user.username, role: data.user.role },
        };

        commitUser(nextUser);
        commitProfileError("");
        setState(AUTH_STATUS.AUTHENTICATED);
      } catch (error) {
        const message = toReadableError(error);
        commitProfileError(message);
        setState(AUTH_STATUS.SIGNED_OUT);
        throw error;
      }
    },
    [setState, commitUser, commitToken, commitProfileError]
  );

  const logout = useCallback(async () => {
    goSignedOut();
  }, [goSignedOut]);

  const retryProfileVerification = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) {
      goSignedOut();
      return;
    }

    setState(AUTH_STATUS.VERIFYING_PROFILE);

    try {
      const response = await withTimeout(
        fetch(`${getBackendUrl()}/api/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        LOGIN_TIMEOUT_MS,
        "Verifikasi profil terlalu lama."
      );

      if (!response.ok) {
        throw new Error("Verifikasi profil gagal");
      }

      const data = await response.json();
      const nextUser = {
        id: data.user.id,
        name: data.user.username,
        role: data.user.role,
        profile: { id: data.user.id, username: data.user.username, role: data.user.role },
      };

      commitUser(nextUser);
      commitProfileError("");
      setState(AUTH_STATUS.AUTHENTICATED);
    } catch (error) {
      console.warn("Retry profile verification gagal:", error);
      const message = toReadableError(error);
      commitProfileError(message);
      setState(AUTH_STATUS.PROFILE_ERROR);
    }
  }, [setState, commitUser, commitProfileError]);

  const contextValue = useMemo(
    () => ({
      authState,
      user,
      profileError,
      login,
      logout,
      retryProfileVerification,
    }),
    [authState, user, profileError, login, logout, retryProfileVerification]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export { AuthProvider };
