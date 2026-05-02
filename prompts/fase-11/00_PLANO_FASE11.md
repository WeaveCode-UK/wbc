# [FASE 11] — Plano de Sequência Lógica · Fechamento de Gaps + MVP Utilizável

> **Fase:** 11 — Fechamento de Gaps (Gap Closure)
> **Origem:** `Fase 3/WBC-Fase3-Auditoria-e-Plano-v1.0.md`
> **Depende de:** Fase 10 completa (`v2.0.0-fase-10`)
> **Total de épicos:** 30 (F11.E01–E30 + F11.E20.5) + 1 checkpoint final (F11.E23 build-complete; F11.E30 production-live)
> **Estimativa global:** ~270 tasks
>
> **Histórico de revisões:**
>
> - **v1.1 (2026-05-02):** F11.E20.5 (UX polish pass) inserido entre F11.E20
>   e F11.E21. Motivo: a auditoria de uso do MVP (sessão de 2026-05-02, após
>   E14–E17 mergeados) achou bugs sistêmicos de UX — sem logout no topbar,
>   "Adicionar X" sem handler em várias páginas, telas que pedem UUID raw
>   em vez de seletor. Os testes E2E (E20) vão expor esses bugs ao tropeçar
>   neles, e antes do Lighthouse (E21) faz sentido um pass dedicado pra
>   fechar os 4 críticos. Numeração 20.5 escolhida pra não renumerar
>   E21–E23 e preservar referências em commits/notas existentes.
> - **v1.2 (2026-05-02 noite):** F11.E24 a F11.E30 adicionados após o
>   checkpoint v3.0.0-fase-11 ter exposto que o BUILD_COMPLETE de E23
>   deixou 7 lacunas que foram marcadas como follow-up nos commits
>   originais. O usuário pediu explicitamente que essas lacunas fossem
>   fechadas, não deixadas para trás. F11.E23 permanece como o build-
>   complete (tag mantida); E24–E30 fecham as lacunas até PRODUCTION_LIVE.
>
>   **Tag-alvo:** `v3.0.0-fase-11`

> **ANTES DE EXECUTAR:** Leia `begin/WBC_REGRAS_INVIOLAVEIS.md`. As 16 regras são absolutas:
>
> - NUNCA pare, NUNCA pergunte, NUNCA espere confirmação
> - Execução sequencial — sem subagents
> - Literalidade absoluta — se não está no prompt, não existe
> - `domain/` NUNCA importa de `adapters/`
> - `tenantId` OBRIGATÓRIO em toda query Prisma
> - ZERO strings hardcoded na UI — tudo via i18n
> - ZERO `any` — tipagem estrita
> - Commits: Conventional Commits em inglês
> - Sem testes durante construção (exceto Bloco F — ver F11.E19/E20)
> - Ao concluir um épico → merge → próximo épico → NÃO PARAR

---

## CONTEXTO

A auditoria registrada em `Fase 3/WBC-Fase3-Auditoria-e-Plano-v1.0.md` (2026-05-02) identificou:

- **Backend muito mais maduro que UI web.** ~125 procedures tRPC, 8 workers BullMQ, todos os 16 routers prontos. Mas ~90% das `page.tsx` em `apps/web/src/app/(dashboard)/` são scaffolds com `EmptyState` — sem chamadas tRPC.
- **3 bloqueadores arquiteturais** corrigidos parcialmente em sessão de 2026-05-02 (commits `9318a37`–`d719d6f`):
  - `apps/web/src/middleware.ts.disabled` — auth.config Edge/Node não splittado
  - `apps/landing/[slug]/page.tsx` — placeholder de 1 linha
  - Turbopack incompatível com import dinâmico de i18n (rodando em Webpack)
- **8 funcionalidades sem backend nenhum.**
- **10 funcionalidades com backend parcial.**
- **~16 telas web ausentes** apesar de backend pronto.
- Toda **Fase 2 ecossistema** (`Fase 2/WBC-Roadmap-Ecossistema-v1.0.md`) é backlog para Fase 12+.

A Fase 11 fecha esses gaps até atingir um **MVP utilizável end-to-end**.

## PRÉ-CONDIÇÕES

- [x] Fase 10 completa (`v2.0.0-fase-10`)
- [x] Auth 2.0 implementado (Account/TenantMember/Session/Invite)
- [x] Design System aplicado (Fase 9)
- [x] Audit doc lida (`Fase 3/WBC-Fase3-Auditoria-e-Plano-v1.0.md`)

## RESULTADO ESPERADO

Ao final da Fase 11:

- Cliente tRPC instalado em `apps/web/`. Todas as 25+ páginas web carregam dados reais.
- Middleware Next.js reabilitado (CSP nonces + proteção de rotas funcionando).
- 8 funcionalidades novas (loyalty, demo, importação, NPS etc.) implementadas backend + UI.
- 10 funcionalidades parciais completadas.
- 16 telas web ausentes criadas e plugadas ao tRPC.
- Landing pública estilizada (substitui o placeholder).
- Mobile com offline (`expo-sqlite`) + Push (Expo Push).
- Cobertura de testes além de clients/sales/logistics.
- 5 fluxos golden path com Playwright E2E.
- Lighthouse 90+ em performance.
- Deploy staging com smoke tests OK.
- Tag `v3.0.0-fase-11` criada.

---

## ESTRUTURA DA FASE — 6 BLOCOS LÓGICOS

A Fase 11 está dividida em 6 blocos sequenciais. **Não comece um bloco antes de fechar o anterior.** Dentro do bloco, épicos podem ser executados em sequência sem interdependência rígida (mas mantendo a ordem definida).

### BLOCO A · Fundação (destrava todo o resto)

F11.E01, F11.E02 — sem isso, os outros blocos não funcionam end-to-end.

### BLOCO B · Conectar UI existente ao backend

F11.E03 → F11.E04 → F11.E05 → F11.E06 — atinge ~50 funcionalidades de uma vez.

### BLOCO C · Backend ausente (épicos novos)

F11.E07 → F11.E08 → F11.E09 → F11.E10 — implementa 8 funcionalidades zeradas na spec.

### BLOCO D · Backend parcial (completar)

F11.E11 → F11.E12 → F11.E13 — fecha 10 funcionalidades meio-feitas.

### BLOCO E · UI web ausente para backend pronto

F11.E14 → F11.E15 → F11.E16 → F11.E17 — cria as ~16 telas faltantes.

### BLOCO F · Mobile + QA + Deploy

F11.E18 → F11.E19 → F11.E20 → **F11.E20.5 (UX polish pass)** → F11.E21 → F11.E22 → F11.E23 (checkpoint).

---

## SEQUÊNCIA DE ÉPICOS

### BLOCO A · FUNDAÇÃO

#### **F11.E01** — tRPC client setup em `apps/web/`

**Depende de:** nenhum (kickoff)
**Bloqueia:** F11.E03 a F11.E17 (toda UI web que carrega dados)
**Tasks estimadas:** 6
**Escopo:**

- Instalar `@trpc/client`, `@trpc/react-query`, `superjson` em `apps/web/`
- Criar `apps/web/src/lib/trpc.ts` com `createTRPCNext` apontando para `/api/trpc`
- Criar `apps/web/src/providers/trpc-provider.tsx` com `QueryClient` + `QueryClientProvider`
- Wraplar o `(dashboard)/layout.tsx` no provider
- Tipos compartilhados: importar `AppRouter` de `apps/api/src/router.ts`
- Health check: criar `apps/web/src/components/__trpc-smoke.tsx` que chama `trpc.platform.healthCheck.useQuery()` e renderiza apenas para validar (depois remove)

**Deliverable:** `import { trpc } from '@/lib/trpc'` funciona em qualquer page.tsx, com types ponta-a-ponta a partir do router da API.

---

#### **F11.E02** — Reabilitar middleware (split auth.config edge/node)

**Depende de:** F11.E01 (não estritamente, mas faz sentido junto)
**Bloqueia:** Deploy (sem middleware, CSP/proteção de rotas off em prod)
**Tasks estimadas:** 5
**Escopo:**

- Criar `apps/web/src/lib/auth.config.edge.ts` — sem Redis, bcrypt, crypto. Apenas providers metadata + JWT callbacks (jwt() + session()) baseados em token.
- Manter `auth.config.ts` Node-side com Redis/bcrypt/totp completos (signIn callback + authorize() do Credentials)
- Renomear `apps/web/src/middleware.ts.disabled` → `middleware.ts` e fazer ele importar `auth.config.edge.ts` (não o full)
- Smoke: testar `/api/auth/session` retorna 200, `/login` 200, rotas protegidas redirecionam para `/login` quando deslogado
- Documentar no CLAUDE.md a regra: middleware só importa de `auth.config.edge.ts`

**Deliverable:** Middleware verde em Edge runtime; CSP nonces e proteção de rotas voltando.

---

### BLOCO B · CONECTAR UI EXISTENTE

#### **F11.E03** — Wire dashboard + clients

**Depende de:** F11.E01
**Tasks estimadas:** 8
**Escopo:**

- `/` (Meu Dia): `analytics.getDashboard`, `analytics.getMyDay`, `analytics.getGoalProgress` → preencher cards de stats, urgentes, lembretes, aniversariantes, agenda do dia
- `/clients`: `clients.list` + `clients.listLeads` → tabela com paginação, search, segmented control Todas/Ativas/Leads/Inativas, filter chips por etiqueta
- `/clients/[id]`: `clients.getById`, `sales.list({clientId})`, `clients.getCashbackBalance`, `messaging.listScheduled` → preencher header, action strip, 6 stats grid, timeline, wishlist, beauty profile, allergy/cashback cards condicionais
- Loading states: `Skeleton`/`SkeletonListItem` enquanto carrega
- Error states: toast com `Alert` em mutações que falharem

**Deliverable:** Os 50 clientes do seed aparecem na lista; clicar abre o perfil real.

---

#### **F11.E04** — Wire sales + finance

**Depende de:** F11.E01
**Tasks estimadas:** 7
**Escopo:**

- `/sales`: `sales.list`, `finance.getDashboard` (parcial) → tabela com status badge, segmented control, stats row
- `/sales/new` (wizard 4-step): chamar `clients.list` no step 1, `catalog.listProducts` no step 2, `sales.create` no submit final; persistir `paymentMethod`, `discount`, `delivery`
- `/finance`: `finance.getDashboard`, `finance.listExpenses`, `sales.getAccountsReceivable` → 4 stats cards, lista de contas a receber, lista de despesas

**Deliverable:** Criar uma venda real através da UI funciona; aparece na `/sales` e em `/finance`.

---

#### **F11.E05** — Wire campaigns + remaining dashboard

**Depende de:** F11.E01
**Tasks estimadas:** 9
**Escopo:**

- `/campaigns`: `campaigns.list`
- `/campaigns/[id]`: `campaigns.getById`, `sales.getConversionStats({campaignId})` → preencher FunnelChart com valores reais
- `/campaigns/new` (wizard 3-step): `clients.list` + `clients.listTags` no step 1, `campaigns.create` no submit
- `/catalog`: `catalog.listProducts`, `catalog.listBrands` → grid 2 colunas
- `/inventory`: `inventory.listStock`, `inventory.listOrders`
- `/schedule`: `schedule.listAppointments`, `schedule.getCalendar`
- `/team`: `team.getTeam`, `team.getTeamStats`, `team.getRanking` (visível só para LEADER+)

**Deliverable:** Todas as 9 telas listadas mostram dado real do banco.

---

#### **F11.E06** — Wire landing + settings

**Depende de:** F11.E01
**Tasks estimadas:** 5
**Escopo:**

- `/landing`: `landing.get` no mount, `landing.update` no save, upload de foto via `platform.uploadAvatar`
- `/settings` (todas as 4 tabs):
  - profile: já tem form, plugar `platform.updateProfile`
  - plan: `platform.getSubscription` + UI de plano atual
  - landing: link para `/landing` (atalho)
  - export: `platform.exportData` com download
- `/settings/theme`: já está plugado no `ThemeProvider` em sessão anterior; persistir locale escolhido em cookie + API call para gravar preferência

**Deliverable:** Editar landing, exportar CSV, trocar tema/idioma — tudo funciona.

---

### BLOCO C · BACKEND AUSENTE

#### **F11.E07** — Importação + Bulk edit + QR autocadastro

**Depende de:** F11.E01
**Tasks estimadas:** 14
**Escopo:**

- **Importar contatos (xlsx/csv):** instalar `xlsx`, criar use-case `ImportClients` com parser, validação Zod, dedup por phone+tenantId, bulk insert com `prisma.client.createMany`. Procedure `clients.importFromFile`. UI: tela `/clients/import` com dropzone + preview + commit.
- **Bulk edit nomes:** procedure `clients.bulkUpdate({ids, fields})` com proteção (max 200 por batch). UI: checkbox em cada row de `/clients` + barra de bulk actions.
- **QR Code + autocadastro:** model `SelfRegistrationLink` (tenantId + slug + active), use-case `GenerateRegistrationQr`. Endpoint público `apps/landing/cadastro/[slug]` com OTP via WhatsApp. Procedure `clients.acceptSelfRegistration`. QR gerado server-side via `qrcode` npm.

**Deliverable:** Import .xlsx funciona; Renata escaneia o próprio QR e a cliente preenche autocadastro com OTP.

---

#### **F11.E08** — Programa de fidelidade (LoyaltyPoints)

**Depende de:** F11.E01
**Tasks estimadas:** 9
**Escopo:**

- Schema: model `LoyaltyPoints { id, tenantId, clientId, balance, lifetimeEarned }`, model `LoyaltyTransaction { id, clientId, kind: EARN|REDEEM|EXPIRE, amount, saleId?, createdAt, expiresAt? }`
- Use-case `EarnLoyaltyPoints` (chamado por handler de `SALE_CONFIRMED`, regra: 1 ponto por R$ 10)
- Use-case `RedeemLoyaltyPoints` (consome do balance, gera transaction REDEEM)
- Cron `expireLoyaltyPoints` (1× ao dia, expira após 12 meses)
- Procedures `loyalty.getBalance`, `loyalty.getStatement`, `loyalty.redeem`
- UI: card no `/clients/[id]` com saldo + botão "Resgatar"; tela `/clients/[id]/loyalty` com extrato

**Deliverable:** Confirmar venda credita pontos; cliente pode trocar pontos por desconto na próxima venda.

---

#### **F11.E09** — Modo demo + Onboarding progressivo

**Depende de:** F11.E01
**Tasks estimadas:** 11
**Escopo:**

- **Modo demo:** flag `Tenant.isDemo: boolean` + `Tenant.demoResetAt: DateTime?`. Cron diário que reseta dados em tenants demo (preserva contas de acesso, regenera 50 clientes/100 vendas via seed). UI: badge "DEMO" no header. Procedure `platform.resetDemo` (admin only).
- **Onboarding progressivo:** estender `OnboardingProgress` model com flags `hasFirstClient`, `hasFirstSale`, `hasFirstCampaign`, `unlockedFeatures: string[]`. Helper `getUnlockedFeatures(tenantId)`. Middleware tRPC que rejeita procedures bloqueadas com `FEATURE_LOCKED`. UI: badges "🔒 Disponível após sua primeira venda" nas seções bloqueadas (campanhas só após 3 clientes, IA só após 5 mensagens enviadas).

**Deliverable:** Tenant demo reseta sozinho à meia-noite; novo tenant não vê campanhas até cadastrar 3 clientes.

---

#### **F11.E10** — NPS pós-entrega + Gerador de cards promocionais

**Depende de:** F11.E01
**Tasks estimadas:** 13
**Escopo:**

- **NPS pós-entrega:** schema `NpsSurvey { id, saleId, clientId, score?: 0-10, comment?, sentAt, respondedAt? }`. Handler do evento `DELIVERY_COMPLETED` → schedule message com link `/nps/[token]`. Página pública `apps/landing/nps/[token]/page.tsx`. Procedure `nps.list` para dashboard. UI no `/finance` ou `/sales`: card com NPS médio + distribuição (promotores/neutros/detratores).
- **Gerador de cards promocionais:** use-case `GeneratePromoCard({title, price, brand, photo})` que renderiza imagem 1080×1080 server-side via `sharp` + SVG template. 4 templates de design (Minimal, Bold, Festive, Elegant). Procedure `promo.generateCard` retornando URL CDN. UI: tela `/promo/new` + integração no fluxo `/campaigns/new` (botão "Gerar card").

**Deliverable:** Cliente recebe link NPS após entrega; consultora gera card 1080×1080 e anexa em campanha.

---

### BLOCO D · BACKEND PARCIAL

#### **F11.E11** — WhatsApp N1 + Remarketing + Reativação

**Depende de:** F11.E01
**Tasks estimadas:** 10
**Escopo:**

- **WhatsApp N1 deep link:** use-case `GenerateWhatsappLink({phone, message, kind: SALE|CHARGE|MESSAGE|...})` com tracking. Integrar em `clients/[id]` action strip, em `sales/[id]` confirmação, em `finance` cobrança.
- **Campanhas — Remarketing:** procedure `campaigns.createRemarketing({sourceCampaignId, targetSegment: NO_RECEIVE|NO_VIEW|NO_RESPONSE})` que clona uma campanha filtrando os destinatários. UI: botão "Remarketing" no `/campaigns/[id]` (já existe stub).
- **Reativação automática:** evento `CLIENT_GOING_INACTIVE` (cliente sem compra há > avgCycle × 1.5). Handler que cria `Notification` + sugestão de campanha. Cron diário.

**Deliverable:** Botão WhatsApp funciona em 4 fluxos; "Remarketing: 12 não responderam" cria nova campanha; cliente sumindo gera notificação.

---

#### **F11.E12** — Cashback expirando + IA 4-split + Seed templates

**Depende de:** F11.E01
**Tasks estimadas:** 10
**Escopo:**

- **Cashback expirando:** evento `CASHBACK_EXPIRING` disparado por cron quando saldo expira em ≤ 7 dias. Handler envia notificação + sugestão de mensagem.
- **IA — split em 4 use-cases:** refatorar `generate-text.ts` em `GeneratePromoText`, `GenerateChargeText`, `GenerateReactivationText`, `CorrectText`. Cada um com prompt-engineering próprio + tom de voz. Limite de 30/mês continua compartilhado.
- **Seed de templates:** estender `prisma/seed.ts` para criar 50 `MessageTemplate` (10 categorias × 5 variações). Categorias: cobrança, pós-venda, reativação, aniversário, lançamento, cashback, follow-up, agradecimento, indicação, evento.

**Deliverable:** Cashback expirando notifica; IA tem 4 botões distintos; seed cria templates.

---

#### **F11.E13** — Lembretes reposição + Datas auto + Roteiro ordenado

**Depende de:** F11.E01
**Tasks estimadas:** 9
**Escopo:**

- **Lembretes reposição com média real:** calcular `avgDaysBetweenPurchases` por cliente em `analytics`. Cron diário que cria `Reminder` quando `today - lastPurchase >= avgCycle`.
- **Datas automáticas:** cron diário que detecta aniversário, profissão (dia do médico, dia do professor, etc.), 1ª compra (1 ano de cliente). Cria notificação + sugestão.
- **Roteiro do dia ordenado:** use-case `BuildDailyRoute` que ordena `Delivery[]` por endereço usando heurística vizinho-mais-próximo (geocoding via API ou parsing do CEP). Procedure `logistics.getDailyRoute`.

**Deliverable:** "Renata, hora de chamar Ana, ela costuma comprar a cada 45 dias"; rota do dia mostra 5 entregas em ordem geográfica.

---

### BLOCO E · UI WEB AUSENTE

#### **F11.E14** — UI gaps wave 1 · Comunicação

**Depende de:** F11.E03 a F11.E06 (provider tRPC funcionando)
**Tasks estimadas:** 12
**Escopo (criar `page.tsx` para):**

- `/tags` — gerenciar etiquetas (CRUD)
- `/messaging/quick-replies` — CRUD de respostas rápidas
- `/messaging/templates` — pessoais + feed comunitário (segmented control)
- `/ai` — gerador de texto (preview de prompts, histórico, limite 30/mês visível)
- `/messaging/post-sale` — config do fluxo 2+2+2 (toggle + custom delays)
- `/notifications` — lista + badge no sidebar com contagem unread

**Deliverable:** As 6 telas existem, plugadas ao tRPC, com loading/empty states.

---

#### **F11.E15** — UI gaps wave 2 · Vendas/Finanças/Settings

**Depende de:** F11.E04
**Tasks estimadas:** 11
**Escopo:**

- `/finance/receivables` — tabela de contas a receber com ação "Cobrar" / "Marcar pago"
- `/finance/payments` — lista de pagamentos com filtros
- `/sales/returns` — devoluções (criar + listar)
- `/sales/finance` — sub-rota que reúne receivables + payments (mantém compatibilidade com a spec)
- `/settings/plan` — substitui o stub atual por UI real (plano atual, faturas, upgrade)
- `/settings/landing` — atalho para `/landing` com preview embed
- `/settings/export` — UI do export CSV (escolher datasets + período)
- `/settings/referral` — código de indicação + lista de indicados

**Deliverable:** Cobrar uma parcela cria deep link WhatsApp; exportar CSV baixa o arquivo; ver plano funcional.

---

#### **F11.E16** — UI gaps wave 3 · Operação

**Depende de:** F11.E03 a F11.E06
**Tasks estimadas:** 12
**Escopo:**

- `/showcases` — vitrines (CRUD)
- `/inventory/orders` — pedidos à marca (criar + acompanhar status)
- `/inventory/samples` — amostras distribuídas + ROI
- `/logistics` — hub principal (entregas, tracking, rota do dia)
- `/logistics/deliveries` — lista
- `/logistics/route` — rota do dia (mapa + ordem)
- `/logistics/tracking/[code]` — tracking público (sem auth)
- `/clients/[id]/wishlist` — tela própria da lista de desejos (substitui o placeholder do perfil)

**Deliverable:** Toda operação cabe na web (não exige mobile pra rodar o dia a dia).

---

#### **F11.E17** — Landing pública estilizada

**Depende de:** F11.E06
**Tasks estimadas:** 6
**Escopo:**

- Substituir `apps/landing/[slug]/page.tsx` (placeholder de 1 linha) por landing real estilizada com Design System
- Server component com ISR (revalidate 300s)
- Estrutura: foto + nome + bio + filosofia + grid de marcas + lista de produtos featured + botão WhatsApp grande + QR Code do tenant + campo "Receber novidades"
- Página de erro 404 estilizada quando slug não existe ou `landing.active = false`
- SEO: `<title>`, `<meta description>`, OG tags
- Smoke: `/{slug}` carrega em < 1.5s no Lighthouse

**Deliverable:** `wbc.com.br/renata-cosmeticos` mostra a landing da Renata bonita; cliente clica e abre WhatsApp.

---

### BLOCO F · MOBILE + QA + DEPLOY

#### **F11.E18** — Mobile offline + Push

**Depende de:** F11.E11 a F11.E13 (eventos prontos)
**Tasks estimadas:** 10
**Escopo:**

- Instalar `expo-sqlite` no `apps/mobile/`
- Criar camada de sync: tabelas locais espelham `Client`, `Sale`, `Schedule`. Marcar mutações offline em fila. Sync na volta da rede.
- Conflito: last-write-wins com timestamp do servidor; sinalizar conflito para revisão manual
- Push: `expo-notifications` + `expo-device`. Endpoint `mobile.registerPushToken({token, platform})`. Worker que envia push via Expo Push API quando `Notification` é criada com flag `pushable=true`.

**Deliverable:** App offline navega clientes/vendas; cobranças vencendo viram push.

---

#### **F11.E19** — Cobertura de testes

**Depende de:** F11.E07 a F11.E13 (use-cases novos prontos)
**Tasks estimadas:** 14
**Escopo:**

- Unit tests Vitest para todos os use-cases novos (E07 a E13) + completar gaps em campaigns, messaging, finance, schedule, team, landing, platform
- Mocks para repositórios via interface, não Prisma direto
- Cobertura mínima: 70% por contexto em `packages/business/`
- `pnpm test` precisa passar verde

**Deliverable:** `pnpm test` roda > 200 testes verdes; coverage report.

---

#### **F11.E20** — E2E Playwright golden paths

**Depende de:** F11.E03 a F11.E17 (UI plugada)
**Tasks estimadas:** 8
**Escopo:** 5 fluxos golden path em `e2e/`:

1. Onboarding completo (signup → wizard 5-step → primeira venda)
2. Criar cliente → criar venda → confirmar venda → cobrar via WhatsApp
3. Criar campanha → enviar → ver estatísticas → remarketing
4. Importar planilha (50 contatos) → bulk edit etiquetas
5. Exportar CSV → trocar tema/idioma → suspender e reativar conta

**Deliverable:** `pnpm test:e2e` roda os 5 fluxos verdes em CI.

---

#### **F11.E20.5** — UX polish pass (inserido em v1.1)

**Depende de:** F11.E20 (os fluxos E2E vão expor cada um destes bugs)
**Tasks estimadas:** 10
**Contexto:** auditoria de uso do MVP em 2026-05-02 (logo após E14–E17 mergeados) identificou bugs sistêmicos que os scaffolds de Bloco E não cobriram. Os 4 críticos abaixo precisam fechar antes do deploy (E22) — Lighthouse (E21) é otimização e pode rodar depois.

**Escopo:**

1. **Logout no topbar.** Adicionar botão "Sair" ao header de `(dashboard)/layout.tsx` que chama `signOut()` do NextAuth. Mobile: incluir no `BottomNav` ou no menu hamburger.
2. **"Adicionar cliente" funcional.** Criar `(dashboard)/clients/new/page.tsx` (ou modal) com form completo (nome, telefone E.164, email opcional, classificação, isLead). Plugar `clients.create`. Mesmo padrão para os outros "Novo X" sem handler em `/sales`, `/campaigns`, `/finance`, `/inventory`, `/schedule`, `/team`, `/promo/new` (já tem), `/tags` (já tem).
3. **Seletores em vez de UUID raw.** `/clients/[id]/wishlist` e `/sales/returns` hoje pedem o UUID na mão. Substituir por:
   - Wishlist: SearchBar que chama `catalog.listProducts` com debounce → lista clicável
   - Returns: SearchBar que chama `sales.list` filtrado por status `DELIVERED|CONFIRMED` → escolhe a venda
4. **Toast feedback de sucesso.** Hoje as mutations bem-sucedidas só invalidam queries silenciosamente. Adicionar Toast (`@wbc/ui`) com mensagem de confirmação em todas as mutations CRUD (~20 lugares). Convenção: success no canto inferior direito, 3s, dispensável.
5. **Estados de hover/focus padronizados** em ListItem, Button, todos os cards interativos. Auditar contra a folha do Design System.
6. **Mobile responsivo até 360px.** Probar cada page.tsx em 360px. Casos sabidos: tabela de finance, grid 6 cards do client profile, wizards 4-step.
7. **Validação visual nos forms.** Hoje formulários só mostram erro depois do submit (via Alert). Mostrar erros inline (red border + helper text) usando react-hook-form + zod resolver, que já está no package.json.
8. **Loading states completos.** Várias páginas só mostram skeleton enquanto a primeira query carrega. Mutations em flight não dão feedback visual (botão fica disabled mas é discreto). Adicionar spinner inline.
9. **Empty states com call-to-action útil.** Padronizar: ícone + título + descrição curta + 1 botão de ação. Auditar todos os EmptyState do app (são ~15).
10. **Acessibilidade básica.** `aria-label` em todos os icon buttons (×, ✓, →), `<label>` em todos os inputs, ordem de tab faz sentido em cada wizard, focus trap em modais.

**Deliverable:** o usuário consegue completar os 5 golden paths do E20 sem cair em botão sem handler, sem precisar copiar UUIDs, com feedback visual claro em cada ação. Toda mutation acerta um Toast. Lighthouse Accessibility ≥ 90 (vai pavimentar o E21).

---

#### **F11.E21** — Performance audit + Lighthouse

**Depende de:** F11.E03 a F11.E17
**Tasks estimadas:** 7
**Escopo:**

- Bundle analyzer no web (`@next/bundle-analyzer`); meta < 300KB JS first load
- Code splitting por rota (já default no Next 15) — auditar tamanho de cada
- Lazy load do FunnelChart, dos editores de texto rico, do mapa de logística
- Lighthouse score ≥ 90 em Performance, Accessibility, Best Practices, SEO no `/` autenticado
- Otimizar imagens (next/image em vez de `<img>`)
- Smoke web vitals via `/api/vitals`

**Deliverable:** Lighthouse 90+ em todas as métricas; first load < 300KB.

---

#### **F11.E22** — Deploy staging + production

**Depende de:** F11.E18 a F11.E21 (e F11.E20.5)
**Tasks estimadas:** 9
**Escopo:**

- Configurar `deploy/staging.env` + `deploy/production.env` reais (Resend, Mercado Pago, WhatsApp Business, Sentry, CDN)
- Smoke test pós-deploy em staging: golden paths E2E rodam contra staging
- Migration de banco em staging
- Deploy production via `deploy/` scripts existentes
- Rollback runbook documentado em `docs/`

**Deliverable:** App em staging e production rodando; smoke verde nos 2 ambientes.

---

#### **F11.E23** — Checkpoint Fase 11

**Depende de:** F11.E01 a F11.E22 (incluindo F11.E20.5)
**Tasks estimadas:** 4
**Escopo:**

- Atualizar `prompts/STATE.json` com `current_phase: 11, status: COMPLETED`
- Type-check global (`pnpm type-check`)
- Build global (`pnpm build`)
- Tag git: `v3.0.0-fase-11`
- Atualizar `CHANGELOG.md` com tudo da Fase 11
- Atualizar `Fase 3/WBC-Fase3-Auditoria-e-Plano-v1.0.md` marcando os itens fechados

**Deliverable:** Tag `v3.0.0-fase-11` no git; STATE.json reflete BUILD_COMPLETE da fase.

---

### BLOCO G · GAP CLOSURE (inserido em v1.2)

Sete lacunas que F11.E23 marcou como follow-up nos commits originais. Aqui são elevadas a épicos próprios para serem fechadas até PRODUCTION_LIVE.

#### **F11.E24** — BullMQ schedulers para 6 jobs cron

**Depende de:** F11.E11–E13, E18 (procedures manuais já existem)
**Tasks estimadas:** 8
**Escopo:** registrar workers BullMQ para os 6 jobs com procedure manual hoje:

- `clients.flagInactive` — daily cron, scan tenants ativos
- `sales.flagExpiringCashbacks` — daily cron
- `schedule.buildRestockReminders` — daily cron
- `schedule.buildDateReminders` — daily cron
- `platform.refreshUnlockedFeatures` — após mutações (event-driven) ou daily
- `resetDemoTenant` — daily cron, só para tenants `isDemo=true`

Adicionar processador em `apps/worker/src/processors/` com `Queue.add` agendado por cron string. Jobs idempotentes (use-cases já são).

**Deliverable:** worker container roda os 6 jobs sem chamada manual; dashboard `/api/health` mostra cada queue saudável.

---

#### **F11.E25** — Outbox handlers para SALE_CONFIRMED + push fan-out

**Depende de:** F11.E08 (loyalty), F11.E18 (PushDevice)
**Tasks estimadas:** 5
**Escopo:**

- Handler em `apps/worker` que escuta evento `SALE_CONFIRMED` e chama `loyalty.earnFromSale` (1 ponto / R$ 10).
- Handler que escuta `Notification` criada com `type` cuja categoria é "pushable" e fan-outs para todos os `PushDevice` do tenant via Expo Push API.

**Deliverable:** confirmar uma venda credita pontos sem chamada manual; criar uma Notification dispara push real para cada device registrado.

---

#### **F11.E26** — Procedures faltantes para tabs e funil reais

**Depende de:** F11.E03–E06 (UI plugada)
**Tasks estimadas:** 6
**Escopo:**

- `platform.getSubscription` — lê Subscription + planQuota; usado em `/settings/plan`.
- `campaigns.getById` — single campaign read; usado em `/campaigns/[id]`.
- `sales.getConversionStats({campaignId})` — agrega `CampaignRecipient` por status; alimenta o FunnelChart com valores reais.
- `team.listMembers` — lista membros de um Team; usado na tab "members" de `/team`.

Refatorar as 4 páginas correspondentes para consumir os dados reais (substituir hardcoded zero/`null` por valores da query).

**Deliverable:** funil de campanha mostra números reais; tab Plan mostra plano atual; tab Members do `/team` lista membros.

---

#### **F11.E27** — Mobile screens consumindo a camada offline

**Depende de:** F11.E18 (libs offline já existem)
**Tasks estimadas:** 10
**Escopo:** refatorar as screens principais do `apps/mobile/` para usar `getDb()` + `enqueueMutation()`:

- `clients-list-screen.tsx` — read SQLite primeiro, fall back para tRPC online
- `client-profile-screen.tsx` — mesmo padrão
- `sales-list-screen.tsx`, `new-sale-screen.tsx`
- `schedule-screen.tsx`, `my-day-screen.tsx`
- Hook `useOnlineSync()` que dispara `runSyncOnce` na volta da rede (`Network.addNetworkStateListener`)
- `App.tsx` registra o push token uma vez após login (chama `registerForPushNotifications` + `platform.registerPushToken`)

**Deliverable:** abrir o app sem rede mostra o último estado conhecido; criar cliente offline grava local + enfileira; ao reconectar, drena automaticamente.

---

#### **F11.E28** — UX polish 5–10 (resto do E20.5)

**Depende de:** F11.E20.5
**Tasks estimadas:** 12
**Escopo:** os 6 itens deixados em aberto:

5. Estados hover/focus padronizados em ListItem, Button, cards interativos.
6. Mobile responsivo até 360px (testar todas as page.tsx).
7. Validação visual inline em todos os forms (react-hook-form + zod resolver).
8. Loading states completos (mutation in-flight com spinner inline).
9. Empty states com CTA padronizado (auditoria das ~15 telas).
10. A11y básica completa — aria-label em todos os icon buttons, label em todos os inputs, tab order em wizards, focus trap em modais.

**Deliverable:** Lighthouse Accessibility ≥ 95 em `/`, `/clients`, `/sales/new`, `/campaigns/new`. Sem warnings do `axe-core` nos golden paths.

---

#### **F11.E29** — Lighthouse measurement real

**Depende de:** F11.E21, F11.E28
**Tasks estimadas:** 4
**Escopo:**

- Instalar `lighthouse` CLI local e rodar contra `localhost:3000` autenticado.
- Capturar relatórios JSON em `.lighthouse-reports/` (gitignored).
- Documentar números no `docs/PERFORMANCE.md` como baseline.
- Se algum score < 90, abrir issue para o item específico (não bloquear o checkpoint, mas registrar).

**Deliverable:** baseline de 4 scores Lighthouse documentado para `/`, `/clients`, `/sales/new`, `/campaigns/new`.

---

#### **F11.E30** — Deploy real staging + production

**Depende de:** F11.E22 (runbook), F11.E24–E29
**Tasks estimadas:** 10
**Restrição:** este épico **não pode ser executado pelo agente** porque depende de credenciais externas (Resend, Mercado Pago, WhatsApp Business, Sentry DSN, DNS, infraestrutura). O dono do projeto executa seguindo `docs/DEPLOY.md` + `docs/SMOKE_CHECKLIST.md`.

**Escopo (humano):**

- Provisionar VM/cluster (DigitalOcean, AWS, similar).
- DNS apontando para staging.wbc.com.br + wbc.com.br.
- Preencher `deploy/staging.env` e `deploy/production.env` com credenciais reais.
- Rodar `./deploy/deploy.sh first-run` em staging.
- Smoke completo (`docs/SMOKE_CHECKLIST.md`).
- Promover para produção.
- Atualizar `STATE.json` `status: PRODUCTION_LIVE`.

**Deliverable:** app rodando em produção; tag `v3.0.0-fase-11` validada por smoke real.

---

## CRITÉRIOS DE SUCESSO DA FASE 11

A Fase 11 está completa quando **todos** os critérios abaixo são verdadeiros:

- [ ] `pnpm type-check` verde
- [ ] `pnpm build` verde
- [ ] `pnpm test` verde com cobertura ≥ 70% em `packages/business/`
- [ ] `pnpm test:e2e` verde nos 5 golden paths
- [ ] Lighthouse Performance ≥ 90 em `/` autenticado
- [ ] Lighthouse Accessibility ≥ 90 em `/` autenticado (cumprido em F11.E20.5)
- [ ] F11.E20.5 fechou os 4 bugs críticos: logout no topbar, "Adicionar X" funcional, seletores em vez de UUID raw, toast de feedback
- [ ] Middleware Next ativo e CSP/proteção de rotas funcionando
- [ ] Todas as páginas listadas neste plano respondem 200 com dado real (não scaffold)
- [ ] Os 8 itens "sem backend" (E07–E10) implementados ponta-a-ponta
- [ ] Os 10 itens "backend parcial" (E11–E13) completados
- [ ] As 16+ telas faltantes (E14–E16) criadas e plugadas
- [ ] Landing pública estilizada (E17)
- [ ] Mobile offline + push (E18)
- [ ] Tag `v3.0.0-fase-11` criada
- [ ] `Fase 3/WBC-Fase3-Auditoria-e-Plano-v1.0.md` atualizada com itens fechados

---

## CONVENÇÕES PARA OS PROMPTS DETALHADOS

Cada épico (`F11.E01_*.md` … `F11.E23_*.md`) deve seguir o template já estabelecido na Fase 10:

````
# [F11.EN] — Título

> Fase: 11
> Epico: F11.EN
> Prioridade: N de 23
> Depende de: <lista>
> Estimativa de tasks: X tasks

> ANTES DE EXECUTAR: Leia WBC_REGRAS_INVIOLAVEIS.md...

## CONTEXTO
## PRÉ-CONDIÇÕES
## RESULTADO ESPERADO

## TASKS
### TASK 1 de X — ...
**Objetivo:**
**Arquivos criados:**
**Arquivos modificados:**
**Código:**
```ts
...
````

**Validação:**

### TASK 2 de X — ...

...

## CHECKLIST DE CONCLUSÃO

- [ ] type-check verde
- [ ] testes manuais OK
- [ ] commit `feat(<scope>): ...` criado
- [ ] merge para main

```

---

## PRÓXIMO PASSO IMEDIATO

Quando começar a executar:

1. Ler este plano (`prompts/fase-11/00_PLANO_FASE11.md`)
2. Ler a auditoria (`Fase 3/WBC-Fase3-Auditoria-e-Plano-v1.0.md`) para contexto profundo de cada item
3. Atualizar `prompts/STATE.json` com `current_phase: 11, current_epic: "F11.E01", status: IN_PROGRESS`
4. Escrever `prompts/fase-11/F11.E01_trpc_client_setup.md` com TASK 1 a TASK 6 detalhadas
5. Executar F11.E01 → merge → escrever F11.E02 → executar → merge → ... até F11.E23

Os prompts detalhados de cada épico serão escritos sob demanda, no momento de executar — não todos de uma vez. Isso evita rebuild do plano se algo na realização do épico anterior mudar a premissa.
```
