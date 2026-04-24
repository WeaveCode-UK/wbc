# Fluxos críticos — diagramas de sequência

> Criado pelo ACH-006 da auditoria `documentacao-runbooks/runs/2026-04-19_21-26-25`. Complementa `docs/ARCHITECTURE.md` (estático/containers) e `docs/architecture/events.md` (catálogo de eventos) com diagramas de **sequência em tempo real**.

Cada fluxo mostra:

- **Ator inicial** (consultora, cliente final, sistema).
- **Hops** entre `web`, `api`, Postgres, outbox, `worker`, provider externo.
- **Garantias** (atomicidade, idempotência, retry, fallback).

## Fluxo 1 — Criar venda

Quando a consultora confirma uma venda, a API grava `Sale` + `SaleItem` + decremento de `Inventory` + `OutboxEvent` numa **única transação Postgres**. O worker depois publica notificações sem bloquear a resposta.

```mermaid
sequenceDiagram
    autonumber
    actor Consultora
    participant Web as apps/web<br/>(tRPC handler)
    participant DB as PostgreSQL<br/>(sales + inventory + outbox)
    participant Worker as apps/worker
    participant Meta as Meta WA API

    Consultora->>Web: POST /trpc/sales.confirm
    Note over Web: Valida input (Zod)<br/>middleware: auth + tenant + backpressure

    Web->>DB: BEGIN
    Web->>DB: INSERT Sale, SaleItem[]
    Web->>DB: UPDATE Inventory (decrementa)
    Web->>DB: INSERT OutboxEvent<br/>topic=sales.confirmed
    Web->>DB: COMMIT
    Web-->>Consultora: 200 {saleId}

    Note over DB,Worker: Worker faz polling a cada 1s<br/>(ADR-003 outbox pattern)

    Worker->>DB: SELECT * FROM OutboxEvent<br/>WHERE status='PENDING'<br/>LIMIT 50 FOR UPDATE SKIP LOCKED
    DB-->>Worker: [sales.confirmed]

    Worker->>Worker: handler = salesConfirmedHandler
    Worker->>DB: INSERT ProcessedEvent(idempotencyKey)<br/>(retorna false se já existe)

    alt primeiro processamento
        Worker->>Meta: POST /messages (thank-you)
        alt sucesso
            Meta-->>Worker: 200 {messageId}
            Worker->>DB: UPDATE OutboxEvent<br/>SET status='PROCESSED'
        else erro (5xx ou timeout)
            Worker->>Worker: RetryPolicy (exp backoff)
            alt max attempts
                Worker->>DB: UPDATE OutboxEvent<br/>SET status='DLQ'
            end
        end
    else já processado (idempotencyKey duplicado)
        Worker->>DB: UPDATE OutboxEvent<br/>SET status='PROCESSED'<br/>(no-op)
    end
```

**Garantias:**

- **Atomicidade** — sale + inventory + outbox numa transação.
- **Idempotência** — `ProcessedEvent.idempotencyKey` previne double-notification em caso de retry do worker.
- **Back-pressure** — middleware em `sales.confirm` rejeita 503 quando outbox lag > 30s (ACH-006 performance-escalabilidade).
- **Circuit breaker** — chamadas à Meta Cloud API abrem o breaker após 5 falhas consecutivas (ADR-007 + `packages/shared/src/circuit-breaker.ts`).

## Fluxo 2 — Enviar campanha

Consultora dispara "Campanha Dia das Mães" para 2.000 clientes. O sistema não envia 2.000 mensagens síncrono — fan-out via eventos + fila BullMQ com throttle por tenant.

```mermaid
sequenceDiagram
    autonumber
    actor Consultora
    participant Web as apps/web
    participant DB as PostgreSQL
    participant BullMQ as Redis<br/>(wbc:messaging queue)
    participant Worker as apps/worker
    participant Meta as Meta WA API

    Consultora->>Web: POST /trpc/campaigns.launch<br/>{campaignId}
    Web->>DB: UPDATE Campaign SET status='QUEUED'
    Web->>DB: INSERT OutboxEvent<br/>topic=campaigns.launched
    Web-->>Consultora: 200 {estimatedRecipients}

    Worker->>DB: Poll outbox → [campaigns.launched]

    Note over Worker: fan-out handler
    Worker->>DB: SELECT CampaignRecipient<br/>WHERE campaignId = ?<br/>(2.000 linhas)

    loop para cada recipient (batch 100)
        Worker->>BullMQ: ADD job wbc:messaging<br/>{tenantId, recipient, template}<br/>delay = tenantThrottle(80/s)
    end
    Worker->>DB: UPDATE Campaign SET status='PROCESSING'
    Worker->>DB: UPDATE OutboxEvent SET status='PROCESSED'

    Note over BullMQ,Worker: Worker consome job-por-job<br/>(WORKER_CONCURRENCY=5 por réplica)

    loop para cada job (background)
        Worker->>BullMQ: Get next job
        Worker->>Worker: sendWhatsAppMessage()
        Worker->>Meta: POST /messages
        alt 429 (rate limit)
            Meta-->>Worker: 429
            Worker->>BullMQ: Reschedule job (backoff)
        else sucesso
            Meta-->>Worker: 200 {messageId}
            Worker->>DB: INSERT CampaignRecipient.sentAt
            Worker->>DB: INSERT OutboxEvent<br/>topic=messaging.sent<br/>(para billing — ACH-003 custos-finops)
        end
    end

    Worker->>DB: UPDATE Campaign SET status='COMPLETED'<br/>(quando última job for done)
```

**Garantias:**

- **Throttle por tenant** — não exceder 80 msg/s por tenant (limite Meta).
- **Persistência do progresso** — `CampaignRecipient.sentAt` permite retomar do ponto se o worker reiniciar.
- **Billing observável** — evento `messaging.sent` alimenta `MessageBilled` (ACH-003 custos-finops; pendente).

## Fluxo 3 — Aceitar convite de tenant

Consultora recebe link de convite, cria conta, e entra no workspace. Exige invalidação do token, criação de `Account`, `TenantMember` e `Session` — tudo atômico.

```mermaid
sequenceDiagram
    autonumber
    actor NovoConsultor
    participant Web as apps/web<br/>(/invite/[token])
    participant NextAuth as next-auth<br/>(apps/web/src/lib/auth.config.ts)
    participant DB as PostgreSQL

    NovoConsultor->>Web: GET /invite/abc123
    Web->>DB: SELECT TenantInvite<br/>WHERE token=abc123<br/>AND status='PENDING'<br/>AND expiresAt > now()
    alt inválido ou expirado
        DB-->>Web: []
        Web-->>NovoConsultor: 410 Gone<br/>"convite expirou"
    else válido
        DB-->>Web: TenantInvite
        Web-->>NovoConsultor: render form (email, senha)

        NovoConsultor->>Web: POST /api/auth/accept-invite<br/>{email, password, token}
        Web->>DB: BEGIN

        Web->>DB: INSERT Account(email, passwordHash)
        Web->>DB: INSERT TenantMember(<br/>  tenantId,<br/>  accountId,<br/>  role=CONSULTOR)
        Web->>DB: UPDATE TenantInvite<br/>SET status='ACCEPTED',<br/>acceptedAt=now()
        Web->>DB: INSERT OutboxEvent<br/>topic=team.member_joined

        Web->>DB: COMMIT
        Web->>NextAuth: signIn('credentials', {email, password})
        NextAuth->>DB: SELECT Account + TenantMember
        NextAuth->>DB: INSERT Session
        NextAuth-->>Web: {sessionToken}

        Web-->>NovoConsultor: 302 → /onboarding
    end
```

**Garantias:**

- **Atomicidade** — account + tenantMember + invite + outbox numa transação.
- **Não double-join** — `(tenantId, accountId)` é UNIQUE em `TenantMember`.
- **Audit trail** — `team.member_joined` event é consumido por `authAuditLog` handler (ACH-020 seguranca).
- **Idempotência do sign-in** — se o POST for retry (timeout no cliente), a transação falha no `INSERT Account` (email UNIQUE) e o fluxo volta ao form.

## Atualizando estes diagramas

Quando mudanças no fluxo afetarem estes diagramas:

1. Edite o Mermaid diretamente aqui.
2. Rode `pnpm -w exec mermaid-cli -i docs/architecture/flows.md -o /tmp/test.svg` para validar que o diagrama é parseável (opcional local).
3. No PR, inclua screenshot ou link para preview GitHub do Mermaid.
4. Atualize o rodapé desta seção (`Última revisão`).

## Referências

- Overview arquitetural: `docs/ARCHITECTURE.md`.
- Catálogo de eventos: `docs/architecture/events.md`.
- ADRs: `docs/adr/003-outbox-pattern-bullmq.md`, `docs/adr/007-resilience-strategies.md`.
- Achado origem: `Auditoria/documentacao-runbooks/runs/2026-04-19_21-26-25/achados.md#ACH-006`

---

_Última revisão: 2026-04-24 · Próxima revisão esperada: 2026-07-24_
