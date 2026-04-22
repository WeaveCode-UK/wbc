import { randomUUID } from "crypto";
import type { DomainEvent, EventType } from "./domain-event";
import type { OutboxPort } from "./outbox-service";
import { logIfInvalidEventPayload } from "./schemas";
import { getActiveTraceContext } from "../observability/trace-context";

let outboxPort: OutboxPort | null = null;

/**
 * ACH-017 apis-integracoes: thrown (with a stable `.name`) so callers can
 * distinguish "forgot to wire the outbox" from arbitrary runtime errors.
 * `publish()` keeps the same throw-on-missing-port behaviour so the
 * regression surfaces loudly — but now via a typed error plus a startup
 * assert that lets an app (API or worker) fail before serving traffic.
 */
export class OutboxNotInitializedError extends Error {
  constructor() {
    super(
      "OutboxPort not initialized. Call setOutboxPort(new PrismaOutboxRepository()) at process startup before any use-case publishes an event.",
    );
    this.name = "OutboxNotInitializedError";
  }
}

export function setOutboxPort(port: OutboxPort): void {
  outboxPort = port;
}

export function isOutboxReady(): boolean {
  return outboxPort !== null;
}

/**
 * Call once during startup (API composition root, worker bootstrap) to
 * verify the outbox was wired before accepting traffic. Cheaper than
 * discovering the mis-wire on the first mutation that publishes an event.
 */
export function assertOutboxReady(): void {
  if (!outboxPort) {
    throw new OutboxNotInitializedError();
  }
}

export async function publish<T>(
  type: EventType,
  tenantId: string,
  payload: T,
): Promise<void> {
  if (!outboxPort) {
    throw new OutboxNotInitializedError();
  }

  // ACH-011 apis-integracoes: warn-only validation during the migration
  // (see schemas.ts). Persist-then-warn keeps old events flowing while the
  // missing schemas are authored module-by-module.
  logIfInvalidEventPayload(type, payload);

  // ACH-011 observabilidade-operacao: propaga trace context do request
  // atual para o evento. O worker que processar pode extrair traceparent
  // e continuar o mesmo trace, conectando request → outbox → handler.
  const traceCtx = getActiveTraceContext();
  const metadata = traceCtx
    ? {
        traceId: traceCtx.traceId,
        spanId: traceCtx.spanId,
        traceparent: `00-${traceCtx.traceId}-${traceCtx.spanId}-01`,
      }
    : undefined;

  const event: DomainEvent<T> & { metadata?: unknown } = {
    id: randomUUID(),
    type,
    tenantId,
    payload,
    timestamp: new Date(),
    version: 1,
    ...(metadata ? { metadata } : {}),
  };

  await outboxPort.save(event);
}
