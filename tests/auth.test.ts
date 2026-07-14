import { describe, it, expect } from "vitest";
import { verifyPassword, createSessionCookie, requireOwner } from "../netlify/lib/auth";

const fakeReq = (method: string, headers: Record<string, string>): Request =>
  ({
    method,
    headers: { get: (k: string) => headers[k.toLowerCase()] ?? null },
  }) as unknown as Request;

function tokenFrom(setCookie: string): string {
  return setCookie.split(";")[0].split("=").slice(1).join("=");
}

describe("password auth", () => {
  it("verifies the configured password (constant-time)", () => {
    expect(verifyPassword("test-password-1234")).toBe(true);
    expect(verifyPassword("wrong")).toBe(false);
    expect(verifyPassword("")).toBe(false);
  });
});

describe("session cookie", () => {
  it("accepts a freshly issued session", async () => {
    const token = tokenFrom(createSessionCookie());
    const req = fakeReq("GET", { cookie: `inalpes_session=${token}` });
    await expect(requireOwner(req)).resolves.toMatchObject({ sub: "owner" });
  });

  it("rejects a tampered token", async () => {
    const token = tokenFrom(createSessionCookie());
    const req = fakeReq("GET", { cookie: `inalpes_session=${token}x` });
    await expect(requireOwner(req)).rejects.toBeTruthy();
  });

  it("rejects a missing session", async () => {
    await expect(requireOwner(fakeReq("GET", {}))).rejects.toBeTruthy();
  });
});
