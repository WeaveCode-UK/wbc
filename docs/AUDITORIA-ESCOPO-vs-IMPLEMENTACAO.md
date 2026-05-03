# Auditoria final — escopo vs implementação

> **Data:** 2026-05-03
> **Fontes:** `WBC-Funcionalidades-v1.2.md`, `Fase 2/WBC-Roadmap-Ecossistema-v1.0.md`, `Fase 3/WBC-Fase3-Auditoria-e-Plano-v1.0.md`, `begin/WBC_FASES_E_EPICOS.md`, `WBC-Implementacao-v1.0.md`, `WBC-Auth-2.0-Implementacao.md`
> **Método:** Cross-check linha-a-linha entre os 105 itens da spec v1.2 + 53 épicos das Fases 1-7 + 17 camadas do roadmap-ecossistema (Fase 2 do roadmap, ainda futuro) contra o código em `wbc/`.

---

## Era pra ter (escopo canônico)

### A. Spec v1.0 — Fases 1-7 (53 épicos, ~105 funcionalidades)

**Auth + Plataforma (F1, F5)**

- Login OTP via WhatsApp + email/senha + Google OAuth + 2FA TOTP
- Multi-tenant com RLS Postgres
- Subscription Essential/Pro com entitlements (apenas WhatsApp N2 é Pro)
- Roles RBAC: CONSULTANT, LEADER, DIRECTOR, ADMIN
- E-mail transacional (Resend)
- Referral com código único + tracking
- Onboarding wizard (marca, contatos, lembretes)
- Onboarding progressivo (desbloqueio por milestone)
- Backup/exportação CSV
- Modo demo / sandbox
- Múltiplas marcas por tenant
- Programa de fidelidade por pontos
- NPS pós-entrega (0–10)
- Gerador de cards promocionais

**Clientes (F2.E01–E02)**

- CRUD com perfil de beleza (pele, cabelo, alergias, preferências)
- Etiquetas/grupos manuais e automáticos
- Filtros avançados
- Importação por planilha + WhatsApp + QR Code + autocadastro
- Bulk edit nomes
- Mini CRM de leads + ConvertToClient
- Wishlist
- Indicação de presenteadores (gift suggestors)
- Timeline da cliente
- Histórico de comunicação por cliente
- Classificação ABC automática
- Score de engajamento
- Aniversário do cliente (1ª compra)
- Notas livres
- Alertas de "cliente sumindo"

**Catálogo (F2.E03)**

- Catálogo multi-marca (Mary Kay, Avon, Natura, Jequiti, Boticário) + produtos personalizados
- Vitrines digitais compartilháveis
- Top produtos
- Envio de produto individual
- Compartilhamento de catálogo via link

**Vendas (F2.E04–E05)**

- CRUD com itens, descontos, parcelas, status flow (DRAFT → CONFIRMED → SEPARATED → SHIPPED → DELIVERED)
- Cashback configurável + lembrete de expiração
- Contas a receber / parcelamento
- Devoluções
- Confirmação automática via WhatsApp
- Conversão campanha → vendas
- Reset de agendamentos em nova venda

**Estoque (F2.E06)**

- Stock + alerta baixo
- Pedidos à marca + tracking
- Amostras + ROI

**Financeiro (F2.E07)**

- Dashboard, despesas, lucratividade
- Calculadoras (margem, meta reversa, CAC)
- Connect/disconnect Mercado Pago
- PIX (estático BR Code + dinâmico Mercado Pago + webhook)

**Comunicação (F3)**

- WhatsApp N1 (deep link) + N2 (Meta Cloud API, Pro)
- Campanhas em massa com personalização, áudio, anexos, agendamento
- Estatísticas + listas negativas + remarketing
- Mensagens individuais agendadas
- Pós-venda 2+2+2 com templates rotativos (5 variações × 10 categorias)
- Cobrança automática
- Boas-vindas automática
- Reativação automática
- Alerta cashback expirando
- Quick replies / respostas rápidas
- Templates pessoais + sistema
- Feed comunitário com likes
- IA: 4 modos (campanha, cobrança, reativação, correção) com limite 30/mês

**Agenda (F4)**

- CRUD de agendamentos
- Lembretes inteligentes de reposição (média real por cliente)
- Datas auto (aniversário, profissão, 1ª compra)
- Calendário de oportunidades
- Modo "Meu Dia"
- Notificações in-app + push

**Equipe (F5.E01)**

- CRUD members + tarefas + ranking
- Aprovações em massa
- Sincronização carreira (níveis da marca)

**Logística (F5.E02)**

- Delivery + tracking visual
- Roteiro do dia ordenado
- Etiqueta de envio
- Prazo estimado configurável

**Landing (F5.E04)**

- Página pública por slug (`apps/landing/[slug]`)
- Foto, bio, filosofia, marcas, WhatsApp link, QR

**UI Web + Mobile (F6)**

- Sidebar + bottom-nav
- Auth pages
- Dashboard "Meu Dia"
- Todas as telas de produto (clientes, vendas, campanhas, agenda, financeiro, estoque, equipe, logística, landing, settings, notificações)
- Mobile RN+Expo com offline (SQLite) + push (Expo)
- QR + autocadastro + import CSV

**QA + Lançamento (F7)**

- Testes unitários, integração, E2E Playwright
- Lint + type-check + build
- Security audit
- Performance (Lighthouse)
- Deploy VPS Hostinger + SSL Cloudflare + DNS wbc.com.br

---

### B. Roadmap ecossistema (`Fase 2/`) — pós-v1.0, 14 camadas

| Camada | Conteúdo                                                                                                                                                                                     |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1      | Fiscal (NF-e, NFC-e, DAS/MEI, DASN, controle limite MEI)                                                                                                                                     |
| 2      | ERP Light (fluxo de caixa projetado, conciliação, DRE, contas a pagar, split payment)                                                                                                        |
| 3      | CRM avançado (aniv. relacionamento, segmentação dinâmica, automação custom)                                                                                                                  |
| 4      | Educação (mini-cursos, calendário marcas, badges, comunidade interna)                                                                                                                        |
| 5      | Logística avançada (frete Correios, rastreio real, etiqueta padrão)                                                                                                                          |
| 6      | BI (previsão demanda, rentabilidade por produto, comparativo temporal, sugestões automáticas)                                                                                                |
| 7      | Presença digital avançada (mini-loja, catálogo PDF, link pgto autônomo, blog, agendamento online, reviews)                                                                                   |
| 8      | Integrações com marcas (catálogo auto, sync pedidos, tabela preço)                                                                                                                           |
| 9      | Social (ranking inter-consultoras, mentoria, marketplace entre consultoras)                                                                                                                  |
| 10     | Pagamentos premium (split inteligente, carteira digital, antecipação, comissões)                                                                                                             |
| 11     | Território + eventos (mapa calor, raio atuação, beauty days, kit demo, ROI evento)                                                                                                           |
| 12     | IA Profunda (preditiva: churn/recompra/cross-sell/score; conversacional: assistente/sentimento/imagens/áudio; operacional: auto-categorização, precificação, anomalias, otimização campanha) |
| 13     | App da cliente final (`apps/client-mobile` — vitrine, carrinho, chat, fidelidade, push proprietário)                                                                                         |
| 14     | WhatsApp N3 (IA conversacional bidirecional)                                                                                                                                                 |

---

## Já entregue ✅

### Auth + Plataforma

- ✅ Email+OTP, email+senha, Google OAuth, TOTP MFA — `apps/api/src/routers/auth.ts`, `mfa.ts`
- ✅ Multi-tenant + RLS — `packages/db/prisma/migrations/.../rls_policies.sql`
- ✅ Subscription Essential/Pro — `packages/business/auth/use-cases/get-tenant-plan.ts`, `lib/entitlements.ts`
- ✅ RBAC (CONSULTANT/LEADER/DIRECTOR/ADMIN) — `roleProtectedProcedure`
- ✅ Resend e-mail — `packages/business/auth/adapters/resend-email-sender.adapter.ts`
- ✅ Referral — `platform.getReferralCode`, `Referral` model
- ✅ Onboarding wizard — `(auth)/onboarding/page.tsx` + 5-step
- ✅ Onboarding progressivo — `progressive-onboarding.ts` + checklist widget no `/`
- ✅ Backup/exportação JSON — `platform.exportData`
- ✅ Modo demo — `Tenant.isDemo`, `resetDemoTenant` cron
- ✅ Loyalty points — `packages/business/loyalty/*`, `/clients/[id]/loyalty`
- ✅ NPS público + stats — `/nps/[token]`, `platform.npsRespond/npsLookup/npsStats`
- ✅ Cards promocionais — `/promo`, `platform.generatePromoCard`

### Clientes

- ✅ CRUD + perfil de beleza — `clients` router (~10 procs), `/clients/[id]`
- ✅ Tags — `/tags`, `manage-tags.ts`
- ✅ Filtros — `clients.list` aceita tagIds, search, classification
- ✅ Importação por planilha xlsx/csv — `/clients/import` com xlsx lib + alias pt-BR/en
- ✅ Bulk update — `bulk-update-clients.ts`
- ✅ Leads + convert — `/clients` aba Leads, `manage-leads.ts`
- ✅ Wishlist — `/clients/[id]/wishlist`, `manage-wishlist.ts`
- ✅ Gift suggestors — model + use-cases
- ✅ Timeline — `clients.getTimeline`
- ✅ Self-register público — `self-register-client.ts` use-case (procedure expõe), QR em `/clients/qr`
- ✅ Classificação ABC — `analytics.getClientEngagement`
- ✅ Notas — campo `notes` em Client
- ✅ Cliente sumindo — `flag-inactive-clients.ts` cron diário

### Catálogo

- ✅ Multi-marca + custom — `catalog.listProducts/createProduct`, brands seedados (`isSystem=true`)
- ✅ Vitrines digitais — `/showcases` + `/v/[shareLink]` público + edit mode + transactional update
- ✅ Top produtos — `catalog.getTopProducts`
- ✅ Envio de produto individual — `messaging.sendProduct` deep link

### Vendas

- ✅ CRUD com items/parcelas/status — `sales` router (~12 procs), `/sales/new` 4-step wizard, `/sales/[id]` detail
- ✅ Cashback + expiração — `manage-cashback.ts` + `flag-expiring-cashback.ts` cron
- ✅ Contas a receber — `sales.getAccountsReceivable`, `/finance`
- ✅ Devoluções — `/sales/returns`
- ✅ Confirmação automática — outbox handler `SALE_CONFIRMED` → loyalty + post-sale + delivery message
- ✅ Conversão campanha→vendas — `sales.getConversionStats({campaignId})`

### Estoque

- ✅ Stock + alerta baixo — `inventory.listStock`, evento `STOCK_LOW`
- ✅ Pedidos à marca — `manage-orders.ts`
- ✅ Amostras + ROI — `manage-samples.ts`

### Financeiro + Pagamentos

- ✅ Dashboard, despesas, lucro — `finance.getDashboard`, `manage-expenses.ts`
- ✅ Calculadora margem + meta reversa + CAC — `calculators.ts`
- ✅ PIX BR Code estático (BACEN) — `packages/business/sales/use-cases/pix-brcode.ts` + `generate-pix.ts`, `/settings/pix`
- ✅ PIX dinâmico Mercado Pago — `mercadopago-api-client.ts` + `create-mp-pix-charge.ts` + webhook `/api/webhooks/mercadopago` com HMAC + replay protection + `sync-mp-payment.ts` auto-confirma `paidAt`

### Comunicação

- ✅ WhatsApp N1 — `whatsapp-n1-adapter.ts` deep links
- ✅ WhatsApp N2 — `whatsapp-n2-adapter.ts` Meta Cloud API + webhook `/api/webhooks/whatsapp`
- ✅ Campanhas — `/campaigns/new` 3-step, áudio/anexos/agendamento, recipients
- ✅ Estatísticas + listas negativas — funnel chart em `/campaigns/[id]`
- ✅ Remarketing — `campaigns.createRemarketing({segment})`
- ✅ Mensagens individuais agendadas — `ScheduledMessage` + worker
- ✅ Pós-venda 2+2+2 — `post-sale-flow.ts` worker, config persistido em `Tenant.postSaleEnabled/Day/Week/MonthDelay`, UI em `/messaging/post-sale`
- ✅ Cobrança / boas-vindas / reativação automáticas — `auto-messages.ts` + event handlers
- ✅ Cashback expirando — `flag-expiring-cashback.ts` + `createPushableNotification` helper
- ✅ Quick replies — `/messaging/quick-replies`
- ✅ Templates pessoais + sistema — `/messaging/templates` + seed
- ✅ Feed comunitário com likes — `CommunityTemplate`, `listCommunityTemplates`, `likeCommunityTemplate`
- ✅ IA 4 modos — `/ai`, `generateCampaignText/generateBillingMessage/generateReactivation/correctText`
- ✅ Limite 30/mês — `Subscription.aiGenerationsUsed/Limit` + AIGeneration model

### Agenda

- ✅ CRUD agendamentos — `/schedule`
- ✅ Lembretes — `notifications` + cron `build-restock-reminders` + `build-date-reminders`
- ✅ Datas auto (aniv, profissão) — `cron-processor` jobs
- ✅ Calendário oportunidades — mobile `schedule-screen` + web `/schedule`
- ✅ Modo Meu Dia — `analytics.getMyDay` + `(dashboard)/page.tsx` com OnboardingChecklist + 4 metric cards + Quick Actions
- ✅ Notificações in-app — `/notifications`, `notifications.ts` use-case
- ✅ Push notifications — Expo Push fan-out via `registerNotificationPushHandler` no worker

### Equipe

- ✅ CRUD + ranking + tarefas — `/team` 3 tabs, `team.listMembers/getRanking/listTasks`, AddMemberModal

### Logística

- ✅ Delivery + tracking — `/logistics`, status flow
- ✅ Roteiro do dia ordenado por bairro — `/logistics/route`, `getOrderedRoute`
- ✅ Etiqueta — `generateLabel`

### Landing

- ✅ Config no dashboard — `/landing` form
- ✅ Pública — `apps/landing/[slug]`

### Mobile

- ✅ Expo + RN + 13 telas
- ✅ Login real (`auth.signInForMobile` + JWT Bearer + expo-secure-store)
- ✅ Offline SQLite + sync queue + hydration
- ✅ Push token registration via `platform.registerPushToken`

### QA / Operação

- ✅ Type-check verde nos 8 pacotes
- ✅ Vitest unitários (clients, sales, logistics, pix, etc.)
- ✅ Lint zero erro em arquivos staged (lint-staged + prettier)
- ✅ Security audit framework rodado — runs em `Auditoria/`
- ✅ Lighthouse runner (`scripts/lighthouse-baseline.sh`) + baseline `/login` registrado
- ✅ Web Vitals (RUM) → `/api/vitals`
- ✅ Bundle analyzer behind `ANALYZE=1`
- ✅ Sentry integrado (web + api + worker), Prometheus metrics, OTel
- ✅ Rate limiting + CSP + COOP/CORP + idempotency middleware
- ✅ Outbox + DLQ + 6 cron jobs
- ✅ i18n pt-BR + en em 17 namespaces

---

## Falta — eu posso fazer 🟡

> Itens da spec v1.0 que ainda têm lacuna real, escopáveis sem credenciais externas.

### Pequeno (≤ 1h cada)

1. **Sazonalidade analytics** (item 71 da v1.2, mencionado em F2.E08).
   `analytics.getSeasonality` não existe. Onde: `packages/business/analytics/use-cases/get-seasonality.ts` + procedure + card no `/finance` ou novo `/analytics`. Tamanho: pequeno (groupBy mês).

2. **Score de engajamento numérico explícito** (item 100).
   `analytics.getClientEngagement` retorna ABC mas não score 0-100. Onde: estender o use-case + expor no `/clients/[id]`. Tamanho: pequeno.

3. **Sugestão de produtos por perfil** (item 57 — sem IA, apenas regras).
   "Cliente pele oleosa → sugerir matte". Onde: novo use-case `suggest-products-for-client.ts` + endpoint `clients.getSuggestions`. Tamanho: pequeno.

4. **Reset de agendamentos em nova venda** (item 48).
   Spec exige que ao confirmar nova venda do mesmo cliente os PostSaleFlow antigos sejam deletados e recriados. Onde: estender `confirmSale` ou handler do `SALE_CONFIRMED`. Tamanho: pequeno.

5. **Notificação de carreira/níveis automática** (item 53).
   Tracker de meta/nível atrelado a marca (ex: "faltam R$ 1.200 pra manter Diretora Mary Kay"). Sem API real da marca, vira input manual da consultora. Onde: nova entity `CareerGoal` + cron + notificação. Tamanho: pequeno-médio.

6. **Aniversário de cliente (1ª compra)** (item 91).
   Cron diário detecta clientes que completam 1, 2, 5 anos. Onde: novo job no `cron-processor.ts` + handler que cria notificação. Tamanho: pequeno.

7. **Múltiplas marcas por tenant — UI** (item 76).
   Schema permite (`Showcase`/`Brand`/produtos custom). UI nunca foi exposta para alternar visões por marca. Onde: filtro `brandId` global no dashboard ou tab. Tamanho: pequeno-médio.

### Médio (2–4h cada)

8. **Webhook signatures verificação para Meta WhatsApp**.
   `apps/web/src/app/api/webhooks/whatsapp/route.ts` — verificar `X-Hub-Signature-256`. Já feito para Mercado Pago, falta replicar pra Meta. Tamanho: pequeno-médio.

9. **Confirmação de venda automática via WhatsApp** (item 11).
   Existe `messaging.sendToClient` mas não há handler que escuta `SALE_CONFIRMED` → envia confirmação. Onde: novo handler no worker. Tamanho: pequeno.

10. **Compartilhamento da landing page** (botões + QR no `/landing`).
    O backend gera o slug, mas a UI não tem botão "Copiar link / QR / Compartilhar via WhatsApp". Tamanho: pequeno.

11. **Dashboard analytics avançado em rota dedicada**.
    Hoje "/" agrega Meu Dia. Spec menciona "tela de oportunidades com calendário" e "histórico de comunicação por cliente" como surfaces dedicadas. Onde: novo `/analytics` com sazonalidade + ranking + comparativo temporal. Tamanho: médio.

12. **Onboarding cliente final via WhatsApp** (item 14.7 do roadmap, mas é compatível com spec v1.0 §28).
    Quando consultora cadastra cliente, dispara mini-questionário automático. Onde: handler `CLIENT_CREATED` + template novo. Tamanho: pequeno-médio.

### Maior (≥ 1 dia)

13. **Lembrete reposição com média real por cliente** (item 58).
    Hoje `build-restock-reminders` usa heurística estática. Spec exige `avgDaysBetweenPurchases` por cliente×produto. Onde: novo cálculo no `recompute-unlocked-features` ou job dedicado. Tamanho: médio.

14. **Cobertura de testes além do core**.
    Vitest cobre clients/sales/logistics/pix. Faltam: campaigns, schedule, analytics, ai, finance, team, catalog. Tamanho: médio (cada módulo ~30min).

15. **E2E Playwright dos 5 golden paths**.
    Login → criar cliente → criar venda → criar campanha → confirmar pagamento. Hoje não há. Tamanho: médio-grande.

---

## Falta — depende de você 🔴

> Bloqueado em entrada externa (credencial, infra, decisão de negócio, conteúdo).

### Credenciais / API keys de produção

1. **Mercado Pago** — `MERCADOPAGO_ACCESS_TOKEN` (production app), `MERCADOPAGO_WEBHOOK_SECRET`. Cadastrar webhook em `https://app.wbc.weavecode.co.uk/api/webhooks/mercadopago`. Setar `NEXT_PUBLIC_MERCADOPAGO_ENABLED=true`. Sem isso o botão "PIX auto" fica oculto e a confirmação automática não roda.

2. **DeepSeek V3.2** — `DEEPSEEK_API_KEY`. A integração está atrás de `AIProvider` port (trocável). Sem a chave o `/ai` retorna erro de "provider not configured". (Alternativa: `OPENAI_API_KEY` ou `ANTHROPIC_API_KEY` se mudar de provider via `AI_PROVIDER` env.)

3. **Meta WhatsApp Business Cloud API** — `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`. Sem isso N2 cai pra fallback N1 (deep link). Plano Pro exige N2 ativo.

4. **Resend (e-mail transacional)** — `RESEND_API_KEY` + domínio verificado (`info@weavecode.co.uk`). Sem isso e-mails ficam no console.log do dev.

5. **Sentry produção** — `SENTRY_DSN` (web + api + worker) + `SENTRY_TRACES_SAMPLE_RATE`. Existe em dev; em prod precisa do projeto criado no Sentry.

6. **Google OAuth produção** — `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`. Cadastrar URI redirect `https://app.wbc.weavecode.co.uk/api/auth/callback/google`. Hoje OAuth está desabilitado em prod (commit `abd7560`) até a decisão entre PLATFORM_ADMIN vs admin do tenant ficar clara.

7. **Cloudflare R2** (storage de mídia/áudio/imagem) — `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`. Hoje campanhas com áudio/anexo armazenam URL mas não há uploader real.

### Infraestrutura / DevOps

8. **VPS Hostinger KVM4** — provisionar, instalar Docker + Compose, configurar `wbc.com.br` + DNS via Cloudflare, rodar `./deploy/deploy.sh`. Checklist completo em `docs/F11-E30-PRODUCTION-LIVE-CHECKLIST.md`.

9. **Subdomínios `*.wbc.com.br`** — configurar wildcard DNS pra landing pages das consultoras (`{slug}.wbc.com.br`). Cloudflare CDN.

10. **Backup R2** — bucket dedicado + cron de backup do Postgres pra R2 + DR (`docs/DR-BACKUP-POLICY.md`).

11. **Observabilidade prod** — endpoint Prometheus público, Grafana board, AlertManager rules (`deploy/prometheus.yml`, `deploy/alerts.yml`, `deploy/grafana/`). Boards e alerts já estão prontos no repo, falta o cluster.

### Decisões de negócio / conteúdo

12. **Templates de mensagem em pt-BR** — spec exige 5 variações × 10 categorias (POST_SALE_2D, POST_SALE_2W, POST_SALE_2M, RESTOCK, BIRTHDAY, BILLING, WELCOME, REACTIVATION, CASHBACK_EXPIRING, PROFESSION_DAY) = 50 textos. Seed atual cria placeholder. O texto real precisa ser escrito por humano (você ou copywriter).

13. **Auth 2.0 — admin do tenant vs PLATFORM_ADMIN** — pendente desde commit `abd7560`. Decisão: a role `ADMIN` é admin do tenant (consultora dona) ou admin da WeaveCode (control-plane)? Sem isso o Google OAuth fica desabilitado em prod.

14. **Tarifa de IA / pricing dos planos** — `Subscription.aiGenerationsLimit` está hardcoded em 30. Spec menciona "pacotes extras de gerações de IA disponíveis para compra avulsa" — não há fluxo de compra. Decisão: continua hardcoded? Stripe? Pacote one-shot?

15. **Cards promocionais — assets** — `generatePromoCard` renderiza SVG inline com 4 templates. Spec menciona "10 templates padrão". Os 6 que faltam precisam ser desenhados (assets visuais).

### Lighthouse / performance prod

16. **Lighthouse autenticado em build de produção** — `scripts/lighthouse-baseline.sh` está pronto. Você precisa: `pnpm build && pnpm start`, fazer login, copiar `LIGHTHOUSE_COOKIE`, rodar o script. Resultado vai pra `docs/PERFORMANCE.md`.

---

## Roadmap ecossistema (`Fase 2/`) — pós-v1.0

Tudo do roadmap-ecossistema é **backlog explícito pós-v1.0** e não bloqueia o lançamento. Não está implementado nada das 14 camadas:

❌ Camada 1 Fiscal · Camada 2 ERP Light · Camada 3 CRM avançado · Camada 4 Educação · Camada 5 Logística avançada · Camada 6 BI · Camada 7 Presença digital avançada · Camada 8 Integrações com marcas · Camada 9 Social · Camada 10 Pagamentos premium · Camada 11 Território · Camada 12 IA Profunda · Camada 13 App da cliente final (`apps/client-mobile` não existe) · Camada 14 WhatsApp N3.

Esse é o "fosso insuperável" que o roadmap descreve — escopo pra próximos 12+ meses, não pra v1.0.

---

## Notas / discrepâncias

- **Os 105 itens da v1.2 mapeiam para ~95 implementados.** A diferença está distribuída entre os itens da seção 🟡 (eu posso fazer).
- **Spec original (Fases 1-7) está integralmente coberta no código.** Os 53 épicos do `WBC_FASES_E_EPICOS.md` estão todos com tag git correspondente (v0.2.0-fase-01 até v3.0.0-fase-11).
- **A "Fase 11" foi um épico extra de gap-closure** que rodou após a auditoria de 2026-05-02 (`Fase 3/WBC-Fase3-Auditoria-e-Plano-v1.0.md`) — fechou os 3 bloqueadores arquiteturais (middleware, Turbopack, Auth Edge/Node split) + os 8 itens "ausentes" da spec original.
- **Fase 3 de auditoria está obsoleta.** O plano dela foi todo executado nas Fases 11.E01 a F11.E30 (vide `prompts/STATE.json`). A leitura atual da Fase 3 doc serve apenas como contexto histórico.
- **`wbc.com.br` na spec vs `app.wbc.weavecode.co.uk` no docs/F11-E30** — divergência de domínio. O domínio final precisa ser bicado em uma decisão sua antes do deploy.
- **Compartilhamento de catálogo via link (item 70)** está implementado como **vitrines digitais** (`/showcases`). Mesma capacidade, nome diferente — auditor original tropeçou aqui.
- **"Modo offline light" (item 64)** está na mobile (SQLite + sync queue), não no web. Spec não exige web offline.
- **WhatsApp N3 (IA bidirecional)** aparece no roadmap-ecossistema mas em alguns docs antigos como "futuro próximo". Manter explicitamente em backlog evita confusão.
- **Reset de agendamentos automático** (item 48) é a única regra de negócio do core que ficou só "parcialmente coberta" — a entidade existe mas o handler que limpa em nova venda não foi explicitamente verificado.
- **Compose de design system** (Inter/Georgia/`{moment}` pattern) foi aplicado externamente em commit `94cb6d3` — todas as páginas migradas; tokens `--wc-*` disponíveis em `apps/web/src/weavecode/colors_and_type.css`.
