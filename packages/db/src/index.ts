import { PrismaClient } from '@prisma/client';
import { createTenantMiddleware } from './middleware/tenant-middleware';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
});

let tenantMiddlewareApplied = false;

export function applyTenantMiddleware(getTenantId: () => string | undefined): void {
  if (tenantMiddlewareApplied) return;
  prisma.$use(createTenantMiddleware(getTenantId));
  tenantMiddlewareApplied = true;
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export { PrismaClient } from '@prisma/client';
export * from '@prisma/client';
export { createTenantMiddleware } from './middleware/tenant-middleware';
