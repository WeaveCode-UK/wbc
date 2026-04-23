# Plano de Correção

## Identificação
- dominio: infraestrutura-deploy-config
- run_id: 2026-04-19_09-03-12
- data_geracao: 2026-04-23 03:00:00
- total_achados: 16
- corrigiveis: 7
- corrigiveis_parciais: 7
- nao_corrigiveis: 2

## Ordem de Execução

Agrupamento por área (config/docker compose, CI/CD, deploy script, backup/DR, docker security).

### 1. ACH-006 — Pinar versões de imagens de observabilidade
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: docker-compose.prod.yml
- acao_planejada: fixar `prom/prometheus:v2.54.1` e `grafana/grafana:11.2.2`; ajustar docker-compose.yml se necessário
- dependencias: nenhuma
- risco_da_correcao: baixo

### 2. ACH-007 — turbo.json globalEnv incompleto
- severidade: baixo
- classificacao: corrigivel
- arquivo_ou_area_afetada: turbo.json
- acao_planejada: adicionar SENTRY_DSN, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OTEL_EXPORTER_OTLP_ENDPOINT (WHATSAPP_APP_SECRET já presente)
- dependencias: nenhuma
- risco_da_correcao: baixo

### 3. ACH-011 — Compose overlays por ambiente
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: docker-compose.base.yml (novo), docker-compose.dev.yml, docker-compose.staging.yml (seed)
- acao_planejada: extrair base comum; overlay dev/prod/staging com COMPOSE_FILE docs; seed staging
- dependencias: nenhuma
- risco_da_correcao: medio (preservar compat com docker-compose.yml e .prod.yml atuais)

### 4. ACH-013 — Certbot idempotência
- severidade: baixo
- classificacao: corrigivel
- arquivo_ou_area_afetada: deploy/deploy.sh
- acao_planejada: `--keep-until-expiring` ou check prévio; ou certbot renew no lugar de certonly quando existir
- dependencias: nenhuma
- risco_da_correcao: baixo

### 5. ACH-009 — Health check pós-deploy
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: deploy/deploy.sh
- acao_planejada: polling de readiness após `docker compose up`; falha script se não ready em 60s
- dependencias: nenhuma
- risco_da_correcao: baixo

### 6. ACH-014 — Deploy markers (Sentry/Grafana)
- severidade: baixo
- classificacao: corrigivel
- arquivo_ou_area_afetada: deploy/deploy.sh
- acao_planejada: helpers `send_sentry_release`, `send_grafana_annotation` com fallback silencioso quando env var ausente
- dependencias: ACH-013 (mesmo arquivo)
- risco_da_correcao: baixo

### 7. ACH-012 — Migrations manuais fora do workflow Prisma
- severidade: alto
- classificacao: corrigivel
- arquivo_ou_area_afetada: deploy/deploy.sh; packages/db/prisma/migrations/manual/
- acao_planejada: após `prisma migrate deploy`, executar `psql -f` em cada .sql de `manual/` em ordem alfabética; marker de idempotência via tabela `_manual_migrations` ou `IF NOT EXISTS` por script
- dependencias: ACH-014 (mesmo arquivo)
- risco_da_correcao: medio

### 8. ACH-003 — Backup off-host (parcial)
- severidade: alto
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: deploy/backup/backup.sh
- acao_planejada: após dump, tentar upload para `$BACKUP_S3_URL` via `aws s3 cp`/`mc cp` quando env definido; silenciar se não configurado; doc com IAM policy
- dependencias: nenhuma
- risco_da_correcao: baixo

### 9. ACH-010 — DR drill automatizado (parcial)
- severidade: medio
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: .github/workflows/dr-drill.yml (novo); docs/dr/RESTORE-DRILL.md (novo)
- acao_planejada: workflow semanal que baixa último backup, restaura em Postgres efêmero, compara row counts; doc do drill
- dependencias: nenhuma
- risco_da_correcao: baixo (workflow isolado)

### 10. ACH-004 — DR runbooks por cenário
- severidade: alto
- classificacao: corrigivel
- arquivo_ou_area_afetada: docs/dr/*.md (novos)
- acao_planejada: runbooks {disk-full, db-corrupt, vm-down, redis-loss}.md com passos, comandos, verificação
- dependencias: ACH-010 (mesma pasta docs/dr)
- risco_da_correcao: baixo

### 11. ACH-001 — CI/CD build + SBOM + scan (parcial)
- severidade: alto
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: .github/workflows/docker-images.yml (novo)
- acao_planejada: workflow com docker/build-push-action, tags sha+semver, push GHCR, Trivy scan, Syft SBOM CycloneDX; sem assinatura Sigstore (decisão de processo)
- dependencias: nenhuma
- risco_da_correcao: baixo (workflow isolado)

### 12. ACH-015 — Docker secrets de build (parcial)
- severidade: medio
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: deploy/Dockerfile.web, deploy/Dockerfile.worker; deploy/deploy.sh
- acao_planejada: migrar ARG DATABASE_URL para `RUN --mount=type=secret,id=database_url` em stages que rodam `prisma generate`; deploy.sh passa `--secret id=database_url,src=...`; follow-up para buildx em CI
- dependencias: ACH-001 (buildx workflow)
- risco_da_correcao: medio

### 13. ACH-002 — IaC (parcial)
- severidade: alto
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: infra/terraform/README.md (novo), docs/INFRA-AS-CODE-FOLLOWUP.md (novo)
- acao_planejada: seed de pasta `infra/terraform/` com README explicando escolha, estrutura recomendada, módulos esperados; follow-up doc para migração gradual
- dependencias: nenhuma
- risco_da_correcao: baixo (apenas docs)

### 14. ACH-005 — Branch protection + CODEOWNERS
- severidade: alto
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: .github/CODEOWNERS (novo); docs/BRANCH-PROTECTION-FOLLOWUP.md (novo)
- acao_planejada: criar CODEOWNERS com pelo menos dono do repo; doc com steps para habilitar branch protection (GitHub UI ou API)
- dependencias: nenhuma
- risco_da_correcao: baixo

### 15. ACH-008 — Feature flags (parcial)
- severidade: medio
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: packages/shared/src/feature-flags.ts (novo); docs/FEATURE-FLAGS-FOLLOWUP.md (novo)
- acao_planejada: helper `flag(name, defaultValue)` lendo `FEATURE_FLAGS_JSON` env; interface pronta para substituir por Growthbook/Unleash
- dependencias: nenhuma
- risco_da_correcao: baixo

## Achados Não Corrigíveis (1 achado + 1 não aplicável)

### ACH-016 — Cross-ref informativo
- motivo: Achado meta documentando cross-refs de outros domínios. Não é um problema, é um rastro.
- acao_recomendada_ao_usuario: Considerar no planejamento global mas não há correção direta.

## Resumo do Plano
- Total a corrigir: 15 (7 corrigíveis + 8 corrigíveis_parciais)
- Total parcial (requer validação humana após correção): 7
- Total não corrigível: 1 (ACH-016 informativo)
- Estimativa de commits: 15 (executor)
