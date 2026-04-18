# Relatório Final da Auditoria

## Identificação
- dominio: apis-integracoes
- run_id: 2026-04-18_22-30-59
- status_run: ready_for_finalize
- iniciado_em: 2026-04-18 22:30:59
- finalizado_em: none
- ultima_atualizacao: 2026-04-18 22:40:00

## Objetivo da Run
Avaliar a qualidade de contrato, semântica, robustez operacional e segurança da superfície de integração do WBC Platform (tRPC 11 + webhooks + integrações WhatsApp/MercadoPago/DeepSeek/Resend/Google OAuth + BullMQ outbox).

## Escopo Executado
- Inventário: 16 routers tRPC (auth, sales, clients, catalog, inventory, finance, analytics, campaigns, ai, messaging, schedule, team, logistics, landing, platform, health); 3 queues BullMQ (analytics, campaigns, messaging); adapters DeepSeek, WhatsApp N1/N2, Resend (stub), MercadoPago (stub)
- Contratos: schemas Zod em `packages/validators` vs inline em routers; envelope de response; paginação; filtros/ordenação; datas; IDs
- Erros/idempotência/versionamento: `idempotency-middleware`, `error-handler`, ausência de versionamento e deprecation path
- Webhooks/eventos: `whatsapp-webhook-handler`, outbox-service/event-publisher, jobs BullMQ, DLQ
- Segurança de API: BOLA via tenant middleware, paginação, rate-limit por rota

## Escopo Nao Coberto ou Parcial
- Apps/mobile consumer (verificou-se apenas via tipos compartilhados)
- Testes de contrato end-to-end (não há suite relevante — cross-ref `testes-qualidade`)
- Fine-tuning de performance dos endpoints (cross-ref `performance-escalabilidade`)
- Validação empírica contra as APIs externas (requer sandbox)

## Resumo Executivo
A camada de API do WBC Platform usa tRPC 11 de forma consistente e já adota algumas boas práticas (multi-tenant via middleware Prisma, mapeamento de domain errors, superjson, `paginationSchema` com `max 100`). No entanto, a run identificou 2 achados críticos e 7 altos que, juntos, comprometem a previsibilidade e a confiabilidade da superfície de integração: (1) idempotência é *opt-in* e só está aplicada em `sales` e `finance` — toda outra mutation crítica é vulnerável a duplicidade em caso de retry; (2) não existe versionamento nem deprecation path — remover um campo do schema quebra mobile imediatamente; (3) webhooks inbound (WhatsApp, MercadoPago) não têm rotas HTTP declaradas ou handler MP; (4) webhook WhatsApp não possui proteção contra replay; (5) eventos do outbox e jobs BullMQ não têm schema/namespace/versão; (6) adapters externos têm timeout/retry inconsistentes e não enviam chaves de idempotência para os provedores; (7) response shape é heterogêneo entre routers, prejudicando o SDK tipado e a experiência do consumidor. A avaliação geral é `preocupante`: com correções dirigidas em idempotência, versionamento, webhooks e envelopes, o domínio pode rapidamente avançar para `aceitavel_com_ressalvas`.

## Principais Achados
1. ACH-001 (critico) idempotência aplicada só em sales/finance
2. ACH-002 (critico) sem versionamento e sem breaking-change policy
3. ACH-003 (alto) webhooks inbound sem rotas HTTP declaradas (WhatsApp + MP)
4. ACH-004 (alto) webhook WhatsApp sem replay protection
5. ACH-005 (alto) `AppRouter` sem deprecation path
6. ACH-006 (alto) response shape heterogênea
7. ACH-011 (alto) outbox sem schema/namespace/versionamento
8. ACH-015 (alto) timeout/retry inconsistentes em adapters
9. ACH-016 (alto) sem idempotência outbound
10. ACH-020 (alto) DLQ só loga — sem alerta/replay

## Distribuicao por Severidade
- critico: 2
- alto: 8
- medio: 9
- baixo: 1
- informativo: 0

## Riscos Prioritarios
1. **Duplicidade em retries**: sem idempotência universal, retries do cliente (ou do BullMQ) duplicam eventos, mensagens e, quando o MP for conectado, cobranças. Bloqueador para produção.
2. **Breaking silenciosos**: sem versionamento e sem deprecation, um campo removido no backend derruba o mobile/web; rollbacks exigem hot-fix.
3. **Webhooks e eventos frágeis**: handlers inbound não declarados, ausência de replay protection e falta de contrato de evento levam a estado divergente entre sistemas.
4. **Integrações externas travando workers**: `fetch` sem timeout em adapters auxiliares mantém conexões abertas e bloqueia jobs; DLQ cresce sem alerta.
5. **Consumidores sem sinal de retry/circuit**: cliente não sabe quando retry é seguro; sem header `Retry-After`/`X-Circuit-Open`, retry cego amplifica problemas.

## Recomendacoes Prioritarias
1. Tornar idempotência obrigatória em todas as mutations `create`/`confirm`/`send`/`mark` — middleware valida presença do header `idempotency-key`; mobile gera ULID automaticamente (ACH-001).
2. Implementar versionamento: campo `Api-Version` no `ctx` + resposta `health.version` com lista de versões suportadas; marcar campos com `@deprecated` e manter por ≥1 MAJOR (ACH-002, ACH-005).
3. Criar rotas Next.js para webhooks inbound (`/api/webhooks/{whatsapp,mercadopago}/route.ts`) com verificação de assinatura + replay protection (timestamp ±300s e cache de request-id) (ACH-003, ACH-004).
4. Padronizar envelope de response: `{ success, data, error?, meta? }` com helpers `ok(data)` / `fail(code)`; lista sempre com `meta.{page, limit, total, hasMore}` (ACH-006, ACH-007).
5. Centralizar schemas Zod em `@wbc/validators` e proibir `z.object` em routers via ESLint (ACH-008, ACH-009, ACH-010).
6. Introduzir `packages/shared/src/events/schemas.ts` e `packages/shared/src/jobs/schemas.ts` com `discriminatedUnion` e versionamento `{module}.{action}.{vN}`; publisher e consumer validam (ACH-011, ACH-012).
7. Criar `packages/shared/src/http/client.ts` com `fetchWithTimeout` + retry/backoff unificado; todos os adapters usam; default 10s por chamada; inclui header de `idempotency-key` quando aplicável (ACH-015, ACH-016).
8. Completar `mapDomainErrorToTRPC()` e documentar mapeamento; adicionar header `Retry-After` quando aplicável e `X-Circuit-Open` para sinalizar estado ao cliente (ACH-013).
9. Reforçar DLQ: alerta para Sentry/Slack, CLI `audkit-dlq replay`, painel no Grafana com contagem por tipo (ACH-020).
10. Limitar `page` a ≤1000 e restringir `limit` em endpoints caros (analytics, relatórios) para ≤20 (ACH-018); validar shape das respostas externas com Zod (ACH-019); garantir inicialização do `event-publisher` em `bootstrap()` com gate em `health.ready` (ACH-017).

## Avaliacao Geral do Dominio
- avaliacao: preocupante

Justificativa: a fundação é sólida (tRPC tipado, multi-tenant, outbox), mas a ausência de idempotência universal, versionamento e contratos de evento/webhook cria risco real de duplicidade e quebra silenciosa no curto prazo.

## Prontidao para Encerramento
- pronto_para_finalizar: sim
- justificativa: todas as 7 fases concluídas; 20 achados consolidados; relatório final preenchido; sem bloqueios abertos.

## Observacoes Finais
- ACH-001 e ACH-016 compartilham raiz com ACH-001 (seguranca) — todos envolvem o módulo de auth/mensageria.
- ACH-011 e ACH-012 tocam o domínio `arquitetura` (já auditado) e `observabilidade-operacao`.
- ACH-018 e ACH-020 interagem com `performance-escalabilidade` e `observabilidade-operacao`.
- A introdução de `packages/shared/src/http/client.ts` é um quick-win: fecha ACH-015, ACH-016 e ACH-019 com baixo esforço.
