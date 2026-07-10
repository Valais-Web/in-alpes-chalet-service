import { Star } from "lucide-react";
import { AIRBNB_LOGO } from "@/content/media";

/**
 * Aggregate rating chip with the official Airbnb wordmark, so the score reads
 * as verified Airbnb reviews. `onDark` is the glassy variant used over the hero
 * photo; the default is the bordered light chip used in review sections.
 */
export function AirbnbRating({
  rating,
  count,
  label,
  onDark = false,
  className = "",
}: {
  rating: string; // already formatted for the locale, e.g. "4,95"
  count: number;
  label: string; // localized word, e.g. "avis"
  onDark?: boolean;
  className?: string;
}) {
  return (
    <div
      className={
        "inline-flex w-fit items-center gap-2.5 border px-3.5 py-2 " +
        (onDark
          ? "border-white/25 bg-white/10 text-white backdrop-blur-sm "
          : "border-border bg-background text-foreground ") +
        className
      }
    >
      <div className="flex">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-current" />
        ))}
      </div>
      <span className="text-sm font-medium tabular-nums">
        {rating}/5 · {count} {label}
      </span>
      <span className={"h-4 w-px " + (onDark ? "bg-white/30" : "bg-border")} aria-hidden />
      <img
        src={AIRBNB_LOGO}
        alt="Airbnb"
        width={62}
        height={20}
        className="h-[15px] w-auto"
        loading="lazy"
      />
    </div>
  );
}
