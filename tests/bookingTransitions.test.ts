import { describe, it, expect } from "vitest";
import { resolveDecision } from "../netlify/lib/bookingTransitions";

describe("resolveDecision", () => {
  it("books when accepting a pending or reopening a declined request", () => {
    expect(resolveDecision("pending", "accepted")).toEqual({ op: "book" });
    expect(resolveDecision("declined", "accepted")).toEqual({ op: "book" });
  });

  it("releases the soft hold when declining a pending request", () => {
    expect(resolveDecision("pending", "declined")).toEqual({ op: "release_hold" });
  });

  it("unbooks (reverses) when declining an already-accepted request", () => {
    expect(resolveDecision("accepted", "declined")).toEqual({ op: "unbook" });
  });

  it("treats re-confirming an accepted request as an idempotent no-op", () => {
    expect(resolveDecision("accepted", "accepted")).toEqual({ op: "none" });
  });

  it("never touches the calendar when archiving", () => {
    expect(resolveDecision("pending", "archived")).toEqual({ op: "none" });
    expect(resolveDecision("accepted", "archived")).toEqual({ op: "none" });
    expect(resolveDecision("declined", "archived")).toEqual({ op: "none" });
  });

  it("rejects moving a request back to pending", () => {
    expect(resolveDecision("accepted", "pending")).toBeNull();
    expect(resolveDecision("declined", "pending")).toBeNull();
    expect(resolveDecision("archived", "pending")).toBeNull();
  });
});
