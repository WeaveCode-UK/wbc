import { prisma } from "@wbc/db";
import { randomUUID } from "crypto";

// F11.E10: NPS post-delivery flow.
// Standard NPS bands: detractor 0-6, passive 7-8, promoter 9-10.
// NPS = (% promoters - % detractors); a single number from -100 to 100.

export async function createNpsSurvey(input: {
  tenantId: string;
  clientId: string;
  saleId?: string | null;
}): Promise<{ id: string; token: string }> {
  const token = randomUUID();
  const survey = await prisma.npsSurvey.create({
    data: {
      tenantId: input.tenantId,
      clientId: input.clientId,
      saleId: input.saleId ?? null,
      token,
    },
    select: { id: true, token: true },
  });
  return survey;
}

export async function recordNpsResponse(input: {
  token: string;
  score: number;
  comment?: string;
}): Promise<{ ok: true }> {
  if (input.score < 0 || input.score > 10) {
    throw new Error("Score must be between 0 and 10");
  }
  await prisma.npsSurvey.update({
    where: { token: input.token },
    data: {
      score: input.score,
      comment: input.comment ?? null,
      respondedAt: new Date(),
    },
  });
  return { ok: true };
}

export interface NpsStats {
  total: number;
  responded: number;
  promoters: number;
  passives: number;
  detractors: number;
  averageScore: number;
  npsScore: number; // -100..100
}

export async function getNpsStats(tenantId: string): Promise<NpsStats> {
  const rows = await prisma.npsSurvey.findMany({
    where: { tenantId, score: { not: null } },
    select: { score: true },
  });
  const total = await prisma.npsSurvey.count({ where: { tenantId } });
  const responded = rows.length;
  if (responded === 0) {
    return {
      total,
      responded: 0,
      promoters: 0,
      passives: 0,
      detractors: 0,
      averageScore: 0,
      npsScore: 0,
    };
  }
  let promoters = 0;
  let passives = 0;
  let detractors = 0;
  let sum = 0;
  for (const r of rows) {
    const s = r.score!;
    sum += s;
    if (s >= 9) promoters++;
    else if (s >= 7) passives++;
    else detractors++;
  }
  const npsScore = Math.round(((promoters - detractors) / responded) * 100);
  const averageScore = sum / responded;
  return {
    total,
    responded,
    promoters,
    passives,
    detractors,
    averageScore,
    npsScore,
  };
}

export async function listNpsResponses(
  tenantId: string,
  limit = 100,
): Promise<
  Array<{
    id: string;
    score: number | null;
    comment: string | null;
    respondedAt: Date | null;
    sentAt: Date;
    clientId: string;
  }>
> {
  const rows = await prisma.npsSurvey.findMany({
    where: { tenantId },
    orderBy: [{ respondedAt: "desc" }, { sentAt: "desc" }],
    take: limit,
    select: {
      id: true,
      score: true,
      comment: true,
      respondedAt: true,
      sentAt: true,
      clientId: true,
    },
  });
  return rows;
}

export async function getNpsByToken(token: string): Promise<{
  tenantId: string;
  alreadyResponded: boolean;
} | null> {
  const row = await prisma.npsSurvey.findUnique({
    where: { token },
    select: { tenantId: true, respondedAt: true },
  });
  if (!row) return null;
  return {
    tenantId: row.tenantId,
    alreadyResponded: row.respondedAt !== null,
  };
}
