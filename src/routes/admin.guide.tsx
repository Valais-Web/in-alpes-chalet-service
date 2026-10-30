import { createFileRoute } from "@tanstack/react-router";
import { Info } from "lucide-react";
import { adminGuide } from "@/content/adminGuide";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/admin/guide")({
  component: AdminGuide,
});

function AdminGuide() {
  const { locale } = useI18n();
  const g = adminGuide[locale] ?? adminGuide.fr;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">{g.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{g.lead}</p>

      <section className="mt-6 rounded-2xl border border-border p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide">{g.delaysTitle}</h2>
        <dl className="mt-3 divide-y divide-border text-sm">
          {g.delays.map(([what, when]) => (
            <div key={what} className="grid gap-1 py-2 sm:grid-cols-[1fr_auto] sm:gap-6">
              <dt className="text-muted-foreground">{what}</dt>
              <dd className="font-medium sm:text-right">{when}</dd>
            </div>
          ))}
        </dl>
      </section>

      <nav className="mt-6 text-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {g.contents}
        </h2>
        <ol className="mt-2 grid gap-1 sm:grid-cols-2">
          {g.sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-accent hover:underline">
                {i + 1}. {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-8 space-y-10">
        {g.sections.map((s, i) => (
          <section key={s.id} id={s.id} className="scroll-mt-6">
            <h2 className="text-lg font-semibold">
              {i + 1}. {s.title}
            </h2>
            {s.intro && <p className="mt-2 text-sm text-muted-foreground">{s.intro}</p>}
            {s.steps && (
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm marker:font-semibold marker:text-accent">
                {s.steps.map((step) => (
                  <li key={step} className="pl-1">
                    {step}
                  </li>
                ))}
              </ol>
            )}
            {s.points && (
              <ul className="mt-3 space-y-2 text-sm">
                {s.points.map((pt) =>
                  typeof pt === "string" ? (
                    <li key={pt}>{pt}</li>
                  ) : (
                    <li key={pt[0]} className="border-l-2 border-border pl-3">
                      <span className="font-semibold">{pt[0]}</span>
                      <span className="text-muted-foreground">
                        {locale === "fr" ? " : " : ": "}
                        {pt[1]}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            )}
            {s.note && (
              <p className="mt-4 flex gap-2 border border-accent bg-accent-tint px-3 py-2 text-sm">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={1.8} />
                <span>{s.note}</span>
              </p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
