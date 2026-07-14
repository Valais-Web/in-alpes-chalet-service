import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { deleteApartment, listApartments, resolveImage, upsertApartment } from "@/data/api";
import { uploadImage, UploadUnavailableError } from "@/admin/uploadImage";
import type { Apartment, Locale } from "@/data/types";
import { useI18n } from "@/i18n/I18nProvider";
import {
  Pencil,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  Upload,
  X,
  Loader2,
  ImageOff,
} from "lucide-react";

export const Route = createFileRoute("/admin/apartments")({
  component: AdminApartments,
});

const LOCALES: Locale[] = ["fr", "en", "nl"];
const AMENITIES = [
  "wifi",
  "fireplace",
  "parking",
  "washer",
  "dishwasher",
  "balcony",
  "mountainView",
  "skiStorage",
  "elevator",
] as const;

function AdminApartments() {
  const { t, tx } = useI18n();
  const qc = useQueryClient();
  const { data: apartments = [] } = useQuery({ queryKey: ["apartments"], queryFn: listApartments });
  const [editing, setEditing] = useState<Apartment | null>(null);

  // Throws on failure so the dialog can surface the error.
  const onSave = async (a: Apartment) => {
    await upsertApartment(a);
    await qc.invalidateQueries({ queryKey: ["apartments"] });
    setEditing(null);
  };
  const onDelete = async (id: string) => {
    if (!window.confirm(t("admin.apartments.deleteConfirm"))) return;
    try {
      await deleteApartment(id);
      qc.invalidateQueries({ queryKey: ["apartments"] });
    } catch (err) {
      const blocked = err instanceof Error && err.message.includes("apartment_has_bookings");
      window.alert(t(blocked ? "admin.apartments.deleteBlocked" : "admin.apartments.deleteError"));
    }
  };

  const emptyApt = (): Apartment => ({
    id: `apt-${Date.now()}`,
    slug: `nouveau-${Date.now()}`,
    title: { fr: "", en: "", nl: "" },
    summary: { fr: "", en: "", nl: "" },
    description: { fr: "", en: "", nl: "" },
    images: [],
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    surfaceM2: 40,
    floor: "1",
    amenities: [],
    pricePerNight: 100,
    location: { lat: 46.18, lng: 7.31, address: "" },
    practical: { checkIn: "16:00", checkOut: "10:00", rules: { fr: "", en: "", nl: "" } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("admin.nav.apartments")}</h1>
        <button
          onClick={() => setEditing(emptyApt())}
          className="btn-base bg-primary text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> {t("admin.apt.add")}
        </button>
      </div>

      <ul className="mt-6 divide-y divide-border rounded-2xl border border-border">
        {apartments.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary">
                <img
                  src={resolveImage(a.images[0])}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <div className="font-medium">{tx(a.title)}</div>
                <div className="text-xs text-muted-foreground">
                  {a.slug} · CHF {a.pricePerNight} · {a.images.length}{" "}
                  {t("apt.photo").toLowerCase()}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(a)}
                className="border border-border p-2 hover:bg-secondary"
                aria-label="edit"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(a.id)}
                className="border border-border p-2 hover:bg-secondary"
                aria-label="delete"
              >
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

const input =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2";

function EditDialog({
  initial,
  onClose,
  onSave,
}: {
  initial: Apartment;
  onClose: () => void;
  onSave: (a: Apartment) => Promise<void>;
}) {
  const { t } = useI18n();
  const [a, setA] = useState<Apartment>(initial);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const setLoc = (field: "title" | "summary" | "description", loc: Locale, v: string) =>
    setA((p) => ({ ...p, [field]: { ...p[field], [loc]: v } }));
  const setRule = (loc: Locale, v: string) =>
    setA((p) => ({
      ...p,
      practical: { ...p.practical, rules: { ...p.practical.rules, [loc]: v } },
    }));
  const toggleAmenity = (key: string) =>
    setA((p) => ({
      ...p,
      amenities: p.amenities.includes(key)
        ? p.amenities.filter((x) => x !== key)
        : [...p.amenities, key],
    }));

  const moveImage = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= a.images.length) return;
    const copy = [...a.images];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    setA({ ...a, images: copy });
  };
  const removeImage = (i: number) =>
    setA((p) => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }));
  const addUrl = () => {
    const u = urlDraft.trim();
    if (!u) return;
    if (!/^https?:\/\//i.test(u)) {
      setUploadMsg(t("admin.apt.urlInvalid"));
      return;
    }
    setUploadMsg(null);
    setA((p) => ({ ...p, images: [...p.images, u] }));
    setUrlDraft("");
  };

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadMsg(null);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) urls.push(await uploadImage(file));
      setA((p) => ({ ...p, images: [...p.images, ...urls] }));
    } catch (err) {
      setUploadMsg(
        err instanceof UploadUnavailableError
          ? t("admin.apt.uploadUnavailable")
          : (err as Error).message,
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(a);
    } catch (e) {
      setSaveError((e as Error).message || t("admin.apt.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-background shadow-[var(--shadow-lift)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">{t("admin.apt.edit")}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("admin.apt.cancel")}
            className="p-1.5 hover:bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body (scrolls) */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          <Section title={t("admin.apt.section.content")}>
            <div className="space-y-4">
              <TextField
                label={t("admin.apt.field.slug")}
                value={a.slug}
                onChange={(v) => setA({ ...a, slug: v })}
              />
              {(["title", "summary", "description"] as const).map((field) => (
                <div key={field}>
                  <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t(`admin.apt.field.${field}`)}
                  </div>
                  <div className="grid gap-2 md:grid-cols-3">
                    {LOCALES.map((l) => (
                      <label key={l} className="space-y-1">
                        <span className="text-[11px] uppercase text-muted-foreground">{l}</span>
                        {field === "description" ? (
                          <textarea
                            rows={4}
                            className={input}
                            value={a[field][l]}
                            onChange={(e) => setLoc(field, l, e.target.value)}
                          />
                        ) : (
                          <input
                            className={input}
                            value={a[field][l]}
                            onChange={(e) => setLoc(field, l, e.target.value)}
                          />
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title={t("admin.apt.section.photos")}>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-8 text-center text-sm text-muted-foreground hover:border-accent hover:bg-secondary/50">
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
              ) : (
                <Upload className="h-6 w-6" />
              )}
              <span className="font-medium text-foreground">
                {uploading ? t("admin.apt.uploading") : t("admin.apt.uploadImages")}
              </span>
              <span className="text-xs">{t("admin.apt.uploadHint")}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploading}
                onChange={(e) => onFiles(e.target.files)}
              />
            </label>

            <div className="mt-3 flex gap-2">
              <input
                className={input}
                placeholder={t("admin.apt.urlPlaceholder")}
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addUrl();
                  }
                }}
              />
              <button
                type="button"
                onClick={addUrl}
                className="btn-base whitespace-nowrap bg-secondary text-foreground"
              >
                {t("admin.apt.addUrl")}
              </button>
            </div>
            {uploadMsg && <p className="mt-2 text-sm text-accent">{uploadMsg}</p>}

            {a.images.length > 0 && (
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {a.images.map((img, i) => (
                  <li
                    key={`${img}-${i}`}
                    className="group relative overflow-hidden border border-border"
                  >
                    <Thumb src={resolveImage(img)} invalidLabel={t("admin.apt.invalidImage")} />
                    <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-foreground/60 p-1">
                      <span className="flex gap-1">
                        <button
                          type="button"
                          className="rounded p-1 text-background hover:bg-foreground/40 disabled:opacity-30"
                          onClick={() => moveImage(i, -1)}
                          disabled={i === 0}
                          aria-label="up"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="rounded p-1 text-background hover:bg-foreground/40 disabled:opacity-30"
                          onClick={() => moveImage(i, 1)}
                          disabled={i === a.images.length - 1}
                          aria-label="down"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </span>
                      <button
                        type="button"
                        className="rounded p-1 text-background hover:bg-foreground/40"
                        onClick={() => removeImage(i)}
                        aria-label={t("admin.apt.removeImage")}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {i === 0 && (
                      <span className="absolute left-1 top-1 bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">
                        {t("admin.apt.cover")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title={t("admin.apt.section.details")}>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              <NumField
                label={t("apt.guests")}
                value={a.maxGuests}
                onChange={(v) => setA({ ...a, maxGuests: v })}
              />
              <NumField
                label={t("apt.bedrooms")}
                value={a.bedrooms}
                onChange={(v) => setA({ ...a, bedrooms: v })}
              />
              <NumField
                label={t("apt.bathrooms")}
                value={a.bathrooms}
                onChange={(v) => setA({ ...a, bathrooms: v })}
              />
              <NumField
                label={t("admin.apt.field.surface")}
                value={a.surfaceM2}
                onChange={(v) => setA({ ...a, surfaceM2: v })}
              />
              <TextField
                label={t("admin.apt.field.floor")}
                value={a.floor}
                onChange={(v) => setA({ ...a, floor: v })}
              />
              <NumField
                label="CHF"
                value={a.pricePerNight}
                onChange={(v) => setA({ ...a, pricePerNight: v })}
              />
            </div>
          </Section>

          <Section title={t("admin.apt.section.location")}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="md:col-span-2">
                <TextField
                  label={t("admin.apt.field.address")}
                  value={a.location.address}
                  onChange={(v) => setA({ ...a, location: { ...a.location, address: v } })}
                />
              </div>
              <NumField
                label={t("admin.apt.field.lat")}
                value={a.location.lat}
                onChange={(v) => setA({ ...a, location: { ...a.location, lat: v } })}
              />
              <NumField
                label={t("admin.apt.field.lng")}
                value={a.location.lng}
                onChange={(v) => setA({ ...a, location: { ...a.location, lng: v } })}
              />
              <TextField
                label={t("admin.apt.field.checkIn")}
                value={a.practical.checkIn}
                onChange={(v) => setA({ ...a, practical: { ...a.practical, checkIn: v } })}
              />
              <TextField
                label={t("admin.apt.field.checkOut")}
                value={a.practical.checkOut}
                onChange={(v) => setA({ ...a, practical: { ...a.practical, checkOut: v } })}
              />
            </div>
          </Section>

          <Section title={t("admin.apt.field.amenities")}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {AMENITIES.map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={a.amenities.includes(key)}
                    onChange={() => toggleAmenity(key)}
                  />
                  {t(`amenity.${key}`)}
                </label>
              ))}
            </div>
          </Section>

          <Section title={t("admin.apt.field.rules")}>
            <div className="grid gap-2 md:grid-cols-3">
              {LOCALES.map((l) => (
                <label key={l} className="space-y-1">
                  <span className="text-[11px] uppercase text-muted-foreground">{l}</span>
                  <textarea
                    rows={2}
                    className={input}
                    value={a.practical.rules[l]}
                    onChange={(e) => setRule(l, e.target.value)}
                  />
                </label>
              ))}
            </div>
          </Section>
        </div>

        {/* Footer (always visible) */}
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border px-6 py-4">
          {saveError && <span className="mr-auto text-sm text-accent">{saveError}</span>}
          <button onClick={onClose} className="btn-base bg-secondary text-foreground">
            {t("admin.apt.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-base inline-flex items-center gap-2 bg-primary text-primary-foreground disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("admin.apt.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-accent">{title}</h3>
      {children}
    </section>
  );
}

/** Thumbnail that shows a placeholder if the image URL fails to load. */
function Thumb({ src, invalidLabel }: { src: string; invalidLabel: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <div className="grid aspect-[4/3] w-full place-items-center gap-1 bg-secondary text-center text-[10px] text-muted-foreground">
        <ImageOff className="h-5 w-5" />
        {invalidLabel}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      className="aspect-[4/3] w-full object-cover"
      onError={() => setBroken(true)}
    />
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="space-y-1">
      <span className="text-[11px] uppercase text-muted-foreground">{label}</span>
      <input
        type="number"
        step="any"
        className={input}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="space-y-1">
      <span className="text-[11px] uppercase text-muted-foreground">{label}</span>
      <input className={input} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
