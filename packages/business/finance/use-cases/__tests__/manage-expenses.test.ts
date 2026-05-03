// T-coverage — expense CRUD
//
// Update + delete gate the destructive call on a tenant-scoped findById,
// throwing ExpenseNotFoundError otherwise. We also assert listExpenses
// + createExpense forward args verbatim — tenant scoping is enforced
// at the repo layer.
import { describe, it, expect, vi } from "vitest";
import {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../manage-expenses";
import { ExpenseNotFoundError } from "../../domain/errors";
import type { ExpenseRepository } from "../../ports/expense-repository";
import type { Expense } from "../../domain/entities";

function fakeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: "e1",
    tenantId: "t1",
    description: "Travel",
    amount: 100,
    category: "TRAVEL",
    date: new Date("2026-05-01"),
    createdAt: new Date("2026-05-01"),
    ...overrides,
  };
}

function repoMock(
  overrides: Partial<ExpenseRepository> = {},
): ExpenseRepository {
  return {
    findById: vi.fn().mockResolvedValue(fakeExpense()),
    list: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    create: vi
      .fn()
      .mockImplementation((data) => Promise.resolve(fakeExpense(data))),
    update: vi
      .fn()
      .mockImplementation((_t, id, data) =>
        Promise.resolve({ ...fakeExpense(), id, ...data }),
      ),
    delete: vi.fn().mockResolvedValue(undefined),
    getTotalByPeriod: vi.fn().mockResolvedValue(0),
    ...overrides,
  };
}

describe("listExpenses", () => {
  it("forwards tenantId + filters verbatim", async () => {
    const repo = repoMock();
    await listExpenses("t1", { category: "TRAVEL", page: 2, limit: 25 }, repo);
    expect(repo.list).toHaveBeenCalledWith("t1", {
      category: "TRAVEL",
      page: 2,
      limit: 25,
    });
  });
});

describe("createExpense", () => {
  it("delegates to repo.create with full payload", async () => {
    const repo = repoMock();
    await createExpense(
      {
        tenantId: "t1",
        description: "X",
        amount: 50,
        category: "OTHER",
        date: new Date("2026-05-01"),
      },
      repo,
    );
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "t1",
        description: "X",
        amount: 50,
      }),
    );
  });
});

describe("updateExpense", () => {
  it("updates when expense exists in tenant", async () => {
    const repo = repoMock();
    const result = await updateExpense("t1", "e1", { amount: 200 }, repo);
    expect(repo.findById).toHaveBeenCalledWith("t1", "e1");
    expect(repo.update).toHaveBeenCalledWith("t1", "e1", { amount: 200 });
    expect(result.amount).toBe(200);
  });

  it("throws ExpenseNotFoundError when missing", async () => {
    const repo = repoMock({ findById: vi.fn().mockResolvedValue(null) });
    await expect(
      updateExpense("t1", "ghost", { amount: 1 }, repo),
    ).rejects.toThrow(ExpenseNotFoundError);
    expect(repo.update).not.toHaveBeenCalled();
  });
});

describe("deleteExpense", () => {
  it("deletes when expense exists in tenant", async () => {
    const repo = repoMock();
    await deleteExpense("t1", "e1", repo);
    expect(repo.findById).toHaveBeenCalledWith("t1", "e1");
    expect(repo.delete).toHaveBeenCalledWith("t1", "e1");
  });

  it("throws ExpenseNotFoundError when missing (also covers cross-tenant lookups)", async () => {
    const repo = repoMock({ findById: vi.fn().mockResolvedValue(null) });
    await expect(deleteExpense("t1", "ghost", repo)).rejects.toThrow(
      ExpenseNotFoundError,
    );
    expect(repo.delete).not.toHaveBeenCalled();
  });
});
