import { describe, it, expect, vi } from "vitest";

// A fake Netlify Blobs store with real ETag / conditional-write semantics.
const docs = new Map<string, { etag: string; data: unknown }>();
let version = 0;
const fakeStore = {
  async getMetadata(key: string) {
    const d = docs.get(key);
    return d ? { etag: d.etag, metadata: {} } : null;
  },
  async setJSON(
    key: string,
    data: unknown,
    opts: { onlyIfMatch?: string; onlyIfNew?: boolean } = {},
  ) {
    const cur = docs.get(key);
    if (opts.onlyIfNew && cur) return { modified: false };
    if (opts.onlyIfMatch && cur?.etag !== opts.onlyIfMatch) return { modified: false };
    docs.set(key, { etag: `e${++version}`, data });
    return { modified: true, etag: `e${version}` };
  },
};
vi.mock("@netlify/blobs", () => ({ getStore: () => fakeStore }));

const { putJsonFresh } = await import("../netlify/lib/blobs");

describe("putJsonFresh", () => {
  it("never lets an older snapshot overwrite a newer one", async () => {
    let db = ["A"];
    await putJsonFresh("availability.json", async () => [...db]);

    // Publish #1 reads the database, then stalls; meanwhile the data changes
    // and publish #2 completes. #1's stale write must not land.
    const slow = putJsonFresh("availability.json", async () => {
      const snapshot = [...db];
      if (snapshot.length === 1) {
        db = ["A", "B"];
        await putJsonFresh("availability.json", async () => [...db]);
      }
      return snapshot;
    });
    await slow;
    expect(docs.get("availability.json")?.data).toEqual(["A", "B"]);
  });
});
