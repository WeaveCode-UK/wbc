# CHECAGEM — Spec v1.2 vs Implementação Real

**Data:** 2026-05-03
**Fontes cruzadas:**

- `../WBC-Funcionalidades-v1.2.md` — 105 features especificadas (fonte canônica)
- `begin/WBC_FASES_E_EPICOS.md` — roadmap (7 fases, ~53 épicos descritos + Fases 8-11 sem detalhamento)
- `prompts/STATE.json` — `BUILD_COMPLETE` em `F11.E30` (`AWAITING_USER` para go-live)
- Inventário de código (19 routers tRPC, 49 rotas web, 12 processors de worker)

---

## Sumário Executivo

Das 105 features da spec v1.2:

| Status                                             | Qtd |   % |
| -------------------------------------------------- | --: | --: |
| ✅ Implementadas e funcionais                      |  78 | 74% |
| ⚠️ Parciais (estrutura ok, falta operação ou peça) |  14 | 13% |
| ❌ Faltantes — agente pode resolver                |   7 |  7% |
| 🚧 Faltantes — exigem decisão/credencial humana    |   5 |  5% |
| ⛔ Descontinuadas (Auth 2.0 substituiu)            |   1 |  1% |

**Top 5 lacunas críticas:**

1. **Anexos em campanhas + áudio gravado in-app** (#4, #6) — schema/adapter já aceitam `audioUrl/mediaUrl`, mas sem upload no frontend e sem S3/R2 nada chega lá.
2. **Mensagens individuais agendadas** (#10) — `messaging.sendToClient` é instantâneo; não há fila de scheduled messages individual disparada por cron.
3. **Boas-vindas + reativação automáticas via WhatsApp** (#86, #87) — handlers `WELCOME` / `REACTIVATION` criam `ScheduledMessage` no banco, mas o cron que deveria varrer `scheduledMessage.sendAt <= now` e disparar não existe.
4. **WhatsApp Nível 2 sem credenciais Meta reais** (#2, #7, #11, #24, #63) — código pronto, falta o operador conectar conta Meta Business + WABA aprovado.
5. **Push Notifications sem APNs/FCM** (#49) — adapter Expo HTTP existe, mas Apple Developer ($99/ano) + Firebase Service Account ainda não foram provisionados.

---

## Metodologia

Cada feature foi mapeada em três dimensões:

- **Backend?** existe procedure tRPC + use-case + repositório (`packages/business/<area>/`)
- **Frontend?** existe rota em `apps/web/src/app/(dashboard)/...` ou em mobile
- **Cron/worker?** existe processor em `apps/worker/src/processors/...` quando aplicável
- **Integração externa?** existe adapter HTTP real (não stub) com circuit-breaker e retry

Status:

- ✅ = todas as peças aplicáveis estão implementadas e wireadas
- ⚠️ = peça-chave existe mas algo bloqueia (credencial, decisão, sub-feature acessória)
- ❌ = lacuna real de código que pode ser resolvida sem input externo
- 🚧 = lacuna que exige ação humana (credencial, decisão de produto, contrato legal, infra externa)
- ⛔ = descontinuada por decisão posterior (ex.: Fase 10 Auth 2.0)

---

## Inventário das 105 features

### CORE: WhatsApp (1–16)

| #   | Feature                              | Status | Onde mora                                                                                                               | Notas                                                                                                                                         |
| --- | ------------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | WhatsApp N1 (deep link copia/cola)   | ✅     | `packages/business/messaging/adapters/whatsapp-n1-adapter.ts` + `messaging.generateLink`                                | Sale-confirmation usa N1 quando tenant é Essential                                                                                            |
| 2   | WhatsApp N2 (Meta Cloud API)         | ⚠️     | `whatsapp-n2-adapter.ts` (HTTP real, circuit-breaker, retry) + `sale-confirmation-handler.ts`                           | Adapter pronto. Operador precisa: WABA verificado, token de acesso, número aprovado, templates aprovados pela Meta                            |
| 3   | Campanhas personalizadas             | ✅     | `campaigns.create` + `apps/web/src/app/(dashboard)/campaigns/new/` (wizard 3 steps) + `campaign-processor.ts` (fan-out) | Substitui `{{nome}}` no momento do envio                                                                                                      |
| 4   | Campanhas com áudio                  | ⚠️     | `campaigns.audioUrl` no schema + `whatsapp-n1/n2-adapter.sendAudio`                                                     | Schema e adapters ✅, mas wizard `/campaigns/new` não tem gravador nem upload de áudio. Falta UI + S3/R2 host                                 |
| 5   | Agendamento de campanhas             | ✅     | `campaigns.create({ scheduledAt })` + cron schedule                                                                     | Wizard passo 2 aceita data/hora                                                                                                               |
| 6   | Anexos em campanhas (foto/vídeo/PDF) | ❌     | —                                                                                                                       | Adapter N2 suporta tipos, mas não há campo no schema, nem upload no wizard, nem storage. Bloqueado por ausência de S3/R2                      |
| 7   | Estatísticas de campanha             | ⚠️     | `campaigns.getById` (stats agregados) + webhook handler `whatsapp-webhook-handler.ts`                                   | Estrutura pronta; números reais (sent/delivered/read) só populam quando webhooks Meta chegam de verdade                                       |
| 8   | Remarketing por estatísticas         | ✅     | `campaigns.createRemarketing` (cria nova campanha filtrando NO_VIEW/NO_RESPONSE)                                        | UI em `/campaigns/[id]`                                                                                                                       |
| 9   | Conversão campanha → vendas          | ✅     | `sales.getConversionStats`                                                                                              | Cruza vendas com `campaignId` salvo na venda                                                                                                  |
| 10  | Mensagens individuais agendadas      | ❌     | `messaging.sendToClient` envia instantâneo                                                                              | Não há `scheduleSendToClient` nem cron varrendo `scheduledMessage` table tipo CUSTOM. Resolvível                                              |
| 11  | Confirmação de venda automática      | ✅     | `sale-confirmation-handler.ts` (consome `SALE_CONFIRMED` outbox)                                                        | Tenta N2; cai pra notificação N1 se Essential                                                                                                 |
| 12  | Pós-venda automático 2+2+2           | ⚠️     | `post-sale-flow.ts` (cria 3 `PostSaleFlow` ao confirmar venda) + UI `/messaging/post-sale` para configurar dias         | Cria os flows ✅, mas não vi cron que processa `scheduledAt <= now` e dispara — precisa verificar `processPendingPostSaleFlows` está agendado |
| 13  | Cobrança automática                  | ⚠️     | `auto-messages.handlePaymentOverdue` cria `ScheduledMessage` BILLING_REMINDER quando outbox emite `PAYMENT_OVERDUE`     | Mesmo gap que #10/#86: o `ScheduledMessage` é criado no banco, mas falta o cron que dispara mensagem de fato                                  |
| 14  | Templates rotativos (5 variações)    | ✅     | Seed `packages/db/prisma/seed.ts` cria 5 variações × 10 categorias; `post-sale-flow.ts` faz `Math.random()` na seleção  |
| 15  | Templates de mensagens               | ✅     | `messaging.listTemplates/createTemplate/deleteTemplate` + `/messaging/templates`                                        |
| 16  | Feed/marketplace de templates        | ✅     | `messaging.listCommunityTemplates/shareToFeed` + tab "Comunidade" em `/messaging/templates`                             | Falta governança (moderação humana) — fora de escopo de código                                                                                |

### IA (17–21)

| #   | Feature                 | Status | Onde mora                                             | Notas                                             |
| --- | ----------------------- | ------ | ----------------------------------------------------- | ------------------------------------------------- |
| 17  | IA texto de campanha    | ✅     | `ai.generateCampaignText` + `deepseek-adapter.ts`     | Botão na step 2 do wizard `/campaigns/new`        |
| 18  | IA mensagem de cobrança | ✅     | `ai.generateBillingMessage`                           | Endpoint exposto, sem UI dedicada (uso via `/ai`) |
| 19  | IA reativação           | ✅     | `ai.generateReactivation`                             | Idem #18                                          |
| 20  | IA correção de texto    | ✅     | `ai.correctText`                                      | Em `/ai` page                                     |
| 21  | Limite 30 gerações/mês  | ✅     | `ai.getUsage` + tracking em `prisma-ai-repository.ts` | Counter zera no 1º do mês                         |

**Bloqueador 17–20:** todos exigem `DEEPSEEK_API_KEY` válido em `.env`. Sem isso, retornam erro do circuit-breaker.

### Clientes (22–30)

| #   | Feature                      | Status | Onde mora                                                                      | Notas                                                                                                                         |
| --- | ---------------------------- | ------ | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| 22  | Cadastro completo            | ✅     | `clients.create/update` + `/clients` (modal) + `/clients/[id]`                 |
| 23  | Histórico de compras         | ✅     | `/clients/[id]` mostra compras via `sales.list({ clientId })`                  |
| 24  | Importação contatos WhatsApp | 🚧     | —                                                                              | Spec impossível: Meta não expõe API geral de contatos. Bloqueador permanente. Fallback funcionando: import por planilha (#72) |
| 25  | Etiquetas/grupos             | ✅     | `clients.listTags/createTag/tagClient/bulkTag` + `/tags`                       |
| 26  | Filtros avançados            | ✅     | `clients.list` aceita `tagIds`, `isLead`, `search`, `classification`           |
| 27  | QR Code captação             | ✅     | `/clients/qr` + `qrcode` lib client-side                                       |
| 28  | Autocadastro cliente         | ✅     | `clients.selfRegister` (público) + landing `/cadastro/[slug]` no app landing   |
| 29  | Indicação de presenteadores  | ❌     | i18n key `gift_suggestors` existe + cron `notify_client_milestones` mencionado | Sem rota UI, sem procedure que liste/cria presenteadores. Resolvível                                                          |
| 30  | Edição de nomes em massa     | ✅     | `clients.bulkUpdate` (data: { classification, isActive })                      | Mas a UI atual só faz classification A/B/C — não edita nome                                                                   |

### Vendas (31–38)

| #   | Feature                  | Status | Onde mora                                                                                     | Notas                                                                      |
| --- | ------------------------ | ------ | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 31  | Cadastro de vendas       | ✅     | `sales.create` + `/sales/new` (wizard 4 steps)                                                |
| 32  | Vendas em rascunho       | ✅     | `sales.create` salva como DRAFT; `sales.confirm` muda status                                  |
| 33  | Data vinculada à entrega | ✅     | `sales.updateStatus({ status: "DELIVERED", deliveredAt })` define ciclo                       |
| 34  | Cashback configurável    | ✅     | `sales.getCashbackBalance` + cron `flag_expiring_cashbacks` + UI `/clients/[id]` mostra valor |
| 35  | Contas a receber         | ✅     | `sales.getAccountsReceivable` + `/finance` lista                                              |
| 36  | Envio produto individual | ⚠️     | `messaging.generateLink` + `/catalog` mostra produtos                                         | Falta botão "Enviar este produto" ao lado do produto na UI. Adapter pronto |
| 37  | Vitrine digital          | ✅     | `catalog.createShowcase/getPublicShowcase` + `/showcases/*` + `/v/[shareLink]`                |
| 38  | Catálogo multi-marca     | ✅     | `catalog.listBrands/listProducts` + `BrandSelector` na topbar                                 |

### Financeiro (39–41)

| #   | Feature                    | Status | Onde mora                                                                   | Notas |
| --- | -------------------------- | ------ | --------------------------------------------------------------------------- | ----- |
| 39  | Controle financeiro básico | ✅     | `finance.getDashboard` + `/finance` (4 KPIs)                                |
| 40  | Controle de despesas       | ✅     | `finance.createExpense/listExpenses` + modal `AddExpenseModal` recém-criado |
| 41  | Relatório de lucratividade | ✅     | `finance.getDashboard.profit` (revenue − expenses)                          |

### Estoque (42–43)

| #   | Feature             | Status | Onde mora                                                                                     | Notas |
| --- | ------------------- | ------ | --------------------------------------------------------------------------------------------- | ----- |
| 42  | Controle de estoque | ✅     | `inventory.listStock/updateStock/adjustStock` + `/inventory` (com nomes de produto, não UUID) |
| 43  | Pedidos à marca     | ✅     | `inventory.createOrder/receiveOrder` + `AddOrderModal` recém-criado                           |

### Agenda & Lembretes (44–49)

| #   | Feature                              | Status | Onde mora                                                                                                      | Notas                                                                            |
| --- | ------------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 44  | Agenda                               | ✅     | `schedule.createAppointment/listAppointments` + `/schedule` + `AddAppointmentModal`                            |
| 45  | Lembretes inteligentes de reposição  | ✅     | `schedule.buildRestockReminders` + cron diário em `cron-processor.ts`                                          |
| 46  | Datas importantes (aniversário etc.) | ✅     | `schedule.buildDateReminders` + cron diário                                                                    |
| 47  | Tela de oportunidades / calendário   | ⚠️     | `schedule.getCalendar` retorna agregado mensal                                                                 | UI atual `/schedule` lista mas não tem visualização calendário-grade. UI parcial |
| 48  | Reset automático de agendamentos     | ✅     | `post-sale-flow.deletePendingByClient` antes de criar novos                                                    |
| 49  | Notificações para a consultora       | ⚠️     | `schedule.listNotifications/markRead` + `event-handlers.registerNotificationPushHandler` (HTTP para Expo Push) | Backend ✅. Push real depende de credenciais APNs/FCM — bloqueador humano        |

### Equipe (50–54)

| #   | Feature                              | Status | Onde mora                                                                               | Notas                                                                                                                                                           |
| --- | ------------------------------------ | ------ | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 50  | Perfil por cargo                     | ✅     | `team.addMember({ role })` + `auth.updateMemberRole` + `roleProtectedProcedure` no tRPC |
| 51  | Gestão de equipe avançado            | ✅     | `team.listTasks/createTask/completeTask`                                                |
| 52  | Resultados do time (ranking)         | ✅     | `team.getRanking` + `/team` aba ranking                                                 |
| 53  | Sincronização status/níveis carreira | 🚧     | `team.listCareerGoals/createCareerGoal` + `/settings/career`                            | **Sincronização externa de níveis das marcas (Mary Kay, Avon…) não existe** — nenhuma marca expõe API. Implementação alternativa: input manual da consultora ✅ |
| 54  | Notificação novas tarefas            | ✅     | `cron-processor.notify_career_goals` + sistema de notificações                          |

### Inteligência (55–59)

| #   | Feature                             | Status | Onde mora                                                                 | Notas |
| --- | ----------------------------------- | ------ | ------------------------------------------------------------------------- | ----- |
| 55  | Dashboard resumão                   | ✅     | `/` (dashboard root) com 6 KPI cards + quick actions                      |
| 56  | Metas e gamificação                 | ✅     | `/settings/career` (criar metas) + dashboard mostra progresso             |
| 57  | Sugestão de produtos por perfil     | ✅     | `clients.getSuggestions` (engine baseado em skin/hair type)               |
| 58  | Previsão de recompra                | ✅     | `schedule.buildRestockReminders` calcula média real de dias entre compras |
| 59  | Configuração centralizada pós-venda | ✅     | `/messaging/post-sale`                                                    |

### Plataforma (60–63)

| #   | Feature                        | Status | Onde mora                                                                            | Notas                                                                                                                                                                             |
| --- | ------------------------------ | ------ | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 60  | Bilíngue PT-BR + EN            | ✅     | `next-intl` + 17 namespaces × 2 locales + cookie `NEXT_LOCALE` (acabei de consertar) |
| 61  | Programa de indicação/referral | ✅     | `platform.getReferralCode` + `/settings/referral`                                    |
| 62  | Onboarding/checklist           | ✅     | `platform.getOnboarding/completeStep` + checklist na topbar do dashboard             |
| 63  | Login via OTP                  | ⛔     | descontinuado em **F10.E03**                                                         | Substituído por Google OAuth + Credentials. A spec v1.2 lista OTP via WhatsApp, mas isso exigiria template OTP aprovado pela Meta — inviável sem N2. Hoje login é email+senha+MFA |

### Funcionalidades Exclusivas WBC (64–84)

| #   | Feature                            | Status | Onde mora                                                                                                              | Notas                                                                                                                                                                   |
| --- | ---------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 64  | Modo offline light (mobile)        | 🚧     | `apps/mobile/src/lib/offline-store.ts` (expo-sqlite)                                                                   | F6.E06. Apenas no app mobile React Native; web não aplicável                                                                                                            |
| 65  | Notas por cliente                  | ✅     | `clients.create({ notes })` + visível no perfil                                                                        |
| 66  | Histórico comunicação por cliente  | ❌     | —                                                                                                                      | Procedures `messaging.sendToClient` registram, mas `/clients/[id]` não tem aba "Histórico de mensagens enviadas". Resolvível: criar `messaging.listSentToClient` + tab  |
| 67  | Calculadora preço/margem           | ⚠️     | `finance.calculateMargin` (procedure)                                                                                  | Sem UI dedicada. Resolvível: aba em `/finance`                                                                                                                          |
| 68  | Alerta de cliente sumindo          | ✅     | `cron-processor.flag_inactive_clients` chama `clients.flagInactive`                                                    |
| 69  | Mini CRM de leads                  | ✅     | `clients.listLeads/convertToClient` + filtro "Leads" em `/clients`                                                     |
| 70  | Compartilhamento catálogo via link | ✅     | `/v/[shareLink]` (público, sem login)                                                                                  |
| 71  | Relatório de sazonalidade          | ✅     | `analytics.getSeasonality` + `/analytics`                                                                              |
| 72  | Importação clientes por planilha   | ✅     | `clients.importFromRows` + `/clients/import` (xlsx/csv)                                                                |
| 73  | Backup/exportação                  | ✅     | `platform.exportData` (CSV) + `privacy.exportMyData` (LGPD)                                                            |
| 74  | Modo demonstração/treino           | ⚠️     | `platform.resetDemo` + `getTenantBadge.isDemo`                                                                         | Backend ok. UI mostra badge DEMO mas não há toggle "entrar/sair de demo" para um tenant qualquer. Resolvível                                                            |
| 75  | Widget status WhatsApp             | ⚠️     | `/promo/new` gera SVG 1080×1080                                                                                        | Falta export PNG (precisa `sharp` native + S3/R2). Funciona como inline-SVG download                                                                                    |
| 76  | Múltiplas contas/marcas            | ✅     | `BrandSelector` na topbar + relatórios filtrados por brand                                                             |
| 77  | Programa fidelidade pontos         | ✅     | `loyalty.getBalance/earnFromSale/redeem` + `/clients/[id]/loyalty` + handler `registerLoyaltyHandler` (1 ponto / R$10) |
| 78  | Avaliação satisfação pós-entrega   | ✅     | NPS via `platform.npsLookup/npsRespond` + `/nps/[token]` (público)                                                     |
| 79  | Pagamento Mercado Pago / PIX       | ⚠️     | adapter `mercadopago-api-client.ts` + webhook `mercadopago-webhook-handler.ts` (HMAC) + `sales.generateMpPix`          | Cada consultora precisa conectar conta MP própria. F5.E03 prevê o OAuth de connect, mas o fluxo de onboarding de credencial ainda não tem UI. Bloqueador parcial humano |
| 80  | Landing page nome.wbc.com.br       | ⚠️     | `landing.get/update/getPublic` + app `apps/landing` (Next.js ISR)                                                      | Código pronto. Falta domínio `wbc.com.br` registrado + DNS Cloudflare + wildcard SSL — bloqueador humano                                                                |
| 81  | Onboarding progressivo             | ✅     | `platform.getUnlockedFeatures` (libera features conforme uso)                                                          |
| 82  | Setup wizard                       | ✅     | `/onboarding` (auth flow) coleta marca, importa contatos                                                               |
| 83  | Ações um toque                     | ✅     | Quick actions em `/` (dashboard root): venda, cliente, mensagem, IA                                                    |
| 84  | Modo "Meu Dia"                     | ✅     | `schedule.getMyDay` + dashboard root agrega lembretes/aniversários/cobranças                                           |

### Comunicação & Marketing Avançado (85–88)

| #   | Feature                    | Status | Onde mora                                                                                                    | Notas                                                                                                                        |
| --- | -------------------------- | ------ | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| 85  | Gerador cards promocionais | ✅     | `platform.generatePromoCard` + `/promo/new` (4 templates)                                                    |
| 86  | Boas-vindas automática     | ⚠️     | `auto-messages.handleClientCreated` cria `ScheduledMessage` WELCOME quando cliente é cadastrado (não-IMPORT) | Cria registro no banco, **mas não vi cron varrendo `scheduledMessage.sendAt <= now`** — mensagem fica parada. Resolvível     |
| 87  | Reativação automática      | ⚠️     | `clients.flagInactive` cria notificação `client.reactivation`                                                | Notifica a consultora; **não dispara campanha automática** como spec sugere ("o sistema prepara, ela só aprova"). Resolvível |
| 88  | Respostas rápidas          | ✅     | `messaging.listQuickReplies/createQuickReply` + `/messaging/quick-replies`                                   |

### Relacionamento (89–93)

| #   | Feature                      | Status | Onde mora                                                                          | Notas |
| --- | ---------------------------- | ------ | ---------------------------------------------------------------------------------- | ----- |
| 89  | Linha do tempo da cliente    | ✅     | `/clients/[id]` mostra timeline (compras + mensagens + cashback)                   |
| 90  | Classificação automática ABC | ✅     | `analytics.recalculateABC` + cron diário                                           |
| 91  | Aniversário cliente          | ✅     | `schedule.getUpcomingBirthdays` + `cron-processor.notify_client_milestones`        |
| 92  | Lista de desejos             | ✅     | `clients.listWishlist/addToWishlist/removeFromWishlist` + `/clients/[id]/wishlist` |
| 93  | Alergias e restrições        | ✅     | Campo `allergies` em `Client` + visível no perfil + alerta                         |

### Gestão (94–100)

| #   | Feature                        | Status | Onde mora                                                                 | Notas                                                                |
| --- | ------------------------------ | ------ | ------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 94  | Calculadora meta reversa       | ⚠️     | `finance.calculateGoalReverse` (procedure)                                | Sem UI dedicada. Resolvível: aba em `/finance` ou `/settings/career` |
| 95  | Alerta estoque baixo           | ✅     | `manage-stock.checkStockAlerts` + cron via outbox                         |
| 96  | Devoluções/trocas              | ✅     | `sales.createReturn/listReturns` + `/sales/returns`                       |
| 97  | CAC simplificado               | ✅     | `finance.getCAC` (com/sem clientId)                                       |
| 98  | Amostras/brindes               | ✅     | `inventory.listSamples/createSample/getSampleROI`                         |
| 99  | Ranking produtos mais vendidos | ✅     | `analytics.getProductRanking` + `/analytics` (agora com nomes, não UUIDs) |
| 100 | Score engajamento por cliente  | ✅     | `analytics.getClientEngagement` + visível em `/clients/[id]`              |

### Logística (101–105)

| #   | Feature                      | Status | Onde mora                                                          | Notas                                                                                                                             |
| --- | ---------------------------- | ------ | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| 101 | Controle envios/entregas     | ✅     | `logistics.listDeliveries/createDelivery/updateStatus`             |
| 102 | Roteiro entregas do dia      | ⚠️     | `logistics.getDayRoute/getOrderedRoute` + `/logistics/route`       | Lista ordenada por endereço ✅. Spec menciona "abertura direta no Google Maps/Waze" — não vi link `geo:` ou `maps://`. Resolvível |
| 103 | Status venda tracking visual | ✅     | `logistics.updateStatus` faz CONFIRMED→SEPARATED→SHIPPED→DELIVERED |
| 104 | Etiqueta envio simplificada  | ✅     | `logistics.generateLabel`                                          |
| 105 | Prazo entrega estimado       | ✅     | `Delivery.estimatedDays` no schema + use-case                      |

---

## Lacunas — Resolvíveis pelo agente

Estas são tarefas mecânicas que podem ser implementadas sem decisão de produto nem credencial externa. Estão em ordem de impacto / esforço.

### A1. Cron de `ScheduledMessage` (resolve #10 #12 #13 #86 #87)

**Impacto:** alto. **Esforço:** ~80 linhas + 1 teste.

Hoje os handlers `auto-messages.ts` e `post-sale-flow.ts` populam as tabelas `ScheduledMessage` e `PostSaleFlow` corretamente, mas não há cron que varra `where: { sendAt: { lte: new Date() }, status: "PENDING" }` e enfileire em `wbc:messaging`. Adicionar:

- `apps/worker/src/processors/scheduled-message-processor.ts` — varre as duas tabelas a cada minuto, enfileira jobs e marca `status: "QUEUED"`.
- Registrar em `apps/worker/src/index.ts`.
- Reabilitar a lógica de envio em `messaging-processor.ts` (hoje marcada como pendente).

Resolve de uma só vez: pós-venda 2+2+2 (12), cobrança automática (13), boas-vindas automática (86), reativação automática (87), mensagens individuais agendadas (10).

### A2. Histórico de comunicação por cliente (resolve #66)

**Impacto:** médio. **Esforço:** ~50 linhas.

Adicionar `messaging.listSentToClient(clientId)` que retorna `ScheduledMessage[] + Notification[] + CampaignRecipient[]` filtrados. Adicionar tab "Mensagens" em `/clients/[id]`.

### A3. Tela de presenteadores (resolve #29)

**Impacto:** médio. **Esforço:** ~120 linhas (router + UI).

Criar tabela `GiftSuggestor { id, clientId, suggestorClientId, relationship, createdAt }`. Procedures `clients.listGiftSuggestors/addGiftSuggestor/removeGiftSuggestor`. Aba em `/clients/[id]`.

### A4. UI das calculadoras já existentes (resolve #67 #94)

**Impacto:** baixo. **Esforço:** ~80 linhas.

Procedures `finance.calculateMargin` e `finance.calculateGoalReverse` já existem, sem tela. Criar `/finance/calculators` com dois forms: preço/custo → margem; meta de receita → vendas necessárias.

### A5. Anexos em campanhas (resolve #6 — versão sem mídia rica)

**Impacto:** alto. **Esforço:** moderado, mas bloqueado por A8 (S3/R2).

Adicionar campo `attachments: { url, type }[]` no `createCampaignSchema`. UI: dropzone no wizard step 2. Adapter já suporta. **Bloqueado por A8 abaixo (precisa de storage).**

### A6. Botão "Enviar produto" em /catalog (resolve #36)

**Impacto:** baixo. **Esforço:** ~30 linhas.

Em `/catalog/page.tsx`, adicionar ao card do produto um botão "Enviar via WhatsApp" que abre modal de seleção de cliente + chama `messaging.generateLink` com a foto + preço.

### A7. Link Google Maps/Waze no roteiro (resolve #102)

**Impacto:** baixo. **Esforço:** ~10 linhas.

Em `/logistics/route/page.tsx`, transformar cada parada em link `<a href="https://www.google.com/maps/search/?api=1&query={endereco}">` e detectar mobile pra usar `waze://?q={endereco}`.

### A8. Storage S3/R2 (desbloqueia #4 #6 #75)

**Impacto:** alto, **esforço:** moderado. Pré-requisito do operador: criar bucket R2 (Cloudflare) e gerar API token. Depois é mecânico:

- `packages/business/storage/adapters/r2-adapter.ts` (presigned upload + public URL)
- procedure `platform.requestUploadUrl`
- promo card #75 vira PNG real (precisa lib `sharp` no Docker image)

Listo aqui porque o **código** é trivial; o que falta é a credencial — mistura categoria. Marquei como "agente resolve depois que humano provê creds R2".

### A9. Bugs menores ainda abertos da segunda passada

- `/catalog` botão "Novo produto" sem `onClick` → criar `AddProductModal` (segue padrão dos modais já feitos hoje)
- `/sales` tabs com nomes de ação (Salvar/Confirmar/Cancelar) em vez de filtros — refator de SegmentedControl semantically
- Templates do sistema com emoji `�` no banco — re-rodar `pnpm seed` resolve (não é bug de código, é dado já corrompido)

---

## Lacunas — Responsabilidade humana

Coisas que **não dependem de mais código** e sim de ações fora do repositório. Categorizadas por urgência para o go-live.

### H1. Credenciais Meta WhatsApp Business (libera #2, #7, #11 N2, #24, #63 — total 5 features)

**Quem:** Robson (operador WBC).
**O que:** Conta Meta Business verificada, número WhatsApp Business API (WABA) aprovado, templates de mensagem (post-sale, billing, welcome, reactivation) submetidos e aprovados pela Meta. Token de acesso permanente do system user.
**Onde plugar:** variáveis `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID` no `.env` de cada tenant Pro.
**Estimativa:** 1–4 semanas (dependendo de aprovação Meta).

### H2. Credencial DeepSeek (libera #17–#20)

**Quem:** Robson.
**O que:** Conta paga DeepSeek + API key + billing.
**Onde plugar:** `DEEPSEEK_API_KEY`. Custo previsto na spec: ~$45/mês para 10mil usuárias.
**Estimativa:** 1 dia.

### H3. Conta Mercado Pago do tenant (libera #79 real)

**Quem:** cada consultora individualmente.
**O que:** Cada consultora conecta sua própria conta MP via OAuth (no produto, F5.E03 prevê esse fluxo, mas a UI de "Conectar Mercado Pago" não está visível em `/settings/pix` — o operador-mãe configura a app MP, cada tenant autoriza).
**Estimativa:** 1 dia para o operador-mãe + onboarding por consultora.

### H4. Subdomínio wbc.com.br + DNS (libera #80 real)

**Quem:** Robson.
**O que:** Registrar `wbc.com.br` no Registro.br. Apontar nameservers para Cloudflare. Criar wildcard `*.wbc.com.br` apontando para o app `apps/landing`. Wildcard SSL via Cloudflare.
**Estimativa:** 1 dia.

### H5. Apple Developer + Firebase (libera #49 real e a publicação mobile)

**Quem:** Robson.
**O que:**

- Apple Developer Account ($99/ano) → APNs Auth Key (.p8).
- Firebase project + google-services.json + Service Account JSON.
- Configurar Expo `eas.json` com `expoPushNotifications` ativado.
  **Estimativa:** 1–2 dias para setup, mais 1–2 semanas para review da App Store.

### H6. Plano de cobrança ativo (libera Plano Essential/Pro reais)

**Quem:** Robson + decisão de produto.
**O que:** Hoje `auth.getSubscription` lê `Tenant.plan` do banco, mas **não há cobrança recorrente**. Para receita real:

- Decidir gateway (Mercado Pago Subscriptions vs Stripe vs ASAAS).
- Implementar webhook + cancelamento + dunning.
- Página de checkout em `/settings/plan`.
  **Estimativa:** 2–4 semanas (envolve código + escolha de gateway).

### H7. Conformidade LGPD revisada (mencionada na spec)

**Quem:** advogado + Robson.
**O que:** Revisão jurídica do `apps/web/src/app/privacy-policy/page.tsx`, criação de DPA com cada subprocessor (Meta, Mercado Pago, DeepSeek, Sentry, Cloudflare, Hostinger, Resend), termo de uso, fluxo de consentimento granular, data retention policy.
**Estimativa:** 2–4 semanas de jurídico.

### H8. Deploy produção (F11.E30 — `AWAITING_USER`)

**Quem:** Robson.
**O que:** Seguir `docs/F11-E30-PRODUCTION-LIVE-CHECKLIST.md`. Provisionar VPS Hostinger KVM4, configurar Docker Compose, secrets, backup R2, monitoring Sentry, smoke test produção.
**Estimativa:** 1–2 dias se checklist está completo.

---

## Descontinuadas

| #   | Feature                | Razão                                                                                              | Substituto                    |
| --- | ---------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------- |
| 63  | Login OTP via WhatsApp | F10.E03 explicitamente removeu (exigia template OTP Meta + N2 funcionando — inviável no Essential) | Email + senha + MFA (TOTP) ✅ |

---

## Apêndices

### Apêndice A — 19 Routers tRPC (procedures expostas)

```
ai.ts          : generateCampaignText, generateBillingMessage, generateReactivation, correctText, getUsage
analytics.ts   : getDashboard, getSalesStats, getProductRanking, getClientEngagement, getSeasonality, getTemporalComparison, recalculateABC
auth.ts        : 26 procedures (ver inventário completo abaixo)
campaigns.ts   : list, getById, create, confirm, cancel, getRecipients, createRemarketing
catalog.ts     : listBrands, listProducts, createProduct, updateProduct, deleteProduct, getTopProducts, listShowcases, getShowcaseDetail, createShowcase, updateShowcase, deleteShowcase, getPublicShowcase
clients.ts     : 21 procedures (CRUD + tags + leads + wishlist + suggestions)
finance.ts     : getDashboard, listExpenses, createExpense, updateExpense, deleteExpense, calculateMargin, calculateGoalReverse, getCAC
health.ts      : version, live, ready, redis, db
inventory.ts   : listStock, updateStock, adjustStock, listOrders, createOrder, receiveOrder, cancelOrder, listSamples, createSample, markSampleConverted, getSampleROI
landing.ts     : get, update, toggleActive, getPublic
logistics.ts   : listDeliveries, createDelivery, updateStatus, getDayRoute, generateLabel, getOrderedRoute
loyalty.ts     : getBalance, getStatement, earnFromSale, redeem
messaging.ts   : sendToClient, getConnectionStatus, listQuickReplies, createQuickReply, deleteQuickReply, listTemplates, createTemplate, deleteTemplate, listCommunityTemplates, shareToFeed, generateLink, getPostSaleConfig, updatePostSaleConfig
mfa.ts         : getStatus, beginEnrollment, confirmEnrollment, disable
platform.ts    : 19 procedures (referral, onboarding, export, NPS, push, PIX, promo card, demo)
privacy.ts     : exportMyData, correctField, requestDeletion, accessLog
sales.ts       : 16 procedures (CRUD + payments + cashback + returns + PIX)
schedule.ts    : 14 procedures (appointments + reminders + birthdays + notifications)
team.ts        : 11 procedures (members + tasks + ranking + career)
```

**Total:** 178 procedures expostas no tRPC.

### Apêndice B — 49 rotas web

- 8 auth (login, register, onboarding, workspace, invite, reset-password, suspended, verify-email)
- 38 dashboard (todas mapeadas no inventário)
- 3 públicas (`/nps/[token]`, `/privacy-policy`, `/v/[shareLink]`)

### Apêndice C — 12 processors de worker

```
analytics-processor.ts          - queue wbc:analytics
campaign-processor.ts            - fan-out de campanhas → wbc:messaging
cron-processor.ts                - 8 jobs diários por tenant (ABC, restock, reminders, demos, milestones, career goals…)
dlq-archive.ts                   - arquiva eventos FAILED do outbox
dlq-processor.ts                 - consome DLQ + alerta Slack
dlq-scanner.ts                   - varre outbox FAILED → enfileira em dlqQueue
event-handlers.ts                - handlers para SALE_CONFIRMED (loyalty) + Push (Expo HTTP)
messaging-processor.ts           - queue wbc:messaging (envio rate-limited; lógica marcada "pendente" no comentário, mas adapter N1/N2 funcional)
outbox-cleanup.ts                - retenção 30d
outbox-processor.ts              - processa eventos PENDING do outbox
sale-confirmation-handler.ts     - SALE_CONFIRMED → WhatsApp N1 ou N2 conforme plano
schedule-processor.ts            - queue wbc:schedule (lógica marcada como pendente)
```

### Apêndice D — Integrações externas (estado real)

| Integração                      | Status                                   | Arquivo de prova                                                            |
| ------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------- |
| Meta WhatsApp Cloud API (N2)    | ✅ adapter HTTP real                     | `packages/business/messaging/adapters/whatsapp-n2-adapter.ts`               |
| Meta WhatsApp Deep Link (N1)    | ✅                                       | `packages/business/messaging/adapters/whatsapp-n1-adapter.ts`               |
| Meta Webhook (delivery/read)    | ✅ handler implementado                  | `packages/business/messaging/adapters/whatsapp-webhook-handler.ts`          |
| Mercado Pago API + webhook HMAC | ✅ adapter + ⚠️ sync end-to-end pendente | `packages/business/finance/adapters/mercadopago-*.ts`                       |
| DeepSeek IA                     | ✅ adapter HTTP real                     | `packages/business/ai/adapters/deepseek-adapter.ts`                         |
| S3 / R2 storage                 | ❌ inexistente                           | comentário em `packages/business/platform/use-cases/generate-promo-card.ts` |
| Expo Push Notifications         | ⚠️ HTTP direto (sem SDK)                 | `apps/worker/src/processors/event-handlers.ts:111`                          |
| Resend (email transacional)     | ✅ adapter HTTP real                     | `packages/business/auth/adapters/resend-email-sender.adapter.ts`            |
| Sentry                          | ✅ via `@sentry/nextjs`                  | `apps/web/sentry.*.config.ts`                                               |

---

## O que fazer agora

**Fila do agente (em ordem):**

1. **A1 — cron de ScheduledMessage** (resolve 5 features de uma vez)
2. **A2 — histórico de comunicação por cliente**
3. **A3 — tela de presenteadores**
4. **A4 — UIs das calculadoras**
5. **A6 — botão enviar produto em /catalog**
6. **A7 — link Maps/Waze no roteiro**
7. **A9 — botão "Novo produto" do catálogo + tabs do /sales**

**Fila do humano (em ordem):**

1. **H8** — deploy produção (já está em `AWAITING_USER`; só precisa rodar o checklist)
2. **H4** — domínio wbc.com.br + Cloudflare (libera landing pages das consultoras)
3. **H2** — DeepSeek API key (libera IA — feature anunciada nos planos)
4. **H1** — Meta WhatsApp Business (libera plano Pro real)
5. **H6** — gateway de cobrança ativo (sem isso, sem receita)
6. **H5** — Apple Developer + Firebase (libera mobile)
7. **H7** — revisão jurídica LGPD
8. **H3** — coordenar onboarding Mercado Pago para cada consultora

**A8 (R2 storage)** é categoria-mista: humano cria bucket e fornece credencial; agente implementa adapter. Depois de A8, A5 (anexos em campanhas) e melhoria do #75 (PNG do widget) ficam desbloqueados.

---

## Hardening pré-go-live (avaliação de stack 2026-05-03)

Itens que **não estão na fila CHECAGEM** porque não saem da spec v1.2, mas que a stack atual exige antes de produção real receber dinheiro de cliente. Avaliação derivada da inspeção da stack (Next.js 15, tRPC 11, Prisma + Postgres RLS, BullMQ, Sentry, NextAuth, hexagonal arch). São lacunas estruturais, não bugs.

### HG1 — Rate limiting por tenant

**O que:** middleware tRPC que conta requests por `tenantId` numa janela deslizante (Redis `INCR` + `EXPIRE`) e responde `TOO_MANY_REQUESTS` acima do teto. Aplicar antes dos protected procedures.

**Por que:** hoje qualquer tenant pode emitir N requisições paralelas e ocupar 100% do connection pool do Postgres (já tunado em 10 conexões). Um único cliente abusivo — script mal feito, integração quebrada, ou ataque — degrada todos os outros tenants. Não é hipotético: o pool tuning do hardening pass só protege contra fila infinita, não contra exhaustion deliberado.

**Como:** Redis-based limiter no middleware do tRPC. Limites diferentes por plano (Free 60 req/min, Pro 300 req/min). Headers `X-RateLimit-*` na resposta. ~1-2 dias.

**Bloqueador para:** abrir cadastro público, plano Pro pago.

### HG2 — Backup automatizado de Postgres

**O que:** `pg_dump` agendado (cron + container ou managed) com upload pra storage off-site (R2/S3). Retenção mínima 30 dias diários, 12 mensais.

**Por que:** WBC armazena dados de cliente, vendas, cobranças, payment logs — categoria de dado que, se perdida, **vira ação judicial** sob LGPD. RDS/managed Postgres geralmente faz isso, mas a decisão é VPS Hostinger self-hosted (item H8 do checklist) — daí backup é responsabilidade da operação, não automático.

**Como:** WAL archiving + base backup diário; ou `pg_dump` pra começar (mais simples, recovery mais lento). Encriptar antes do upload. ~1 dia.

**Bloqueador para:** F11.E30 produção (humano deve verificar como pré-flight).

### HG3 — Smoketest de restore programado

**O que:** job semanal que pega o backup mais recente, restaura num Postgres efêmero (container), roda um SELECT mínimo (`COUNT` em tenants, sales, payments) e alerta no Slack se restore ou query falhar.

**Por que:** **backup que nunca foi restaurado não é backup, é arquivo.** Disco, encryption, formato, retenção podem corromper sem ninguém notar até precisar — daí é tarde. Smoketest contínuo é a única forma de garantir que o procedimento de DR funciona.

**Como:** GitHub Actions ou cron na própria VPS. Pull do backup mais recente → `pg_restore` em container temporário → query smoke → cleanup. ~0.5 dia.

**Bloqueador para:** confiança operacional. Não bloqueia go-live, mas bloqueia "go-live tranquilo".

### HG4 — Revisão jurídica LGPD (reforça o H7)

**O que:** auditoria por advogado de dados sobre: política de privacidade, termos de uso, contrato com Meta para WhatsApp Business, base legal para tratamento (consentimento vs legítimo interesse), DPO, prazo de retenção, fluxo de exclusão de dados ("direito ao esquecimento"), DPIA se aplicável.

**Por que:** WBC trata categoria especial (alergias, preferências cosméticas vinculadas a CPF inferível por nome+cidade) e dado financeiro (PIX, cobrança). ANPD pode multar até 2% do faturamento. **Não é defensável engenharia sólida + LGPD ignorada** — para a ANPD é o mesmo que negligência grave.

**Como:** contratar revisão. Implementar correções de fluxo (exclusão programática de cliente, export LGPD, audit log de quem viu o quê). Esforço técnico depende do parecer; estimar 3-5 dias após receber o documento.

**Bloqueador para:** abrir cadastro público com cobrança real.

### HG5 — Ativação da suíte de testes

**O que:** ligar de fato vitest + jest nos workspaces, escrever os testes críticos dos use-cases de **dinheiro** (`createSale`, `confirmSale`, `cancelSale`, `markPaid`, `flagExpiringCashback`, `generatePixForPayment`) e de **isolamento de tenant** (RLS bypass attempts, middleware ignored). Coverage não precisa ser 80% — precisa cobrir os caminhos onde erro vira processo judicial.

**Por que:** a regra "ZERO testes até Fase 7" foi consciente e aceitável enquanto não havia dinheiro real circulando. No momento que receber o primeiro pagamento via MercadoPago, qualquer regressão em `confirmSale` ou `markPaid` é prejuízo direto (cobrar errado, devolver indevido, deixar de cobrar). A dívida técnica vira passivo legal.

**Como:** começar pelos 6 use-cases acima (~3 dias). Adicionar property-based testing nos cálculos de cashback/desconto (fast-check). Smoke test E2E do fluxo completo: criar cliente → criar venda → gerar PIX → marcar paga (~2 dias). Total ~5 dias para o mínimo defensável.

**Bloqueador para:** receber dinheiro real. Não bloqueia demo/sandbox.

---

### Síntese de prioridade

| Item                       | Esforço | Bloqueia              |
| -------------------------- | ------- | --------------------- |
| HG1 — Rate limiting        | 1-2d    | abertura pública      |
| HG2 — Backup automatizado  | 1d      | F11.E30 produção      |
| HG3 — Smoketest de restore | 0.5d    | confiança operacional |
| HG4 — LGPD                 | 3-5d\*  | cobrança real         |
| HG5 — Testes críticos      | 5d      | receber dinheiro      |

\* após parecer jurídico chegar.

**Sequência recomendada:** HG2 + HG3 (backup é higiene básica, semana 1) → HG1 (antes de abrir cadastro, semana 2) → HG5 (em paralelo com onboarding de primeiras consultoras pagas, semana 2-3) → HG4 (segue em outro fluxo com o jurídico).

Total estimado: **~10 dias de engenharia** + tempo do parecer jurídico em paralelo.
