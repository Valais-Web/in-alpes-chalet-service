import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { deleteApartment, listApartments, upsertApartment } from "@/data/api";
import type { Apartment, Locale } from "@/data/types";
import { useI18n } from "@/i18n/I18nProvider";
import { Pencil, Trash2, Plus, ArrowUp, ArrowDown, Upload } from "lucide-react";

export const Route = createFileRoute("/admin/apartments")({
  component: AdminApartments,
});

const LOCALES: Locale[] = ["fr", "en", "nl"];

function AdminApartments() {
  const { t, tx } = useI18n();
  const qc = useQueryClient();
  const { data: apartments = [] } = useQuery({ queryKey: ["apartments"], queryFn: listApartments });
  const [editing, setEditing] = useState<Apartment | null>(null);

  const onSave = async (a: Apartment) => {
    await upsertApartment(a);
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["apartments"] });
  };
  const onDelete = async (id: string) => {
    await deleteApartment(id);
    qc.invalidateQueries({ queryKey: ["apartments"] });
  };

  const emptyApt = (): Apartment => ({
    id: `apt-${Date.now()}`,
    slug: `nouveau-${Date.now()}`,
    title: { fr: "", en: "", nl: "" },
    summary: { fr: "", en: "", nl: "" },
    description: { fr: "", en: "", nl: "" },
    images: ["apt-1"],
    maxGuests: 2, bedrooms: 1, bathrooms: 1, surfaceM2: 40, floor: "1",
    amenities: [],
    pricePerNight: 100,
    location: { lat: 46.18, lng: 7.31, address: "" },
    practical: { checkIn: "16:00", checkOut: "10:00", rules: { fr: "", en: "", nl: "" } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("admin.nav.apartments")}</h1>
        <button onClick={() => setEditing(emptyApt())} className="btn-base bg-primary text-primary-foreground">
          <Plus className="h-4 w-4" /> {t("admin.apt.add")}
        </button>
      </div>

      <ul className="mt-6 divide-y divide-border rounded-2xl border border-border">
        {apartments.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-4 p-4">
            <div>
              <div className="font-medium">{tx(a.title)}</div>
              <div className="text-xs text-muted-foreground">{a.slug} · CHF {a.pricePerNight}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(a)} className="rounded-full border border-border p-2 hover:bg-secondary" aria-label="edit">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => onDelete(a.id)} className="rounded-full border border-border p-2 hover:bg-secondary" aria-label="delete">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {editing && <EditDialog initial={editing} onClose={() => setEditing(null)} onSave={onSave} />}
    </div>
  );
}

function EditDialog({ initial, onClose, onSave }: { initial: Apartment; onClose: () => void; onSave: (a: Apartment) => void }) {
  const { t } = useI18n();
  const [a, setA] = useState<Apartment>(initial);

  const setLoc = (field: "title" | "summary" | "description", loc: Locale, v: string) => {
    setA((p) => ({ ...p, [field]: { ...p[field], [loc]: v } }));
  };

  const moveImage = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= a.images.length) return;
    const copy = [...a.images];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    setA({ ...a, images: copy });
  };

  const input = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-3xl bg-background p-6 shadow-[var(--shadow-lift)]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">{t("admin.apt.edit")}</h2>

        <div className="mt-4 space-y-5">
          {(["title","summary","description"] as const).map((field) => (
            <div key={field}>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{field}</div>
              <div className="grid gap-2 md:grid-cols-3">
                {LOCALES.map((l) => (
                  <label key={l} className="space-y-1">
                    <span className="text-[11px] uppercase text-muted-foreground">{l}</span>
                    {field === "description" ? (
                      <textarea rows={3} className={input} value={a[field][l]} onChange={(e) => setLoc(field, l, e.target.value)} />
                    ) : (
                      <input className={input} value={a[field][l]} onChange={(e) => setLoc(field, l, e.target.value)} />
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <NumField label={t("apt.guests")} value={a.maxGuests} onChange={(v) => setA({ ...a, maxGuests: v })} />
            <NumField label={t("apt.bedrooms")} value={a.bedrooms} onChange={(v) => setA({ ...a, bedrooms: v })} />
            <NumField label={t("apt.bathrooms")} value={a.bathrooms} onChange={(v) => setA({ ...a, bathrooms: v })} />
            <NumField label="CHF" value={a.pricePerNight} onChange={(v) => setA({ ...a, pricePerNight: v })} />
          </div>

          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Images</div>
            <div className="rounded-xl border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              <Upload className="mx-auto h-5 w-5" />
              <div className="mt-2">{t("admin.apt.uploadImages")}</div>
            </div>
            <ul className="mt-3 space-y-1">
              {a.images.map((img, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2 text-sm">
                  <span className="font-mono text-xs">{img}</span>
                  <span className="flex gap-1">
                    <button className="rounded p-1 hover:bg-background" onClick={() => moveImage(i, -1)}><ArrowUp className="h-3 w-3" /></button>
                    <button className="rounded p-1 hover:bg-background" onClick={() => moveImage(i, 1)}><ArrowDown className="h-3 w-3" /></button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="btn-base bg-secondary text-foreground">{t("admin.apt.cancel")}</button>
          <button onClick={() => onSave(a)} className="btn-base bg-primary text-primary-foreground">{t("admin.apt.save")}</button>
        </div>
      </div>
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="space-y-1">
      <span className="text-[11px] uppercase text-muted-foreground">{label}</span>
      <input type="number" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}
