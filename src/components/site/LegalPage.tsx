import type { LegalDoc } from "@/content/legal";

export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-semibold md:text-4xl">{doc.title}</h1>
        <p className="mt-2 text-xs text-muted-foreground">{doc.updated}</p>
        {doc.intro && (
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{doc.intro}</p>
        )}
        <div className="mt-8 space-y-8">
          {doc.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-lg font-semibold">{s.heading}</h2>
              <div className="mt-2 space-y-2">
                {s.paragraphs.map((p, i) => (
                  <p key={i} className="text-sm leading-relaxed text-muted-foreground">
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
