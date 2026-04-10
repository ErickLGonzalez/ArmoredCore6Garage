"use client";

import { useEffect, useMemo, useState } from "react";

type MeResponse = {
  user: {
    id: string;
    username: string;
    email: string | null;
    displayName: string | null;
    theme: string;
  } | null;
  themes: string[];
};

function themeLabel(theme: string): string {
  return theme.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

async function applyThemeVars(theme: string) {
  const res = await fetch(`/api/themes/${theme}`);
  if (!res.ok) return;
  const body = (await res.json()) as { cssVars?: Record<string, string> };
  if (!body.cssVars) return;
  for (const [k, v] of Object.entries(body.cssVars)) {
    document.documentElement.style.setProperty(k, v);
  }
  document.documentElement.setAttribute("data-ui-theme", theme);
}

export function UserThemeControls() {
  const [data, setData] = useState<MeResponse | null>(null);
  const [username, setUsername] = useState("");
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
      await applyThemeVars(next.user.theme);
    }
  };

  useEffect(() => {
    void loadMe();
  }, []);

  const isLoggedIn = Boolean(data?.user);
  const currentTheme = data?.user?.theme ?? "DEFAULT";
  const themes = data?.themes ?? [];
  const userLabel = useMemo(
    () => data?.user?.displayName || data?.user?.username || data?.user?.email || "User",
    [data],
  );

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        mode === "login"
          ? { username, password }
          : {
              username,
              email: email || undefined,
              password,
              displayName: displayName || undefined,
            };
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
      await applyThemeVars(theme);
      await loadMe();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Theme update failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="min-w-[280px] border-2 px-2 py-1.5 text-[11px]"
      style={{
        borderColor: "color-mix(in srgb, var(--ui-border) 88%, transparent)",
        background:
          "linear-gradient(180deg, color-mix(in srgb, var(--ui-panel-top) 92%, transparent), color-mix(in srgb, var(--ui-panel-bottom) 96%, transparent))",
        color: "var(--ui-text)",
      }}
    >
      {isLoggedIn ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="truncate" style={{ color: "var(--ui-text-dim)" }}>
              {userLabel}
            </span>
            <button
              type="button"
              onClick={logout}
              disabled={busy}
              className="classic-tab px-2 py-px text-[10px]"
            >
              LOGOUT
            </button>
          </div>
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-wide" style={{ color: "var(--ui-text-dim)" }}>
              COLOR SCHEME
            </span>
            <select
              value={currentTheme}
              disabled={busy}
              onChange={(e) => void setTheme(e.target.value)}
              className="w-full border px-2 py-1 text-xs"
              style={{
                borderColor: "color-mix(in srgb, var(--ui-border) 95%, transparent)",
                background: "color-mix(in srgb, var(--ui-panel-bottom) 92%, black)",
                color: "var(--ui-text)",
              }}
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
              className={`classic-tab px-2 py-px text-[10px] ${mode === "login" ? "classic-tab-active" : ""}`}
            >
              LOGIN
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`classic-tab px-2 py-px text-[10px] ${mode === "register" ? "classic-tab-active" : ""}`}
            >
              REGISTER
            </button>
          </div>
          {mode === "register" ? (
            <input
              placeholder="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full border px-2 py-1 text-xs"
              style={{
                borderColor: "color-mix(in srgb, var(--ui-border) 95%, transparent)",
                background: "color-mix(in srgb, var(--ui-panel-bottom) 92%, black)",
                color: "var(--ui-text)",
              }}
            />
          ) : null}
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border px-2 py-1 text-xs"
            style={{
              borderColor: "color-mix(in srgb, var(--ui-border) 95%, transparent)",
              background: "color-mix(in srgb, var(--ui-panel-bottom) 92%, black)",
              color: "var(--ui-text)",
            }}
          />
          {mode === "register" ? (
            <input
              placeholder="Email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border px-2 py-1 text-xs"
              style={{
                borderColor: "color-mix(in srgb, var(--ui-border) 95%, transparent)",
                background: "color-mix(in srgb, var(--ui-panel-bottom) 92%, black)",
                color: "var(--ui-text)",
              }}
            />
          ) : null}
          <input
            type="password"
            placeholder="Password (min 4)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border px-2 py-1 text-xs"
            style={{
              borderColor: "color-mix(in srgb, var(--ui-border) 95%, transparent)",
              background: "color-mix(in srgb, var(--ui-panel-bottom) 92%, black)",
              color: "var(--ui-text)",
            }}
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
