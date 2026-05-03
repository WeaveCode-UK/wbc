import { prisma } from "@wbc/db";
import { createPushableNotification } from "@wbc/business/schedule/use-cases/notification-fanout";

// Item 53 da spec / item 7 do handoff: tracker de carreira/níveis.
//
// A consultora cadastra metas de manutenção/promoção por marca (ex:
// "manter Diretora Mary Kay até 2026-12-31, R$ 30.000"). O cron diário
// soma o total de Sale.total entre `startsAt` e `targetByDate` e gera
// uma Notification quando faltar < 20% do tempo OU < 20% do valor — o
// que disparar primeiro. Idempotente: `notifiedAt` evita notificação
// duplicada na mesma janela.

const URGENT_THRESHOLD = 0.2; // 20%

export interface CareerGoalInput {
  tenantId: string;
  brandName: string;
  levelName: string;
  targetRevenue: number;
  targetByDate: Date;
  startsAt?: Date;
}

export async function createCareerGoal(input: CareerGoalInput) {
  return prisma.careerGoal.create({
    data: {
      tenantId: input.tenantId,
      brandName: input.brandName,
      levelName: input.levelName,
      targetRevenue: input.targetRevenue,
      targetByDate: input.targetByDate,
      startsAt: input.startsAt ?? new Date(),
    },
  });
}

export async function listCareerGoals(tenantId: string) {
  const goals = await prisma.careerGoal.findMany({
    where: { tenantId, isActive: true },
    orderBy: { targetByDate: "asc" },
  });
  return Promise.all(goals.map((g) => withProgress(g)));
}

export async function deactivateCareerGoal(tenantId: string, id: string) {
  return prisma.careerGoal.update({
    where: { id, tenantId },
    data: { isActive: false },
  });
}

interface CareerGoalRow {
  id: string;
  tenantId: string;
  brandName: string;
  levelName: string;
  targetRevenue: { toString(): string } | number;
  targetByDate: Date;
  startsAt: Date;
  notifiedAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CareerGoalProgress {
  currentRevenue: number;
  remainingRevenue: number;
  remainingPercent: number;
  daysRemaining: number;
  daysTotal: number;
  isUrgent: boolean;
}

export interface CareerGoalWithProgress {
  id: string;
  brandName: string;
  levelName: string;
  targetRevenue: number;
  targetByDate: Date;
  startsAt: Date;
  isActive: boolean;
  notifiedAt: Date | null;
  progress: CareerGoalProgress;
}

async function computeProgress(
  goal: CareerGoalRow,
  now: Date = new Date(),
): Promise<CareerGoalProgress> {
  const aggregate = await prisma.sale.aggregate({
    where: {
      tenantId: goal.tenantId,
      status: { in: ["CONFIRMED", "DELIVERED"] },
      createdAt: { gte: goal.startsAt, lte: goal.targetByDate },
    },
    _sum: { total: true },
  });

  const target = Number(goal.targetRevenue);
  const currentRevenue = Number(aggregate._sum.total ?? 0);
  const remainingRevenue = Math.max(0, target - currentRevenue);
  const remainingPercent = target > 0 ? remainingRevenue / target : 0;
  const daysTotal = Math.max(
    1,
    Math.ceil(
      (goal.targetByDate.getTime() - goal.startsAt.getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );
  const daysRemaining = Math.max(
    0,
    Math.ceil(
      (goal.targetByDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    ),
  );

  const timeFraction = daysTotal > 0 ? daysRemaining / daysTotal : 0;
  // Urgente: ainda falta dinheiro AND (pouco tempo OR ainda muito por
  // realizar com tempo curto).
  const isUrgent =
    remainingRevenue > 0 &&
    (timeFraction <= URGENT_THRESHOLD ||
      (remainingPercent >= URGENT_THRESHOLD && timeFraction <= 0.5));

  return {
    currentRevenue,
    remainingRevenue,
    remainingPercent,
    daysRemaining,
    daysTotal,
    isUrgent,
  };
}

async function withProgress(
  goal: CareerGoalRow,
): Promise<CareerGoalWithProgress> {
  const progress = await computeProgress(goal);
  return {
    id: goal.id,
    brandName: goal.brandName,
    levelName: goal.levelName,
    targetRevenue: Number(goal.targetRevenue),
    targetByDate: goal.targetByDate,
    startsAt: goal.startsAt,
    isActive: goal.isActive,
    notifiedAt: goal.notifiedAt,
    progress,
  };
}

export async function notifyUrgentCareerGoals(
  tenantId: string,
): Promise<{ scanned: number; notified: number }> {
  const goals = await prisma.careerGoal.findMany({
    where: {
      tenantId,
      isActive: true,
      targetByDate: { gt: new Date() },
    },
  });

  let notified = 0;
  for (const goal of goals) {
    const progress = await computeProgress(goal);
    if (!progress.isUrgent) continue;

    // Re-notify at most once per 7 days for the same goal.
    if (goal.notifiedAt) {
      const daysSinceLast =
        (Date.now() - goal.notifiedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLast < 7) continue;
    }

    const remainingBRL = progress.remainingRevenue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    await createPushableNotification({
      tenantId,
      type: `CAREER_GOAL_URGENT_${goal.id}`,
      title: `Faltam ${remainingBRL} para ${goal.levelName} ${goal.brandName}`,
      body: `Restam ${progress.daysRemaining} dias até ${goal.targetByDate.toLocaleDateString("pt-BR")}.`,
    });
    await prisma.careerGoal.update({
      where: { id: goal.id },
      data: { notifiedAt: new Date() },
    });
    notified++;
  }

  return { scanned: goals.length, notified };
}
