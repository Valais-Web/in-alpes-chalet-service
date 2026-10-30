/**
 * The editorial system shared by every public page: one heading scale, one
 * vertical rhythm, one lead style, one photo grade. Pages compose these
 * instead of restyling headings one by one.
 */

/** Page title (one per page). */
export const H1 = "text-[clamp(2.6rem,6vw,5.2rem)] font-medium leading-[0.98] tracking-[-0.03em]";
/** Section heading, same size on every page (footer included). */
export const H2 = "text-[clamp(2.3rem,4.2vw,3.6rem)] font-medium leading-[1.02] tracking-[-0.03em]";
/** Sub-heading inside a section. */
export const H3 = "font-[family-name:var(--font-display)] text-xl font-medium tracking-[-0.01em]";
/** One vertical rhythm for every section. */
export const SECTION = "py-24 md:py-32";
/** Running text one step above body size. */
export const LEAD = "text-[17px] leading-relaxed text-foreground/80";

/** One shared grade for the owner's phone photos: auto levels, then a touch
 * less saturation so sky and lamp light sit together. Cloudinary URLs only. */
export const grade = (url: string) =>
  url.replace(/\/upload\//g, "/upload/e_improve,e_saturation:-18/");
