import { describe, it, expect } from "vitest";
import {
  InsufficientLoyaltyBalanceError,
  LoyaltyAccountNotFoundError,
} from "../errors";

describe("InsufficientLoyaltyBalanceError", () => {
  it("exposes available + requested as readonly fields", () => {
    const e = new InsufficientLoyaltyBalanceError(10, 25);
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("InsufficientLoyaltyBalanceError");
    // Public fields are how the UI shows the gap to the consultant.
    expect(e.available).toBe(10);
    expect(e.requested).toBe(25);
    expect(e.message).toContain("available 10");
    expect(e.message).toContain("requested 25");
  });
});

describe("LoyaltyAccountNotFoundError", () => {
  it("exposes clientId and includes it in the message", () => {
    const e = new LoyaltyAccountNotFoundError("c-1");
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("LoyaltyAccountNotFoundError");
    expect(e.clientId).toBe("c-1");
    expect(e.message).toBe("Loyalty account not found for client c-1");
  });
});
