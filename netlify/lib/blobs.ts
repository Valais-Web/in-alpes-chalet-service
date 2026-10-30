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

/**
 * Publish a snapshot computed by `produce` without ever letting an OLDER
 * snapshot overwrite a newer one. Two publishes can overlap (an admin edit and
 * the scheduled sync, say); a plain set would let the slower one — read from
 * the database first — land last. Compare-and-swap instead: note the
 * document's ETag, THEN read the data, and write only if the ETag is still
 * the same. If another writer got in between, re-read and try again. Each
 * successful write therefore read the database after the previous one did,
 * so the last write always carries the newest data.
 */
export async function putJsonFresh(key: string, produce: () => Promise<unknown>): Promise<void> {
  try {
    const s = store();
    for (let attempt = 0; attempt < 6; attempt++) {
      // Strong reads see the latest ETag; a stale (eventual) one can only make
      // the conditional write fail and retry, never overwrite newer data.
      const current = await s
        .getMetadata(key, { consistency: "strong" })
        .catch(() => s.getMetadata(key));
      const data = await produce();
      const { modified } = current?.etag
        ? await s.setJSON(key, data, { onlyIfMatch: current.etag })
        : await s.setJSON(key, data, { onlyIfNew: true });
      if (modified) return;
      await new Promise((r) => setTimeout(r, 100 * (attempt + 1)));
    }
    throw new Error(`blobs_write_contended: ${key}`);
  } catch (err) {
    if (isProduction) throw err;
    console.warn(`[blobs] putJsonFresh(${key}) fell back to memory (dev):`, (err as Error).message);
    memory.set(key, await produce());
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
