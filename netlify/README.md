# Backend — Netlify Functions

TypeScript backend for In-Alpes, per `CLAUDE.md`. Neon is the source of truth,
written only here and by the admin; the public site reads published JSON from
Netlify Blobs and **never queries Neon** (§3).

## Layout

```
netlify/
  functions/        HTTP endpoints (Netlify Functions v2, web Request/Response)
    submit-booking.ts     POST /api/submit-booking            (public)
    content.ts            GET  /api/content?type=…            (public read)
    admin-login.ts        POST /api/admin/login | /logout
    admin-apartments.ts   GET/POST/DELETE /api/admin/apartments
    admin-availability.ts GET/POST/DELETE /api/admin/availability
    admin-requests.ts     GET/PATCH /api/admin/requests
    sign-upload.ts        POST /api/admin/sign-upload         (Cloudinary sig)
  lib/              shared modules (env, db, blobs, publish, email, cloudinary, auth, http, validation, types)
db/
  schema.sql        Neon schema        (psql "$NEON_DATABASE_URL" -f db/schema.sql)
  seed.mjs          demo seed          (NEON_DATABASE_URL=… node db/seed.mjs)
```

## Dev-fallback mode (zero config)

Every service degrades gracefully when its env vars are absent (see `lib/env.ts`),
so the whole backend runs locally with nothing configured:

| Service   | Configured                  | Missing (fallback)                |
| --------- | --------------------------- | --------------------------------- |
| Neon      | `NEON_DATABASE_URL`         | in-memory store seeded from JSON  |
| Blobs     | `NETLIFY_BLOBS_*` / Netlify | in-process Map                    |
| Resend    | `RESEND_API_KEY`            | emails logged to console          |
| Cloudinary| `CLOUDINARY_*`              | `sign-upload` returns 503         |
| Auth      | `ADMIN_PASSWORD`+`SESSION_SECRET` / Neon Auth | fails **closed** (401) unless `ALLOW_DEV_OPEN_AUTH=1` in non-prod |

Auth is the one service that does **not** silently fall open: with no secret
configured, admin writes return 401. To work on the admin locally without auth
you must explicitly set `ALLOW_DEV_OPEN_AUTH=1`, and even then it is refused in
any production/Netlify context.

The frontend uses the live backend only when built with `VITE_API_MODE=live`;
otherwise `src/data/api.ts` stays on its own in-memory stubs.

Run the backend smoke test (in-fallback): `npx tsx scripts/smoke.mts`.

## Booking flow (`submit-booking`)

Validate (Zod) → insert request (`new`) → lay a 48h pre-reservation
(`prebooked`, `expires_at = now + PREBOOKING_TTL_HOURS`) → republish
`availability.json` → email owner + guest. The guest email is explicitly a
**request, not a confirmation** (§13). A hold only becomes `booked` when the
owner confirms in the admin.

## Security

- Every admin write/upload calls `requireOwner(req)` server-side (§6).
- Cloudinary secret never leaves the server: the browser gets a short-lived
  signature and uploads directly; Neon stores only the URL.
- `lib/auth.ts` has a `verifyNeonAuthSession` seam where Neon Auth (Better Auth)
  plugs in; until then a signed-cookie password login is the fallback. Real auth
  is a launch blocker (§11.3).

## ⚠️ Deployment note — SSR target

The Lovable/nitro scaffold currently builds the SSR site for **Cloudflare**
(`vite build` emits `wrangler.json`). `CLAUDE.md` §2 locks hosting to **Netlify**
(Functions + Blobs), which these functions assume. Before launch, repoint the
nitro preset to Netlify so the SSR app and these functions deploy together on
one platform. This is an infra decision flagged for the owner — code is
otherwise platform-agnostic (web-standard Request/Response).
