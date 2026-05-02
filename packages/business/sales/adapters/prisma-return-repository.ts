import { prisma } from "@wbc/db";
import type { ReturnRepository, SaleReturn } from "../ports/return-repository";

function mapReturn(r: {
  id: string;
  saleId: string;
  reason: string;
  refundAmount: unknown;
  createdAt: Date;
}): SaleReturn {
  return {
    id: r.id,
    saleId: r.saleId,
    reason: r.reason,
    refundAmount: Number(r.refundAmount),
    createdAt: r.createdAt,
  };
}

export class PrismaReturnRepository implements ReturnRepository {
  async create(
    saleId: string,
    reason: string,
    refundAmount: number,
  ): Promise<SaleReturn> {
    const r = await prisma.return.create({
      data: { saleId, reason, refundAmount },
    });
    return mapReturn(r);
  }

  async findBySaleId(tenantId: string, saleId: string): Promise<SaleReturn[]> {
    // ACH-024 seguranca: tenantId is enforced by the Prisma tenant
    // middleware (applyTenantMiddleware) — this query passes through
    // it via the Sale relation since Return doesn't carry tenantId
    // directly. The explicit `sale.tenantId` filter is defense in
    // depth in case the middleware is bypassed.
    const list = await prisma.return.findMany({
      where: { saleId, sale: { tenantId } },
    });
    return list.map(mapReturn);
  }

  async listByTenant(tenantId: string, limit = 100): Promise<SaleReturn[]> {
    const list = await prisma.return.findMany({
      where: { sale: { tenantId } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return list.map(mapReturn);
  }
}
