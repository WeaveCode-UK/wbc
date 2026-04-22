# ADR-007: Resilience Strategies — Retry, Timeout, Circuit Breaker, DLQ, Graceful Shutdown

- **Status:** aceito
- **Data:** 2026-04-18
- **Origem:** ACH-010 da auditoria de arquitetura (run `2026-04-18_18-17-50`), complementa ADR-003 (outbox + BullMQ) com decisões de resiliência que eram implícitas.

## Contexto

O sistema depende de serviços externos (WhatsApp Cloud API, DeepSeek, Resend, MercadoPago) que falham com frequência não-desprezível (timeouts, rate limits, 5xx, indisponibilidade momentânea). Sem política clara, cada adapter implementa seu próprio retry/timeout/circuit breaker, resultando em:

- Thresholds inconsistentes entre adapters.
- Difícil ajuste global em incidente.
- Sem garantia de continuidade dos jobs em-flight durante deploy/restart do worker.

ACH-009, ACH-008 e ACH-010 endereçaram a implementação; este ADR registra a decisão arquitetural por trás.

## Decisão

### 1. Retry

- **Estratégia:** backoff linear (`delay = baseDelayMs * (attempt+1)`).
- **Condição:** HTTP 5xx e 429 são retryable por default; outros status **não** são.
- **Max retries por default:** 2 (3 tentativas totais).
- **Centralização:** `packages/shared/src/resilience/retry.ts` expõe `RetryPolicy`, `withRetry`, `RetryExhaustedError`.
- **Overrides por provider:** `packages/shared/src/resilience/policies.ts` define `whatsappRetryPolicy` e `deepseekRetryPolicy` configuráveis via env vars (`WHATSAPP_MAX_RETRIES`, `DEEPSEEK_RETRY_DELAY_MS`, etc.).

### 2. Timeout

- **Estratégia:** `AbortController` com timeout por tentativa (não acumulativo).
- **Default:** 10s (WhatsApp), 30s (DeepSeek). Override por env var.
- **Implementação:** `createTimeoutSignal(policy)` retorna `{ signal, cancel }`. Adapter chama `cancel()` em `finally` para não vazar timers.

### 3. Circuit Breaker

- **Implementação:** `packages/shared/src/circuit-breaker.ts` (existente; mantido).
- **Thresholds:** WhatsApp 5 falhas em 60s abre; DeepSeek 3 falhas em 60s abre (mais agressivo porque falhas de LLM custam mais).
- **Fallback:** toda chamada de provider externo passa por `circuit.execute(fn, fallback)` com fallback que retorna resposta neutra (`{ success: false }` ou "[AI indisponível]").
- **Racional:** thresholds são **semânticos do provider** (custo de falha, probabilidade), não "operacionais" — ficam hardcoded nos adapters, podem ser movidos para `policies.ts` via env var futuramente sem breaking change.

### 4. DLQ (Dead Letter Queue)

- **Fila dedicada:** `wbc:dlq` no BullMQ.
- **Trigger:** `apps/worker/src/processors/dlq-scanner.ts` varre outbox a cada 60s; eventos com > 3 tentativas falhas migram para DLQ.
- **Processamento atual:** `apps/worker/src/processors/dlq-processor.ts` só **loga** o evento morto — sem retry manual automático e sem interface administrativa (follow-up documentado).
- **Roadmap:** expor endpoint de resgate (`POST /admin/dlq/:id/retry`) quando o impacto justificar.

### 5. Outbox Cleanup

- **Frequência:** diária (24h `setInterval` em `outbox-cleanup.ts`).
- **Critério:** remove eventos `processedAt != null` e mais velhos que N dias (padrão a definir; hoje mantém histórico integral).
- **Racional:** eventos processados são dados de auditoria curta-duração, não permanente — outbox é mecanismo de entrega, não histórico.

### 6. Graceful Shutdown (ACH-009)

- **Sinais:** `SIGTERM`, `SIGINT`.
- **Sequência:**
  1. Pausa os 5 BullMQ workers com `.pause(true)` (aguarda in-flight).
  2. Cancela os 3 `setInterval` (outbox/cleanup/DLQ).
  3. Fecha health server HTTP.
  4. `.close()` nos workers.
  5. `bullmqRedis.quit()`.
  6. `prisma.$disconnect()`.
  7. `process.exit(0)`.
- **Timeout:** 30s (configurável via `WORKER_SHUTDOWN_TIMEOUT_MS`). Se exceder, force `exit(1)`.
- **Lock:** previne shutdown duplicado se SIGTERM chegar duas vezes.

## SLOs propostos (pendente validação humana)

> ⚠️ Valores abaixo são propostas iniciais. Operação/produto deve validar.

| SLO                                | Target proposto                              | Observação                               |
| ---------------------------------- | -------------------------------------------- | ---------------------------------------- |
| Entrega de mensagens WhatsApp      | ≥ 99% dentro de 5 min do `cashback.expiring` | Depende de WhatsApp Cloud API            |
| Lag máximo do outbox (p95)         | ≤ 30s                                        | Usado em `/health/ready` (threshold 60s) |
| Uptime da API                      | ≥ 99.5% (MVP)                                | Single-host no MVP                       |
| Tempo de drain de worker em deploy | ≤ 30s                                        | WORKER_SHUTDOWN_TIMEOUT_MS               |

## Consequências

### Positivas

- Ajuste global de retry/timeout em incidente: mudar env var, redeployar — sem tocar em múltiplos adapters.
- Garantia at-least-once do outbox preservada em deploys/restarts (ACH-009).
- Padrão reproduzível para novos providers externos (SMS, Slack, etc.) — copiar template de WhatsApp adapter.
- Thresholds de SLO documentados abrem discussão com produto.

### Negativas

- Complexidade extra: adapters recebem policies via constructor (DI leve).
- Valores default precisam ser revisados quando SLA for acordado com clientes.
- Circuit breaker thresholds continuam hardcoded (não em env var) — intencional, mas pode ser revisitado.

## Alternativas consideradas

### Exponential backoff vs linear

- Exponential: `delay = base * 2^attempt`. Mais agressivo; útil quando o serviço demora para se recuperar.
- **Linear (escolhido):** previsível, fácil de raciocinar, suficiente para 2-3 retries. Se MAX_RETRIES subir > 5, reavaliar.

### Retry via BullMQ job retries vs retry no adapter

- BullMQ: delega retry para a fila (cada job que falhar é re-enfileirado com delay).
- **Adapter (escolhido):** retry dentro da mesma invocação para falhas transientes rápidas (rede), BullMQ retry para falhas mais persistentes. Duas camadas se complementam.

## Adendo — dois níveis de retry (ACH-009 confiabilidade-resiliencia, 2026-04-22)

Existe hoje três níveis de retry em operação; a tabela abaixo evita confusão em diagnóstico de incidente:

| Nível   | Onde                                    | Quando dispara                    | Backoff                                               | Propósito                                                                |
| ------- | --------------------------------------- | --------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------ |
| Adapter | `@wbc/shared/resilience/retry.ts`       | HTTP 5xx/429 em uma única chamada | Linear: `baseDelayMs * (attempt+1)`                   | Falhas transientes rápidas (rede, 502 momentâneo) — resolver em segundos |
| Outbox  | `PrismaOutboxRepository.markFailed`     | Handler lança erro                | Exponencial + jitter: `attempt² · 10s ±50%` (ACH-010) | Falhas persistentes que precisam de janela maior para se recuperar       |
| BullMQ  | `defaultJobOptions` em queues (ACH-003) | Job worker lança erro             | Exponencial: 5s, 10s, 20s                             | Backup para bugs transientes no handler ou adapter indisponível          |

**Regra de uso:**

- Use **retry do adapter** para erros de rede esperados (503, 429, connection reset).
- Confie no **retry do outbox** para erros persistentes (DB lock, provider fora do ar por minutos). Não multiplique por tentar no adapter.
- O **retry do BullMQ** cobre apenas jobs que não nascem do outbox (campanhas agendadas, analytics).
- Jitter está aplicado em outbox; WhatsApp retry não (linear curto) — intencional, mas pode ser uniformizado se padrões de incidente sugerirem.

Carga máxima amplificada (worst case): `adapter.maxRetries × outbox.maxAttempts × bullmq.attempts` — hoje ~3 × 5 × 3 = 45 tentativas totais por evento em falha completa. Não é cenário real (a maioria resolve no primeiro nível), mas serve de limite superior para dimensionar rate limit de provider externo.

## Links

- ADR-003 — Outbox Pattern + BullMQ
- ADR-008 — Worker Scaling & Job Affinity
- `packages/shared/src/resilience/` — implementação
- `packages/shared/src/circuit-breaker.ts` — implementação existente
- ACH-008, ACH-009, ACH-010 — Auditoria de arquitetura
