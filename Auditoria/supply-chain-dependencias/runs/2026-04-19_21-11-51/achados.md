# Achados da Auditoria

## Identificação
- dominio: supply-chain-dependencias
- run_id: 2026-04-19_21-11-51
- ultima_atualizacao: 2026-04-19 21:25:00

## Severidades / Status
- critico · alto · medio · baixo · informativo
- aberto · confirmado · mitigado · resolvido · aceito · nao_aplicavel

## Achados Registrados

### ACH-001
- titulo: Vulnerabilidade crítica (RCE) em `protobufjs < 7.5.5` via OpenTelemetry
- severidade: critico
- categoria: cve
- status: confirmado
- resumo: `@opentelemetry/auto-instrumentations-node@0.72.0` puxa `protobufjs@7.5.4`, versão com RCE conhecida em serialização gRPC. Propaga-se pela pipeline de telemetria do apps/api.

#### Evidencia
- arquivo_ou_area: apps/api/package.json; pnpm-lock.yaml (entrada `protobufjs 7.5.4`)

#### Impacto
- tecnico: Execução de código arbitrário via payload gRPC malformado
- negocio: Comprometimento de container em produção

#### Recomendacao
- acao_sugerida: Atualizar `@opentelemetry/auto-instrumentations-node` para versão que puxe `protobufjs ≥ 7.5.5`; alternativamente, `pnpm.overrides: { "protobufjs": ">=7.5.5" }`; validar pelo `pnpm audit`
- prioridade: alta

---

### ACH-002
- titulo: `next-auth` em versão beta (5.0.0-beta.30) em autenticação de produção
- severidade: alto
- categoria: pinagem-de-versao
- status: confirmado
- resumo: `apps/web/package.json` fixa `next-auth: "5.0.0-beta.30"`. Pre-release com breaking changes frequentes, risco em auth crítico.

#### Evidencia
- arquivo_ou_area: apps/web/package.json

#### Impacto
- tecnico: Breaking changes silenciosos; falhas de auth em minor upgrade
- negocio: Logins/logout/sessão instáveis; suporte oficial limitado

#### Recomendacao
- acao_sugerida: Aguardar GA de `next-auth@5`; ou rollback para `4.x` LTS se estabilidade é prioridade imediata
- prioridade: alta

---

### ACH-003
- titulo: Sem `pnpm audit` (ou scanner equivalente) no CI
- severidade: alto
- categoria: pipeline-e-governanca
- status: confirmado
- resumo: `.github/workflows/ci.yml` roda lint/type-check/test, mas não há job de vulnerability scanning. CVEs como ACH-001 não são detectadas em PR. Cross-ref seguranca/ACH-015 (secret scanning) + testes-qualidade/ACH-007 (arch:check).

#### Evidencia
- arquivo_ou_area: .github/workflows/ci.yml

#### Impacto
- tecnico: Regressões de segurança entram em main sem alerta
- negocio: Exposição não detectada

#### Recomendacao
- acao_sugerida: Passo `pnpm audit --audit-level high --production=true`; opcional Trivy filesystem/Grype em modo `fail-on high`; Snyk ou GitHub Dependency Review Action como gate
- prioridade: alta

---

### ACH-004
- titulo: Imagens Docker base sem digest pinning
- severidade: alto
- categoria: supply-chain-de-containers
- status: confirmado
- resumo: `docker-compose.prod.yml` usa tags flutuantes (`postgres:16-alpine`, `prom/prometheus:latest`, etc.) sem `@sha256:…`. Reforça infra/ACH-006 (prom/grafana `:latest`).

#### Evidencia
- arquivo_ou_area: docker-compose.prod.yml; deploy/Dockerfile.*

#### Impacto
- tecnico: Build não reprodutível; supply-chain attack por image swap
- negocio: Forense pós-incidente inviável

#### Recomendacao
- acao_sugerida: Pin por digest (`image@sha256:...`); Dependabot (`package-ecosystem: docker`) para manter atualizado com PR automatizado
- prioridade: alta

---

### ACH-005
- titulo: Sem SBOM (CycloneDX/Syft) nem attestations de build
- severidade: alto
- categoria: sbom-e-integridade
- status: confirmado
- resumo: Nenhum arquivo SBOM no repositório; nenhum job em CI que gere/publique. Sem assinatura de imagens (cosign/sigstore). Sem attestations SLSA.

#### Evidencia
- arquivo_ou_area: ausência em .github/workflows/; ausência de `sbom.json`

#### Impacto
- tecnico: Rastreabilidade de dependências inviável
- negocio: Compliance (SLSA, NIST SSDF) não atendido

#### Recomendacao
- acao_sugerida: Gerar SBOM CycloneDX com Syft em CI; publicar artefato e assinar imagens com cosign; habilitar `actions/attest-build-provenance`
- prioridade: alta

---

### ACH-006
- titulo: Dependabot NPM cobre apenas root e sem docker-ecosystem
- severidade: alto
- categoria: politica-de-atualizacao
- status: confirmado
- resumo: `.github/dependabot.yml` só tem `package-ecosystem: npm` em `/`. Não cobre `docker`, e não há major-bump channel separado.

#### Evidencia
- arquivo_ou_area: .github/dependabot.yml

#### Impacto
- tecnico: Imagens Docker não auditadas automaticamente
- negocio: CVEs em base images passam despercebidas

#### Recomendacao
- acao_sugerida: Adicionar `docker` e `docker-compose`; agendar 2x/semana; grupo separado para major updates com reviewer humano
- prioridade: alta

---

### ACH-007
- titulo: Sem política de licenças — risco de copyleft incompatível
- severidade: medio
- categoria: licencas
- status: confirmado
- resumo: Nenhum `docs/LICENSING.md`, nenhum scan de licenças em CI. Transitivas podem trazer GPL/AGPL incompatíveis com modelo SaaS.

#### Evidencia
- arquivo_ou_area: docs/ (sem LICENSING); .github/workflows (sem `license-checker`)

#### Impacto
- tecnico: Possível contaminação de licença
- negocio: Risco jurídico

#### Recomendacao
- acao_sugerida: Política (allowlist MIT/Apache/BSD/ISC); `license-checker` em CI com fail em GPL/AGPL; SBOM inclui campo license
- prioridade: media

---

### ACH-008
- titulo: Overrides de React 19 / React Native 0.81 / ioredis sem matriz de compatibilidade
- severidade: medio
- categoria: overrides
- status: confirmado
- resumo: `pnpm.overrides` força versões global (react 19.1.0, react-native 0.81.5, ioredis 5.10.1, @types/react ~19.1.17) sem documentação por package consumidor.

#### Evidencia
- arquivo_ou_area: package.json (pnpm.overrides)

#### Impacto
- tecnico: Peer-dep mismatch silencioso
- negocio: Bugs de integração dormentes

#### Recomendacao
- acao_sugerida: `docs/OVERRIDES.md` com rationale por override; rodar `pnpm install --strict-peer-dependencies` em CI opcional
- prioridade: media

---

### ACH-009
- titulo: Ausência de verificação de integridade de lockfile no CI
- severidade: medio
- categoria: reprodutibilidade
- status: confirmado
- resumo: CI usa `pnpm install --frozen-lockfile`, mas sem verificação extra (hash comparativo, assinatura). Se lockfile for adulterado em branch, instalação é aceita.

#### Evidencia
- arquivo_ou_area: .github/workflows/ci.yml

#### Impacto
- tecnico: Tampering indetectável em CI
- negocio: Supply-chain attack via branch adulterada

#### Recomendacao
- acao_sugerida: Signed commits; hook pre-push que recalcula hash do `pnpm-lock.yaml`; GitHub Advanced Security (Dependency Review) para analisar diffs
- prioridade: media

---

### ACH-010
- titulo: Picomatch vulnerável em tooling (tailwind/vite/expo)
- severidade: medio
- categoria: cve-em-tooling
- status: confirmado
- resumo: Lockfile traz versões vulneráveis de `picomatch` em dependências transitivas de tailwindcss/@vitejs/plugin-react/expo. Impacto dev-time; em CI/build.

#### Evidencia
- arquivo_ou_area: pnpm-lock.yaml (múltiplos registros picomatch)

#### Impacto
- tecnico: Injeção em patterns de glob
- negocio: Risco em builds que processam input externo (landing CMS, etc.)

#### Recomendacao
- acao_sugerida: Atualizar tooling; `pnpm dedupe` após; validar com `pnpm audit`
- prioridade: media

---

### ACH-011
- titulo: Vulnerabilidade moderada em Vite 8.0.x — path traversal em sourcemaps
- severidade: medio
- categoria: cve
- status: confirmado
- resumo: `@vitejs/plugin-react@6.0.1 -> vite@8.0.1` tem janela de vulnerabilidade (≤ 8.0.4). Dev-time mas pode afetar pipelines.

#### Evidencia
- arquivo_ou_area: package.json; pnpm-lock.yaml

#### Impacto
- tecnico: Exposição de arquivos via `.map`
- negocio: Vazamento de código-fonte em builds mal-configurados

#### Recomendacao
- acao_sugerida: Atualizar para `@vitejs/plugin-react@6.0.2+`; garantir que sourcemaps não vão para produção
- prioridade: media

---

### ACH-012
- titulo: Vulnerabilidade em `next-intl@3.26.5` (open redirect)
- severidade: medio
- categoria: cve
- status: confirmado
- resumo: `apps/web/package.json` fixa `next-intl@3.26.5`. Versões pré-4.9.1 sofrem open redirect em locale param.

#### Evidencia
- arquivo_ou_area: apps/web/package.json

#### Impacto
- tecnico: Redirect para URL controlada pelo atacante
- negocio: Phishing direcionado

#### Recomendacao
- acao_sugerida: Atualizar para `next-intl@4.x`; validar redirects no middleware; testar fluxos de i18n
- prioridade: media

---

### ACH-013
- titulo: Deprecated packages (stub types, uuid<7, rimraf<4, glob antigo)
- severidade: baixo
- categoria: higienizacao
- status: confirmado
- resumo: Lockfile contém avisos deprecated em `@types/bcryptjs`, `@types/ioredis`, `node-uuid`, `rimraf<4`, `uuid<7`, `old glob`. Stubs redundantes e EOL.

#### Evidencia
- arquivo_ou_area: pnpm-lock.yaml

#### Impacto
- tecnico: Aumento de superfície de ataque; tipos imprecisos
- negocio: Pequeno, mas cumulativo

#### Recomendacao
- acao_sugerida: Remover @types redundantes; atualizar glob/rimraf/uuid; `pnpm dedupe`
- prioridade: baixa

---

### ACH-014
- titulo: `.nvmrc` e Dockerfile usam tag `20` (floating) em vez de versão minor
- severidade: baixo
- categoria: reprodutibilidade
- status: confirmado
- resumo: `.nvmrc=20` e `FROM node:20-alpine` puxam qualquer 20.x LTS. Pode mudar patch level entre builds.

#### Evidencia
- arquivo_ou_area: .nvmrc; deploy/Dockerfile.web; deploy/Dockerfile.worker

#### Impacto
- tecnico: Build drift entre patches
- negocio: Baixo

#### Recomendacao
- acao_sugerida: Pinar minor (ex.: `20.13.0`) e alinhar em todos; Dependabot atualiza
- prioridade: baixa

---

### ACH-015
- titulo: `prepare: husky` roda em `pnpm install` — risco teórico de supply chain em dev
- severidade: baixo
- categoria: postinstall
- status: confirmado
- resumo: O script `prepare` do root executa `husky` em cada install. Se `.husky/` for alterado maliciosamente, hooks disparam em máquinas de dev.

#### Evidencia
- arquivo_ou_area: package.json:27; .husky/

#### Impacto
- tecnico: Execução de hooks manipulados em clones ou CI
- negocio: Menor em CI com `--ignore-scripts`, maior em máquinas locais

#### Recomendacao
- acao_sugerida: Revisar `.husky/` regularmente; code review obrigatório para mudanças; em CI ignorar scripts não necessários (`pnpm install --ignore-scripts` onde cabível)
- prioridade: baixa

---

### ACH-016
- titulo: Ausência de transparência/matriz de peer-dependencies
- severidade: baixo
- categoria: peer-deps
- status: confirmado
- resumo: Em monorepo com múltiplos apps, peer deps não são verificadas estritamente no CI. `autoInstallPeers` implícito evita erros de instalação mas pode mascarar incompatibilidades.

#### Evidencia
- arquivo_ou_area: pnpm-lock.yaml (sem relatório strict-peer); .npmrc ausente

#### Impacto
- tecnico: Peer mismatch visível só em runtime
- negocio: Debug adicional

#### Recomendacao
- acao_sugerida: `pnpm install --strict-peer-dependencies` em job não bloqueante; relatório mensal
- prioridade: baixa
