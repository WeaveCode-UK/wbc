import { prisma } from "@wbc/db";

// F11.E09: demo-mode utilities. A tenant flagged isDemo gets its
// transactional data wiped on a schedule (or on manual reset) so a
// shared demo workspace doesn't accumulate noise. The reset preserves
// account/member rows because the testing accounts must stay logged
// in across resets.
//
// Order matters: child rows referencing the tenant must be deleted
// before the tenant-scoped rows that reference them, and we keep the
// tenant + members + invites + onboarding rows because those are the
// "shape" of the workspace, not its content.

const PRESERVED_TABLES = new Set([
  "tenant",
  "tenantMember",
  "invite",
  "account",
  "oAuthAccount",
  "session",
  "subscription",
  "onboardingProgress",
  "landingPage",
]);

export async function resetDemoTenant(tenantId: string): Promise<void> {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant?.isDemo) {
    throw new Error("Tenant is not flagged as demo");
  }

  // Delete in dependency order (children first). Wrapped in a single
  // transaction so a partial failure rolls back to the prior state.
  await prisma.$transaction(async (tx) => {
    await tx.loyaltyTransaction.deleteMany({ where: { tenantId } });
    await tx.loyaltyPoints.deleteMany({ where: { tenantId } });
    await tx.cashbackRedemption.deleteMany({ where: { tenantId } });
    await tx.cashback.deleteMany({ where: { tenantId } });
    await tx.delivery.deleteMany({ where: { sale: { tenantId } } });
    await tx.payment.deleteMany({ where: { sale: { tenantId } } });
    await tx.saleItem.deleteMany({ where: { sale: { tenantId } } });
    await tx.sale.deleteMany({ where: { tenantId } });
    await tx.expense.deleteMany({ where: { tenantId } });
    await tx.scheduledMessage.deleteMany({ where: { tenantId } });
    await tx.campaign.deleteMany({ where: { tenantId } });
    await tx.appointment.deleteMany({ where: { tenantId } });
    await tx.reminder.deleteMany({ where: { tenantId } });
    await tx.opportunity.deleteMany({ where: { tenantId } });
    await tx.aIGeneration.deleteMany({ where: { tenantId } });
    await tx.notification.deleteMany({ where: { tenantId } });
    await tx.giftSuggestor.deleteMany({ where: { tenantId } });
    await tx.clientWishlist.deleteMany({ where: { tenantId } });
    await tx.clientTag.deleteMany({ where: { client: { tenantId } } });
    await tx.tag.deleteMany({ where: { tenantId } });
    await tx.client.deleteMany({ where: { tenantId } });
    await tx.stock.deleteMany({ where: { tenantId } });
    await tx.brandOrder.deleteMany({ where: { tenantId } });
    await tx.sample.deleteMany({ where: { tenantId } });
    await tx.product.deleteMany({ where: { tenantId } });

    await tx.tenant.update({
      where: { id: tenantId },
      data: { demoResetAt: new Date() },
    });
  });
}

/** Inspector reused by the daily cron when wired up. */
export async function listDemoTenants(): Promise<string[]> {
  const rows = await prisma.tenant.findMany({
    where: { isDemo: true, isActive: true },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

// Bloco 9 do plano: feature #74 — toggle modo demo. Ligar marca o
// tenant como demo (passa a ser elegível pra reset diário pelo cron
// reset_demo_tenants); desligar tira o flag e zera demoResetAt.
// `resetDemoTenant` (acima) refusa rodar em tenant não-demo, então
// é seguro permitir desativar a qualquer momento.
export async function setDemoMode(
  tenantId: string,
  enabled: boolean,
): Promise<void> {
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      isDemo: enabled,
      demoResetAt: enabled ? new Date() : null,
    },
  });
}

export const PRESERVED_TENANT_TABLES = PRESERVED_TABLES;
