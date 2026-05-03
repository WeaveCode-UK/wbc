// T-coverage — getFinanceDashboard period parsing
//
// Period semantics live in the use-case (not the repo) so the SQL
// layer stays oblivious to "how does the user describe a window".
// We assert each branch:
//   - "all" → epoch → today
//   - "YYYY" → Jan 1 → Dec 31 of that year (end-of-day stamped)
//   - "YYYY-MM" → 1st of month → last day of month
//   - undefined → trailing 12 months (today minus 11 months → today)
//   - malformed YYYY-MM → returns the zeroed dashboard inline (no repo call)
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getFinanceDashboard } from "../get-dashboard";
import type { FinanceRepository } from "../../ports/finance-repository";

function repoMock(): FinanceRepository {
  return {
    getDashboard: vi.fn().mockResolvedValue({
      revenue: 1,
      expenses: 1,
      profit: 0,
      receivables: 0,
    }),
    getCAC: vi.fn(),
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  // Mid-year so all branches behave deterministically.
  vi.setSystemTime(new Date("2026-05-15T10:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getFinanceDashboard period parsing", () => {
  it("'all' uses epoch-zero as start and today as end", async () => {
    const repo = repoMock();
    await getFinanceDashboard("t1", "all", repo);
    const [tenantId, start, end] =
      (repo.getDashboard as ReturnType<typeof vi.fn>).mock.calls[0] ?? [];
    expect(tenantId).toBe("t1");
    expect((start as Date).getTime()).toBe(0);
    expect((end as Date).getFullYear()).toBe(2026);
  });

  it("'YYYY' spans Jan 1 → Dec 31 of that year", async () => {
    const repo = repoMock();
    await getFinanceDashboard("t1", "2025", repo);
    const [, start, end] =
      (repo.getDashboard as ReturnType<typeof vi.fn>).mock.calls[0] ?? [];
    expect((start as Date).getFullYear()).toBe(2025);
    expect((start as Date).getMonth()).toBe(0);
    expect((start as Date).getDate()).toBe(1);
    expect((end as Date).getFullYear()).toBe(2025);
    expect((end as Date).getMonth()).toBe(11);
    expect((end as Date).getDate()).toBe(31);
  });

  it("'YYYY-MM' spans the first → last day of that calendar month", async () => {
    const repo = repoMock();
    await getFinanceDashboard("t1", "2026-02", repo);
    const [, start, end] =
      (repo.getDashboard as ReturnType<typeof vi.fn>).mock.calls[0] ?? [];
    expect((start as Date).getMonth()).toBe(1); // Feb is month 1
    expect((start as Date).getDate()).toBe(1);
    // Feb 2026 has 28 days; end-of-day on Feb 28.
    expect((end as Date).getMonth()).toBe(1);
    expect((end as Date).getDate()).toBe(28);
  });

  it("'YYYY-MM' for a 31-day month lands on day 31", async () => {
    const repo = repoMock();
    await getFinanceDashboard("t1", "2026-01", repo);
    const [, , end] =
      (repo.getDashboard as ReturnType<typeof vi.fn>).mock.calls[0] ?? [];
    expect((end as Date).getMonth()).toBe(0);
    expect((end as Date).getDate()).toBe(31);
  });

  it("undefined falls back to trailing 12 months (today minus 11 months → today)", async () => {
    const repo = repoMock();
    await getFinanceDashboard("t1", undefined, repo);
    const [, start, end] =
      (repo.getDashboard as ReturnType<typeof vi.fn>).mock.calls[0] ?? [];
    // "today minus 11 months" from 2026-05-15 is 2025-06-01.
    expect((start as Date).getFullYear()).toBe(2025);
    expect((start as Date).getMonth()).toBe(5); // June
    expect((start as Date).getDate()).toBe(1);
    expect((end as Date).getFullYear()).toBe(2026);
    expect((end as Date).getMonth()).toBe(4); // May
  });

  it("malformed YYYY-MM (e.g. invalid year/month) returns zeroed dashboard without hitting repo", async () => {
    const repo = repoMock();
    // The /^\d{4}-\d{2}$/ regex matches but Number(year) / Number(month)
    // produce 0 for "0000-00", which the use-case treats as "give up".
    const out = await getFinanceDashboard("t1", "0000-00", repo);
    expect(out).toEqual({ revenue: 0, expenses: 0, profit: 0, receivables: 0 });
    expect(repo.getDashboard).not.toHaveBeenCalled();
  });

  it("non-matching strings (e.g. 'this-week') fall through to the trailing-12 default", async () => {
    const repo = repoMock();
    await getFinanceDashboard("t1", "this-week", repo);
    expect(repo.getDashboard).toHaveBeenCalledOnce();
  });
});
