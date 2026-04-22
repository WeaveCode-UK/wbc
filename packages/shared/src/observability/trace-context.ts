// ACH-002 observabilidade-operacao: ponte entre OTel e Pino.
// Quando há um span ativo, `getActiveTraceContext()` retorna
// `{ traceId, spanId }` — o logging middleware e o Sentry podem
// misturá-los em cada log/evento para correlação entre sistemas.
//
// O módulo não depende de @opentelemetry/api no build do shared
// (packages auxiliares como landing/mobile não o carregam). A API é
// resolvida em runtime via require opcional; se não estiver presente,
// as funções viram no-op.

export interface TraceContext {
  traceId: string;
  spanId: string;
  traceFlags?: number;
}

type OtelApi = {
  trace: {
    getActiveSpan: () =>
      | {
          spanContext: () => {
            traceId: string;
            spanId: string;
            traceFlags: number;
          };
        }
      | null
      | undefined;
  };
};

let syncApi: OtelApi | null = null;

export async function primeTraceContext(): Promise<void> {
  try {
    // Import dinâmico para não quebrar builds sem @opentelemetry/api.
    // Usa string literal ofuscada o suficiente para que o bundler não
    // tente resolver o módulo em compile-time.
    const moduleName = "@opentelemetry/api";
    const mod = (await import(/* @vite-ignore */ moduleName)) as OtelApi;
    syncApi = mod;
  } catch {
    syncApi = null;
  }
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
