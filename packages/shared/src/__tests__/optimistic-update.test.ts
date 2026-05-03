// Coverage push — optimistic-update helper.
//
// We lock the lock-conflict retry loop:
//   - happy path: first attempt commits → returned value
//   - one collision then commit → 2nd attempt's value returned
//   - collisions exhaust the retry budget → OptimisticLockError thrown
//   - thrown errors inside attempt() are remembered and re-thrown if
//     the budget runs out without a successful commit
//   - read() is invoked once per attempt (so the caller always has the
//     freshest version on retry)
import { describe, it, expect, vi } from "vitest";
import {
  optimisticUpdate,
  OptimisticLockError,
} from "../persistence/optimistic-update";

interface State {
  count: number;
}

describe("OptimisticLockError", () => {
  it("carries entity + attempts and has the typed name", () => {
    const err = new OptimisticLockError("Sale", 3);
    expect(err.name).toBe("OptimisticLockError");
    expect(err.entity).toBe("Sale");
    expect(err.attempts).toBe(3);
    expect(err.message).toContain("Sale");
    expect(err.message).toContain("3");
  });
});

describe("optimisticUpdate", () => {
  it("happy path: first commit wins, no retries needed", async () => {
    const read = vi
      .fn()
      .mockResolvedValue({ currentVersion: 1, state: { count: 5 } });
    const attempt = vi
      .fn()
      .mockResolvedValue({ value: { count: 6 }, committed: true });

    const out = await optimisticUpdate<State>("Sale", read, attempt);
    expect(out).toEqual({ count: 6 });
    expect(read).toHaveBeenCalledOnce();
    expect(attempt).toHaveBeenCalledOnce();
  });

  it("re-reads on uncommitted attempt and returns the second commit's value", async () => {
    const read = vi
      .fn()
      .mockResolvedValueOnce({ currentVersion: 1, state: { count: 5 } })
      .mockResolvedValueOnce({ currentVersion: 2, state: { count: 6 } });
    const attempt = vi
      .fn()
      .mockResolvedValueOnce({ value: { count: 5 }, committed: false })
      .mockResolvedValueOnce({ value: { count: 7 }, committed: true });

    const out = await optimisticUpdate<State>("Sale", read, attempt);
    expect(out).toEqual({ count: 7 });
    expect(read).toHaveBeenCalledTimes(2);
    expect(attempt).toHaveBeenCalledTimes(2);
  });

  it("throws OptimisticLockError after maxRetries (default 3) collisions", async () => {
    const read = vi
      .fn()
      .mockResolvedValue({ currentVersion: 1, state: { count: 5 } });
    const attempt = vi
      .fn()
      .mockResolvedValue({ value: { count: 5 }, committed: false });

    await expect(
      optimisticUpdate<State>("Sale", read, attempt),
    ).rejects.toBeInstanceOf(OptimisticLockError);
    // Default max=3 → 4 attempts total (i=0..3 inclusive).
    expect(attempt).toHaveBeenCalledTimes(4);
  });

  it("respects custom maxRetries", async () => {
    const read = vi
      .fn()
      .mockResolvedValue({ currentVersion: 1, state: { count: 0 } });
    const attempt = vi
      .fn()
      .mockResolvedValue({ value: { count: 0 }, committed: false });

    await expect(
      optimisticUpdate<State>("Sale", read, attempt, 1),
    ).rejects.toBeInstanceOf(OptimisticLockError);
    expect(attempt).toHaveBeenCalledTimes(2); // i=0,1
  });

  it("re-throws the last caught error when retries exhaust without commit", async () => {
    const read = vi
      .fn()
      .mockResolvedValue({ currentVersion: 1, state: { count: 0 } });
    const attempt = vi.fn().mockRejectedValue(new Error("transient db"));

    await expect(
      optimisticUpdate<State>("Sale", read, attempt, 1),
    ).rejects.toThrow("transient db");
  });

  it("commits even at the last allowed attempt (boundary)", async () => {
    const read = vi
      .fn()
      .mockResolvedValue({ currentVersion: 1, state: { count: 0 } });
    let calls = 0;
    const attempt = vi.fn().mockImplementation(async () => {
      calls++;
      if (calls < 4) return { value: { count: 0 }, committed: false };
      return { value: { count: 1 }, committed: true };
    });

    const out = await optimisticUpdate<State>("Sale", read, attempt, 3);
    expect(out).toEqual({ count: 1 });
    expect(attempt).toHaveBeenCalledTimes(4);
  });
});
