import { describe, it, expect } from "vitest";
import {
  StockNotFoundError,
  InsufficientStockError,
  OrderNotFoundError,
  InvalidOrderStatusError,
  isValidOrderTransition,
} from "../errors";

describe("StockNotFoundError", () => {
  it("uses the generic message when productId is omitted", () => {
    const e = new StockNotFoundError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("StockNotFoundError");
    expect(e.message).toBe("Stock not found");
  });

  it("includes the productId when provided", () => {
    const e = new StockNotFoundError("p-1");
    expect(e.message).toBe("Stock not found for product: p-1");
  });
});

describe("InsufficientStockError", () => {
  it("includes available + requested quantities in the message", () => {
    const e = new InsufficientStockError("p-1", 2, 5);
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("InsufficientStockError");
    expect(e.message).toContain("p-1");
    expect(e.message).toContain("available 2");
    expect(e.message).toContain("requested 5");
  });
});

describe("OrderNotFoundError", () => {
  it("uses the generic message when id is omitted", () => {
    const e = new OrderNotFoundError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("OrderNotFoundError");
    expect(e.message).toBe("Order not found");
  });

  it("includes the order id when provided", () => {
    const e = new OrderNotFoundError("o-1");
    expect(e.message).toBe("Order not found: o-1");
  });
});

describe("InvalidOrderStatusError", () => {
  it("includes the from + to states in the message", () => {
    const e = new InvalidOrderStatusError("RECEIVED", "PENDING");
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("InvalidOrderStatusError");
    expect(e.message).toContain("RECEIVED");
    expect(e.message).toContain("PENDING");
  });
});

// Order state-machine — terminal states must reject any further transitions
// (ACH-027). PENDING is the only non-terminal state.
describe("isValidOrderTransition", () => {
  it("allows PENDING -> RECEIVED", () => {
    expect(isValidOrderTransition("PENDING", "RECEIVED")).toBe(true);
  });

  it("allows PENDING -> CANCELLED", () => {
    expect(isValidOrderTransition("PENDING", "CANCELLED")).toBe(true);
  });

  it("rejects PENDING -> PENDING (no self-loop)", () => {
    expect(isValidOrderTransition("PENDING", "PENDING")).toBe(false);
  });

  it("rejects RECEIVED -> anything (terminal state)", () => {
    expect(isValidOrderTransition("RECEIVED", "PENDING")).toBe(false);
    expect(isValidOrderTransition("RECEIVED", "CANCELLED")).toBe(false);
    expect(isValidOrderTransition("RECEIVED", "RECEIVED")).toBe(false);
  });

  it("rejects CANCELLED -> anything (terminal state)", () => {
    expect(isValidOrderTransition("CANCELLED", "PENDING")).toBe(false);
    expect(isValidOrderTransition("CANCELLED", "RECEIVED")).toBe(false);
    expect(isValidOrderTransition("CANCELLED", "CANCELLED")).toBe(false);
  });

  it("rejects unknown source states (defensive)", () => {
    expect(isValidOrderTransition("UNKNOWN", "RECEIVED")).toBe(false);
  });
});
