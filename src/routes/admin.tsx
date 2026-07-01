import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { useAdminAuth } from "@/admin/AdminAuth";
import { useI18n } from "@/i18n/I18nProvider";
import { LogOut, LayoutDashboard, Home, CalendarRange, Inbox } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — In-Alpes" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { authed } = useAdminAuth();
  if (!authed) return <LoginScreen />;
  return <Shell />;
}

function LoginScreen() {
  const { t } = useI18n();
  const { login } = useAdminAuth();
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState(false);
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center">
      <form
        onSubmit={(e) => { e.preventDefault(); if (!login(pwd)) setError(true); }}
        className="card-soft w-full max-w-sm space-y-4 p-8"
      >
        <div>
          <h1 className="text-xl font-semibold">{t("admin.login.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.login.sub")}</p>
        </div>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">{t("admin.login.password")}</span>
          <input
            type="password"
            autoFocus
            value={pwd}
            onChange={(e) => { setPwd(e.target.value); setError(false); }}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
          />
        </label>
        {error && <p className="text-xs text-accent">{t("admin.login.error")}</p>}
        <button className="btn-base w-full bg-primary text-primary-foreground">{t("admin.login.submit")}</button>
        <p className="text-[11px] text-muted-foreground">{t("admin.login.hint")}</p>
      </form>
    </div>
  );
}

function Shell() {
  const { t } = useI18n();
  const { logout } = useAdminAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const items = [
    { to: "/admin", exact: true, label: t("admin.nav.dashboard"), Icon: LayoutDashboard },
    { to: "/admin/apartments", label: t("admin.nav.apartments"), Icon: Home },
    { to: "/admin/availability", label: t("admin.nav.availability"), Icon: CalendarRange },
    { to: "/admin/requests", label: t("admin.nav.requests"), Icon: Inbox },
  ] as const;

  return (
    <div className="container-page grid gap-8 py-10 md:grid-cols-[220px_1fr]">
      <aside className="space-y-1">
        {items.map(({ to, label, Icon, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={"flex items-center gap-2 rounded-xl px-3 py-2 text-sm " + (active ? "bg-secondary font-medium" : "text-muted-foreground hover:bg-secondary/60")}
            >
              <Icon className="h-4 w-4" /> {label}
            </Link>
          );
        })}
        <button onClick={logout} className="mt-4 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/60">
          <LogOut className="h-4 w-4" /> {t("admin.logout")}
        </button>
      </aside>
      <div><Outlet /></div>
    </div>
  );
}
