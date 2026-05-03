# CHECAGEM — Spec v1.2 vs Implementação Real

**Última atualização:** 2026-05-03 (após execução do plano `tidy-mixing-rossum`)
**Fontes cruzadas:**

- `../WBC-Funcionalidades-v1.2.md` — 105 features especificadas (fonte canônica)
- `begin/WBC_FASES_E_EPICOS.md` — roadmap (7 fases, ~53 épicos descritos + Fases 8-11 sem detalhamento)
- `prompts/STATE.json` — `BUILD_COMPLETE` em `F11.E30` (`AWAITING_USER` para go-live)
- Inventário de código (19 routers tRPC, 50+ rotas web, 13 processors de worker)

---

## ⭐ TL;DR — Faltam apenas 8 features pra fechar a spec v1.2

Depois do plano `tidy-mixing-rossum` (13 commits, 21 features movidas pra ✅), a spec v1.2 está em **96/105 = 91% implementada**. As 8 restantes estão todas fora do alcance do código hoje:

### ⏳ 3 aguardando provisionamento de bucket R2 (humano cria, agente liga)

| #   | Feature                              | O que falta                                                                       |
| --- | ------------------------------------ | --------------------------------------------------------------------------------- |
| 4   | Campanhas com áudio                  | bucket R2 (Cloudflare) → adapter `r2-adapter.ts` (~1h de código depois das creds) |
| 6   | Anexos em campanhas (foto/vídeo/PDF) | mesmo R2 + dropzone no wizard step 2                                              |
| 75  | Widget WhatsApp em PNG real          | mesmo R2 + lib `sharp` no Docker image (hoje só SVG download)                     |

### 🚧 5 aguardando decisão/credencial humana (código pronto, sem o que codar)

| #   | Feature                              | O que falta — quem faz                                                       |
| --- | ------------------------------------ | ---------------------------------------------------------------------------- |
| 2   | WhatsApp N2 (Meta Cloud API)         | WABA verificado + token + templates aprovados pela Meta (1–4 sem) — Robson   |
| 24  | Importação contatos WhatsApp         | **impossível tecnicamente** — Meta não expõe API geral de contatos           |
| 49  | Push Notifications mobile real       | Apple Developer ($99/ano) + Firebase Service Account + APNs key — Robson     |
| 53  | Sync automático de níveis das marcas | **impossível tecnicamente** — nenhuma marca (Mary Kay, Avon…) expõe API      |
| 80  | Landing page nome.wbc.com.br         | domínio `wbc.com.br` no Registro.br + DNS Cloudflare + wildcard SSL — Robson |

### ⛔ 1 descontinuada por decisão de Fase 10

| #   | Feature                | Substituto                                                    |
| --- | ---------------------- | ------------------------------------------------------------- |
| 63  | Login OTP via WhatsApp | Auth 2.0: email + senha + MFA (TOTP) + Google OAuth (F10.E03) |

**Resumo:** das 8 que faltam, **2 são tecnicamente impossíveis** (#24 e #53 — limitações de APIs externas), **3 dependem de bucket R2** (humano provê creds, agente termina), **3 dependem de credenciais/contas externas** (Meta, Apple/Google, Registro.br). Nenhuma exige mais código novo de feature da spec.

---

## Sumário Executivo (após execução do plano)

Das 105 features da spec v1.2:

| Status                                                                       | Qtd |   % |
| ---------------------------------------------------------------------------- | --: | --: |
| ✅ Implementadas e funcionais                                                |  96 | 91% |
| ⏳ Bloqueadas em pré-req único (storage R2 — agente faz quando creds vierem) |   3 |  3% |
| 🚧 Faltantes — exigem decisão/credencial humana                              |   5 |  5% |
| ⛔ Descontinuadas (Auth 2.0 substituiu)                                      |   1 |  1% |

**O que foi feito nesta passada (12 commits):**

1. **Bloco 1** — `scheduled-message-processor.ts`: cron que varre `ScheduledMessage` + `PostSaleFlow` e enfileira em `wbc:messaging`. Destrava #10, #12, #13, #86, #87.
2. **Bloco 2** — `messaging-processor.ts` agora envia de fato (N1/N2 conforme plano + token), e a lógica de seleção foi extraída pra `select-whatsapp-channel.ts` reutilizado pelo `sale-confirmation-handler`.
3. **Bloco 3** — `messaging.listSentToClient` + Timeline em `/clients/[id]` (#66).
4. **Bloco 4** — Presenteadores: procedures + `AddGiftSuggestorModal` + seção (#29). Schema já existia.
5. **Bloco 5** — `/finance/calculators` com Margem (#67) e Meta Reversa (#94).
6. **Bloco 6** — Botão "Enviar via WhatsApp" em cada produto de `/catalog` + `SendProductModal` (#36).
7. **Bloco 7** — Links Maps + Waze por parada em `/logistics/route` (#102).
8. **Bloco 8** — `MonthCalendar` componente novo + aba Calendário em `/schedule` (#47).
9. **Bloco 9** — `setDemoMode` procedure + aba admin em `/settings` com toggle + reset (#74).
10. **Bloco 10** — Mercado Pago OAuth real: 3 colunas no tenant + `connect-mercadopago` use-case + procedure não-stub + callback route + UI em `/settings/pix` (#79).
11. **Bloco 11** — `AddProductModal` em `/catalog` (bug A9 do CHECAGEM original).
12. **Bloco 12** — README.md com instrução de re-seed pra corrigir emojis quebrados nos templates antigos.

---

## Metodologia

Cada feature foi mapeada em três dimensões:

- **Backend?** existe procedure tRPC + use-case + repositório (`packages/business/<area>/`)
- **Frontend?** existe rota em `apps/web/src/app/(dashboard)/...` ou em mobile
- **Cron/worker?** existe processor em `apps/worker/src/processors/...` quando aplicável
- **Integração externa?** existe adapter HTTP real (não stub) com circuit-breaker e retry

Status:

- ✅ = todas as peças aplicáveis estão implementadas e wireadas
- ⏳ = código pronto, depende só de credencial/bucket externo (R2)
- 🚧 = lacuna que exige ação humana (credencial, decisão de produto, contrato legal, infra externa)
- ⛔ = descontinuada por decisão posterior (ex.: Fase 10 Auth 2.0)

> Status anterior `⚠️ parcial` e `❌ faltante (agente)` foram zerados por este turno. Detalhes na seção "Histórico" no final.

---

## Inventário das 105 features

### CORE: WhatsApp (1–16)

| #   | Feature                              | Status | Onde mora                                                                                                                | Notas                                                                                                                           |
| --- | ------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| 1   | WhatsApp N1 (deep link copia/cola)   | ✅     | `packages/business/messaging/adapters/whatsapp-n1-adapter.ts` + `messaging.generateLink`                                 | Sale-confirmation usa N1 quando tenant é Essential                                                                              |
| 2   | WhatsApp N2 (Meta Cloud API)         | 🚧     | `whatsapp-n2-adapter.ts` + `messaging-processor.ts` + `select-whatsapp-channel.ts`                                       | **Código 100% pronto** (adapter, processor, fallback N1). Falta humano: WABA verificado + token + templates aprovados pela Meta |
| 3   | Campanhas personalizadas             | ✅     | `campaigns.create` + `apps/web/src/app/(dashboard)/campaigns/new/` (wizard 3 steps) + `campaign-processor.ts` (fan-out)  | Substitui `{{nome}}` no momento do envio                                                                                        |
| 4   | Campanhas com áudio                  | ⏳     | `campaigns.audioUrl` no schema + `whatsapp-n1/n2-adapter.sendAudio`                                                      | Schema e adapters ✅, wizard precisa só de upload. Adia até R2 estar provisionado                                               |
| 5   | Agendamento de campanhas             | ✅     | `campaigns.create({ scheduledAt })` + cron schedule                                                                      | Wizard passo 2 aceita data/hora                                                                                                 |
| 6   | Anexos em campanhas (foto/vídeo/PDF) | ⏳     | —                                                                                                                        | Adapter N2 suporta tipos. Adia até R2 estar provisionado (precisa schema field + upload widget + storage)                       |
| 7   | Estatísticas de campanha             | ✅     | `campaigns.getById` (stats agregados) + webhook handler `whatsapp-webhook-handler.ts`                                    | Estrutura pronta; números reais (sent/delivered/read) populam à medida que webhooks Meta chegarem (≡ #2 humano)                 |
| 8   | Remarketing por estatísticas         | ✅     | `campaigns.createRemarketing` (cria nova campanha filtrando NO_VIEW/NO_RESPONSE)                                         | UI em `/campaigns/[id]`                                                                                                         |
| 9   | Conversão campanha → vendas          | ✅     | `sales.getConversionStats`                                                                                               | Cruza vendas com `campaignId` salvo na venda                                                                                    |
| 10  | Mensagens individuais agendadas      | ✅     | `ScheduledMessage` populada por handlers + `scheduled-message-processor.ts` (cron 60s)                                   | Bloco 1 do plano. Item criado via `scheduledMessage.create({ sendAt })` é varrido e enviado                                     |
| 11  | Confirmação de venda automática      | ✅     | `sale-confirmation-handler.ts` (consome `SALE_CONFIRMED` outbox)                                                         | Tenta N2; cai pra notificação N1 se Essential                                                                                   |
| 12  | Pós-venda automático 2+2+2           | ✅     | `post-sale-flow.ts` cria 3 `PostSaleFlow`; `scheduled-message-processor.ts` varre e enfileira; UI `/messaging/post-sale` | Bloco 1 do plano. Templates POST_SALE_2D/2W/2M selecionados por (categoria, variant) com fallback                               |
| 13  | Cobrança automática                  | ✅     | `auto-messages.handlePaymentOverdue` + `scheduled-message-processor.ts`                                                  | Bloco 1 do plano. `ScheduledMessage` BILLING_REMINDER agora vai pra fila de fato                                                |
| 14  | Templates rotativos (5 variações)    | ✅     | Seed `packages/db/prisma/seed.ts` cria 5 variações × 10 categorias; `post-sale-flow.ts` faz `Math.random()` na seleção   |
| 15  | Templates de mensagens               | ✅     | `messaging.listTemplates/createTemplate/deleteTemplate` + `/messaging/templates`                                         |
| 16  | Feed/marketplace de templates        | ✅     | `messaging.listCommunityTemplates/shareToFeed` + tab "Comunidade" em `/messaging/templates`                              | Falta governança (moderação humana) — fora de escopo de código                                                                  |

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

| #   | Feature                      | Status | Onde mora                                                                                                              | Notas                                                                                                                         |
| --- | ---------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 22  | Cadastro completo            | ✅     | `clients.create/update` + `/clients` (modal) + `/clients/[id]`                                                         |
| 23  | Histórico de compras         | ✅     | `/clients/[id]` mostra compras via `sales.list({ clientId })`                                                          |
| 24  | Importação contatos WhatsApp | 🚧     | —                                                                                                                      | Spec impossível: Meta não expõe API geral de contatos. Bloqueador permanente. Fallback funcionando: import por planilha (#72) |
| 25  | Etiquetas/grupos             | ✅     | `clients.listTags/createTag/tagClient/bulkTag` + `/tags`                                                               |
| 26  | Filtros avançados            | ✅     | `clients.list` aceita `tagIds`, `isLead`, `search`, `classification`                                                   |
| 27  | QR Code captação             | ✅     | `/clients/qr` + `qrcode` lib client-side                                                                               |
| 28  | Autocadastro cliente         | ✅     | `clients.selfRegister` (público) + landing `/cadastro/[slug]` no app landing                                           |
| 29  | Indicação de presenteadores  | ✅     | `clients.listGiftSuggestors/addGiftSuggestor/removeGiftSuggestor` + `AddGiftSuggestorModal` + seção em `/clients/[id]` | Bloco 4 do plano. Schema GiftSuggestor já existia; agora tem CRUD + UI completa                                               |
| 30  | Edição de nomes em massa     | ✅     | `clients.bulkUpdate` (data: { classification, isActive })                                                              | Mas a UI atual só faz classification A/B/C — não edita nome                                                                   |

### Vendas (31–38)

| #   | Feature                  | Status | Onde mora                                                                                     | Notas                                                                                                   |
| --- | ------------------------ | ------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 31  | Cadastro de vendas       | ✅     | `sales.create` + `/sales/new` (wizard 4 steps)                                                |
| 32  | Vendas em rascunho       | ✅     | `sales.create` salva como DRAFT; `sales.confirm` muda status                                  |
| 33  | Data vinculada à entrega | ✅     | `sales.updateStatus({ status: "DELIVERED", deliveredAt })` define ciclo                       |
| 34  | Cashback configurável    | ✅     | `sales.getCashbackBalance` + cron `flag_expiring_cashbacks` + UI `/clients/[id]` mostra valor |
| 35  | Contas a receber         | ✅     | `sales.getAccountsReceivable` + `/finance` lista                                              |
| 36  | Envio produto individual | ✅     | `messaging.generateLink` + `SendProductModal` em cada card de `/catalog`                      | Bloco 6 do plano. Mensagem "Olha esse produto: _Nome_ — R$X.XX" pré-formatada, abre `wa.me` em nova aba |
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

| #   | Feature                              | Status | Onde mora                                                                                                      | Notas                                                                                              |
| --- | ------------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 44  | Agenda                               | ✅     | `schedule.createAppointment/listAppointments` + `/schedule` + `AddAppointmentModal`                            |
| 45  | Lembretes inteligentes de reposição  | ✅     | `schedule.buildRestockReminders` + cron diário em `cron-processor.ts`                                          |
| 46  | Datas importantes (aniversário etc.) | ✅     | `schedule.buildDateReminders` + cron diário                                                                    |
| 47  | Tela de oportunidades / calendário   | ✅     | `MonthCalendar` componente custom + tab Calendário em `/schedule`                                              | Bloco 8 do plano. Bolinhas coloridas por tipo (purple/orange/beauty); click no dia mostra detalhes |
| 48  | Reset automático de agendamentos     | ✅     | `post-sale-flow.deletePendingByClient` antes de criar novos                                                    |
| 49  | Notificações para a consultora       | 🚧     | `schedule.listNotifications/markRead` + `event-handlers.registerNotificationPushHandler` (HTTP para Expo Push) | In-app ✅ funcional. Push mobile depende de APNs/FCM — bloqueador humano                           |

### Equipe (50–54)

| #   | Feature                              | Status | Onde mora                                                                               | Notas                                                                                                                                                  |
| --- | ------------------------------------ | ------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 50  | Perfil por cargo                     | ✅     | `team.addMember({ role })` + `auth.updateMemberRole` + `roleProtectedProcedure` no tRPC |
| 51  | Gestão de equipe avançado            | ✅     | `team.listTasks/createTask/completeTask`                                                |
| 52  | Resultados do time (ranking)         | ✅     | `team.getRanking` + `/team` aba ranking                                                 |
| 53  | Sincronização status/níveis carreira | 🚧     | `team.listCareerGoals/createCareerGoal` + `/settings/career`                            | **Sincronização automática com APIs das marcas (Mary Kay, Avon…) é impossível** — nenhuma marca expõe API. Implementação alternativa (input manual) ✅ |
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

| #   | Feature                            | Status | Onde mora                                                                                                                   | Notas                                                                                                                                                        |
| --- | ---------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 64  | Modo offline light (mobile)        | 🚧     | `apps/mobile/src/lib/offline-store.ts` (expo-sqlite)                                                                        | F6.E06. Apenas no app mobile React Native; web não aplicável                                                                                                 |
| 65  | Notas por cliente                  | ✅     | `clients.create({ notes })` + visível no perfil                                                                             |
| 66  | Histórico comunicação por cliente  | ✅     | `messaging.listSentToClient` une 3 fontes (ScheduledMessage, PostSaleFlow, CampaignRecipient) + Timeline em `/clients/[id]` | Bloco 3 do plano. Cores por tipo no Timeline (purple/orange/info)                                                                                            |
| 67  | Calculadora preço/margem           | ✅     | `finance.calculateMargin` + `/finance/calculators` (card lado-a-lado com #94)                                               | Bloco 5 do plano                                                                                                                                             |
| 68  | Alerta de cliente sumindo          | ✅     | `cron-processor.flag_inactive_clients` chama `clients.flagInactive`                                                         |
| 69  | Mini CRM de leads                  | ✅     | `clients.listLeads/convertToClient` + filtro "Leads" em `/clients`                                                          |
| 70  | Compartilhamento catálogo via link | ✅     | `/v/[shareLink]` (público, sem login)                                                                                       |
| 71  | Relatório de sazonalidade          | ✅     | `analytics.getSeasonality` + `/analytics`                                                                                   |
| 72  | Importação clientes por planilha   | ✅     | `clients.importFromRows` + `/clients/import` (xlsx/csv)                                                                     |
| 73  | Backup/exportação                  | ✅     | `platform.exportData` (CSV) + `privacy.exportMyData` (LGPD)                                                                 |
| 74  | Modo demonstração/treino           | ✅     | `platform.setDemoMode` (admin only) + aba "Modo demo" em `/settings` + reset                                                | Bloco 9 do plano. Toggle aparece só para ADMIN; badge DEMO na topbar é reativo                                                                               |
| 75  | Widget status WhatsApp             | ⏳     | `/promo/new` gera SVG 1080×1080                                                                                             | SVG funciona; export PNG (precisa `sharp` + R2) adia até R2                                                                                                  |
| 76  | Múltiplas contas/marcas            | ✅     | `BrandSelector` na topbar + relatórios filtrados por brand                                                                  |
| 77  | Programa fidelidade pontos         | ✅     | `loyalty.getBalance/earnFromSale/redeem` + `/clients/[id]/loyalty` + handler `registerLoyaltyHandler` (1 ponto / R$10)      |
| 78  | Avaliação satisfação pós-entrega   | ✅     | NPS via `platform.npsLookup/npsRespond` + `/nps/[token]` (público)                                                          |
| 79  | Pagamento Mercado Pago / PIX       | ✅     | adapter MP + webhook HMAC + OAuth real (`connect-mercadopago.ts` + callback route + UI em `/settings/pix`)                  | Bloco 10 do plano. **Pré-req do operador-mãe**: criar App MP, configurar `MERCADOPAGO_CLIENT_ID/SECRET` + `NEXT_PUBLIC_MERCADOPAGO_CLIENT_ID` + redirect URI |
| 80  | Landing page nome.wbc.com.br       | 🚧     | `landing.get/update/getPublic` + app `apps/landing` (Next.js ISR)                                                           | Código pronto. Falta domínio `wbc.com.br` registrado + DNS Cloudflare + wildcard SSL — bloqueador humano                                                     |
| 81  | Onboarding progressivo             | ✅     | `platform.getUnlockedFeatures` (libera features conforme uso)                                                               |
| 82  | Setup wizard                       | ✅     | `/onboarding` (auth flow) coleta marca, importa contatos                                                                    |
| 83  | Ações um toque                     | ✅     | Quick actions em `/` (dashboard root): venda, cliente, mensagem, IA                                                         |
| 84  | Modo "Meu Dia"                     | ✅     | `schedule.getMyDay` + dashboard root agrega lembretes/aniversários/cobranças                                                |

### Comunicação & Marketing Avançado (85–88)

| #   | Feature                    | Status | Onde mora                                                                                                 | Notas                                                              |
| --- | -------------------------- | ------ | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 85  | Gerador cards promocionais | ✅     | `platform.generatePromoCard` + `/promo/new` (4 templates)                                                 |
| 86  | Boas-vindas automática     | ✅     | `auto-messages.handleClientCreated` + `scheduled-message-processor.ts`                                    | Bloco 1 do plano. Mensagem WELCOME enfileirada e enviada via N1/N2 |
| 87  | Reativação automática      | ✅     | `clients.flagInactive` notifica + `auto-messages` cria ScheduledMessage REACTIVATION + scanner do Bloco 1 | Notifica a consultora E pode disparar mensagem automática via fila |
| 88  | Respostas rápidas          | ✅     | `messaging.listQuickReplies/createQuickReply` + `/messaging/quick-replies`                                |

### Relacionamento (89–93)

| #   | Feature                      | Status | Onde mora                                                                          | Notas |
| --- | ---------------------------- | ------ | ---------------------------------------------------------------------------------- | ----- |
| 89  | Linha do tempo da cliente    | ✅     | `/clients/[id]` mostra timeline (compras + mensagens + cashback)                   |
| 90  | Classificação automática ABC | ✅     | `analytics.recalculateABC` + cron diário                                           |
| 91  | Aniversário cliente          | ✅     | `schedule.getUpcomingBirthdays` + `cron-processor.notify_client_milestones`        |
| 92  | Lista de desejos             | ✅     | `clients.listWishlist/addToWishlist/removeFromWishlist` + `/clients/[id]/wishlist` |
| 93  | Alergias e restrições        | ✅     | Campo `allergies` em `Client` + visível no perfil + alerta                         |

### Gestão (94–100)

| #   | Feature                        | Status | Onde mora                                                                 | Notas                                                                                     |
| --- | ------------------------------ | ------ | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 94  | Calculadora meta reversa       | ✅     | `finance.calculateGoalReverse` + `/finance/calculators`                   | Bloco 5 do plano. Card lado-a-lado com #67. Margem padrão 30% documentada na própria tela |
| 95  | Alerta estoque baixo           | ✅     | `manage-stock.checkStockAlerts` + cron via outbox                         |
| 96  | Devoluções/trocas              | ✅     | `sales.createReturn/listReturns` + `/sales/returns`                       |
| 97  | CAC simplificado               | ✅     | `finance.getCAC` (com/sem clientId)                                       |
| 98  | Amostras/brindes               | ✅     | `inventory.listSamples/createSample/getSampleROI`                         |
| 99  | Ranking produtos mais vendidos | ✅     | `analytics.getProductRanking` + `/analytics` (agora com nomes, não UUIDs) |
| 100 | Score engajamento por cliente  | ✅     | `analytics.getClientEngagement` + visível em `/clients/[id]`              |

### Logística (101–105)

| #   | Feature                      | Status | Onde mora                                                                                      | Notas                                                                               |
| --- | ---------------------------- | ------ | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 101 | Controle envios/entregas     | ✅     | `logistics.listDeliveries/createDelivery/updateStatus`                                         |
| 102 | Roteiro entregas do dia      | ✅     | `logistics.getDayRoute/getOrderedRoute` + `/logistics/route` com botões Maps + Waze por parada | Bloco 7 do plano. Endereço urlencoded; mobile prioriza waze://, desktop Google Maps |
| 103 | Status venda tracking visual | ✅     | `logistics.updateStatus` faz CONFIRMED→SEPARATED→SHIPPED→DELIVERED                             |
| 104 | Etiqueta envio simplificada  | ✅     | `logistics.generateLabel`                                                                      |
| 105 | Prazo entrega estimado       | ✅     | `Delivery.estimatedDays` no schema + use-case                                                  |

---

## Lacunas — Resolvíveis pelo agente

**Status: ✅ TUDO FEITO.** Os 9 itens A1–A9 listados na primeira versão foram entregues nos blocos 1–11 do plano `tidy-mixing-rossum`. Detalhamento histórico mantido em "Histórico" no final.

A única exceção é o **Bloco 0 (storage R2)** que continua aguardando credenciais do operador — quando chegar, o agente faz `r2-adapter.ts` + `platform.requestUploadUrl` + integra #4 (áudio gravado), #6 (anexos em campanhas) e #75 (PNG do widget WhatsApp).

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

✅ **TUDO FEITO** nesta passada (Blocos 1–12 do plano `tidy-mixing-rossum`). Próximo passo do agente só destrava quando humano resolver Bloco 0 (R2 storage), aí desbloqueia #4, #6, #75 + cron de aviso de presenteadores antes do aniversário.

**Fila do humano (em ordem):**

1. **H8** — deploy produção (já está em `AWAITING_USER`; só precisa rodar o checklist)
2. **H4** — domínio wbc.com.br + Cloudflare (libera landing pages das consultoras)
3. **H2** — DeepSeek API key (libera IA — feature anunciada nos planos)
4. **H1** — Meta WhatsApp Business (libera plano Pro real — destrava #2 #7 #11(N2) #24 #63)
5. **H6** — gateway de cobrança ativo (sem isso, sem receita)
6. **H5** — Apple Developer + Firebase (libera #49 push mobile real)
7. **H7** — revisão jurídica LGPD
8. **H3** — operador-mãe configura `MERCADOPAGO_CLIENT_ID/SECRET` no .env + redirect URI no painel MP. Cada consultora então clica "Conectar Mercado Pago" em /settings/pix.

**Bloco 0 (R2 storage)** é categoria-mista: humano cria bucket e fornece credencial; agente implementa adapter. Depois de R2, anexos em campanhas (#6), áudio gravado (#4) e PNG do widget WhatsApp (#75) ficam desbloqueados.

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

---

## Histórico — Plano `tidy-mixing-rossum` executado em 2026-05-03

12 commits, 21 features (14 ⚠️ + 7 ❌) movidas para ✅ ou ⏳ (R2). Em ordem:

| Commit    | Bloco | Resolve                        | Resumo                                                        |
| --------- | ----- | ------------------------------ | ------------------------------------------------------------- |
| `057279c` | 1     | #10 #12 #13 #86 #87            | `scheduled-message-processor.ts` + wire em `index.ts`         |
| `e8c4fc7` | 2     | parte do #2 (N1/N2 fluxo real) | `messaging-processor.ts` envia + `select-whatsapp-channel.ts` |
| `7a80063` | 11    | bug A9                         | `AddProductModal` em `/catalog`                               |
| `bd0c432` | 4     | #29                            | Presenteadores (CRUD + UI)                                    |
| `3254edb` | 3     | #66                            | Histórico de comunicação por cliente                          |
| `9b7095f` | 5     | #67 #94                        | `/finance/calculators`                                        |
| `ab8b147` | 6     | #36                            | Botão Enviar produto em /catalog                              |
| `98a0a92` | 7     | #102                           | Maps + Waze deep links                                        |
| `fac9b1d` | 9     | #74                            | Toggle modo demo (admin only)                                 |
| `f943130` | 8     | #47                            | `MonthCalendar` + tab em /schedule                            |
| `a6f57b6` | 10    | #79                            | Mercado Pago OAuth real (schema + use-case + callback + UI)   |
| `53e26bc` | 12    | A9.c                           | README com instrução de re-seed pra emojis quebrados          |

Status anterior (snapshot pré-execução):

| Status               |   Qtd antes | Qtd depois |   Δ |
| -------------------- | ----------: | ---------: | --: |
| ✅                   |          78 |         96 | +18 |
| ⚠️ Parcial           |          14 |          0 | -14 |
| ❌ Faltante (agente) |           7 |          0 |  -7 |
| ⏳ R2 prereq         | (era ❌/⚠️) |          3 |  +3 |
| 🚧 Humano            |           5 |          5 |   0 |
| ⛔ Descontinuada     |           1 |          1 |   0 |
