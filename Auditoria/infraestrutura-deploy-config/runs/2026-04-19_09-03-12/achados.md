# Achados da Auditoria

## Identificação
- dominio: infraestrutura-deploy-config
- run_id: 2026-04-19_09-03-12
- ultima_atualizacao: 2026-04-19 09:15:00

## Severidades / Status
- critico · alto · medio · baixo · informativo
- aberto · confirmado · mitigado · resolvido · aceito · nao_aplicavel

## Positivos (registrados para contexto, não geram achado)
- Dockerfiles multi-stage com usuário não-root e `pnpm install --frozen-lockfile`
- Healthchecks nativos no compose para web e worker
- Graceful shutdown implementado no worker
- Backup diário com retenção 30 d (`deploy/backup/backup.sh` + `install-cron.sh`)
- `packages/shared/src/env.ts` valida env vars via Zod no startup
- Dependabot ativo (`.github/dependabot.yml`) com agrupamento semanal

## Achados Registrados

### ACH-001
- titulo: Pipeline CI/CD não constrói nem publica imagens OCI
- severidade: alto
- categoria: pipeline
- status: confirmado
- resumo: `.github/workflows/ci.yml` roda apenas lint e testes. Imagens `web` e `worker` são construídas manualmente na VM via `docker compose build`. Não há build reprodutível em CI, sem SBOM nem scanning automático.

#### Evidencia
- arquivo_ou_area: .github/workflows/ci.yml

#### Impacto
- tecnico: Sem trilha de auditoria das imagens; sem registro de quem buildou; sem imagens imutáveis versionadas
- negocio: Deploy inconsistente; rollback difícil

#### Recomendacao
- acao_sugerida: Adicionar job que faz `docker buildx` com tags `sha`, `semver` e push para GHCR; rodar Trivy/Grype; exportar SBOM (CycloneDX/Syft); assinar com Sigstore (cosign) opcionalmente
- prioridade: alta

---

### ACH-002
- titulo: Sem Infrastructure-as-Code — deploy via bash imperativo
- severidade: alto
- categoria: infraestrutura
- status: confirmado
- resumo: `deploy/deploy.sh` e Docker Compose estático cumprem o papel, mas não há Terraform/Pulumi nem estado versionado. Reconstrução do ambiente depende de manual + ordem correta de comandos.

#### Evidencia
- arquivo_ou_area: deploy/deploy.sh; ausência de `infra/terraform`, `infra/pulumi`

#### Impacto
- tecnico: Onboarding de novo ambiente trabalhoso e sujeito a drift
- negocio: DR caro; migração de provedor custosa

#### Recomendacao
- acao_sugerida: Migrar para Terraform (se cloud homogêneo) ou Pulumi; versionar no repo; CI de `plan` em PR
- prioridade: alta

---

### ACH-003
- titulo: Backups apenas locais — sem replicação off-host/off-site
- severidade: alto
- categoria: dr
- status: confirmado
- resumo: `deploy/backup/backup.sh` grava dumps em `/backups/` na mesma VM. Se o host falhar (disco, SO, acesso), todos os backups são perdidos.

#### Evidencia
- arquivo_ou_area: deploy/backup/backup.sh:10; docs/DEPLOYMENT.md

#### Impacto
- tecnico: DR inviável para falha total de host
- negocio: Perda permanente de dados possível

#### Recomendacao
- acao_sugerida: Ao final do backup, `aws s3 cp` (ou `mc cp`) para bucket remoto com versionamento e lifecycle; chaves IAM com escopo mínimo (cross-ref seguranca/ACH-016)
- prioridade: alta

---

### ACH-004
- titulo: DR documentado em placeholder — RTO/RPO sem validação nem runbook
- severidade: alto
- categoria: dr
- status: confirmado
- resumo: `docs/DEPLOYMENT.md` sugere RTO ≤ 4 h e RPO ≤ 15 min como "pendente validação humana". Não há runbook por cenário (disk full, DB corruption, VM down, Redis loss).

#### Evidencia
- arquivo_ou_area: docs/DEPLOYMENT.md:65-75

#### Impacto
- tecnico: Tempo de resposta a incidente indeterminado
- negocio: Sem contrato de continuidade

#### Recomendacao
- acao_sugerida: Formalizar RTO/RPO com stakeholders; criar `docs/dr/{disk-full,db-corrupt,vm-down,redis-loss}.md`; validar em drill mensal (cross-ref dados-persistencia/ACH-018)
- prioridade: alta

---

### ACH-005
- titulo: Sem `required_status_checks` / branch protection no main
- severidade: alto
- categoria: pipeline-e-governanca
- status: confirmado
- resumo: CI roda, mas nenhum gate impede merge com CI falhando. Sem `.github/CODEOWNERS` nem required reviews (cross-ref seguranca/ACH-017).

#### Evidencia
- arquivo_ou_area: .github/ (sem CODEOWNERS); GitHub branch protection não verificável estaticamente, mas ausência de artefatos aponta para desativação

#### Impacto
- tecnico: Código com erro entra em main
- negocio: Risco operacional direto

#### Recomendacao
- acao_sugerida: Habilitar branch protection: `required_status_checks` (lint, type-check, test, arch:check), ≥1 review, dismiss stale; criar CODEOWNERS
- prioridade: alta

---

### ACH-006
- titulo: Imagens de observabilidade usando tag `:latest`
- severidade: medio
- categoria: container
- status: confirmado
- resumo: `docker-compose.prod.yml` declara `prom/prometheus:latest` e `grafana/grafana:latest`. Sem pinagem, deploys futuros podem puxar versões incompatíveis.

#### Evidencia
- arquivo_ou_area: docker-compose.prod.yml:125,138

#### Impacto
- tecnico: Drift entre ambientes
- negocio: Incidente após upgrade silencioso

#### Recomendacao
- acao_sugerida: Fixar versões semver (`prom/prometheus:v2.52.0`, `grafana/grafana:11.1.0`); Dependabot para docker (já suporta)
- prioridade: media

---

### ACH-007
- titulo: `turbo.json globalEnv` incompleto — SENTRY_DSN, GOOGLE_*, WHATSAPP_APP_SECRET ausentes
- severidade: baixo
- categoria: config
- status: confirmado
- resumo: Lista declarada em `turbo.json` não inclui variáveis críticas; cache Turbo pode ficar inválido silenciosamente ao trocar SDR_DSN/OAuth.

#### Evidencia
- arquivo_ou_area: turbo.json:4-14

#### Impacto
- tecnico: Cache divergência
- negocio: Baixo

#### Recomendacao
- acao_sugerida: Adicionar `SENTRY_DSN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `WHATSAPP_APP_SECRET`, `OTEL_EXPORTER_OTLP_ENDPOINT`
- prioridade: baixa

---

### ACH-008
- titulo: Sem sistema de feature flags — rollouts binários
- severidade: medio
- categoria: deploy-e-evolucao
- status: confirmado
- resumo: Nenhuma integração com Unleash/Growthbook/LaunchDarkly nem mecanismo env-based estruturado. Features entram "all or nothing".

#### Evidencia
- arquivo_ou_area: ausência em package.json; sem `feature-flag.ts` no packages/shared

#### Impacto
- tecnico: Rollback = redeploy
- negocio: Risco maior em experimentos

#### Recomendacao
- acao_sugerida: Avaliar Growthbook (open-source) ou Unleash; wrapper em `packages/shared/src/feature-flags.ts` com fallback para env
- prioridade: media

---

### ACH-009
- titulo: Health check pós-deploy não é automatizado
- severidade: medio
- categoria: deploy-e-operacao
- status: confirmado
- resumo: `deploy/deploy.sh` termina com `docker compose ps`. Não aguarda readiness real (`/api/trpc/health.ready`) antes de declarar sucesso.

#### Evidencia
- arquivo_ou_area: deploy/deploy.sh:120-130

#### Impacto
- tecnico: Deploy pode parecer ok com app degradado
- negocio: Incidente silencioso

#### Recomendacao
- acao_sugerida: Adicionar polling `for i in {1..30}; do curl -fsS http://localhost:3000/api/trpc/health.ready && break; sleep 2; done`; falhar script se não ficar ready
- prioridade: media

---

### ACH-010
- titulo: Restauração de backup não é testada automaticamente (sem drill)
- severidade: medio
- categoria: dr
- status: confirmado
- resumo: `restore.sh` existe mas sem job periódico que restaure um dump em container isolado para validar integridade.

#### Evidencia
- arquivo_ou_area: deploy/backup/restore.sh; ausência de workflow `.github/workflows/dr-drill.yml`

#### Impacto
- tecnico: Corrupção só é descoberta em incidente real
- negocio: DR pode falhar quando mais precisa

#### Recomendacao
- acao_sugerida: Workflow GitHub Actions semanal: baixar último backup, restaurar em Postgres efêmero, comparar row counts contra snapshot esperado
- prioridade: media

---

### ACH-011
- titulo: Ambientes dev/staging/prod não têm compose overlay (`docker-compose.override.yml`)
- severidade: medio
- categoria: ambientes
- status: confirmado
- resumo: `docker-compose.yml` (dev) e `docker-compose.prod.yml` (prod). Staging inexistente. Sem overlays (`-f base -f staging.yml`) dificultando variações e aumentando drift entre dev/prod.

#### Evidencia
- arquivo_ou_area: docker-compose.yml; docker-compose.prod.yml

#### Impacto
- tecnico: Drift silencioso entre ambientes
- negocio: "works on dev" rotineiro

#### Recomendacao
- acao_sugerida: Adotar `docker-compose.base.yml` + overlays por ambiente; criar ambiente `staging` com dados sintéticos e deploy automático
- prioridade: media

---

### ACH-012
- titulo: Migrations manuais (`packages/db/prisma/migrations/manual/*`) fora do workflow Prisma (cross-ref dados-persistencia/ACH-015)
- severidade: alto
- categoria: deploy-e-dados
- status: confirmado
- resumo: `001_rls_policies.sql`, `auth_v2_schema.sql` etc. não entram em `prisma migrate deploy`. Um ambiente novo pode subir sem RLS.

#### Evidencia
- arquivo_ou_area: packages/db/prisma/migrations/manual/*; deploy/deploy.sh (chama `prisma migrate deploy`)

#### Impacto
- tecnico: Drift de schema entre ambientes
- negocio: Segurança reduzida em produção nova

#### Recomendacao
- acao_sugerida: Converter manuais para migrations Prisma nomeadas; ou executar `psql -f manual/*.sql` explicitamente em `deploy.sh`; gate de CI que falhe se `prisma migrate status` detectar drift
- prioridade: alta

---

### ACH-013
- titulo: SSL/Certbot automation sem retry-safe idempotência
- severidade: baixo
- categoria: deploy
- status: confirmado
- resumo: `deploy/deploy.sh` chama certbot em runs subsequentes; se certificado já existe pode falhar. Sem flag `--keep-until-expiring`.

#### Evidencia
- arquivo_ou_area: deploy/deploy.sh (seção ssl)

#### Impacto
- tecnico: Deploy repetido falha; operador precisa ignorar manualmente
- negocio: Fricção operacional

#### Recomendacao
- acao_sugerida: `certbot certonly --keep-until-expiring` ou check prévio com `certbot certificates`
- prioridade: baixa

---

### ACH-014
- titulo: Sem monitoramento de deploy (deployment events no Sentry/Grafana)
- severidade: baixo
- categoria: deploy-e-observabilidade
- status: confirmado
- resumo: Cada deploy não envia evento a Sentry (`release:create`) nem marker de Grafana (`/api/annotations`), dificultando correlação entre deploy e incidente.

#### Evidencia
- arquivo_ou_area: deploy/deploy.sh (sem integração)

#### Impacto
- tecnico: Regressões difíceis de correlacionar
- negocio: MTTR alto

#### Recomendacao
- acao_sugerida: Adicionar `curl -X POST $SENTRY_RELEASE_URL` após build; `/api/annotations` Grafana com tag `deploy`
- prioridade: baixa

---

### ACH-015
- titulo: Secrets de build podem aparecer em cache de imagem (ARG DATABASE_URL)
- severidade: medio
- categoria: seguranca-de-build
- status: confirmado
- resumo: Dockerfiles recebem `DATABASE_URL` via `ARG` para `prisma generate`. Ainda que não persista na camada final, fica exposto no histórico de build-kit se não usar `--secret`.

#### Evidencia
- arquivo_ou_area: deploy/Dockerfile.web, deploy/Dockerfile.worker (ARG + ENV no builder)

#### Impacto
- tecnico: Credenciais em layer cache
- negocio: Leakage em mirror de registry

#### Recomendacao
- acao_sugerida: Migrar para `RUN --mount=type=secret,id=database_url`; passar via buildx `--secret id=database_url,src=...`
- prioridade: media

---

### ACH-016
- titulo: Cross-ref reforços não duplicados
- severidade: informativo
- categoria: cross-ref
- status: confirmado
- resumo: Achados registrados em outros domínios que impactam diretamente este domínio e que não foram duplicados aqui: seguranca/ACH-013 (WHATSAPP_APP_SECRET), seguranca/ACH-014 (Grafana fallback admin), seguranca/ACH-015 (secret scanning), seguranca/ACH-016 (secret manager), seguranca/ACH-025 (role Postgres), seguranca/ACH-026 (hardening runtime), confiabilidade/ACH-005 (stop_grace_period). Todos são itens de infra/deploy a considerar na execução de remediação.

#### Evidencia
- arquivo_ou_area: cross-ref com Auditoria/seguranca/runs/2026-04-18_22-06-18/achados.md e Auditoria/confiabilidade-resiliencia/runs/2026-04-19_07-38-46/achados.md

#### Impacto
- tecnico: Priorização conjunta no backlog de infra
- negocio: Não criar débito por esquecer itens já documentados

#### Recomendacao
- acao_sugerida: Incluir no plano de remediação junto com ACH-001..015 deste domínio
- prioridade: informativo
