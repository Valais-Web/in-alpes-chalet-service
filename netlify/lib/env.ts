/**
 * Environment access + capability flags.
 *
 * The whole backend is designed to run in a "dev fallback" mode: when a
 * service's credentials are absent, the corresponding module degrades to an
 * in-memory / no-op implementation instead of throwing. This lets the site run
 * locally with zero configuration while the exact same code path lights up in
 * production once the env vars are set (see .env.example).
 */

export const env = {
  NEON_DATABASE_URL: process.env.NEON_DATABASE_URL ?? "",

  // Netlify Blobs — usually auto-injected on Netlify. For manual/edge use:
  NETLIFY_BLOBS_SITE_ID: process.env.NETLIFY_BLOBS_SITE_ID ?? process.env.NETLIFY_SITE_ID ?? "",
  NETLIFY_BLOBS_TOKEN: process.env.NETLIFY_BLOBS_TOKEN ?? process.env.NETLIFY_API_TOKEN ?? "",

  // Resend
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
  EMAIL_FROM: process.env.EMAIL_FROM ?? "In-Alpes <info@in-alpes.ch>",
  OWNER_NOTIFICATION_EMAIL: process.env.OWNER_NOTIFICATION_EMAIL ?? "info@in-alpes.ch",

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ?? "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ?? "",
  CLOUDINARY_UPLOAD_FOLDER: process.env.CLOUDINARY_UPLOAD_FOLDER ?? "in-alpes/apartments",

  // Owner auth. In production this is delegated to Neon Auth (Better Auth);
  // ADMIN_PASSWORD + SESSION_SECRET provide a self-contained fallback so the
  // admin is usable before Neon Auth is wired.
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? "",
  SESSION_SECRET: process.env.SESSION_SECRET ?? "",

  SITE_URL: process.env.SITE_URL ?? process.env.URL ?? "http://localhost:8080",

  // Runtime context — used to make the open-admin fallback impossible in prod.
  NODE_ENV: process.env.NODE_ENV ?? "",
  NETLIFY_CONTEXT: process.env.CONTEXT ?? "", // "production" | "deploy-preview" | "branch-deploy"
  ON_NETLIFY: process.env.NETLIFY === "true",
  // Explicit, deliberate opt-in required to ever run the admin without auth.
  ALLOW_DEV_OPEN_AUTH: process.env.ALLOW_DEV_OPEN_AUTH === "1",

  // How long a public pre-reservation (soft hold) survives before the client
  // treats it as free again. 48h per CLAUDE.md §5.
  PREBOOKING_TTL_HOURS: Number(process.env.PREBOOKING_TTL_HOURS ?? "48"),
} as const;

export const flags = {
  hasNeon: Boolean(env.NEON_DATABASE_URL),
  hasResend: Boolean(env.RESEND_API_KEY),
  hasBlobs: Boolean(env.NETLIFY_BLOBS_SITE_ID && env.NETLIFY_BLOBS_TOKEN),
  hasCloudinary: Boolean(
    env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
  ),
  hasPasswordAuth: Boolean(env.ADMIN_PASSWORD && env.SESSION_SECRET),
} as const;

/** True in any deployed/production context — never fail auth open here. */
export const isProduction =
  env.NODE_ENV === "production" || env.NETLIFY_CONTEXT === "production" || env.ON_NETLIFY;

/**
 * The open-admin fallback is allowed ONLY when explicitly opted in AND not in a
 * production/deployed context. A missing secret can therefore never silently
 * disable authentication.
 */
export const allowDevOpenAuth = env.ALLOW_DEV_OPEN_AUTH && !isProduction;

/** Log the active runtime mode once, at cold start, to aid debugging. */
export function logMode(): void {
  console.info("[in-alpes] backend mode:", {
    db: flags.hasNeon ? "neon" : "in-memory",
    email: flags.hasResend ? "resend" : "console",
    blobs: flags.hasBlobs ? "netlify" : "in-process",
    images: flags.hasCloudinary ? "cloudinary" : "disabled",
    auth: flags.hasPasswordAuth ? "password" : "dev-open",
  });
}
