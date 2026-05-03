// T-coverage — notifications repo pass-through
//
// listNotifications / markAsRead / markAllAsRead are thin wrappers
// over NotificationRepository — we assert each forwards (tenantId, ...)
// verbatim so the tenant filter in the repo is the single source of
// truth for cross-tenant isolation.
import { describe, it, expect, vi } from "vitest";
import { listNotifications, markAsRead, markAllAsRead } from "../notifications";
import type { NotificationRepository } from "../../ports/schedule-repository";

function repoMock(
  overrides: Partial<NotificationRepository> = {},
): NotificationRepository {
  return {
    list: vi.fn().mockResolvedValue({ data: [], total: 0, unread: 0 }),
    markAsRead: vi.fn().mockResolvedValue({ id: "n1" }),
    markAllAsRead: vi.fn().mockResolvedValue({ success: true }),
    create: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("listNotifications", () => {
  it("forwards tenantId + page + limit", async () => {
    const repo = repoMock();
    await listNotifications("t1", 2, 25, repo);
    expect(repo.list).toHaveBeenCalledWith("t1", 2, 25);
  });

  it("returns the repo payload as-is (data + total + unread)", async () => {
    const repo = repoMock({
      list: vi
        .fn()
        .mockResolvedValue({ data: [{ id: "n1" }], total: 1, unread: 1 }),
    });
    const out = await listNotifications("t1", 1, 10, repo);
    expect(out.unread).toBe(1);
  });
});

describe("markAsRead", () => {
  it("forwards (tenantId, id)", async () => {
    const repo = repoMock();
    await markAsRead("t1", "n1", repo);
    expect(repo.markAsRead).toHaveBeenCalledWith("t1", "n1");
  });
});

describe("markAllAsRead", () => {
  it("forwards tenantId verbatim and returns the repo's success flag", async () => {
    const repo = repoMock();
    const out = await markAllAsRead("t1", repo);
    expect(repo.markAllAsRead).toHaveBeenCalledWith("t1");
    expect(out.success).toBe(true);
  });
});
