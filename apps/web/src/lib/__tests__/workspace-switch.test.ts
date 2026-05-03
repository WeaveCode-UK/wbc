// Coverage push — workspace switching. Locks the strict ordering:
// (1) backend validates the move, (2) cache invalidates, (3) session
// updates, (4) router navigates. Out-of-order would leak stale data
// from the previous tenant into the new tenant's UI on first paint.
import { describe, it, expect, vi } from "vitest";
import { switchWorkspace } from "../workspace-switch";

function makeDeps(
  switchResult = {
    tenantId: "t-NEW",
    memberId: "m-1",
    role: "ADMIN",
    plan: "PRO",
  },
) {
  const order: string[] = [];
  const trpcUtils = {
    auth: {
      switchWorkspace: {
        mutate: vi
          .fn()
          .mockImplementation(async (input: { tenantId: string }) => {
            order.push(`mutate:${input.tenantId}`);
            return switchResult;
          }),
      },
    },
  };
  const queryClient = {
    clear: vi.fn().mockImplementation(() => order.push("clear")),
  } as unknown as Parameters<typeof switchWorkspace>[0]["queryClient"];
  const updateSession = vi
    .fn()
    .mockImplementation(async (data: Record<string, unknown>) => {
      order.push(`session:${data.tenantId}`);
      return { ok: true };
    });
  const router = {
    push: vi
      .fn()
      .mockImplementation((path: string) => order.push(`push:${path}`)),
  };
  return { trpcUtils, queryClient, updateSession, router, order };
}

describe("switchWorkspace", () => {
  it("calls mutate → clear → updateSession → push, in that order", async () => {
    const d = makeDeps();
    await switchWorkspace({
      trpcUtils: d.trpcUtils,
      queryClient: d.queryClient,
      updateSession: d.updateSession,
      router: d.router,
      tenantId: "t-NEW",
    });
    expect(d.order).toEqual([
      "mutate:t-NEW",
      "clear",
      "session:t-NEW",
      "push:/dashboard",
    ]);
  });

  it("forwards the validated tenantId from the backend response — not the request", async () => {
    // If the backend resolves to a different tenant (corner case: alias),
    // updateSession should carry the resolved id, not the requested one.
    const d = makeDeps({
      tenantId: "t-RESOLVED",
      memberId: "m-1",
      role: "ADMIN",
      plan: "PRO",
    });
    await switchWorkspace({
      trpcUtils: d.trpcUtils,
      queryClient: d.queryClient,
      updateSession: d.updateSession,
      router: d.router,
      tenantId: "t-ALIAS",
    });
    expect(d.updateSession).toHaveBeenCalledWith({ tenantId: "t-RESOLVED" });
  });

  it("aborts — does NOT clear/session/push — when mutate rejects", async () => {
    const d = makeDeps();
    d.trpcUtils.auth.switchWorkspace.mutate = vi
      .fn()
      .mockRejectedValue(new Error("forbidden"));

    await expect(
      switchWorkspace({
        trpcUtils: d.trpcUtils,
        queryClient: d.queryClient,
        updateSession: d.updateSession,
        router: d.router,
        tenantId: "t-FORBIDDEN",
      }),
    ).rejects.toThrow("forbidden");

    expect(d.queryClient.clear).not.toHaveBeenCalled();
    expect(d.updateSession).not.toHaveBeenCalled();
    expect(d.router.push).not.toHaveBeenCalled();
  });
});
