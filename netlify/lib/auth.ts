/**
 * Owner authentication — the server-side security boundary. CLAUDE.md §6:
 * "Vérifier la session côté serveur sur chaque écriture et chaque upload."
 *
 * A single shared password (ADMIN_PASSWORD) issued as a self-contained HMAC
 * session cookie (SESSION_SECRET). No third-party auth: the site has one admin
 * (Bart), 1-2 at most — CLAUDE.md §2 chose this over Neon Auth.
 *
 * If no password is configured, auth fails CLOSED (401). A missing secret can
 * never silently open the admin. For local admin work without auth you must opt
 * in explicitly with ALLOW_DEV_OPEN_AUTH=1, which is additionally refused in any
 * production/deployed context.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { env, flags, allowDevOpenAuth } from "./env";
import { HttpError } from "./http";

const COOKIE = "inalpes_session";
const MAX_AGE_SEC = 60 * 60 * 12; // 12h

export interface Session {
  sub: string; // "owner"
  exp: number; // epoch seconds
}

function b64url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string): string {
  return createHmac("sha256", env.SESSION_SECRET).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

// --- password login ---------------------------------------------------------

export function verifyPassword(password: string): boolean {
  if (!flags.hasPasswordAuth) return false;
  return safeEqual(password, env.ADMIN_PASSWORD);
}

export function createSessionCookie(): string {
  const session: Session = { sub: "owner", exp: Math.floor(Date.now() / 1000) + MAX_AGE_SEC };
  const payload = b64url(JSON.stringify(session));
  const token = `${payload}.${sign(payload)}`;
  return `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAX_AGE_SEC}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

function verifyCookieSession(req: Request): Session | null {
  if (!flags.hasPasswordAuth) return null;
  const token = readCookie(req, COOKIE);
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || !safeEqual(sig, sign(payload))) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    if (session.exp < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

// --- guard ------------------------------------------------------------------

/** Throws 401 unless the request carries a valid owner session. */
export async function requireOwner(req: Request): Promise<Session> {
  const viaCookie = verifyCookieSession(req);
  if (viaCookie) return viaCookie;

  // Fail CLOSED by default. The open-admin fallback is reachable only with an
  // explicit ALLOW_DEV_OPEN_AUTH=1 opt-in AND outside any production context, so
  // a missing secret can never silently disable authentication (CLAUDE.md §11.3).
  if (!flags.hasPasswordAuth && allowDevOpenAuth) {
    console.warn(
      "[auth] DEV-OPEN: admin write allowed WITHOUT authentication " +
        "(ALLOW_DEV_OPEN_AUTH=1, non-production only). Never enable this in production.",
    );
    return { sub: "owner", exp: Math.floor(Date.now() / 1000) + MAX_AGE_SEC };
  }

  throw new HttpError(401, "unauthorized");
}
