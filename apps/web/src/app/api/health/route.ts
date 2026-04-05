import { NextResponse } from 'next/server';
import { prisma } from '@wbc/db';
import { API_VERSION } from '@wbc/shared';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, string> = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db = 'ok';
  } catch {
    checks.db = 'error';
  }

  const allOk = Object.values(checks).every((v) => v === 'ok');

  return NextResponse.json(
    { status: allOk ? 'healthy' : 'degraded', apiVersion: API_VERSION, checks, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503 },
  );
}
