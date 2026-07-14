/**
 * Netlify Blobs access. The public site reads these JSON documents; Neon is
 * never on the public read path (CLAUDE.md §3).
 *
 * On Netlify, the store auto-configures. Off-platform (or when blobs env vars
 * are missing) we fall back to a process-local Map so `netlify dev` and unit
 * runs keep working — the same read/write API, no crashes.
 *
 * The in-memory fallback is a DEV convenience ONLY. In production a Blob error
 * is rethrown: a serverless isolate's memory is not shared with the read path,
 * so silently "succeeding" into memory would report a publish as done while the
 * durable document stays stale. Failures must surface (CLAUDE.md §3, §7).
 */
import { getStore } from "@netlify/blobs";
import { env, flags, isProduction } from "./env";

const STORE_NAME = "content";

// Process-local fallback store (survives within a single running process only).
const memory = new Map<string, unknown>();

function store() {
  // Explicit config when env vars are present (edge / manual). On Netlify the
  // no-arg form is auto-wired, so we only pass config when we actually have it.
  if (flags.hasBlobs) {
    return getStore({
      name: STORE_NAME,
      siteID: env.NETLIFY_BLOBS_SITE_ID,
      token: env.NETLIFY_BLOBS_TOKEN,
    });
  }
  return getStore(STORE_NAME);
}

export async function putJson(key: string, data: unknown): Promise<void> {
  try {
    await store().setJSON(key, data);
  } catch (err) {
    if (isProduction) throw err; // a real publish failure must not look like success
    console.warn(`[blobs] setJSON(${key}) fell back to memory (dev):`, (err as Error).message);
    memory.set(key, data);
  }
}

export async function getJson<T>(key: string): Promise<T | null> {
  try {
    const value = await store().get(key, { type: "json" });
    return (value as T) ?? null;
  } catch (err) {
    if (isProduction) throw err; // surface a Blob outage rather than serve empty memory
    console.warn(`[blobs] get(${key}) fell back to memory (dev):`, (err as Error).message);
    return (memory.get(key) as T) ?? null;
  }
}
