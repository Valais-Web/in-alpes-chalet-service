import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import type { Review } from "@/content/reviews";

/**
 * Draggable, swipeable carousel of guest reviews. Shows 1 / 2 / 3 cards across
 * (mobile / tablet / desktop). Arrows + dots + keyboard, and it stays a plain
 * scrollable list before hydration.
 */
export function ReviewsCarousel({ reviews }: { reviews: Review[] }) {
  const { tx } = useI18n();
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps" });
  const [snaps, setSnaps] = useState<number[]>([]);
  const [selected, setSelected] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback((api: NonNullable<typeof emblaApi>) => {
    setSelected(api.selectedScrollSnap());
    setCanPrev(api.canScrollPrev());
    setCanNext(api.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    setSnaps(emblaApi.scrollSnapList());
    onSelect(emblaApi);
    const handler = () => onSelect(emblaApi);
    emblaApi.on("select", handler).on("reInit", handler);
    return () => {
      emblaApi.off("select", handler).off("reInit", handler);
    };
  }, [emblaApi, onSelect]);

  return (
    <div>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {reviews.map((r, i) => (
            <figure
              key={i}
              className="flex min-w-0 flex-[0_0_86%] flex-col border border-border bg-background p-6 sm:flex-[0_0_47%] lg:flex-[0_0_31.5%]"
            >
              <div className="flex items-center justify-between">
                <div className="flex text-foreground">
                  {[0, 1, 2, 3, 4].map((s) => (
                    <Star key={s} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <span className="text-xs font-medium text-muted-foreground">Airbnb</span>
              </div>
              <blockquote className="mt-4 line-clamp-6 text-sm leading-relaxed">
                « {tx(r.quote)} »
              </blockquote>
              <figcaption className="mt-4 pt-1 text-sm">
                <span className="font-[family-name:var(--font-display)] font-semibold">
                  {r.author}
                </span>
                <span className="text-muted-foreground"> · {tx(r.meta)}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5">
          {snaps.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Avis ${i + 1}`}
              aria-current={i === selected}
              onClick={() => emblaApi?.scrollTo(i)}
              className={
                "h-1.5 transition-all " +
                (i === selected ? "w-6 bg-foreground" : "w-1.5 bg-border hover:bg-muted-foreground")
              }
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canPrev}
            aria-label="Précédent"
            className="flex h-10 w-10 items-center justify-center border border-border text-foreground transition-colors hover:bg-foreground hover:text-background disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            disabled={!canNext}
            aria-label="Suivant"
            className="flex h-10 w-10 items-center justify-center border border-border text-foreground transition-colors hover:bg-foreground hover:text-background disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
