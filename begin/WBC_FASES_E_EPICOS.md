# WBC Platform — Documento de Fases e Épicos

> **Versão:** 1.0
> **Data:** 20/03/2026
> **Base:** WBC-Funcionalidades-v1.2, WBC-Arquitetura-Tecnica-v1.0, WBC-Implementacao-v1.0
>
> Este documento define TODAS as fases de implementação do WBC Platform, com épicos numerados, critérios de conclusão (DoD) e dependências. O produto será lançado COMPLETO — sem MVP, sem cortes.
>
> **Convenções:**
> - Cada épico: `F{fase}.E{número}` (ex: `F1.E01`)
> - Dependências: épicos anteriores que devem estar concluídos
> - DoD: critérios técnicos verificáveis
> - Referências: `[Doc Impl §X]` = WBC-Implementacao-v1.0, Seção X
> - Referências: `[Doc Arq §X]` = WBC-Arquitetura-Tecnica-v1.0, Seção X
> - Referências: `[Doc Func §X]` = WBC-Funcionalidades-v1.2, item X
>
> **REGRA:** Sem testes durante construção (Fases 1-6). Testes na Fase 7.
> **REGRA:** Sem gates entre épicos. Type-check apenas entre fases.
> **REGRA:** Ao concluir cada épico → merge → próximo épico. NÃO PARAR.

---

# FASE 1 — FUNDAÇÃO (Auth + Tenant + Infra Base)

> **Objetivo:** Construir toda a base técnica: autenticação, multi-tenancy com RLS, cache Redis, event bus, observabilidade, e-mail. Nenhuma feature de negócio ainda.
> **Depende de:** Bootstrap executado com sucesso (v0.1.0-bootstrap)
> **Épicos:** 8 (7 de implementação + 1 checkpoint)

---

### F1.E01 — Autenticação: Auth.js + OTP via WhatsApp

**Descrição:** Implementar autenticação completa com Auth.js. Login via OTP enviado por WhatsApp (sem senha). JWT com claims de tenant.

**Referência:** [Doc Func §59, §63] [Doc Impl §1 — Tenant, User, OtpCode, Subscription]

**Ações:**
- Configurar Auth.js v5 em apps/web
- Implementar provider de credentials (phone + OTP code)
- Gerar OTP de 6 dígitos, salvar em tabela OtpCode com expiração de 5 minutos
- Enviar OTP via console.log no dev (integração WhatsApp real vem na Fase 3)
- JWT com claims: sub (userId), tid (tenantId), role, plan, locale, timezone
- Middleware Next.js para proteger rotas autenticadas
- Página de login (phone input → enviar OTP → verificar código)
- Página de registro (nome, phone → criar tenant + user → enviar OTP → verificar)
- Configurar session callback para expor tenant context ao client

**Dependências:** Bootstrap (TASK 07 — Prisma schema, TASK 09 — Next.js app)

**DoD:**
- [ ] Login via phone + OTP funcional
- [ ] Registro de novo tenant + user funcional
- [ ] JWT contém todas as claims (sub, tid, role, plan, locale, timezone)
- [ ] Rotas protegidas redirecionam para login
- [ ] OTP expira após 5 minutos
- [ ] OTP é uso único (invalidado após verificação)

---

### F1.E02 — Multi-Tenancy: RLS e Tenant Context

**Descrição:** Implementar isolamento de dados por tenant via Row-Level Security no PostgreSQL e middleware de injeção de tenant context.

**Referência:** [Doc Arq §1 — Multi-Tenant]

**Ações:**
- Criar SQL de RLS policies para todas as tabelas com tenantId
- Criar middleware Prisma que injeta tenantId automaticamente em toda query
- Criar TenantContext via AsyncLocalStorage (ou similar) para propagar tenantId
- Middleware tRPC que extrai tenantId do JWT e injeta no contexto
- Verificar que queries sem tenantId são bloqueadas pelo RLS
- Criar helper `withTenant(tenantId)` para uso no worker (que não tem JWT)

**Dependências:** F1.E01 (auth funcional, JWT com tid)

**DoD:**
- [ ] RLS policies ativas em todas as tabelas com tenantId
- [ ] Middleware Prisma injeta tenantId automaticamente
- [ ] Query sem tenantId retorna zero resultados (RLS bloqueia)
- [ ] Worker consegue executar queries com `withTenant()`
- [ ] TenantContext propaga corretamente em toda a stack

---

### F1.E03 — Redis: Conexão, Cache Helpers, e Health Check

**Descrição:** Conexão Redis singleton, helpers de cache tipados, health check endpoint.

**Referência:** [Doc Impl §1 — Stack: Redis]

**Ações:**
- Criar módulo de conexão Redis singleton com ioredis (apps/api e apps/worker)
- Helpers tipados: cacheGet<T>, cacheSet<T>, cacheDelete, cacheInvalidatePattern
- Prefixo automático `wbc:` em todas as chaves
- TTLs padrão configuráveis via constantes
- Health check endpoint `/api/health/redis`

**Dependências:** Bootstrap (TASK 08 — Docker Compose com Redis)

**DoD:**
- [ ] Conexão Redis funcional com reconnect automático
- [ ] Helpers de cache tipados funcionando
- [ ] Health check respondendo
- [ ] Prefixo `wbc:` em todas as chaves

---

### F1.E04 — Event Bus: BullMQ + Outbox Pattern

**Descrição:** Implementar sistema de eventos entre módulos via BullMQ com Outbox pattern para garantia de entrega.

**Referência:** [Doc Arq §1 — Comunicação entre Módulos] [Doc Impl §2 — Domain Events]

**Ações:**
- Criar tabela `outbox_events` no Prisma schema (id, type, tenantId, payload, status, createdAt, processedAt)
- Criar service `OutboxService` que salva evento na tabela outbox dentro da mesma transação do negócio
- Criar worker `OutboxProcessor` que lê eventos pendentes e publica no BullMQ
- Criar `EventPublisher` que abstrai o outbox (os módulos usam `publish(event)` sem saber do outbox)
- Criar `EventSubscriber` que registra handlers por tipo de evento
- Idempotência: cada handler verifica se já processou o evento (por event.id)
- DLQ: eventos que falham 3 vezes vão para fila `wbc:dlq`
- Registrar todas as filas definidas no Bootstrap (messaging, campaigns, schedule, analytics, outbox)

**Dependências:** F1.E03 (Redis funcional)

**DoD:**
- [ ] Outbox pattern funcional (evento salvo + publicado)
- [ ] EventPublisher abstrai o outbox
- [ ] EventSubscriber registra handlers por tipo
- [ ] Idempotência implementada
- [ ] DLQ configurada
- [ ] Worker de outbox processa eventos pendentes

---

### F1.E05 — Observabilidade: Logging + Sentry + OpenTelemetry Base

**Descrição:** Logging estruturado com Pino, error tracking com Sentry, tracing base com OpenTelemetry.

**Ações:**
- Configurar Pino em todos os apps (api, worker, web) com formato JSON em prod e pretty em dev
- Integrar Sentry para error tracking (apps/web e apps/api)
- Configurar OpenTelemetry base (tracing de requests)
- Logger NUNCA loga PII (phone, email, name) — apenas IDs
- Criar middleware de request logging para tRPC (method, duration, status, tenantId)

**Dependências:** F1.E01 (auth — pra ter tenantId nos logs)

**DoD:**
- [ ] Logs estruturados em todos os apps
- [ ] Sentry captura erros não tratados
- [ ] Request logging com tenantId, method, duration
- [ ] Zero PII nos logs

---

### F1.E06 — Subscription e Entitlements

**Descrição:** Implementar gestão de planos (Essential/Pro) e controle de features por entitlements.

**Referência:** [Doc Func — Planos]

**Ações:**
- CRUD de Subscription (criar com tenant, mudar plano, verificar status)
- Middleware/guard `requirePlan('PRO')` para proteger features exclusivas do Pro
- Helper `canUseFeature(tenantId, feature)` que verifica o plano
- Features controladas por plano: APENAS WhatsApp N2 (API Meta). Todo o resto é desbloqueado.
- Cache de entitlements no Redis (TTL 300s) para evitar query no banco a cada request
- Invalidação de cache ao mudar de plano

**Dependências:** F1.E01 (auth), F1.E02 (tenant), F1.E03 (Redis)

**DoD:**
- [ ] Subscription criada automaticamente ao registrar tenant
- [ ] Guard `requirePlan` bloqueia acesso a features Pro para plano Essential
- [ ] Cache de entitlements funcional
- [ ] Mudança de plano invalida cache

---

### F1.E07 — E-mail Base: Resend ou Nodemailer

**Descrição:** Configurar envio de e-mails transacionais (confirmação de conta, OTP fallback, notificações internas).

**Ações:**
- Configurar provider de e-mail (Resend em prod, console.log em dev)
- Criar `EmailService` com port abstrato (trocável)
- Templates base: welcome, otp_code, sale_confirmation
- Templates em HTML simples com variáveis ({{name}}, {{code}}, etc.)
- Templates bilíngues (pt-BR e en)

**Dependências:** F1.E01 (auth — para e-mails de OTP)

**DoD:**
- [ ] EmailService funcional com provider abstrato
- [ ] Templates de e-mail base criados em pt-BR e en
- [ ] E-mails enviados em dev via console.log
- [ ] Variáveis substituídas nos templates

---

### F1.E08 — Checkpoint Fase 1

> **⚠️ CHECKPOINT — NÃO é épico de implementação.**
> O Orchestrator NÃO gera prompt para checkpoints. Executa type-check + tag diretamente em main.
> NÃO criar branch para checkpoints.

**Ações:**
```bash
git checkout main
pnpm install
pnpm type-check
# Se falhar: corrigir, max 3 tentativas, depois BLOCKED
git tag v0.2.0-fase-01
```

**DoD:**
- [ ] type-check passa com zero erros
- [ ] Tag v0.2.0-fase-01 criada
- [ ] STATE.json atualizado (phase 1 = COMPLETED, mode = ARCHITECT)

---

# FASE 2 — CORE DE NEGÓCIO (Clientes + Catálogo + Vendas + Estoque + Financeiro)

> **Objetivo:** Implementar os módulos centrais de negócio: cadastro de clientes com perfil de beleza, catálogo multi-marca, vendas completas com cashback, estoque, e financeiro básico.
> **Depende de:** Fase 1 completa
> **Épicos:** 10 (9 de implementação + 1 checkpoint)

---

### F2.E01 — Módulo Clients: Domain + Ports

**Descrição:** Camada de domínio e portas do módulo de clientes.

**Referência:** [Doc Impl §1 — Client, Tag, ClientTag, ClientWishlist, GiftSuggestor] [Doc Func §18-30]

**Ações:**
- Criar entities: Client, Tag, ClientTag, GiftSuggestor
- Criar value objects: PhoneNumber, SkinType, HairType, Classification
- Criar ports: ClientRepository, TagRepository
- Criar domain errors: ClientNotFound, DuplicatePhone, InvalidTag
- Criar domain events: CLIENT_CREATED, CLIENT_UPDATED, CLIENT_TAGGED, CLIENT_GOING_INACTIVE

**Dependências:** F1.E02 (multi-tenancy)

**DoD:**
- [ ] Entities com validações de domínio
- [ ] Ports definidos como interfaces TypeScript
- [ ] Domain events tipados
- [ ] Zero dependência externa no domain/

---

### F2.E02 — Módulo Clients: Use Cases + Adapters + Router

**Descrição:** Use cases, adapters Prisma, e tRPC router do módulo de clientes.

**Ações:**
- Use cases: CreateClient, UpdateClient, DeleteClient, ListClients, GetClientById, ImportContacts, ImportFromSpreadsheet, BulkEditNames, GetTimeline, GetCommunicationHistory
- Use cases de tags: CreateTag, DeleteTag, TagClient, UntagClient, BulkTag, ListTags
- Use cases de leads: ListLeads, ConvertToClient
- Use cases extras: AddToWishlist, RemoveFromWishlist, AddGiftSuggestor, RemoveGiftSuggestor, GetQrCode, SelfRegister
- Adapter: PrismaClientRepository (implementa ClientRepository port)
- tRPC router: clients.router com todas as procedures conforme [Doc Impl §3 — clients.router]
- Todas as queries com tenantId obrigatório

**Dependências:** F2.E01

**DoD:**
- [ ] Todos os use cases implementados
- [ ] Adapter Prisma funcional
- [ ] tRPC router com todas as procedures
- [ ] tenantId em toda query

---

### F2.E03 — Módulo Catalog: Completo

**Descrição:** Módulo completo de catálogo: marcas, produtos, vitrines, compartilhamento.

**Referência:** [Doc Impl §1 — Brand, Product, Showcase, ShowcaseProduct] [Doc Func §31-38]

**Ações:**
- Domain: entities (Brand, Product, Showcase), ports (ProductRepository, BrandRepository)
- Use cases: ListBrands, ListProducts, CreateProduct, UpdateProduct, DeleteProduct, SendToClient, CreateShowcase, UpdateShowcase, DeleteShowcase, GetPublicShowcase, GetTopProducts
- Adapters: Prisma repositories
- tRPC router: catalog.router conforme [Doc Impl §3]
- Seed de brands padrão do sistema (Mary Kay, Avon, Natura, Jequiti, Boticário) com isSystem=true

**Dependências:** F1.E02 (tenant), F2.E01 (clients — para envio de produto a cliente)

**DoD:**
- [ ] Brands de sistema seedadas
- [ ] CRUD completo de produtos
- [ ] Vitrines com compartilhamento via link
- [ ] Router completo

---

### F2.E04 — Módulo Sales: Domain + Ports

**Descrição:** Camada de domínio do módulo de vendas.

**Referência:** [Doc Impl §1 — Sale, SaleItem, Payment, Cashback, Return] [Doc Func §27-34]

**Ações:**
- Entities: Sale, SaleItem, Payment, Cashback, Return
- Value objects: SaleStatus, PayMethod, PayStatus
- Ports: SaleRepository, PaymentRepository, CashbackRepository
- Domain events: SALE_CREATED, SALE_CONFIRMED, SALE_DELIVERED, SALE_CANCELLED, SALE_STATUS_CHANGED, PAYMENT_RECEIVED, PAYMENT_OVERDUE, CASHBACK_GENERATED, CASHBACK_USED
- Business rules: cashback calculation, installment generation, delivery date logic

**Dependências:** F2.E01 (clients)

**DoD:**
- [ ] Entities com regras de negócio (cálculo cashback, parcelas)
- [ ] Ports definidos
- [ ] Events tipados

---

### F2.E05 — Módulo Sales: Use Cases + Adapters + Router

**Descrição:** Use cases, adapters, e router de vendas.

**Ações:**
- Use cases: CreateSale, UpdateSale, ConfirmSale, CancelSale, UpdateSaleStatus, ListSales, GetSaleById
- Use cases pagamento: ListPayments, MarkPaid, GeneratePix
- Use cases cashback: GetCashbackBalance
- Use cases extra: CreateReturn, GetAccountsReceivable, GetConversionStats
- Adapters: Prisma repositories
- tRPC router: sales.router conforme [Doc Impl §3]
- Ao confirmar venda: emitir evento SALE_CONFIRMED (consumido por messaging, schedule, inventory, analytics)
- Lógica de rascunho: venda com status DRAFT não emite eventos

**Dependências:** F2.E04, F1.E04 (event bus)

**DoD:**
- [ ] Fluxo completo: criar → confirmar → entregar
- [ ] Cashback calculado e gerado automaticamente
- [ ] Parcelas geradas corretamente
- [ ] Eventos emitidos ao confirmar/cancelar/entregar
- [ ] Rascunhos funcionam sem emitir eventos

---

### F2.E06 — Módulo Inventory: Completo

**Descrição:** Estoque, pedidos à marca, amostras, alerta de estoque baixo.

**Referência:** [Doc Impl §1 — Stock, BrandOrder, BrandOrderItem, Sample] [Doc Func §38-43]

**Ações:**
- Domain: entities, ports, events (STOCK_LOW, STOCK_DEPLETED, BRAND_ORDER_RECEIVED)
- Use cases: ListStock, UpdateStock, AdjustStock, ListOrders, CreateOrder, ReceiveOrder, CancelOrder, ListSamples, CreateSample, MarkSampleConverted, GetSampleROI
- Adapters: Prisma repositories
- tRPC router: inventory.router
- Event handler: ao receber SALE_CONFIRMED → baixar estoque dos itens vendidos
- Event handler: ao baixar estoque → verificar minAlert → emitir STOCK_LOW se necessário

**Dependências:** F2.E03 (catalog — produtos), F2.E05 (sales — evento de venda), F1.E04 (events)

**DoD:**
- [ ] Baixa automática de estoque ao confirmar venda
- [ ] Alerta de estoque baixo funcional
- [ ] Pedidos à marca com status tracking
- [ ] Amostras com ROI

---

### F2.E07 — Módulo Finance: Completo

**Descrição:** Controle financeiro, despesas, lucratividade, calculadoras.

**Referência:** [Doc Impl §1 — Expense, FinancialReport] [Doc Func §35-37, §63, §90, §93]

**Ações:**
- Domain: entities (Expense, FinancialReport), ports
- Use cases: GetDashboard, ListExpenses, CreateExpense, UpdateExpense, DeleteExpense, GetProfitReport, CalculateMargin, CalculateGoalReverse, GetCAC
- Adapters: Prisma
- tRPC router: finance.router
- ConnectMercadoPago e DisconnectMercadoPago (placeholder — integração real na Fase 5)
- HandleWebhook (placeholder)

**Dependências:** F2.E05 (sales — dados de receita)

**DoD:**
- [ ] CRUD de despesas funcional
- [ ] Relatório de lucratividade (receita de vendas - despesas)
- [ ] Calculadora de margem e meta reversa
- [ ] CAC calculado por cliente

---

### F2.E08 — Módulo Analytics: Dashboard Base

**Descrição:** Dashboard resumão e métricas iniciais.

**Referência:** [Doc Func §51-52, §55-58, §86, §95-100]

**Ações:**
- Use cases: GetDashboard, GetSalesStats, GetGoalProgress, GetSeasonality, GetClientEngagement, GetProductRanking, GetCampaignConversions
- Dashboard agrega: vendas do mês, faturamento, pendentes, agendamentos (da Fase 4), alertas
- Classificação ABC de clientes (baseada em frequência e valor de compra)
- Score de engajamento por cliente
- Ranking de produtos mais vendidos
- tRPC router: analytics.router

**Dependências:** F2.E02 (clients), F2.E05 (sales), F2.E06 (inventory)

**DoD:**
- [ ] Dashboard com métricas reais
- [ ] Classificação ABC automática
- [ ] Score de engajamento calculado
- [ ] Ranking de produtos funcional

---

### F2.E09 — Seed de Dados de Desenvolvimento

**Descrição:** Seed com dados realistas para desenvolvimento e demonstração.

**Ações:**
- Criar seed script em packages/db/prisma/seed.ts
- Criar 1 tenant de demo com plano PRO
- Criar 50 clientes com perfis de beleza variados, etiquetas, classificações
- Criar 5 brands de sistema + 30 produtos por marca
- Criar 100 vendas com itens, pagamentos, cashback
- Criar estoque para todos os produtos
- Criar 10 despesas
- NÃO criar dados de campanhas/messaging (vem na Fase 3)

**Dependências:** F2.E01 a F2.E08 (todos os módulos de negócio)

**DoD:**
- [ ] `pnpm db:seed` roda sem erros
- [ ] Dados realistas no banco
- [ ] Dashboard mostra métricas reais

---

### F2.E10 — Checkpoint Fase 2

> **⚠️ CHECKPOINT — NÃO é épico de implementação.**
> O Orchestrator NÃO gera prompt para checkpoints. Executa type-check + tag diretamente em main.
> NÃO criar branch para checkpoints.

**Ações:**
```bash
git checkout main
pnpm install
pnpm type-check
# Se falhar: corrigir, max 3 tentativas, depois BLOCKED
git tag v0.3.0-fase-02
```

**DoD:**
- [ ] type-check passa com zero erros
- [ ] Tag v0.3.0-fase-02 criada
- [ ] STATE.json atualizado (phase 2 = COMPLETED, mode = ARCHITECT)

---

# FASE 3 — COMUNICAÇÃO (WhatsApp + Campanhas + Pós-Venda + IA)

> **Objetivo:** Implementar todo o sistema de comunicação: WhatsApp N1 e N2, campanhas em massa, pós-venda automático, cobrança, IA para geração de texto, templates, feed comunitário.
> **Depende de:** Fase 2 completa
> **Épicos:** 9 (8 de implementação + 1 checkpoint)

---

### F3.E01 — Módulo Messaging: WhatsApp N1 (Deep Links)

**Descrição:** Implementar WhatsApp Nível 1 — geração de deep links `wa.me/` com mensagem pré-preenchida. A consultora copia e cola ou o app abre o WhatsApp no contato certo.

**Referência:** [Doc Func §1]

**Ações:**
- Criar service WhatsAppN1Service com método generateDeepLink(phone, message): string
- Deep link format: `https://wa.me/{phone}?text={encodedMessage}`
- Personalização: substituir {{nome}} pelo nome da cliente na mensagem
- Criar helper de formatação de phone para E.164 (sem +, sem espaços)
- Integrar com o fluxo de envio de produto individual (catalog.sendToClient)
- Integrar com confirmação de venda

**Dependências:** F2.E02 (clients — phones), F2.E05 (sales — confirmação)

**DoD:**
- [ ] Deep links gerados corretamente
- [ ] Personalização com nome funcional
- [ ] Integrado com catálogo e vendas

---

### F3.E02 — Módulo Messaging: WhatsApp N2 (Meta Cloud API)

**Descrição:** Implementar WhatsApp Nível 2 — envio automatizado via Meta Cloud API. Exclusivo plano Pro.

**Referência:** [Doc Func §2]

**Ações:**
- Criar adapter WhatsAppN2Adapter que implementa WhatsAppPort
- Integração com Meta Cloud API: envio de texto, imagem, áudio, documento
- Guard `requirePlan('PRO')` em todas as chamadas N2
- Fallback: se tenant é Essential, usar N1 (deep link) em vez de N2
- Webhook receiver para status de mensagem (sent, delivered, read)
- Rate limiting por tenant (respeitar limites da Meta)
- Configuração: WHATSAPP_API_TOKEN e WHATSAPP_PHONE_NUMBER_ID via env

**Dependências:** F3.E01, F1.E06 (entitlements — verificar plano)

**DoD:**
- [ ] Envio de mensagem via Meta API funcional
- [ ] Guard de plano bloqueia Essential
- [ ] Webhook de status funcional
- [ ] Fallback para N1 quando Essential

---

### F3.E03 — Módulo Campaigns: Disparo + Agendamento + Estatísticas

**Descrição:** Sistema completo de campanhas em massa com personalização, agendamento, áudio, anexos, e estatísticas.

**Referência:** [Doc Func §3-9, §20-24, §47-48] [Doc Impl §3 — campaigns.router]

**Ações:**
- Domain: Campaign, CampaignRecipient entities
- Use cases: CreateCampaign, UpdateCampaign, SendTest, ConfirmCampaign, CancelCampaign, GetCampaignById, ListCampaigns, GetRecipients, CreateRemarketing
- Personalização: substituir {{nome}} em cada mensagem pelo nome do recipient
- Agendamento: campanhas com scheduledAt são processadas pelo worker na data/hora
- Áudio: campo audioUrl no Campaign, enviado junto com texto
- Anexos: campo attachments (JSON array de URLs)
- Estatísticas: recebeu, visualizou, respondeu + listas negativas
- Remarketing: criar nova campanha apenas para quem não respondeu/visualizou
- Worker: CampaignDispatcher processa fila `wbc:campaigns`, envia mensagens via messaging module
- N1: gera deep links para cada recipient / N2: dispara automaticamente
- tRPC router: campaigns.router

**Dependências:** F3.E01/E02 (messaging), F2.E02 (clients — recipients)

**DoD:**
- [ ] Campanhas criadas com personalização por nome
- [ ] Agendamento funcional
- [ ] Áudio e anexos incluídos no envio
- [ ] Estatísticas atualizadas (via webhook N2 ou manualmente)
- [ ] Remarketing por filtro de status
- [ ] Worker processa fila

---

### F3.E04 — Módulo Messaging: Pós-Venda Automático (2+2+2)

**Descrição:** Sistema de pós-venda automático que envia mensagens em 2 dias, 2 semanas, e 2 meses após a venda.

**Referência:** [Doc Func §12, §14, §26, §36, §44]

**Ações:**
- Ao receber evento SALE_CONFIRMED: criar 3 registros PostSaleFlow (TWO_DAYS, TWO_WEEKS, TWO_MONTHS) + opcional RESTOCK
- Worker ScheduleProcessor: verifica diariamente mensagens pendentes, envia as que atingiram a data
- Templates rotativos: 5 variações por stage (sem IA — rotação aleatória)
- Personalização com nome da cliente
- Reset automático: nova venda para mesma cliente → deletar pendentes → reagendar
- Recompra: se configurada, agendar mensagem de recompra X dias após venda
- CRUD de templates de pós-venda (MessageTemplate com category POST_SALE_*)
- Configuração centralizada de textos de pós-venda

**Dependências:** F3.E01/E02 (messaging), F2.E05 (sales — evento SALE_CONFIRMED), F1.E04 (events)

**DoD:**
- [ ] 3 mensagens agendadas ao confirmar venda
- [ ] Worker envia na data correta
- [ ] Templates rotativos funcionam
- [ ] Reset automático em nova venda
- [ ] Recompra agendada quando configurada

---

### F3.E05 — Módulo Messaging: Cobrança + Boas-vindas + Reativação

**Descrição:** Mensagens automáticas de cobrança de parcela, boas-vindas a novo cliente, e reativação de cliente inativo.

**Referência:** [Doc Func §13, §82-83, §64, §68]

**Ações:**
- Cobrança: event handler PAYMENT_OVERDUE → agendar mensagem de lembrete com dias até vencimento e valor
- Boas-vindas: event handler CLIENT_CREATED → enviar mensagem de boas-vindas (se source != IMPORT)
- Reativação automática: analytics detecta CLIENT_GOING_INACTIVE → cria campanha sugerida para consultora aprovar
- Respostas rápidas (QuickReply): CRUD + tRPC router
- Cashback expiring: event handler CASHBACK_EXPIRING → enviar lembrete com valor e dias restantes

**Dependências:** F3.E01/E02 (messaging), F2.E05 (sales — payments), F2.E02 (clients)

**DoD:**
- [ ] Cobrança automática funcional
- [ ] Boas-vindas a novo cliente
- [ ] Reativação sugerida (consultora aprova)
- [ ] Respostas rápidas CRUD
- [ ] Lembrete de cashback expirando

---

### F3.E06 — Módulo Campaigns: Templates + Feed Comunitário

**Descrição:** Templates prontos e feed/marketplace comunitário de textos de campanha.

**Referência:** [Doc Func §15-16, §39]

**Ações:**
- CRUD de MessageTemplate pessoais (por tenant)
- Templates de sistema (isSystem=true) pré-populados no seed
- CommunityTemplate: compartilhar campanha no feed público
- Feed: listar por popularidade (likes), por data, por amigos (contatos que usam WBC)
- Filtro por tópico (dia das mães, natal, promoção, reposição etc.)
- Botão "usar esta campanha" → cria campanha com texto do template
- tRPC router: procedures de templates e community feed

**Dependências:** F3.E03 (campaigns)

**DoD:**
- [ ] Templates pessoais CRUD
- [ ] Templates de sistema seedados
- [ ] Feed comunitário com likes e filtros
- [ ] "Usar campanha" funcional

---

### F3.E07 — Módulo AI: Geração de Texto

**Descrição:** Integração com DeepSeek V3.2 para geração de textos de campanha, cobrança, reativação e correção.

**Referência:** [Doc Func §17-21] [Doc Impl §1 — AIGeneration]

**Ações:**
- Criar AIProvider interface (port) com método generate(prompt): string
- Criar DeepSeekAdapter que implementa AIProvider (chama API DeepSeek V3.2)
- Provider abstrato: trocável via env var AI_PROVIDER (deepseek/openai/anthropic)
- Use cases: GenerateCampaignText, GenerateBillingMessage, GenerateReactivation, CorrectText
- Controle de limite: 30 gerações/mês por tenant (campo aiGenerationsUsed na Subscription)
- Registrar cada geração na tabela AIGeneration (tipo, tokens, model)
- Se limite atingido: retornar erro claro (não bloquear, informar)
- tRPC router: ai.router conforme [Doc Impl §3]

**Dependências:** F1.E06 (subscription — limite de IA)

**DoD:**
- [ ] Geração de texto funcional via DeepSeek
- [ ] Provider abstrato (trocável via env var)
- [ ] Limite de 30/mês controlado
- [ ] Cada geração registrada
- [ ] 4 tipos de geração funcionando

---

### F3.E08 — Seed de Dados de Comunicação

**Descrição:** Adicionar ao seed dados de campanhas, templates e mensagens.

**Ações:**
- Adicionar templates de sistema para todas as categorias (POST_SALE_2D, POST_SALE_2W, POST_SALE_2M, RESTOCK, BIRTHDAY, BILLING, WELCOME, REACTIVATION, CASHBACK_EXPIRING, PROFESSION_DAY)
- 5 variações por categoria (templates rotativos)
- Templates em pt-BR e en
- 5 campanhas de exemplo com recipients e estatísticas
- 10 community templates com likes variados
- Quick replies padrão (10 frases comuns)

**Dependências:** F3.E03 a F3.E07

**DoD:**
- [ ] Templates seedados em todas as categorias
- [ ] 5 variações por categoria
- [ ] Bilíngue

---

### F3.E09 — Checkpoint Fase 3

> **⚠️ CHECKPOINT — NÃO é épico de implementação.**
> O Orchestrator NÃO gera prompt para checkpoints. Executa type-check + tag diretamente em main.
> NÃO criar branch para checkpoints.

**Ações:**
```bash
git checkout main
pnpm install
pnpm type-check
# Se falhar: corrigir, max 3 tentativas, depois BLOCKED
git tag v0.4.0-fase-03
```

**DoD:**
- [ ] type-check passa com zero erros
- [ ] Tag v0.4.0-fase-03 criada
- [ ] STATE.json atualizado (phase 3 = COMPLETED, mode = ARCHITECT)

---

# FASE 4 — AGENDA & SCHEDULE

> **Objetivo:** Implementar agenda, lembretes, calendário de oportunidades, notificações, e modo "Meu Dia".
> **Depende de:** Fase 3 completa
> **Épicos:** 4 (3 de implementação + 1 checkpoint)

---

### F4.E01 — Módulo Schedule: Agenda + Lembretes

**Descrição:** Agenda completa e lembretes inteligentes de reposição.

**Referência:** [Doc Func §40-45, §80] [Doc Impl §1 — Appointment, Reminder, Opportunity]

**Ações:**
- Domain: Appointment, Reminder, Opportunity entities
- Use cases: CRUD de agendamentos, ListReminders, DismissReminder, GetUpcomingBirthdays
- Lembretes de reposição: baseados na previsão de recompra inteligente (média real de dias entre compras do cliente)
- Datas automatizadas: aniversário, profissão, aniversário de cliente (primeira compra)
- Worker: ReminderProcessor verifica diariamente, emite REMINDER_TRIGGERED
- Event handler: SALE_CONFIRMED → resetar agendamentos do cliente e reagendar
- tRPC router: schedule.router

**Dependências:** F2.E02 (clients), F2.E05 (sales), F3.E01/E02 (messaging — envio)

**DoD:**
- [ ] CRUD de agendamentos funcional
- [ ] Lembretes de reposição automáticos
- [ ] Datas automatizadas detectadas
- [ ] Reset em nova venda
- [ ] Worker processa lembretes

---

### F4.E02 — Módulo Schedule: Calendário de Oportunidades + Modo "Meu Dia"

**Descrição:** Tela de oportunidades navegável e tela matinal "Meu Dia".

**Referência:** [Doc Func §43, §47, §80, §84]

**Ações:**
- Use cases: GetMyDay, GetCalendar (por mês/ano)
- Modo "Meu Dia": agrega reminders + appointments + pendingBillings + birthdays + opportunities para hoje
- Calendário: navegável por mês, mostra oportunidades passadas (enviadas) e futuras (agendadas)
- Cada item no "Meu Dia" tem botão de ação direto (enviar mensagem, ver perfil, registrar venda)
- tRPC procedures: schedule.getMyDay, schedule.getCalendar

**Dependências:** F4.E01

**DoD:**
- [ ] "Meu Dia" retorna dados corretos
- [ ] Calendário navegável por mês
- [ ] Histórico de mensagens enviadas visível

---

### F4.E03 — Notificações Push Base

**Descrição:** Sistema de notificações para a consultora (in-app e push).

**Referência:** [Doc Func §45, §7]

**Ações:**
- Criar tabela Notification (id, tenantId, title, body, type, read, createdAt)
- Event handlers: STOCK_LOW → notificação, REMINDER_TRIGGERED → notificação, PAYMENT_OVERDUE → notificação, APPOINTMENT_UPCOMING → notificação
- tRPC: listNotifications, markAsRead, markAllAsRead
- Badge counter de não lidas
- Push notification será implementada no mobile (Fase 6) — aqui só o backend

**Dependências:** F1.E04 (events), F4.E01 (schedule)

**DoD:**
- [ ] Notificações criadas a partir de eventos
- [ ] CRUD funcional
- [ ] Badge counter

---

### F4.E04 — Checkpoint Fase 4

> **⚠️ CHECKPOINT — NÃO é épico de implementação.**
> O Orchestrator NÃO gera prompt para checkpoints. Executa type-check + tag diretamente em main.
> NÃO criar branch para checkpoints.

**Ações:**
```bash
git checkout main
pnpm install
pnpm type-check
# Se falhar: corrigir, max 3 tentativas, depois BLOCKED
git tag v0.5.0-fase-04
```

**DoD:**
- [ ] type-check passa com zero erros
- [ ] Tag v0.5.0-fase-04 criada
- [ ] STATE.json atualizado (phase 4 = COMPLETED, mode = ARCHITECT)

---

# FASE 5 — DIFERENCIADORES (Team + Logistics + Pagamento + Landing + Fidelidade)

> **Objetivo:** Implementar os módulos que diferenciam o WBC de qualquer concorrente.
> **Depende de:** Fase 4 completa
> **Épicos:** 8 (7 de implementação + 1 checkpoint)

---

### F5.E01 — Módulo Team: Gestão de Equipe

**Referência:** [Doc Func §46-54]

**Ações:**
- Domain + use cases + adapters + router para Team, TeamMember, TeamTask
- Perfil por cargo (CONSULTANT, LEADER, DIRECTOR)
- Líder pode vincular membros, ver resultados, criar tarefas, aprovar em massa
- Ranking do time por vendas/metas
- tRPC router: team.router

**Dependências:** F1.E01 (auth — roles)

**DoD:**
- [ ] CRUD de equipe funcional
- [ ] Ranking do time
- [ ] Tarefas e aprovações

---

### F5.E02 — Módulo Logistics: Entregas + Tracking

**Referência:** [Doc Func §97-105]

**Ações:**
- Domain + use cases + adapters + router para Delivery
- Status tracking: Confirmed → Separated → Shipped → Delivered
- Event handlers: ao mudar status → notificar cliente via WhatsApp
- Roteiro do dia: listar entregas pendentes ordenadas por endereço
- Etiqueta de envio: gerar dados formatados (nome, endereço, itens)
- Prazo estimado: configurável por método de entrega
- tRPC router: logistics.router

**Dependências:** F2.E05 (sales), F3.E01/E02 (messaging)

**DoD:**
- [ ] Tracking visual funcional
- [ ] Notificação ao cliente em cada mudança de status
- [ ] Roteiro do dia
- [ ] Etiqueta de envio

---

### F5.E03 — Módulo Finance: Integração Mercado Pago / PIX

**Referência:** [Doc Func §75, §79]

**Ações:**
- Criar MercadoPagoAdapter que implementa PaymentPort
- Gerar QR Code / link de pagamento PIX via API Mercado Pago
- Webhook receiver: /api/webhooks/mercadopago (público, sem auth)
- Ao receber webhook de pagamento confirmado: emitir PAYMENT_RECEIVED
- Event handler: PAYMENT_RECEIVED → marcar parcela como paga → atualizar financeiro
- Link de pagamento enviado junto com mensagem de cobrança (Fase 3)
- ConnectMercadoPago: consultora informa access_token → salvar encriptado
- DisconnectMercadoPago: remover token

**Dependências:** F2.E07 (finance), F3.E05 (cobrança — incluir link)

**DoD:**
- [ ] QR Code PIX gerado via Mercado Pago
- [ ] Webhook recebe e confirma pagamento
- [ ] Parcela marcada como paga automaticamente
- [ ] Connect/disconnect funcional

---

### F5.E04 — Módulo Landing: Landing Page Pessoal

**Referência:** [Doc Func §76, §80]

**Ações:**
- Domain: LandingPage entity
- Use cases: GetLandingPage, UpdateLandingPage, ToggleActive, GetPublicLandingPage
- Consultora configura: foto, bio, filosofia, marcas, whatsapp link, QR code
- Gerado automaticamente dos dados do tenant + landing page config
- App landing (apps/landing): rota dinâmica [slug], ISR com revalidate 60s
- Subdomínio: nome.wbc.com.br (configuração DNS via Cloudflare)
- Página pública: bonita, mobile-first, com botão WhatsApp grande
- tRPC router: landing.router

**Dependências:** Bootstrap (TASK 12 — apps/landing)

**DoD:**
- [ ] Landing page configurável pela consultora
- [ ] Página pública acessível via slug
- [ ] ISR funcional
- [ ] Mobile-first

---

### F5.E05 — Módulo Platform: Referral + Onboarding + Export

**Referência:** [Doc Func §57, §58, §61, §62, §69, §70, §72, §77-78, §81-84]

**Ações:**
- Referral: gerar código único, link de indicação, rastrear quem indicou quem
- Onboarding wizard: passo a passo (marca, contatos, lembretes)
- Onboarding progressivo: funcionalidades desbloqueadas conforme uso
- Onboarding checklist: guia interativo do que falta usar
- Backup/exportação: gerar CSV com todos os dados do tenant (clientes, vendas, etc.)
- Modo demo: sandbox com dados fictícios, isolado do real
- Widget de status WhatsApp: templates de cards promocionais
- Múltiplas marcas: tenant pode ter catálogos de várias marcas
- Programa de fidelidade por pontos: LoyaltyPoints model, acumula por compra, troca por brindes
- Avaliação de satisfação pós-entrega: pergunta simples (1-5) após delivery
- tRPC router: platform.router

**Dependências:** F1.E01 (auth), F2.E02 (clients), F2.E05 (sales)

**DoD:**
- [ ] Referral funcional
- [ ] Wizard de onboarding
- [ ] Exportação CSV
- [ ] Modo demo isolado
- [ ] Fidelidade por pontos

---

### F5.E06 — Gerador de Cards Promocionais

**Referência:** [Doc Func §71, §75, §81, §85]

**Ações:**
- Templates visuais (HTML/CSS) para cards de promoção
- Consultora seleciona template, produto, preço, desconto
- Sistema gera imagem (via HTML-to-image ou canvas) pronta para download
- Cards dimensionados para status do WhatsApp (720x1280) e Instagram Stories
- 10 templates padrão de sistema

**Dependências:** F2.E03 (catalog — produtos com fotos)

**DoD:**
- [ ] Geração de cards funcional
- [ ] 10 templates disponíveis
- [ ] Download como imagem
- [ ] Dimensões corretas para WhatsApp/Instagram

---

### F5.E07 — Seed Final + Dados Completos

**Descrição:** Completar seed com dados de todas as funcionalidades implementadas.

**Ações:**
- Adicionar ao seed: team, logistics, landing page, referrals, onboarding progress, notifications, loyalty points
- Garantir que todos os módulos têm dados de demonstração

**Dependências:** F5.E01 a F5.E06

**DoD:**
- [ ] Seed completo para todas as entidades
- [ ] Dados realistas

---

### F5.E08 — Checkpoint Fase 5

> **⚠️ CHECKPOINT — NÃO é épico de implementação.**
> O Orchestrator NÃO gera prompt para checkpoints. Executa type-check + tag diretamente em main.
> NÃO criar branch para checkpoints.

**Ações:**
```bash
git checkout main
pnpm install
pnpm type-check
# Se falhar: corrigir, max 3 tentativas, depois BLOCKED
git tag v0.6.0-fase-05
```

**DoD:**
- [ ] type-check passa com zero erros
- [ ] Tag v0.6.0-fase-05 criada
- [ ] STATE.json atualizado (phase 5 = COMPLETED, mode = ARCHITECT)

---

# FASE 6 — UI COMPLETA (Web + Mobile)

> **Objetivo:** Construir toda a interface visual — web dashboard e app mobile React Native.
> **Depende de:** Fase 5 completa (toda a lógica de negócio funcional)
> **Épicos:** 8 (7 de implementação + 1 checkpoint)

---

### F6.E01 — UI Web: Layout + Navegação + Auth Pages

**Ações:**
- Layout principal com sidebar (desktop) e bottom nav (mobile)
- Navegação por módulo: Dashboard, Clientes, Vendas, Campanhas, Agenda, Financeiro, Estoque, Equipe, Config
- Páginas de auth: login, registro, verificação OTP
- Loading states com Skeleton em todo lugar
- Error boundary global
- Todas as labels via i18n

**DoD:**
- [ ] Layout responsivo (mobile-first)
- [ ] Navegação funcional
- [ ] Auth pages completas
- [ ] i18n em toda label

---

### F6.E02 — UI Web: Dashboard + Modo "Meu Dia"

**Ações:**
- Dashboard resumão: vendas do mês, faturamento, pendentes, alertas
- Modo "Meu Dia": lembretes, aniversários, cobranças, follow-ups com botões de ação
- Gráficos simples (recharts ou chart.js) para tendências
- Cards de oportunidades

**DoD:**
- [ ] Dashboard com dados reais
- [ ] Meu Dia funcional com ações diretas

---

### F6.E03 — UI Web: Clientes + Catálogo + Vendas

**Ações:**
- Listagem de clientes com filtros e etiquetas
- Detalhe do cliente com perfil de beleza, timeline, histórico
- Cadastro/edição de cliente
- Listagem de produtos com busca e filtros
- Fluxo de venda completo (selecionar cliente → produtos → pagamento → confirmar)
- Contas a receber

**DoD:**
- [ ] CRUD de clientes na UI
- [ ] Fluxo de venda end-to-end
- [ ] Filtros e busca funcionais

---

### F6.E04 — UI Web: Campanhas + Messaging + IA

**Ações:**
- Criar campanha: selecionar contatos, escrever texto, anexar mídia, agendar
- Botão IA: gerar texto de campanha
- Estatísticas de campanha com listas
- Templates e feed comunitário
- Configuração de pós-venda
- Respostas rápidas

**DoD:**
- [ ] Fluxo completo de campanha na UI
- [ ] IA de geração de texto integrada
- [ ] Feed comunitário navegável

---

### F6.E05 — UI Web: Agenda + Financeiro + Estoque + Equipe + Logística + Resto

**Ações:**
- Agenda com calendário visual
- Financeiro: despesas, relatórios, calculadoras
- Estoque: listagem, alertas, pedidos à marca
- Equipe: membros, ranking, tarefas
- Logística: entregas, tracking, roteiro
- Landing page: configuração
- Configurações: perfil, plano, referral, exportação
- Notificações: lista com badge

**DoD:**
- [ ] Todas as funcionalidades acessíveis via UI web
- [ ] Todas as labels via i18n

---

### F6.E06 — Mobile: React Native (Expo) — Telas Completas

**Ações:**
- Setup Expo com React Navigation (tab navigator + stack navigators)
- Zustand stores para state management
- NativeWind para estilo (Tailwind no mobile)
- Telas: Login/Registro, Dashboard, Meu Dia, Clientes, Vendas, Campanhas, Agenda, Notificações, Config
- Modo offline light: expo-sqlite para cache local, sync ao reconectar
- Push notifications via Expo Push
- Deep links para WhatsApp N1
- Todas as labels via i18next

**DoD:**
- [ ] App funcional com todas as telas principais
- [ ] Modo offline light
- [ ] Push notifications
- [ ] i18n

---

### F6.E07 — QR Code + Autocadastro + Importação

**Ações:**
- QR Code: gerar QR code da consultora (link para autocadastro)
- Autocadastro: página pública onde cliente preenche dados
- Importação por planilha: upload CSV/XLSX, parse, preview, confirmar
- Importação de contatos WhatsApp (placeholder — depende do N2)

**DoD:**
- [ ] QR Code funcional
- [ ] Autocadastro funcional
- [ ] Importação por planilha

---

### F6.E08 — Checkpoint Fase 6

> **⚠️ CHECKPOINT — NÃO é épico de implementação.**
> O Orchestrator NÃO gera prompt para checkpoints. Executa type-check + tag diretamente em main.
> NÃO criar branch para checkpoints.

**Ações:**
```bash
git checkout main
pnpm install
pnpm type-check
# Se falhar: corrigir, max 3 tentativas, depois BLOCKED
git tag v0.7.0-fase-06
```

**DoD:**
- [ ] type-check passa com zero erros
- [ ] Tag v0.7.0-fase-06 criada
- [ ] STATE.json atualizado (phase 6 = COMPLETED, mode = ARCHITECT)

---

# FASE 7 — TESTES + QA + POLISH + LANÇAMENTO

> **Objetivo:** Testes, qualidade, performance, segurança, e preparação para lançamento.
> **Depende de:** Fase 6 completa
> **Épicos:** 6

---

### F7.E01 — Testes Unitários (Domain + Use Cases)

**Ações:**
- Vitest para todos os 15 módulos
- Testar entities, value objects, regras de negócio
- Testar use cases com mocks dos ports
- Mínimo 1 teste por use case

**DoD:**
- [ ] Todos os módulos com testes unitários
- [ ] `pnpm test` passa

---

### F7.E02 — Testes de Integração (Repositories + tRPC)

**Ações:**
- Testar Prisma repositories contra banco real (Docker test DB)
- Testar tRPC routers com superjson
- Verificar tenantId em toda query (teste de isolamento)
- Mocks para: Redis, BullMQ, Mercado Pago, DeepSeek, Meta API

**DoD:**
- [ ] Repositories testados
- [ ] Routers testados
- [ ] Isolamento de tenant verificado

---

### F7.E03 — Lint + Type-Check + Build Completo

**Ações:**
```bash
pnpm lint (corrigir todos os erros)
pnpm type-check (zero erros)
pnpm build (build completo de todos os apps)
```

**DoD:**
- [ ] Zero erros de lint
- [ ] Zero erros de tipo
- [ ] Build completo sem falhas

---

### F7.E04 — Security Audit

**Ações:**
- Verificar RLS em todas as tabelas
- Verificar tenantId em toda query Prisma
- Verificar sanitização de inputs (Zod em todo tRPC input)
- Verificar que PII não aparece em logs
- Verificar auth em todas as rotas protegidas
- Verificar rate limiting
- Verificar webhook signatures (Mercado Pago)

**DoD:**
- [ ] Audit completo documentado
- [ ] Zero vulnerabilidades encontradas

---

### F7.E05 — Performance + Deploy

**Ações:**
- Otimizar queries lentas (índices, includes seletivos)
- Verificar N+1 queries
- Cache Redis nas queries mais frequentes
- Docker Compose de produção (sem hot-reload, com health checks)
- Deploy na VPS Hostinger
- SSL via Cloudflare
- Domínio wbc.com.br configurado
- Subdomínios *.wbc.com.br para landing pages

**DoD:**
- [ ] Performance aceitável (p95 < 1s)
- [ ] Deploy funcional em produção
- [ ] SSL ativo
- [ ] Domínio configurado

---

### F7.E06 — Tag Final + BUILD COMPLETO

**Ações:**
```bash
git checkout main
pnpm install
pnpm type-check
pnpm lint
pnpm test
pnpm build
git tag v1.0.0
```

Atualizar STATE.json: `status: "BUILD_COMPLETE"`

**PARAR. Reportar: "BUILD COMPLETO — WBC Platform v1.0.0"**

---

# RESUMO

| Fase | Nome | Épicos (impl + checkpoint) | Tag |
|------|------|---------------------------|-----|
| 1 | Fundação | 7 + 1 = 8 | v0.2.0-fase-01 |
| 2 | Core de Negócio | 9 + 1 = 10 | v0.3.0-fase-02 |
| 3 | Comunicação | 8 + 1 = 9 | v0.4.0-fase-03 |
| 4 | Agenda & Schedule | 3 + 1 = 4 | v0.5.0-fase-04 |
| 5 | Diferenciadores | 7 + 1 = 8 | v0.6.0-fase-05 |
| 6 | UI Completa | 7 + 1 = 8 | v0.7.0-fase-06 |
| 7 | Testes + QA + Lançamento | 6 (sem checkpoint — F7.E06 é BUILD COMPLETE) | v1.0.0 |

**Total: 7 fases, ~53 épicos**

> **NOTA SOBRE CHECKPOINTS:** O último épico de cada fase (Fases 1–6) é um CHECKPOINT.
> Checkpoints NÃO são épicos de implementação. O Orchestrator NÃO gera prompt para eles.
> O Orchestrator executa o procedimento de checkpoint diretamente: type-check + tag em main.

---

**Este documento é a fonte de verdade do roadmap. O Orchestrator lê este documento para saber O QUE fazer em cada fase. Os prompts detalhados de COMO fazer são gerados pelo modo ARQUITETO a partir deste documento + documentos técnicos.**
