/**
 * Best-effort, serverless-friendly rate limiting.
 *
 * State lives in a Netlify Blobs store (shared across isolates) with an in-process
 * mirror as a dev/edge fallback. It is a fixed-window counter, not a strongly
 * consistent limiter (no compare-and-set), so under heavy concurrency a few extra
 * requests can slip through — enough to blunt password brute-forcing and form
 * flooding without a heavyweight dependency. Fails OPEN: if the store is
 * unreachable we never lock a legitimate user out.
 */
import { getStore } from "@netlify/blobs";
import { env, flags } from "./env";

const STORE_NAME = "ratelimit";
const memory = new Map<string, Rec>();

interface Rec {
  count: number;
  firstAt: number; // epoch ms of the window start
}

export interface RateResult {
  limited: boolean;
  retryAfterSec: number;
}

function store() {
  if (flags.hasBlobs) {
    return getStore({
      name: STORE_NAME,
      siteID: env.NETLIFY_BLOBS_SITE_ID,
      token: env.NETLIFY_BLOBS_TOKEN,
    });
  }
  return getStore(STORE_NAME);
}

async function read(key: string): Promise<Rec | null> {
  try {
    const v = (await store().get(key, { type: "json" })) as Rec | null;
    return v ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null; // fail open
  }
}

async function write(key: string, rec: Rec): Promise<void> {
  memory.set(key, rec);
  try {
    await store().setJSON(key, rec);
  } catch {
    /* best-effort */
  }
}

/** Count one hit against `key`. Returns limited=true once `max` hits occur
 * inside a rolling `windowSec` window. */
export async function hitRateLimit(
  key: string,
  opts: { max: number; windowSec: number },
): Promise<RateResult> {
  const now = Date.now();
  const rec = await read(key);
  if (rec && now - rec.firstAt < opts.windowSec * 1000) {
    if (rec.count >= opts.max) {
      return {
        limited: true,
        retryAfterSec: Math.ceil((opts.windowSec * 1000 - (now - rec.firstAt)) / 1000),
      };
    }
    await write(key, { count: rec.count + 1, firstAt: rec.firstAt });
    return { limited: false, retryAfterSec: 0 };
  }
  await write(key, { count: 1, firstAt: now });
  return { limited: false, retryAfterSec: 0 };
}

/** Clear a key's counter (e.g. after a successful login). */
export async function resetRateLimit(key: string): Promise<void> {
  memory.delete(key);
  try {
    await store().delete(key);
  } catch {
    /* best-effort */
  }
}

/** Best-guess client IP from Netlify / proxy headers. */
export function clientIp(req: Request): string {
  return (
    req.headers.get("x-nf-client-connection-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
