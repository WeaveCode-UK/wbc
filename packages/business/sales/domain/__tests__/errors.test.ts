import { describe, it, expect } from "vitest";
import {
  SaleNotFoundError,
  InvalidSaleStatusError,
  PaymentNotFoundError,
  InvalidPaymentTransitionError,
  InsufficientCashbackError,
  RefundExceedsSaleTotalError,
  SaleNotRefundableError,
  InvalidRefundAmountError,
} from "../errors";

describe("SaleNotFoundError", () => {
  it("uses the generic message when id is omitted", () => {
    const e = new SaleNotFoundError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("SaleNotFoundError");
    expect(e.message).toBe("Sale not found");
  });

  it("includes the sale id when provided", () => {
    const e = new SaleNotFoundError("s-1");
    expect(e.message).toBe("Sale not found: s-1");
  });
});

describe("InvalidSaleStatusError", () => {
  it("includes the from + to states in the message", () => {
    const e = new InvalidSaleStatusError("DRAFT", "SHIPPED");
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("InvalidSaleStatusError");
    expect(e.message).toBe("Cannot transition from DRAFT to SHIPPED");
  });
});

describe("PaymentNotFoundError", () => {
  it("has the expected name and message", () => {
    const e = new PaymentNotFoundError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("PaymentNotFoundError");
    expect(e.message).toBe("Payment not found");
  });
});

describe("InvalidPaymentTransitionError", () => {
  it("forwards a caller-provided message verbatim", () => {
    const e = new InvalidPaymentTransitionError("PAID -> PENDING not allowed");
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("InvalidPaymentTransitionError");
    expect(e.message).toBe("PAID -> PENDING not allowed");
  });
});

describe("InsufficientCashbackError", () => {
  it("has the expected name and message", () => {
    const e = new InsufficientCashbackError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("InsufficientCashbackError");
    expect(e.message).toBe("Insufficient cashback balance");
  });
});

describe("RefundExceedsSaleTotalError", () => {
  it("includes requested + alreadyRefunded + saleTotal in the message", () => {
    const e = new RefundExceedsSaleTotalError(50, 30, 70);
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("RefundExceedsSaleTotalError");
    expect(e.message).toContain("requested 50");
    expect(e.message).toContain("already refunded 30");
    expect(e.message).toContain("sale total 70");
  });
});

describe("SaleNotRefundableError", () => {
  it("includes the offending sale status", () => {
    const e = new SaleNotRefundableError("CANCELLED");
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("SaleNotRefundableError");
    expect(e.message).toBe("Sale in status CANCELLED cannot be refunded");
  });
});

describe("InvalidRefundAmountError", () => {
  it("has the expected name and message", () => {
    const e = new InvalidRefundAmountError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("InvalidRefundAmountError");
    expect(e.message).toBe("Refund amount must be greater than zero");
  });
});
