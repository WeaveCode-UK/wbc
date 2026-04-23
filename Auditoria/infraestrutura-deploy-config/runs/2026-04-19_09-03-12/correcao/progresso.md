# Progresso da Correção

## Identificação
- dominio: infraestrutura-deploy-config
- run_id: 2026-04-19_09-03-12
- branch: fix/infraestrutura-deploy-config/2026-04-19_09-03-12
- data_inicio: 2026-04-23 03:00:00
- ultima_atualizacao: 2026-04-23 04:20:00
- fase_atual: revisor_concluido
- status: pronto_para_validacao_tecnica

## Resumo de Progresso
- total_aprovados: 15
- corrigidos_executor: 15
- revisados_revisor: 15
- aprovados_direto: 15
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
- status_revisor: aprovado
- commit_executor: 1c2fe76
- commit_revisor: none
- arquivos_alterados: docker-compose.prod.yml
- descricao_correcao: prom/prometheus:v2.54.1, prom/alertmanager:v0.27.0, grafana/grafana:11.2.2
- nota_revisor: três imagens pinadas em semver válido; remove risco de drift por :latest

### ACH-007
- titulo: turbo.json globalEnv incompleto
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: e8099cf
- commit_revisor: none
- arquivos_alterados: turbo.json
- descricao_correcao: +SENTRY_DSN, GOOGLE_CLIENT_ID/SECRET, OTEL_EXPORTER_OTLP_ENDPOINT (WHATSAPP_APP_SECRET já estava)
- nota_revisor: JSON válido; cobre as 5 variáveis da recomendação — cache Turbo agora invalida ao trocar Sentry/OAuth/OTEL

### ACH-011
- titulo: Compose overlays por ambiente
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: b4ca9bb
- commit_revisor: none
- arquivos_alterados: docker-compose.staging.yml (novo), deploy/COMPOSE-OVERLAYS.md (novo)
- descricao_correcao: overlay staging que sobrepõe prod (env_file, replicas, GF_SERVER_ROOT_URL); doc explicando convenção e usos
- nota_revisor: overlay sobrepõe prod.yml corretamente (replicas=1, env_file=.env.staging, GF_SERVER_ROOT_URL staging); doc lista comandos, regras de listas e follow-up de deploy-staging

### ACH-013
- titulo: Certbot idempotência
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: d8566c7
- commit_revisor: none
- arquivos_alterados: deploy/deploy.sh
- descricao_correcao: certbot certonly com --keep-until-expiring --non-interactive
- nota_revisor: flag aplicada + comentário explicativo; runs subsequentes ficam idempotentes

### ACH-009
- titulo: Health check pós-deploy
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: e51cd05
- commit_revisor: none
- arquivos_alterados: deploy/deploy.sh
- descricao_correcao: wait_for_ready() polling /api/health por 30 tentativas (60s); chamada em first_run e update
- nota_revisor: função com curl --max-time 3, fail-fast após 60s; endpoint /api/health real verificado em apps/web/src/app/api/health/route.ts (Executor ajustou de /api/trpc/health.ready para o endpoint que de fato existe)

### ACH-014
- titulo: Deploy markers (Sentry/Grafana)
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 83688f4
- commit_revisor: none
- arquivos_alterados: deploy/deploy.sh
- descricao_correcao: send_sentry_release + send_grafana_annotation com fallback silencioso; ambos chamados em first_run e update com release = first-run-<sha> / update-<sha>
- nota_revisor: opt-in via SENTRY_AUTH_TOKEN/ORG/PROJECT + GRAFANA_URL/API_KEY; falhas resultam em warning não-bloqueante; release derivado de git rev-parse com fallback para timestamp

### ACH-012
- titulo: Migrations manuais fora do workflow Prisma
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 292d20d
- commit_revisor: none
- arquivos_alterados: deploy/deploy.sh
- descricao_correcao: apply_manual_migrations() cria _manual_migrations table, aplica *.sql em ordem alfabética marcando idempotência; chamado após prisma migrate deploy em first_run e update
- nota_revisor: tracker _manual_migrations(name PK, applied_at); loop glob *.sql idempotente; verifiquei que packages/db/prisma/migrations/manual/ tem 4 arquivos (001_rls_policies.sql, 002_rls_policies_complement.sql, auth_v2_schema.sql, rls_policies.sql) — agora entram em ambiente novo sem ficar sem RLS

### ACH-003
- titulo: Backup off-host
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: d5476f9
- commit_revisor: none
- arquivos_alterados: deploy/backup/backup.sh, docs/dr/BACKUP-OFFSITE.md (novo)
- descricao_correcao: replicate_offsite() opt-in via BACKUP_S3_URL (aws cli ou mc); warning se não configurado; doc com IAM policy mínima e follow-up (bucket, retention, credentials)
- nota_revisor: seed + follow-up consistentes; código fail-soft (local preservado mesmo se replicação falhar); doc lista 4 pendências humanas (provisionar bucket, testar em staging, monitorar idade do último PutObject, integrar com secret manager)

### ACH-010
- titulo: DR drill automatizado
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 1f56847
- commit_revisor: none
- arquivos_alterados: .github/workflows/dr-drill.yml (novo), docs/dr/RESTORE-DRILL.md (novo)
- descricao_correcao: workflow semanal domingo 03:00 UTC, Postgres 16 service, restaura último backup de S3, valida DR_DRILL_EXPECTED_TABLES
- nota_revisor: workflow emite ::error:: se tabela sumir, ::warning:: se vier zerada; skip gracioso quando BACKUP_S3_URL não está configurado; doc lista 5 pendências humanas (IAM read-only, popular expected tables, alerta Slack, benchmark tempo restore, expandir para Redis + manual migrations)

### ACH-004
- titulo: DR runbooks por cenário
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 678e413
- commit_revisor: none
- arquivos_alterados: docs/dr/{README,disk-full,db-corrupt,vm-down,redis-loss}.md (novos)
- descricao_correcao: 4 runbooks por cenário com sintomas, diagnóstico rápido, plano de ação, verificação, prevenção; cross-ref ACH-002/003/010/012; índice README em docs/dr/
- nota_revisor: runbooks executáveis (comandos concretos, múltiplas rotas A/B/C para db-corrupt/vm-down/redis-loss), RTO/RPO alvos documentados, cross-refs internos bem mantidos

### ACH-001
- titulo: CI/CD build + SBOM + scan
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 5c39b20
- commit_revisor: none
- arquivos_alterados: .github/workflows/docker-images.yml (novo), docs/CI-CD-IMAGES-FOLLOWUP.md (novo)
- descricao_correcao: workflow Docker build + push GHCR matrix [web,worker]; Trivy SARIF; Syft SBOM CycloneDX; cache GHA; BUILD_DATABASE_URL via build secret; follow-up doc com 6 pendências
- nota_revisor: workflow produção-grade (matrix web/worker, metadata-action semver+sha, GHCR login, build-push-action v6, Trivy→SARIF→Security tab, Syft CycloneDX artifact 30d); integrado com ACH-015 via database_url build-secret; pendências humanas claras (BUILD_DATABASE_URL, cosign, promote tags, exit-code 1, dependabot, SCA tool)

### ACH-015
- titulo: Docker secrets de build
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 6761fd5
- commit_revisor: none
- arquivos_alterados: deploy/Dockerfile.web, deploy/Dockerfile.worker
- descricao_correcao: RUN --mount=type=secret,id=database_url; fallback dev via env; cacheable sem vazar credencial
- nota_revisor: ARG/ENV DATABASE_URL removido em ambos Dockerfiles; substituído por mount BuildKit; CI já configurado (ACH-001 workflow passa BUILD_DATABASE_URL via secrets map); fallback se /run/secrets/database_url não existir preserva build local

### ACH-002
- titulo: IaC
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 7f75f35
- commit_revisor: none
- arquivos_alterados: infra/terraform/README.md (novo), docs/INFRA-AS-CODE-FOLLOWUP.md (novo)
- descricao_correcao: pasta infra/terraform/ marcada com README explicando estrutura futura; follow-up doc com 4 fases de migração, candidatos de provider, 5 pendências humanas
- nota_revisor: seed mínimo e doc extensiva; 4 fases ordenadas (documentar estado, escolher stack, módulos mínimos, CI); 5 pendências humanas (provider, state remoto, runbook cutover, testes staging, compliance); 5 critérios de fechamento — escopo coerente com "corrigivel_parcial" sem exigir implementação completa

### ACH-005
- titulo: Branch protection + CODEOWNERS
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 9720e18
- commit_revisor: none
- arquivos_alterados: .github/CODEOWNERS, docs/BRANCH-PROTECTION-FOLLOWUP.md (novo)
- descricao_correcao: CODEOWNERS expandido com /apps/web/src/app/(auth)/, /apps/api/src/middleware/, /docs/dr/, /infra/, compose variants; doc com gh api command e 10 valores alvo de branch protection
- nota_revisor: CODEOWNERS cobre auth, middleware, schema.prisma, shared, platform, deploy, compose variants, gitleaks, infra, dr, audit, self; doc com comando gh api pronto + tabela de 10 campos com justificativa + 5 pendências humanas (rodar comando, validar context names, decisão sobre build blocker, expandir grupo, auditar bypasses)

### ACH-008
- titulo: Feature flags
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 1420f57
- commit_revisor: none
- arquivos_alterados: packages/shared/src/feature-flags.ts (novo), packages/shared/src/index.ts, docs/FEATURE-FLAGS-FOLLOWUP.md (novo)
- descricao_correcao: flag(name, default) lê FEATURE_FLAGS_JSON; type-safe; cache process-scoped; __resetFlagsForTesting helper; follow-up com comparação de providers e contrato de migração
- nota_revisor: parse defensivo (try/catch, null/array check); type guard via typeof; re-export em index.ts confirmado; doc compara Growthbook/Unleash/LaunchDarkly/Flagsmith e preserva assinatura flag() na migração para provider real

### ACH-016 (informativo)
- titulo: Cross-ref reforços não duplicados
- severidade: informativo
- classificacao: nao_corrigivel
- status_executor: nao_aplicavel
- status_revisor: nao_aplicavel
- commit_executor: none
- commit_revisor: none
- observacoes: achado meta, documentação de cross-ref
