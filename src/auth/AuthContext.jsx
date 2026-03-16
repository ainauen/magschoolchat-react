import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { createApiClient } from "../api/apiClient";

const AuthContext = createContext(null);

const AUTH_CHANNEL = "msc_auth_channel";
const STORAGE_KEY = "msc_auth_event"; // fallback for browsers w/o BroadcastChannel

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [expiresUtc, setExpiresUtc] = useState(null);

  const [me, setMe] = useState(null); // { userId, email, displayName, roles }
  const [booting, setBooting] = useState(true);

  const bcRef = useRef(null);

  const baseURL = import.meta.env.VITE_API_BASE_URL || "";

  // Minimal axios for auth endpoints
  const authHttp = useMemo(() => {
    return axios.create({
      baseURL,
      withCredentials: true,
    });
  }, [baseURL]);

  const logoutLocal = () => {
    setAccessToken(null);
    setExpiresUtc(null);
    setMe(null);
  };

  const broadcast = (msg) => {
    try {
      bcRef.current?.postMessage(msg);
    } catch {
      // ignore
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...msg, ts: Date.now() }));
    } catch {
      // ignore
    }
  };

  const onAuthFailed = () => {
    logoutLocal();
    broadcast({ type: "LOGOUT" });
    // Let the RequireAuth component redirect when it sees no token
  };

  const refreshAccessToken = async () => {
    // Calls /api/auth/refresh (cookie-based)
    const res = await authHttp.post("/api/auth/refresh");
    const { accessToken: token, expiresUtc: exp } = res.data || {};
    if (!token) return null;

    setAccessToken(token);
    setExpiresUtc(exp || null);

    return token;
  };

  const loadMe = async (tokenOverride) => {
    const token = tokenOverride ?? accessToken;
    if (!token) return;

    const res = await authHttp.get("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setMe({
      userId: res.data.userId,
      email: res.data.email,
      displayName: res.data.displayName,
      roles: res.data.roles || res.data.Roles || [],
    });
  };

  const login = async ({ email, password }) => {
    const res = await authHttp.post("/api/auth/login", { email, password });
    const { accessToken: token, expiresUtc: exp } = res.data || {};

    setAccessToken(token);
    setExpiresUtc(exp || null);

    await loadMe(token);
    broadcast({ type: "LOGIN" });

    return true;
  };

  const logout = async () => {
    try {
      await authHttp.post("/api/auth/logout");
    } catch {
      // ignore
    } finally {
      logoutLocal();
      broadcast({ type: "LOGOUT" });
    }
  };

  const hasRole = (role) => {
    const roles = me?.roles || [];
    return roles.includes(role);
  };

  // Create API client with interceptors (uses refresh)
  const api = useMemo(() => {
    return createApiClient({
      getAccessToken: () => accessToken,
      refreshAccessToken,
      onAuthFailed,
    });
  }, [accessToken, authHttp]); // eslint-disable-line react-hooks/exhaustive-deps

  // Boot: try refresh on page load (enables new tabs + reload)
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const token = await refreshAccessToken();
        if (!mounted) return;
        if (token) await loadMe(token);
      } catch {
        // not logged in (no refresh cookie)
      } finally {
        if (mounted) setBooting(false);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Multi-tab: BroadcastChannel + storage fallback
  useEffect(() => {
    // BroadcastChannel
    try {
      bcRef.current = new BroadcastChannel(AUTH_CHANNEL);
      bcRef.current.onmessage = (e) => {
        if (e?.data?.type === "LOGOUT") logoutLocal();
        if (e?.data?.type === "LOGIN") {
          // optional: you could refresh immediately in other tabs
        }
      };
    } catch {
      bcRef.current = null;
    }

    // localStorage fallback
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const msg = JSON.parse(e.newValue);
        if (msg.type === "LOGOUT") logoutLocal();
      } catch {
        // ignore
      }
    };

    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      try {
        bcRef.current?.close();
      } catch {
        // ignore
      }
      bcRef.current = null;
    };
  }, []);

  const value = {
    booting,
    api, // use this for all app API calls
    accessToken,
    expiresUtc,
    me,
    login,
    logout,
    refreshAccessToken,
    hasRole,
    isAuthenticated: !!accessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
