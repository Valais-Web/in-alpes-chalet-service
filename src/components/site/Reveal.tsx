import { useEffect, useRef, type ReactNode } from "react";

/**
 * Fades + rises its children into view the first time they're scrolled to.
 *
 * Progressive-enhancement by design: the server-rendered markup is fully
 * visible. Only after mount, and only for elements that are actually below the
 * fold, do we hide-then-reveal, so there's no flash, nothing is hidden without
 * JS, and reduced-motion users get the content immediately.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver === "undefined") return;

    // Already in (or near) view on mount → leave it be, no animation, no flash.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    if (delay) el.style.transitionDelay = `${delay}ms`;
    el.setAttribute("data-reveal", "");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.setAttribute("data-reveal", "in");
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
