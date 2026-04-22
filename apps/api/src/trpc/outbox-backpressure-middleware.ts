// ACH-007 confiabilidade-resiliencia: backpressure para mutations que
// geram eventos no outbox. Lança TOO_MANY_REQUESTS quando o lag do
// outbox excede o threshold, evitando que o API aceite mais carga
// enquanto o worker está saturado.
//
// Uso: chamar `applyOutboxBackpressure(path)` no início de procedures
// que publicam evento (segue o mesmo padrão de `applyProtectedRateLimit`
// em rate-limit-middleware.ts). Piloto documentado em
// docs/RELIABILITY-FOLLOWUP.md; rollout para demais mutations é
// follow-up humano.
//
// Threshold configurável via env OUTBOX_BACKPRESSURE_THRESHOLD_MS
// (default 30_000 ms, metade do threshold de readiness do worker).

import { TRPCError } from "@trpc/server";
import { getOutboxLagMs } from "../lib/outbox-lag-monitor";

const DEFAULT_THRESHOLD_MS = 30_000;

function getThresholdMs(): number {
  const raw = Number.parseInt(
    process.env.OUTBOX_BACKPRESSURE_THRESHOLD_MS ?? "",
    10,
  );
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_THRESHOLD_MS;
}

export function applyOutboxBackpressure(path: string): void {
  const lagMs = getOutboxLagMs();
  const thresholdMs = getThresholdMs();
  if (lagMs > thresholdMs) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Outbox backpressure: lag=${lagMs}ms > ${thresholdMs}ms (path=${path})`,
    });
  }
}
