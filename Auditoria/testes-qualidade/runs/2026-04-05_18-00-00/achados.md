# Achados da Auditoria

## Identificacao
- dominio: testes-qualidade
- run_id: 2026-04-05_18-00-00
- ultima_atualizacao: 2026-04-05 18:30:00

## Severidades Permitidas
- critico, alto, medio, baixo, informativo

## Status Permitidos
- aberto, confirmado, mitigado, resolvido, aceito, nao_aplicavel

## Achados Registrados

### ACH-TQ-001
- titulo: 19 arquivos de teste cobrindo domain, use-cases, guards, UI e shared
- severidade: informativo
- categoria: cobertura
- status: confirmado
- resumo: O projeto possui 19 arquivos de teste distribuidos em: 3 UI (button, input, alert), 8 domain entities/value-objects (clients, sales, auth/otp, catalog, inventory, finance, messaging, platform/email), 4 use-cases (create-client, cancel-sale, send-otp, verify-otp, generate-label), 1 guard (permission), 2 shared (security-logger, circuit-breaker).

#### Evidencia
- arquivo_ou_area: packages/**/__tests__/*.test.ts, packages/**/__tests__/*.test.tsx
- detalhe: 19 arquivos de teste encontrados excluindo node_modules.

#### Impacto
- tecnico: Cobertura das camadas mais criticas (domain, guards, shared utilities).
- negocio: Confianca nas regras de negocio.

#### Recomendacao
- acao_sugerida: Nenhuma. Coerente com a regra do projeto "ZERO testes ate Fase 7, depois incremental".
- prioridade: nenhuma

---

### ACH-TQ-002
- titulo: Vitest configurado com coverage thresholds de 20%
- severidade: informativo
- categoria: configuracao
- status: confirmado
- resumo: vitest.config.ts configura coverage via v8 com thresholds de 20% (lines, branches, functions, statements). Coverage inclui shared, UI, domain, guards e use-cases. Exclui __tests__ e index.ts.

#### Evidencia
- arquivo_ou_area: vitest.config.ts:25-41
- detalhe: `thresholds: { lines: 20, branches: 20, functions: 20, statements: 20 }`. Provider v8.

#### Impacto
- tecnico: Gate basico de cobertura no CI.
- negocio: nenhum impacto direto.

#### Recomendacao
- acao_sugerida: Aumentar thresholds progressivamente conforme testes sao adicionados.
- prioridade: baixa

---

### ACH-TQ-003
- titulo: Playwright configurado para E2E com 1 teste
- severidade: informativo
- categoria: e2e
- status: confirmado
- resumo: playwright.config.ts configurado com chromium, retries: 1, timeout 30s, screenshot on failure. 1 e2e test existente (health.spec.ts). WebServer configurado para iniciar Next.js dev.

#### Evidencia
- arquivo_ou_area: playwright.config.ts, e2e/health.spec.ts
- detalhe: 1 projeto (chromium), baseURL localhost:3000.

#### Impacto
- tecnico: Infraestrutura de E2E pronta para expansao.
- negocio: nenhum impacto direto.

#### Recomendacao
- acao_sugerida: Expandir E2E tests para fluxos criticos (login, create sale, create client).
- prioridade: baixa

---

### ACH-TQ-004
- titulo: CI pipeline com lint, type-check e test em GitHub Actions
- severidade: informativo
- categoria: ci-cd
- status: confirmado
- resumo: ci.yml define 2 jobs paralelos: lint-and-typecheck (pnpm lint + pnpm type-check) e test (pnpm test). Ambos usam Node 20, pnpm 9.15.4 com cache, e rodam em push/PR para main.

#### Evidencia
- arquivo_ou_area: .github/workflows/ci.yml
- detalhe: 2 jobs, frozen-lockfile, db:generate antes de lint/test.

#### Impacto
- tecnico: Gate de qualidade automatico antes de merge.
- negocio: Menos bugs em producao.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

---

### ACH-TQ-005
- titulo: Nenhum teste para routers tRPC ou adapters
- severidade: medio
- categoria: lacuna-cobertura
- status: confirmado
- resumo: Nao existem testes para os 16 routers tRPC ou para os adapters Prisma. Toda a camada de integracao (router -> use-case -> adapter -> Prisma) nao esta coberta por testes.

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/ (zero __tests__), packages/business/**/adapters/ (zero __tests__)
- detalhe: Nenhum arquivo *.test.ts encontrado em routers ou adapters.

#### Impacto
- tecnico: Regressoes na camada de integracao nao sao detectadas automaticamente.
- negocio: Risco de bugs nao detectados em mudancas de API.

#### Recomendacao
- acao_sugerida: Adicionar testes de integracao para routers criticos (auth, sales, clients) usando mocks dos repositorios.
- prioridade: media

---

### ACH-TQ-006
- titulo: Dependabot configurado para atualizacoes semanais
- severidade: informativo
- categoria: dependencias
- status: confirmado
- resumo: dependabot.yml configura atualizacoes semanais de npm com max 10 PRs abertas e agrupamento de minor+patch.

#### Evidencia
- arquivo_ou_area: .github/dependabot.yml
- detalhe: `schedule: interval: weekly, open-pull-requests-limit: 10, groups: minor-and-patch`

#### Impacto
- tecnico: Dependencias atualizadas automaticamente.
- negocio: Menos vulnerabilidades.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

---

### ACH-TQ-007
- titulo: Testes nao incluem worker processors
- severidade: baixo
- categoria: lacuna-cobertura
- status: confirmado
- resumo: Os processors do worker (outbox-processor, dlq-scanner, dlq-processor, campaign-processor, analytics-processor, etc.) nao possuem testes unitarios.

#### Evidencia
- arquivo_ou_area: apps/worker/src/processors/ (zero __tests__)
- detalhe: 8 processors sem nenhum teste.

#### Impacto
- tecnico: Logica de processamento em background nao testada.
- negocio: Risco menor pois muitos processors sao thin wrappers.

#### Recomendacao
- acao_sugerida: Adicionar testes para outbox-processor e dlq-scanner como prioridade.
- prioridade: baixa
