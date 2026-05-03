// Coverage gap: tenant-middleware (factory variant, distinct from
// tenant-injection.middleware) has the OPPOSITE contract: it THROWS
// when a tenant-scoped model is queried without tenantId, instead of
// silently passing through. The two middlewares are layered (the
// throwing one acts as a defence-in-depth signal); a regression that
// silently degraded the throw to a passthrough would let a forgotten
// `withTenant` cross tenants without anyone noticing.

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Prisma } from "@prisma/client";

const logSecurityEventMock = vi.hoisted(() => vi.fn());

vi.mock("@wbc/shared", async () => {
  const actual =
    await vi.importActual<typeof import("@wbc/shared")>("@wbc/shared");
  return {
    ...actual,
    logSecurityEvent: logSecurityEventMock,
  };
});

import { createTenantMiddleware } from "../tenant-middleware";

type Params = Prisma.MiddlewareParams;
type NextSpy = ReturnType<typeof vi.fn>;

let next: NextSpy;

beforeEach(() => {
  next = vi.fn().mockResolvedValue(undefined);
  logSecurityEventMock.mockReset();
});

function buildParams(partial: Partial<Params>): Params {
  return {
    model: undefined,
    action: "findFirst",
    args: undefined,
    dataPath: [],
    runInTransaction: false,
    ...partial,
  } as Params;
}

describe("createTenantMiddleware — passthrough (no model / non-tenant model)", () => {
  it("passes through when params.model is undefined ($queryRaw)", async () => {
    const mw = createTenantMiddleware(() => "t-1");
    await mw(buildParams({ model: undefined, action: "findMany" }), next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("passes through for non-tenant-scoped models (User, Subscription, etc.)", async () => {
    const mw = createTenantMiddleware(() => undefined);
    await mw(
      buildParams({
        model: "User",
        action: "findMany",
        args: { where: {} },
      }),
      next,
    );
    expect(next).toHaveBeenCalledOnce();
    expect(logSecurityEventMock).not.toHaveBeenCalled();
  });
});

describe("createTenantMiddleware — missing tenant on tenant-scoped model", () => {
  it("throws with model+action context when tenantId is undefined", async () => {
    const mw = createTenantMiddleware(() => undefined);
    await expect(
      mw(buildParams({ model: "Client", action: "findMany", args: {} }), next),
    ).rejects.toThrow(
      /Tenant context required for Client\.findMany but tenantId is undefined/,
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("logs a security event before throwing (audit trail)", async () => {
    const mw = createTenantMiddleware(() => undefined);
    await expect(
      mw(buildParams({ model: "Sale", action: "create", args: {} }), next),
    ).rejects.toThrow();

    expect(logSecurityEventMock).toHaveBeenCalledOnce();
    const arg = logSecurityEventMock.mock.calls[0]![0] as {
      event: string;
      success: boolean;
      detail: string;
    };
    expect(arg.event).toBe("tenant.cross_tenant_blocked");
    expect(arg.success).toBe(false);
    expect(arg.detail).toContain("Sale.create");
  });
});

describe("createTenantMiddleware — read injection", () => {
  it.each([
    "findFirst",
    "findMany",
    "findUnique",
    "count",
    "aggregate",
    "groupBy",
  ])("injects WHERE tenantId on %s", async (action) => {
    const mw = createTenantMiddleware(() => "t-1");
    const params = buildParams({
      model: "Client",
      action: action as Params["action"],
      args: {},
    });
    await mw(params, next);
    expect(
      (params.args as { where: { tenantId: string } }).where.tenantId,
    ).toBe("t-1");
  });
});

describe("createTenantMiddleware — write injection", () => {
  it("injects tenantId on create.data", async () => {
    const mw = createTenantMiddleware(() => "t-1");
    const params = buildParams({
      model: "Client",
      action: "create",
      args: { data: { name: "Alice" } },
    });
    await mw(params, next);
    expect(params.args).toEqual({
      data: { name: "Alice", tenantId: "t-1" },
    });
  });

  it("injects tenantId on every row of createMany", async () => {
    const mw = createTenantMiddleware(() => "t-1");
    const params = buildParams({
      model: "Tag",
      action: "createMany",
      args: { data: [{ name: "vip" }, { name: "loyal" }] },
    });
    await mw(params, next);
    expect(params.args).toEqual({
      data: [
        { name: "vip", tenantId: "t-1" },
        { name: "loyal", tenantId: "t-1" },
      ],
    });
  });

  it.each(["update", "updateMany", "delete", "deleteMany"])(
    "injects WHERE tenantId on %s",
    async (action) => {
      const mw = createTenantMiddleware(() => "t-1");
      const params = buildParams({
        model: "Sale",
        action: action as Params["action"],
        args: { where: { id: "s-1" } },
      });
      await mw(params, next);
      expect(
        (params.args as { where: { tenantId: string } }).where.tenantId,
      ).toBe("t-1");
    },
  );
});

describe("createTenantMiddleware — getter is called per-request (not cached)", () => {
  it("re-reads the tenant id every call (different scopes get different IDs)", async () => {
    let counter = 0;
    const mw = createTenantMiddleware(() => `t-${++counter}`);
    const p1 = buildParams({
      model: "Client",
      action: "findMany",
      args: {},
    });
    const p2 = buildParams({
      model: "Client",
      action: "findMany",
      args: {},
    });
    await mw(p1, next);
    await mw(p2, next);
    expect((p1.args as { where: { tenantId: string } }).where.tenantId).toBe(
      "t-1",
    );
    expect((p2.args as { where: { tenantId: string } }).where.tenantId).toBe(
      "t-2",
    );
  });
});
