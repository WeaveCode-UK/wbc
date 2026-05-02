import { prisma } from "@wbc/db";

// F11.E18: Expo push token registry. Idempotent: same token
// upserts to avoid duplicates when the mobile app re-registers
// (which it does on every login + every cold-start). Stale tokens
// are not pruned here — the Expo Push API responds with
// `DeviceNotRegistered` and the worker calls `removePushToken` then.

export async function registerPushToken(input: {
  tenantId: string;
  accountId?: string | null;
  token: string;
  platform: "ios" | "android";
}): Promise<{ id: string }> {
  const row = await prisma.pushDevice.upsert({
    where: { token: input.token },
    update: {
      tenantId: input.tenantId,
      accountId: input.accountId ?? null,
      platform: input.platform,
      lastSeen: new Date(),
    },
    create: {
      tenantId: input.tenantId,
      accountId: input.accountId ?? null,
      token: input.token,
      platform: input.platform,
    },
    select: { id: true },
  });
  return row;
}

export async function listPushTokensForTenant(
  tenantId: string,
): Promise<Array<{ id: string; token: string; platform: string }>> {
  return prisma.pushDevice.findMany({
    where: { tenantId },
    select: { id: true, token: true, platform: true },
  });
}

export async function removePushToken(token: string): Promise<void> {
  await prisma.pushDevice.deleteMany({ where: { token } });
}
