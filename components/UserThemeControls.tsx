"use client";

import { useEffect, useMemo, useState } from "react";

type MeResponse = {
  user: { id: string; email: string; displayName: string | null; theme: string } | null;
  themes: string[];
};

function themeLabel(theme: string): string {
  return theme.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export function UserThemeControls() {
  const [data, setData] = useState<MeResponse | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMe = async () => {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    const next = (await res.json()) as MeResponse;
    setData(next);
    if (next.user?.theme) {
      document.documentElement.setAttribute("data-ui-theme", next.user.theme);
    }
  };

  useEffect(() => {
    void loadMe();
  }, []);

  const isLoggedIn = Boolean(data?.user);
  const currentTheme = data?.user?.theme ?? "TOKYONIGHT";
  const themes = data?.themes ?? [];
  const userLabel = useMemo(
    () => data?.user?.displayName || data?.user?.email || "User",
    [data],
  );

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        mode === "login"
          ? { email, password }
          : { email, password, displayName: displayName || undefined };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Authentication failed");
      }
      await loadMe();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    setBusy(true);
    setError(null);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await loadMe();
    } finally {
      setBusy(false);
    }
  };

  const setTheme = async (theme: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/theme", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ theme }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Theme update failed");
      }
      document.documentElement.setAttribute("data-ui-theme", theme);
      await loadMe();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Theme update failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-w-[280px] rounded border border-cyan-300/35 bg-[#0a1f2f] px-3 py-2 text-[11px] text-cyan-50">
      {isLoggedIn ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="truncate text-cyan-200/90">{userLabel}</span>
            <button
              type="button"
              onClick={logout}
              disabled={busy}
              className="classic-tab px-2 py-1 text-[10px]"
            >
              Logout
            </button>
          </div>
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-wide text-cyan-200/80">
              Color Scheme
            </span>
            <select
              value={currentTheme}
              disabled={busy}
              onChange={(e) => void setTheme(e.target.value)}
              className="w-full border border-cyan-300/45 bg-[#081724] px-2 py-1 text-xs text-cyan-50"
            >
              {themes.map((t) => (
                <option key={t} value={t}>
                  {themeLabel(t)}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`classic-tab px-2 py-1 text-[10px] ${mode === "login" ? "classic-tab-active" : ""}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`classic-tab px-2 py-1 text-[10px] ${mode === "register" ? "classic-tab-active" : ""}`}
            >
              Register
            </button>
          </div>
          {mode === "register" ? (
            <input
              placeholder="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full border border-cyan-300/45 bg-[#081724] px-2 py-1 text-xs text-cyan-50"
            />
          ) : null}
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-cyan-300/45 bg-[#081724] px-2 py-1 text-xs text-cyan-50"
          />
          <input
            type="password"
            placeholder="Password (min 8)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-cyan-300/45 bg-[#081724] px-2 py-1 text-xs text-cyan-50"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit()}
            className="classic-tab w-full px-2 py-1 text-[10px]"
          >
            {mode === "login" ? "Login" : "Create Account"}
          </button>
        </div>
      )}
      {error ? <p className="mt-2 text-[10px] text-rose-300">{error}</p> : null}
    </div>
  );
}
