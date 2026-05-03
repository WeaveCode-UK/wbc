// Coverage gap: tenantInjectionMiddleware is the second line of defence
// after AsyncLocalStorage — every Prisma call for a tenant-scoped model
// gets `tenantId` injected automatically. A regression here is the
// canonical multi-tenant data leak (cross-tenant read/write); covering
// each branch keeps the contract obvious.
//
// We exercise the middleware as the real Prisma adapter would: build
// `params`, call the middleware with a fake `next`, assert what `params`
// looked like when `next` ran. No Prisma instance needed.

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Prisma } from "@prisma/client";
import { tenantInjectionMiddleware } from "../tenant-injection.middleware";
import { withTenant } from "../../tenant-context";

type Params = Prisma.MiddlewareParams;
type NextSpy = ReturnType<typeof vi.fn>;

const middleware = tenantInjectionMiddleware();

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

let next: NextSpy;

beforeEach(() => {
  next = vi.fn().mockResolvedValue(undefined);
});

describe("tenantInjectionMiddleware — no tenant context (admin / migration)", () => {
  it("passes through unchanged when getCurrentTenantId() is undefined", async () => {
    const params = buildParams({
      model: "Client",
      action: "findMany",
      args: { where: { name: "x" } },
    });
    await middleware(params, next);
    expect(next).toHaveBeenCalledWith(params);
    expect(params.args).toEqual({ where: { name: "x" } }); // not mutated
  });
});

describe("tenantInjectionMiddleware — non-tenant models", () => {
  it("does not inject for User (global model)", async () => {
    await withTenant("t-1", async () => {
      const params = buildParams({
        model: "User",
        action: "findMany",
        args: { where: {} },
      });
      await middleware(params, next);
    });
    const seen = next.mock.calls[0]![0] as Params;
    expect(
      (seen.args as { where: Record<string, unknown> }).where.tenantId,
    ).toBeUndefined();
  });

  it("does not inject when params.model is undefined ($queryRaw etc.)", async () => {
    await withTenant("t-1", async () => {
      const params = buildParams({
        model: undefined,
        action: "findMany",
      });
      await middleware(params, next);
    });
    expect(next).toHaveBeenCalledOnce();
  });
});

describe("tenantInjectionMiddleware — READ operations", () => {
  it("injects WHERE tenantId on findMany", async () => {
    await withTenant("t-1", async () => {
      const params = buildParams({
        model: "Client",
        action: "findMany",
        args: { where: { name: "x" } },
      });
      await middleware(params, next);
    });
    const seen = next.mock.calls[0]![0] as Params;
    expect(seen.args).toEqual({ where: { name: "x", tenantId: "t-1" } });
  });

  it.each(["findFirst", "findUnique", "count", "aggregate", "groupBy"])(
    "injects WHERE tenantId on %s",
    async (action) => {
      await withTenant("t-1", async () => {
        const params = buildParams({
          model: "Sale",
          action: action as Params["action"],
          args: {},
        });
        await middleware(params, next);
      });
      const seen = next.mock.calls[0]![0] as Params;
      expect(
        (seen.args as { where: { tenantId: string } }).where.tenantId,
      ).toBe("t-1");
    },
  );

  it("creates args.where when missing (no Prisma error on raw findMany())", async () => {
    await withTenant("t-1", async () => {
      const params = buildParams({
        model: "Client",
        action: "findMany",
        args: undefined,
      });
      await middleware(params, next);
    });
    const seen = next.mock.calls[0]![0] as Params;
    expect(seen.args).toEqual({ where: { tenantId: "t-1" } });
  });
});

describe("tenantInjectionMiddleware — CREATE operations", () => {
  it("injects tenantId into data on create", async () => {
    await withTenant("t-1", async () => {
      const params = buildParams({
        model: "Client",
        action: "create",
        args: { data: { name: "Alice" } },
      });
      await middleware(params, next);
    });
    const seen = next.mock.calls[0]![0] as Params;
    expect(seen.args).toEqual({ data: { name: "Alice", tenantId: "t-1" } });
  });

  it("injects tenantId on every row of createMany", async () => {
    await withTenant("t-1", async () => {
      const params = buildParams({
        model: "Tag",
        action: "createMany",
        args: { data: [{ name: "vip" }, { name: "loyal" }] },
      });
      await middleware(params, next);
    });
    const seen = next.mock.calls[0]![0] as Params;
    expect(seen.args).toEqual({
      data: [
        { name: "vip", tenantId: "t-1" },
        { name: "loyal", tenantId: "t-1" },
      ],
    });
  });

  it("leaves createMany alone when data is not an array (defensive)", async () => {
    // Prisma rejects this shape itself; we just don't crash on it.
    await withTenant("t-1", async () => {
      const params = buildParams({
        model: "Tag",
        action: "createMany",
        args: { data: { name: "single" } as unknown as Array<unknown> },
      });
      await middleware(params, next);
    });
    expect(next).toHaveBeenCalledOnce();
  });
});

describe("tenantInjectionMiddleware — UPDATE / DELETE / UPSERT", () => {
  it.each(["update", "updateMany", "delete", "deleteMany", "upsert"])(
    "injects WHERE tenantId on %s",
    async (action) => {
      await withTenant("t-1", async () => {
        const params = buildParams({
          model: "Sale",
          action: action as Params["action"],
          args: { where: { id: "s-1" } },
        });
        await middleware(params, next);
      });
      const seen = next.mock.calls[0]![0] as Params;
      expect(
        (seen.args as { where: { tenantId: string } }).where.tenantId,
      ).toBe("t-1");
    },
  );
});

describe("tenantInjectionMiddleware — tenant isolation", () => {
  it("injects different tenantIds for nested withTenant scopes", async () => {
    // Outer scope leaks would let one tenant see another; the AsyncLocalStorage
    // fork-safety is what this test pins.
    await withTenant("t-A", async () => {
      const p1 = buildParams({
        model: "Client",
        action: "findMany",
        args: {},
      });
      await middleware(p1, next);
      await withTenant("t-B", async () => {
        const p2 = buildParams({
          model: "Client",
          action: "findMany",
          args: {},
        });
        await middleware(p2, next);
      });
    });
    const first = next.mock.calls[0]![0] as Params;
    const second = next.mock.calls[1]![0] as Params;
    expect((first.args as { where: { tenantId: string } }).where.tenantId).toBe(
      "t-A",
    );
    expect(
      (second.args as { where: { tenantId: string } }).where.tenantId,
    ).toBe("t-B");
  });
});
