// ACH-001 observabilidade-operacao (revisor): servidor HTTP mínimo que
// expõe /metrics com o `metricsRegistry` populado pelos middlewares tRPC
// em `src/trpc/trpc.ts` e pelos helpers de infra em `src/lib/metrics.ts`.
//
// Porta default 3001 bate com o job `wbc-api` em `deploy/prometheus.yml`.
// Executor anterior criou o job Prometheus mas esqueceu de subir o
// endpoint — o scrape ficava quebrado. Usamos `node:http` nativo para
// não adicionar dependências e para manter o mesmo padrão do worker.
//
// `/metrics` é o único endpoint exposto; qualquer outra rota responde
// 404 de forma silenciosa. O servidor não toca a rota tRPC; aquela é
// servida pela camada Next.js do `apps/web`.

import {
  createServer,
  type IncomingMessage,
  type Server as HttpServer,
  type ServerResponse,
} from "node:http";
import { metricsRegistry } from "./lib/metrics";
import { createLogger } from "./lib/logger";

const logger = createLogger("api:metrics-server");

export const DEFAULT_API_METRICS_PORT = 3001;

export interface ApiMetricsServerHandles {
  server: HttpServer;
  stop: () => Promise<void>;
}

export function startApiMetricsServer(
  port: number = Number(
    process.env.API_METRICS_PORT ?? DEFAULT_API_METRICS_PORT,
  ),
): ApiMetricsServerHandles {
  const server = createServer(
    async (req: IncomingMessage, res: ServerResponse) => {
      try {
        const url = req.url ?? "/";
        if (req.method === "GET" && url === "/metrics") {
          res.writeHead(200, { "Content-Type": metricsRegistry.contentType });
          res.end(await metricsRegistry.metrics());
          return;
        }
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("not found");
      } catch (err) {
        logger.error({ err }, "metrics server error");
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("internal error");
      }
    },
  );

  server.listen(port, () => {
    logger.info({ port }, "api metrics server listening on /metrics");
  });

  return {
    server,
    stop: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}
