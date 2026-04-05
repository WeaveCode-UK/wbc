import { NextResponse } from 'next/server';
import { metricsRegistry } from '@wbc/api/lib/metrics';

export const dynamic = 'force-dynamic';

export async function GET() {
  const metrics = await metricsRegistry.metrics();
  return new NextResponse(metrics, {
    headers: { 'Content-Type': metricsRegistry.contentType },
  });
}
