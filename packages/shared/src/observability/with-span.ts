// ACH-009 observabilidade-operacao: helper para spans manuais. Sem
// este wrapper, cada use-case que queira instrumentar precisa importar
// @opentelemetry/api e lidar com ausência do pacote em builds que não
// o têm (landing/mobile). O helper isola isso.
//
// Uso típico dentro de um use-case:
//
//   await withSpan('sales.createSale', { tenantId }, async () => {
//     return saleRepo.create(...);
//   });
//
// Sem OTel carregado, simplesmente roda `fn()` sem overhead.

type OtelApi = {
  trace: {
    getTracer: (name: string) => {
      startActiveSpan: <T>(
        name: string,
        options: { attributes: Record<string, string | number | boolean> },
        fn: (span: OtelSpan) => T | Promise<T>,
      ) => T | Promise<T>;
    };
  };
  SpanStatusCode: { OK: number; ERROR: number };
};

type OtelSpan = {
  setStatus: (status: { code: number; message?: string }) => void;
  recordException: (err: Error) => void;
  end: () => void;
};

let cachedApi: OtelApi | null | undefined;

async function loadApi(): Promise<OtelApi | null> {
  if (cachedApi !== undefined) return cachedApi;
  try {
    const moduleName = "@opentelemetry/api";
    cachedApi = (await import(/* @vite-ignore */ moduleName)) as OtelApi;
    return cachedApi;
  } catch {
    cachedApi = null;
    return null;
  }
}

export async function withSpan<T>(
  name: string,
  attributes: Record<string, string | number | boolean>,
  fn: () => Promise<T>,
): Promise<T> {
  const api = await loadApi();
  if (!api) return fn();

  const tracer = api.trace.getTracer("wbc");
  return tracer.startActiveSpan(name, { attributes }, async (span) => {
    try {
      const result = await fn();
      span.setStatus({ code: api.SpanStatusCode.OK });
      return result;
    } catch (err) {
      span.setStatus({
        code: api.SpanStatusCode.ERROR,
        message: err instanceof Error ? err.message : String(err),
      });
      if (err instanceof Error) span.recordException(err);
      throw err;
    } finally {
      span.end();
    }
  });
}
