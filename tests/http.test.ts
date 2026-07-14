import { describe, it, expect } from "vitest";
import { honeypotTripped, requireSameOrigin, HttpError, HONEYPOT_FIELD } from "../netlify/lib/http";

const fakeReq = (method: string, headers: Record<string, string>): Request =>
  ({
    method,
    headers: { get: (k: string) => headers[k.toLowerCase()] ?? null },
  }) as unknown as Request;

describe("honeypotTripped", () => {
  it("is false when empty/absent", () => {
    expect(honeypotTripped({})).toBe(false);
    expect(honeypotTripped({ [HONEYPOT_FIELD]: "" })).toBe(false);
    expect(honeypotTripped(null)).toBe(false);
  });
  it("is true when the honeypot is filled", () => {
    expect(honeypotTripped({ [HONEYPOT_FIELD]: "Acme Inc" })).toBe(true);
  });
});

describe("requireSameOrigin", () => {
  it("allows GET regardless of origin", () => {
    expect(() =>
      requireSameOrigin(fakeReq("GET", { origin: "https://evil.com", host: "site.ch" })),
    ).not.toThrow();
  });
  it("allows a same-origin POST", () => {
    expect(() =>
      requireSameOrigin(fakeReq("POST", { origin: "https://site.ch", host: "site.ch" })),
    ).not.toThrow();
  });
  it("allows a POST with no Origin header (non-browser client)", () => {
    expect(() => requireSameOrigin(fakeReq("POST", { host: "site.ch" }))).not.toThrow();
  });
  it("rejects a cross-origin POST", () => {
    expect(() =>
      requireSameOrigin(fakeReq("POST", { origin: "https://evil.com", host: "site.ch" })),
    ).toThrow(HttpError);
  });
});
