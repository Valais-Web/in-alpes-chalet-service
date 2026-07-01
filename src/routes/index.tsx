import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Star, ArrowRight, Sparkles, Home, MapPin } from "lucide-react";
import { listApartments } from "@/data/api";
import { useI18n } from "@/i18n/I18nProvider";
import { ApartmentCard } from "@/components/site/ApartmentCard";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  component: Home_,
});

function Home_() {
  const { t } = useI18n();
  const { data: apartments = [] } = useQuery({ queryKey: ["apartments"], queryFn: listApartments });

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="Chalet alpin à Haute-Nendaz au coucher du soleil" width={1600} height={1024} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background" />
        </div>
        <div className="container-page relative flex min-h-[78vh] flex-col justify-end pb-16 pt-24">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs backdrop-blur">
            <MapPin className="h-3.5 w-3.5 text-accent" /> {t("hero.eyebrow")}
          </span>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.05] md:text-6xl">
            {t("hero.title")}
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
            {t("hero.subtitle")}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link to="/apartments" className="btn-base bg-primary text-primary-foreground hover:bg-foreground/90">
              <Home className="h-4 w-4" /> {t("hero.cta.rent")}
            </Link>
            <Link to="/services" className="btn-base bg-accent text-accent-foreground hover:opacity-90">
              <Sparkles className="h-4 w-4" /> {t("hero.cta.manage")}
            </Link>
          </div>
          <div className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex text-accent">
              {[0,1,2,3,4].map(i => <Star key={i} className="h-4 w-4 fill-current" />)}
            </div>
            <span className="font-medium text-foreground">{t("hero.proof")}</span>
          </div>
        </div>
      </section>

      {/* APARTMENTS */}
      <section className="container-page mt-20">
        <SectionHeader title={t("home.apartments.title")} sub={t("home.apartments.sub")} action={
          <Link to="/apartments" className="text-sm text-accent hover:underline">{t("cta.viewAll")} →</Link>
        } />
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {apartments.map((a) => <ApartmentCard key={a.id} apartment={a} />)}
        </div>
      </section>

      {/* SERVICES PREVIEW */}
      <section className="container-page mt-24">
        <SectionHeader title={t("home.services.title")} sub={t("home.services.sub")} action={
          <Link to="/services" className="text-sm text-accent hover:underline">{t("cta.discover")} →</Link>
        } />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {["rental","cleaning","laundry","snow"].map((k) => (
            <div key={k} className="card-soft p-5">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-accent/10 text-accent">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="mt-3 text-sm font-semibold">{t(`svc.${k}.title`)}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{t(`svc.${k}.body`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* REVIEWS */}
      <section className="container-page mt-24">
        <SectionHeader title={t("home.reviews.title")} sub={t("hero.proof")} />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { name: "Camille R.", body: "Chalet magnifique, accueil impeccable. On reviendra !" },
            { name: "Jasper V.", body: "Perfect location, spotless apartment, super responsive team." },
            { name: "Lieke D.", body: "Prachtig chalet met adembenemend uitzicht. Zeker een aanrader." },
          ].map((r) => (
            <figure key={r.name} className="card-soft p-6">
              <div className="flex text-accent">
                {[0,1,2,3,4].map(i => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <blockquote className="mt-3 text-sm">{r.body}</blockquote>
              <figcaption className="mt-3 text-xs text-muted-foreground">— {r.name}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* OFFER BANNER */}
      <section className="container-page mt-24">
        <div className="rounded-3xl bg-foreground p-8 text-background md:p-12">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                <Sparkles className="h-3.5 w-3.5" /> Offre
              </div>
              <h2 className="mt-3 text-2xl font-semibold md:text-3xl">{t("home.offer.title")}</h2>
              <p className="mt-2 max-w-lg text-sm text-background/70">{t("home.offer.sub")}</p>
            </div>
            <Link to="/apartments" className="btn-base bg-background text-foreground hover:bg-background/90">
              {t("cta.viewAll")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ABOUT + CONTACT */}
      <section className="container-page mt-24 grid gap-8 md:grid-cols-2">
        <div className="card-soft p-8">
          <h2 className="text-2xl font-semibold">{t("home.about.title")}</h2>
          <p className="mt-3 text-sm text-muted-foreground">{t("home.about.body")}</p>
        </div>
        <div className="card-soft bg-accent p-8 text-accent-foreground">
          <h2 className="text-2xl font-semibold">{t("home.contact.title")}</h2>
          <p className="mt-3 text-sm opacity-90">{t("home.contact.sub")}</p>
          <Link to="/contact" className="mt-6 inline-flex btn-base bg-background text-foreground">
            {t("nav.contact")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold md:text-3xl">{title}</h2>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
