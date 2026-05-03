import { describe, it, expect } from "vitest";
import { DeliveryNotFoundError, InvalidStatusTransitionError } from "../errors";

describe("DeliveryNotFoundError", () => {
  it("includes the delivery id in the message", () => {
    const e = new DeliveryNotFoundError("d-1");
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("DeliveryNotFoundError");
    expect(e.message).toBe("Delivery not found: d-1");
  });
});

describe("InvalidStatusTransitionError", () => {
  it("includes the from + to states in the message", () => {
    const e = new InvalidStatusTransitionError("DELIVERED", "PENDING");
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("InvalidStatusTransitionError");
    expect(e.message).toBe(
      "Cannot transition delivery from DELIVERED to PENDING",
    );
  });
});
