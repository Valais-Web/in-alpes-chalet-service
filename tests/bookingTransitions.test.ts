import { describe, it, expect } from "vitest";
import { resolveDecision } from "../netlify/lib/bookingTransitions";

describe("resolveDecision", () => {
  it("books whenever the target is accepted (idempotent, repairs a missing range)", () => {
    expect(resolveDecision("pending", "accepted")).toEqual({ op: "book" });
    expect(resolveDecision("declined", "accepted")).toEqual({ op: "book" });
    expect(resolveDecision("accepted", "accepted")).toEqual({ op: "book" });
    // accept → archive → confirm must not be blind to the existing range
    expect(resolveDecision("archived", "accepted")).toEqual({ op: "book" });
  });

  it("unbooks whenever the target is declined, whatever the current status", () => {
    expect(resolveDecision("pending", "declined")).toEqual({ op: "unbook" });
    expect(resolveDecision("accepted", "declined")).toEqual({ op: "unbook" });
    // accept → archive → decline must still free the confirmed range
    expect(resolveDecision("archived", "declined")).toEqual({ op: "unbook" });
  });

  it("never touches the calendar when archiving", () => {
    expect(resolveDecision("pending", "archived")).toEqual({ op: "none" });
    expect(resolveDecision("accepted", "archived")).toEqual({ op: "none" });
    expect(resolveDecision("declined", "archived")).toEqual({ op: "none" });
  });

  it("rejects moving a request back to pending", () => {
    expect(resolveDecision("pending", "pending")).toEqual({ op: "none" });
    expect(resolveDecision("accepted", "pending")).toBeNull();
    expect(resolveDecision("declined", "pending")).toBeNull();
    expect(resolveDecision("archived", "pending")).toBeNull();
  });
});
