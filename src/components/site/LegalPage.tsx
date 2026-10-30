import type { LegalDoc } from "@/content/legal";

export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <div className="container-page pb-24 pt-16 md:pb-32 md:pt-24">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-[clamp(2.4rem,4.6vw,4rem)] font-medium leading-[1] tracking-[-0.03em]">
          {doc.title}
        </h1>
        <p className="mt-4 text-sm text-foreground/60">{doc.updated}</p>
        {doc.intro && (
          <p className="mt-8 text-[17px] leading-relaxed text-foreground/80">{doc.intro}</p>
        )}
        <div className="mt-12 space-y-10">
          {doc.sections.map((s) => (
            <section key={s.heading} className="border-t border-foreground/15 pt-6">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-medium">
                {s.heading}
              </h2>
              <div className="mt-3 space-y-3">
                {s.paragraphs.map((p, i) => (
                  <p key={i} className="text-base leading-relaxed text-foreground/80">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
