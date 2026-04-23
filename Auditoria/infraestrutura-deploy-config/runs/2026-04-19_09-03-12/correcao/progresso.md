# Progresso da Correção

## Identificação
- dominio: infraestrutura-deploy-config
- run_id: 2026-04-19_09-03-12
- branch: fix/infraestrutura-deploy-config/2026-04-19_09-03-12
- data_inicio: 2026-04-23 03:00:00
- ultima_atualizacao: 2026-04-23 03:45:00
- fase_atual: revisor
- status: em_andamento

## Resumo de Progresso
- total_aprovados: 15
- corrigidos_executor: 15
- revisados_revisor: 0
- corrigidos_pelo_revisor: 0
- nao_corrigiveis: 1
- nao_aprovados: 0
- pendentes: 0

## Achados

### ACH-006
- titulo: Imagens de observabilidade usando tag :latest
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 1c2fe76
- arquivos_alterados: docker-compose.prod.yml
- descricao_correcao: prom/prometheus:v2.54.1, prom/alertmanager:v0.27.0, grafana/grafana:11.2.2

### ACH-007
- titulo: turbo.json globalEnv incompleto
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: e8099cf
- arquivos_alterados: turbo.json
- descricao_correcao: +SENTRY_DSN, GOOGLE_CLIENT_ID/SECRET, OTEL_EXPORTER_OTLP_ENDPOINT (WHATSAPP_APP_SECRET já estava)

### ACH-011
- titulo: Compose overlays por ambiente
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: b4ca9bb
- arquivos_alterados: docker-compose.staging.yml (novo), deploy/COMPOSE-OVERLAYS.md (novo)
- descricao_correcao: overlay staging que sobrepõe prod (env_file, replicas, GF_SERVER_ROOT_URL); doc explicando convenção e usos

### ACH-013
- titulo: Certbot idempotência
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: d8566c7
- arquivos_alterados: deploy/deploy.sh
- descricao_correcao: certbot certonly com --keep-until-expiring --non-interactive

### ACH-009
- titulo: Health check pós-deploy
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: e51cd05
- arquivos_alterados: deploy/deploy.sh
- descricao_correcao: wait_for_ready() polling /api/health por 30 tentativas (60s); chamada em first_run e update

### ACH-014
- titulo: Deploy markers (Sentry/Grafana)
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 83688f4
- arquivos_alterados: deploy/deploy.sh
- descricao_correcao: send_sentry_release + send_grafana_annotation com fallback silencioso; ambos chamados em first_run e update com release = first-run-<sha> / update-<sha>

### ACH-012
- titulo: Migrations manuais fora do workflow Prisma
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 292d20d
- arquivos_alterados: deploy/deploy.sh
- descricao_correcao: apply_manual_migrations() cria _manual_migrations table, aplica *.sql em ordem alfabética marcando idempotência; chamado após prisma migrate deploy em first_run e update

### ACH-003
- titulo: Backup off-host
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: d5476f9
- arquivos_alterados: deploy/backup/backup.sh, docs/dr/BACKUP-OFFSITE.md (novo)
- descricao_correcao: replicate_offsite() opt-in via BACKUP_S3_URL (aws cli ou mc); warning se não configurado; doc com IAM policy mínima e follow-up (bucket, retention, credentials)

### ACH-010
- titulo: DR drill automatizado
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 1f56847
- arquivos_alterados: .github/workflows/dr-drill.yml (novo), docs/dr/RESTORE-DRILL.md (novo)
- descricao_correcao: workflow semanal domingo 03:00 UTC, Postgres 16 service, restaura último backup de S3, valida DR_DRILL_EXPECTED_TABLES

### ACH-004
- titulo: DR runbooks por cenário
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 678e413
- arquivos_alterados: docs/dr/{README,disk-full,db-corrupt,vm-down,redis-loss}.md (novos)
- descricao_correcao: 4 runbooks por cenário com sintomas, diagnóstico rápido, plano de ação, verificação, prevenção; cross-ref ACH-002/003/010/012; índice README em docs/dr/

### ACH-001
- titulo: CI/CD build + SBOM + scan
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 5c39b20
- arquivos_alterados: .github/workflows/docker-images.yml (novo), docs/CI-CD-IMAGES-FOLLOWUP.md (novo)
- descricao_correcao: workflow Docker build + push GHCR matrix [web,worker]; Trivy SARIF; Syft SBOM CycloneDX; cache GHA; BUILD_DATABASE_URL via build secret; follow-up doc com 6 pendências

### ACH-015
- titulo: Docker secrets de build
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 6761fd5
- arquivos_alterados: deploy/Dockerfile.web, deploy/Dockerfile.worker
- descricao_correcao: RUN --mount=type=secret,id=database_url; fallback dev via env; cacheable sem vazar credencial

### ACH-002
- titulo: IaC
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 7f75f35
- arquivos_alterados: infra/terraform/README.md (novo), docs/INFRA-AS-CODE-FOLLOWUP.md (novo)
- descricao_correcao: pasta infra/terraform/ marcada com README explicando estrutura futura; follow-up doc com 4 fases de migração, candidatos de provider, 5 pendências humanas

### ACH-005
- titulo: Branch protection + CODEOWNERS
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 9720e18
- arquivos_alterados: .github/CODEOWNERS, docs/BRANCH-PROTECTION-FOLLOWUP.md (novo)
- descricao_correcao: CODEOWNERS expandido com /apps/web/src/app/(auth)/, /apps/api/src/middleware/, /docs/dr/, /infra/, compose variants; doc com gh api command e 10 valores alvo de branch protection

### ACH-008
- titulo: Feature flags
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 1420f57
- arquivos_alterados: packages/shared/src/feature-flags.ts (novo), packages/shared/src/index.ts, docs/FEATURE-FLAGS-FOLLOWUP.md (novo)
- descricao_correcao: flag(name, default) lê FEATURE_FLAGS_JSON; type-safe; cache process-scoped; __resetFlagsForTesting helper; follow-up com comparação de providers e contrato de migração

### ACH-016 (informativo)
- titulo: Cross-ref reforços não duplicados
- severidade: informativo
- classificacao: nao_corrigivel
- status_executor: nao_aplicavel
- status_revisor: nao_aplicavel
- commit_executor: none
- commit_revisor: none
- observacoes: achado meta, documentação de cross-ref
