import { describe, it, expect, vi } from "vitest";

// Resend resolves API failures as { data: null, error } instead of rejecting.
const send = vi.fn();
vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));

vi.stubEnv("RESEND_API_KEY", "re_test");
const { sendContactEmail } = await import("../netlify/lib/email");

describe("email delivery", () => {
  const msg = { name: "A", email: "a@b.com", message: "Bonjour" };

  it("throws when Resend returns an error result", async () => {
    send.mockResolvedValueOnce({
      data: null,
      error: { name: "validation_error", message: "domain not verified" },
    });
    await expect(sendContactEmail(msg)).rejects.toThrow(/resend_failed/);
  });

  it("resolves when Resend accepts the message", async () => {
    send.mockResolvedValueOnce({ data: { id: "x" }, error: null });
    await expect(sendContactEmail(msg)).resolves.toBeUndefined();
  });
});
