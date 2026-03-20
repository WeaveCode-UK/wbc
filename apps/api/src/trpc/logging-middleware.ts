import { createLogger } from '../lib/logger';

const logger = createLogger('trpc');

export interface RequestLogData {
  path: string;
  type: 'query' | 'mutation' | 'subscription';
  tenantId: string | null;
  durationMs: number;
  ok: boolean;
}

export function logRequest(data: RequestLogData): void {
  const level = data.ok ? 'info' : 'error';
  logger[level]({
    path: data.path,
    type: data.type,
    tenantId: data.tenantId,
    durationMs: data.durationMs,
    ok: data.ok,
  }, `${data.type} ${data.path} ${data.durationMs}ms`);
}
