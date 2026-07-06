import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import logoInk from "@/assets/logo-ink.png";
import ogImage from "@/assets/apt-1.jpg";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { I18nProvider } from "@/i18n/I18nProvider";
import { AdminAuthProvider } from "@/admin/AdminAuth";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <p className="mt-4 text-sm text-muted-foreground">Page not found.</p>
        <a href="/" className="mt-6 inline-flex btn-base bg-primary text-primary-foreground">
          Home
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 btn-base bg-primary text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "In-Alpes Chalet Services — Location & gérance à Haute-Nendaz" },
      {
        name: "description",
        content:
          "Location de chalets et appartements de caractère à Haute-Nendaz (Valais, 4 Vallées) et gérance complète de résidences secondaires.",
      },
      { name: "author", content: "In-Alpes Chalet Services" },
      { property: "og:site_name", content: "In-Alpes Chalet Services" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "fr_CH" },
      { property: "og:locale:alternate", content: "en_GB" },
      { property: "og:locale:alternate", content: "nl_NL" },
      { property: "og:title", content: "In-Alpes Chalet Services — Haute-Nendaz" },
      {
        property: "og:description",
        content:
          "Chalets et appartements à Haute-Nendaz, gérance complète pour résidences secondaires.",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: ogImage },
      { name: "twitter:image", content: ogImage },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "icon", type: "image/png", href: logoInk },
      { rel: "apple-touch-icon", href: logoInk },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700&family=Hanken+Grotesk:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AdminAuthProvider>
          <SiteFrame />
        </AdminAuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

function SiteFrame() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
