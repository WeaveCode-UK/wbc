# Handoff para o próximo chat

> **Estado em 2026-05-03 (último commit `5845e56`):** spec v1.0 (Fases 1-7) integralmente entregue. 95 dos 105 itens do `WBC-Funcionalidades-v1.2.md` estão em produção. Faltam 15 itens pequenos/médios (eu posso fazer) e 16 entradas externas (você precisa fornecer).
>
> Auditoria completa em `docs/AUDITORIA-ESCOPO-vs-IMPLEMENTACAO.md`.

---

## 1. Como abrir o próximo chat

Cole isto no início do novo chat para o agente entrar com contexto:

> "Continua o trabalho do WBC Platform. Lê primeiro `docs/AUDITORIA-ESCOPO-vs-IMPLEMENTACAO.md` e `docs/HANDOFF-PROXIMO-CHAT.md`. Confirma o último commit em `main` (`git log -1`). Depois ataca a lista de 'Falta — eu posso fazer' do handoff, em ordem, sem perguntar. Para cada item: type-check, commit Conventional, push pra main. Para os itens que dependem de credencial minha (lista 🔴 do handoff), pula e segue pro próximo. Não para por nada."

---

## 2. O que eu posso fazer (ataca isso, em ordem)

### Pequeno (≤ 1h cada — pegar tudo de uma vez)

1. **Sazonalidade analytics.** Novo `packages/business/analytics/use-cases/get-seasonality.ts` (groupBy mês/ano em `Sale`). Procedure `analytics.getSeasonality`. Card no `/finance` ou novo `/analytics`.

2. **Score de engajamento numérico (0-100).** Estender `analytics.getClientEngagement` para retornar score além do bucket ABC. Fórmula: frequência (40%) + recência (30%) + ticket (20%) + indicações (10%). Renderizar no `/clients/[id]`.

3. **Sugestão de produtos por perfil (sem IA).** Novo `clients.getSuggestions` que cruza `Client.skinType/hairType/allergies` × `Product.category/description`. Renderizar como lista no `/clients/[id]`.

4. **Reset de agendamentos em nova venda.** Estender `confirmSale` ou criar handler do `SALE_CONFIRMED` que deleta `PostSaleFlow` pendentes do mesmo `clientId` antes de criar os novos.

5. **Aniversário de cliente (1ª compra).** Novo job no `cron-processor.ts` que detecta clientes que completam 1, 2, 5 anos da `firstPurchaseDate` (calculado da menor `Sale.createdAt`) → cria `Notification`.

6. **Múltiplas marcas — UI.** Filtro global `brandId` na sidebar ou tab. Schema já permite (Showcase/Brand/produtos custom).

7. **Tracker de carreira/níveis (sem API real da marca).** Nova entity `CareerGoal` (tenantId, brandName, levelName, targetRevenue, targetByDate, currentRevenue). UI de cadastro manual em `/team` ou `/settings/career`. Cron diário compara progresso e cria notificação quando faltar < 20% do tempo/valor.

### Médio (2–4h cada)

8. **Verificação HMAC do webhook Meta WhatsApp.** Replicar o padrão do `mercadopago-webhook-handler.ts` para `apps/web/src/app/api/webhooks/whatsapp/route.ts`. Header `x-hub-signature-256`, secret `WHATSAPP_APP_SECRET`. Hoje aceita qualquer payload.

9. **Confirmação de venda automática via WhatsApp.** Handler de `SALE_CONFIRMED` no worker que monta mensagem de confirmação (template seedado) e chama `messaging.sendToClient`. Hoje só cria `PostSaleFlow`, não envia confirmação imediata.

10. **Botões de compartilhamento na landing.** No `/landing`: copiar link, gerar QR Code (qrcode lib já no projeto), botão "Compartilhar via WhatsApp" (`wa.me/?text=…`). Backend não muda.

11. **Rota `/analytics` dedicada.** Card de sazonalidade (item 1) + ranking de produtos (já existe) + comparativo temporal (mês atual vs anterior vs ano anterior). Existe uma referência a "tela de oportunidades com calendário" em `WBC-Funcionalidades-v1.2 §47` que pode entrar aqui.

12. **Onboarding cliente final via WhatsApp.** Handler de `CLIENT_CREATED` que dispara mini-questionário ("oi {nome}, qual seu tipo de pele? cabelo? alergia?") via N1 deep link ou N2. Resposta volta como nota livre no perfil — parsing manual fica out of scope.

### Maior (≥ 1 dia cada)

13. **Lembrete reposição com média real por cliente×produto.** Hoje `build-restock-reminders` usa heurística estática. Calcular `avgDaysBetweenPurchases` por par `clientId×productId` (groupBy `SaleItem.productId`, diff de `createdAt`) e usar essa média no scheduling. Persistir em coluna nova `Client.avgRepurchaseDays` ou tabela `ClientProductCadence`.

14. **Cobertura de testes nos módulos faltantes.** Vitest cobre clients/sales/logistics/pix-brcode. Faltam: campaigns, schedule, analytics, ai, finance, team, catalog, loyalty. Padrão: 1 happy path + 1 edge por use-case. Ordem: `campaigns` (mais lógica), `analytics` (cálculos), depois o resto.

15. **E2E Playwright dos 5 golden paths.** Login → criar cliente → criar venda → criar campanha → confirmar pagamento. Hoje `apps/web/playwright.config.ts` está configurado mas só tem fixtures.

---

## 3. O que depende exclusivamente de você

> Cada item: o que cadastrar, onde, e o que isso destrava.

### A. Credenciais que vão direto pro `.env`

Todas as variáveis abaixo já estão documentadas em `.env.production.example`. Cole o valor real e reinicie os containers — sem mudança de código.

| #   | Variável                                                     | De onde                                                             | Destrava                                                             |
| --- | ------------------------------------------------------------ | ------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1   | `MERCADOPAGO_ACCESS_TOKEN`                                   | Painel Mercado Pago > Suas integrações > Produção                   | PIX dinâmico real                                                    |
| 2   | `MERCADOPAGO_WEBHOOK_SECRET`                                 | Painel MP > Notificações                                            | Auto-confirm `paidAt` via webhook                                    |
| 3   | `NEXT_PUBLIC_MERCADOPAGO_ENABLED=true`                       | Decisão sua                                                         | Botão "PIX auto" aparece em `/finance` e `/sales/[id]`               |
| 4   | `DEEPSEEK_API_KEY`                                           | https://platform.deepseek.com                                       | Fluxos `/ai` (4 modos)                                               |
| 5   | `WHATSAPP_API_TOKEN`                                         | Meta for Developers > app > WhatsApp                                | N2 (Pro) — automação total                                           |
| 6   | `WHATSAPP_PHONE_NUMBER_ID`                                   | Meta WhatsApp Business                                              | Idem                                                                 |
| 7   | `WHATSAPP_APP_SECRET`                                        | Meta app > Configurações > Básico                                   | Verificação HMAC do webhook (item 8 da seção 🟡)                     |
| 8   | `WHATSAPP_VERIFY_TOKEN`                                      | Você inventa (string aleatória, paste igual no Meta)                | Handshake de subscrição do webhook                                   |
| 9   | `RESEND_API_KEY`                                             | https://resend.com — domínio verificado para `info@weavecode.co.uk` | E-mails reais (reset password, verify email, OTP)                    |
| 10  | `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN`                      | Sentry > novo projeto                                               | Error tracking em produção                                           |
| 11  | `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`                  | Google Cloud Console > OAuth 2.0 (decisão da role abaixo antes)     | Login com Google                                                     |
| 12  | `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` | Cloudflare R2 (recomendado, zero egress) ou AWS S3                  | Upload de áudio em campanhas, promo cards, avatares                  |
| 13  | `TOTP_ENCRYPTION_KEY`                                        | `openssl rand -base64 32`                                           | Encryption key do TOTP MFA — gere uma vez e guarda em secret manager |
| 14  | `GRAFANA_PASSWORD`                                           | `openssl rand -base64 24`                                           | Acesso ao painel Grafana                                             |

### B. Decisões de produto

15. **Auth 2.0 — `ADMIN` é admin do tenant ou da WeaveCode?** Bloqueador desde commit `abd7560`. Sem essa decisão o Google OAuth fica desabilitado em produção. Se for "admin do tenant", role `ADMIN` mantém escopo. Se for "control-plane", precisa de uma role nova `PLATFORM_ADMIN` separada.

16. **Pricing dos pacotes extras de IA.** `Subscription.aiGenerationsLimit` está hardcoded em 30. Spec menciona "pacotes extras avulsos" mas não há fluxo de compra. Decisão: continua hardcoded? Stripe? Pacote de 50/100/200?

17. **Domínio final.** `wbc.com.br` (spec original) ou `app.wbc.weavecode.co.uk` (docs/F11-E30)? Define `DOMAIN` no `.env`, configura DNS na Cloudflare e ajusta certbot.

18. **6 templates visuais adicionais para promo cards.** `generatePromoCard` tem 4 (`minimal`, `bold`, `festive`, `elegant`). Spec exige 10 — os 6 que faltam precisam ser desenhados (assets visuais SVG ou geração programática nova).

### C. Conteúdo

19. **50 textos pt-BR** para templates rotativos: 5 variações × 10 categorias (`POST_SALE_2D`, `POST_SALE_2W`, `POST_SALE_2M`, `RESTOCK`, `BIRTHDAY`, `BILLING`, `WELCOME`, `REACTIVATION`, `CASHBACK_EXPIRING`, `PROFESSION_DAY`). Seed atual cria placeholder. Texto real precisa de copywriter ou você.

### D. Infraestrutura

20. **Provisionar VPS Hostinger KVM4.** Checklist completo em `docs/F11-E30-PRODUCTION-LIVE-CHECKLIST.md`: instalar Docker + Compose, rodar `./deploy/deploy.sh`, configurar Cloudflare DNS, certbot.

21. **Wildcard DNS `*.wbc.com.br`.** Cloudflare CDN para subdomínios das landing pages (`{slug}.wbc.com.br`).

22. **Bucket R2 + cron de backup Postgres.** Procedure em `docs/DR-BACKUP-POLICY.md`.

### E. Métricas

23. **Lighthouse autenticado em build de produção.** Script já pronto:
    ```bash
    pnpm --filter @wbc/web build && pnpm --filter @wbc/web start
    # outro shell, depois de fazer login no browser:
    export LIGHTHOUSE_COOKIE='authjs.session-token=…'
    ./scripts/lighthouse-baseline.sh
    ```
    Cole os números na tabela em `docs/PERFORMANCE.md`.

---

## 4. O que está fora de escopo (post-v1.0)

Tudo do `Fase 2/WBC-Roadmap-Ecossistema-v1.0.md` — 14 camadas (fiscal, ERP light, CRM avançado, BI, mini-loja, integrações com marcas, social, pagamentos premium, território, IA profunda, app da cliente final, WhatsApp N3) é roadmap pós-v1.0 e não bloqueia o lançamento. Não foi pra esse handoff porque não é gap real.

---

## 5. Checagens rápidas

```bash
# Estado atual
git log -1 --oneline
# Esperado: 5845e56 docs(audit): scope-vs-implementation cross-check

# Type-check verde nos 8 pacotes
pnpm type-check
# Esperado: Tasks: 8 successful, 8 total

# Subir o app local (Postgres + Redis devem estar de pé via docker)
pnpm --filter @wbc/web dev
# Acesso em http://localhost:3000
```

---

**Resumo em uma frase:** o produto v1.0 está pronto e auditado; falta meia dúzia de polimentos (eu posso fazer no próximo chat) e meia dúzia de credenciais/decisões (só você consegue fornecer). O deploy pode acontecer assim que você cadastrar as credenciais e decidir o domínio.
