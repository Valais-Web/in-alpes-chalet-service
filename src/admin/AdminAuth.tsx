import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface AdminCtx {
  authed: boolean;
  login: (pwd: string) => boolean;
  logout: () => void;
}

const Ctx = createContext<AdminCtx | null>(null);
const KEY = "inalpes.admin";
const PWD = "admin"; // demo only — no real auth

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setAuthed(window.sessionStorage.getItem(KEY) === "1");
  }, []);

  const value = useMemo<AdminCtx>(() => ({
    authed,
    login: (pwd) => {
      if (pwd === PWD) {
        window.sessionStorage.setItem(KEY, "1");
        setAuthed(true);
        return true;
      }
      return false;
    },
    logout: () => {
      window.sessionStorage.removeItem(KEY);
      setAuthed(false);
    },
  }), [authed]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return ctx;
}
