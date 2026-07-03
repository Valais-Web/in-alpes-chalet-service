import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface AdminCtx {
  authed: boolean;
  login: (pwd: string) => Promise<boolean>;
  logout: () => void;
}

const Ctx = createContext<AdminCtx | null>(null);
const KEY = "inalpes.admin";
const LIVE = import.meta.env.VITE_API_MODE === "live";
const STUB_PWD = "admin"; // local dev only — the real check is server-side

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setAuthed(window.sessionStorage.getItem(KEY) === "1");
  }, []);

  const value = useMemo<AdminCtx>(
    () => ({
      authed,
      login: async (pwd) => {
        // In live mode the server validates and sets an HttpOnly session cookie;
        // the flag below is only a UX hint. In stub mode we compare locally.
        if (LIVE) {
          try {
            const res = await fetch("/api/admin/login", {
              method: "POST",
              credentials: "same-origin",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ password: pwd }),
            });
            if (!res.ok) return false;
          } catch {
            return false;
          }
        } else if (pwd !== STUB_PWD) {
          return false;
        }
        window.sessionStorage.setItem(KEY, "1");
        setAuthed(true);
        return true;
      },
      logout: () => {
        if (LIVE) {
          void fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
        }
        window.sessionStorage.removeItem(KEY);
        setAuthed(false);
      },
    }),
    [authed],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return ctx;
}
