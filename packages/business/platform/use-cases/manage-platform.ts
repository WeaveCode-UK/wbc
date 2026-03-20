import { prisma } from '@wbc/db';
import { randomUUID } from 'crypto';

export async function getReferralCode(tenantId: string) {
  let referral = await prisma.referral.findFirst({ where: { referrerTenantId: tenantId } });
  if (!referral) {
    const code = randomUUID().substring(0, 8).toUpperCase();
    referral = await prisma.referral.create({ data: { referrerTenantId: tenantId, referralCode: code } });
  }
  return { code: referral.referralCode, link: `https://wbc.com.br/ref/${referral.referralCode}`, stats: { used: 0 } };
}

export async function getOnboarding(tenantId: string) {
  let progress = await prisma.onboardingProgress.findUnique({ where: { tenantId } });
  if (!progress) {
    progress = await prisma.onboardingProgress.create({ data: { tenantId } });
  }
  return progress;
}

export async function completeOnboardingStep(tenantId: string, stepId: string) {
  const progress = await prisma.onboardingProgress.findUnique({ where: { tenantId } });
  if (!progress) return null;
  const steps = (progress.stepsCompleted as string[]) ?? [];
  if (!steps.includes(stepId)) steps.push(stepId);
  return prisma.onboardingProgress.update({ where: { tenantId }, data: { stepsCompleted: steps, currentStep: stepId } });
}

export async function exportData(tenantId: string) {
  const [clients, sales, expenses] = await Promise.all([
    prisma.client.findMany({ where: { tenantId }, select: { name: true, phone: true, email: true, classification: true } }),
    prisma.sale.findMany({ where: { tenantId }, select: { id: true, total: true, status: true, createdAt: true } }),
    prisma.expense.findMany({ where: { tenantId }, select: { description: true, amount: true, date: true } }),
  ]);
  return { clients, sales, expenses, format: 'json' };
}
