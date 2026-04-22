// ACH-002 observabilidade-operacao: ponte entre OTel e Pino.
// Quando há um span ativo, `getActiveTraceContext()` retorna
// `{ traceId, spanId }` — o logging middleware e o Sentry podem
// misturá-los em cada log/evento para correlação entre sistemas.
//
// O módulo não importa @opentelemetry/api diretamente no type space
// porque alguns consumidores (landing, mobile) não trazem OTel. O
// import é lazy/opcional; se o pacote não estiver disponível, retorna
// undefined e o caller continua sem traceId.

export interface TraceContext {
  traceId: string;
  spanId: string;
  traceFlags?: number;
}

let cachedApi: typeof import("@opentelemetry/api") | null | undefined;

async function loadOtelApi(): Promise<
  typeof import("@opentelemetry/api") | null
> {
  if (cachedApi !== undefined) return cachedApi;
  try {
    cachedApi = await import("@opentelemetry/api");
    return cachedApi;
  } catch {
    cachedApi = null;
    return null;
  }
}

// Versão síncrona para hot-path. Retorna undefined no primeiro call
// até que `primeTraceContext()` tenha sido chamada uma vez no bootstrap.
let syncApi: typeof import("@opentelemetry/api") | null = null;

export async function primeTraceContext(): Promise<void> {
  syncApi = await loadOtelApi();
}

export function getActiveTraceContext(): TraceContext | undefined {
  if (!syncApi) return undefined;
  const span = syncApi.trace.getActiveSpan();
  if (!span) return undefined;
  const ctx = span.spanContext();
  if (!ctx.traceId || ctx.traceId === "00000000000000000000000000000000") {
    return undefined;
  }
  return {
    traceId: ctx.traceId,
    spanId: ctx.spanId,
    traceFlags: ctx.traceFlags,
  };
}
