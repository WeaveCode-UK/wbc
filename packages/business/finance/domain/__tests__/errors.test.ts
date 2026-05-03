import { describe, it, expect } from "vitest";
import { ExpenseNotFoundError } from "../errors";

describe("ExpenseNotFoundError", () => {
  it("uses the generic message when id is omitted", () => {
    const e = new ExpenseNotFoundError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("ExpenseNotFoundError");
    expect(e.message).toBe("Expense not found");
  });

  it("includes the expense id when provided", () => {
    const e = new ExpenseNotFoundError("exp-1");
    expect(e.message).toBe("Expense not found: exp-1");
  });
});
