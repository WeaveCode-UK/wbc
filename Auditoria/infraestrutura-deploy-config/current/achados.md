# Achados da Auditoria

## Identificacao
- dominio: infraestrutura-deploy-config
- run_id: 2026-04-05_18-00-00
- ultima_atualizacao: 2026-04-05 18:30:00

## Severidades Permitidas
- critico, alto, medio, baixo, informativo

## Status Permitidos
- aberto, confirmado, mitigado, resolvido, aceito, nao_aplicavel

## Achados Registrados

### ACH-ID-001
- titulo: Multi-stage Dockerfile com user nao-root
- severidade: informativo
- categoria: docker
- status: confirmado
- resumo: Dockerfile.web usa 4 stages (base, pruner, builder, runner) com turbo prune para reduzir tamanho. Runner usa usuario nextjs (uid 1001) nao-root. NEXT_TELEMETRY_DISABLED=1. Node 20 Alpine.

#### Evidencia
- arquivo_ou_area: deploy/Dockerfile.web
- detalhe: `adduser --system --uid 1001 nextjs`, `USER nextjs`. Standalone output.

#### Impacto
- tecnico: Imagem otimizada e segura.
- negocio: nenhum impacto direto.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

---

### ACH-ID-002
- titulo: Nginx com security headers e SSL (TLS 1.2/1.3)
- severidade: informativo
- categoria: nginx
- status: confirmado
- resumo: nginx.conf configura: redirect HTTP->HTTPS, SSL com TLS 1.2/1.3 e ciphers modernos, HSTS 2y com preload, X-Frame-Options DENY, X-Content-Type-Options nosniff, X-XSS-Protection, Referrer-Policy. Gzip ativo. Static assets com cache 1 ano.

#### Evidencia
- arquivo_ou_area: deploy/nginx.conf
- detalhe: ssl_protocols TLSv1.2 TLSv1.3. HSTS max-age=63072000. Gzip para text/css/json/js. /_next/static/ com 365d cache.

#### Impacto
- tecnico: Seguranca de transporte e headers adequados.
- negocio: Compliance com boas praticas de seguranca web.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

---

### ACH-ID-003
- titulo: Deploy script com first-run e update modes
- severidade: informativo
- categoria: deploy
- status: confirmado
- resumo: deploy.sh suporta 3 modos: first-run (build, migrate, SSL), update (pull, rebuild, migrate, restart), ssl (certificate renewal). Verifica deps (docker). Marca baseline migration. Zero-downtime restart via `up -d --no-deps web worker`.

#### Evidencia
- arquivo_ou_area: deploy/deploy.sh
- detalhe: `first_run()`, `update()`, `setup_ssl()`. Pre-checks com check_deps. Error handling via `set -euo pipefail`.

#### Impacto
- tecnico: Deploy reproducivel e com rollback implicito (imagens anteriores).
- negocio: Facilidade de deploy para equipe.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

---

### ACH-ID-004
- titulo: Backup script com retencao de 30 dias
- severidade: informativo
- categoria: backup
- status: confirmado
- resumo: backup.sh faz pg_dump comprimido com gzip, retencao de 30 dias (deleta backups mais antigos), e exibe tamanho e ultimos 5 backups. Restore script tambem presente.

#### Evidencia
- arquivo_ou_area: deploy/backup/backup.sh, deploy/backup/restore.sh, deploy/backup/install-cron.sh
- detalhe: `pg_dump | gzip`. RETENTION_DAYS=30. Cron installer disponivel.

#### Impacto
- tecnico: Protecao contra perda de dados.
- negocio: Compliance com boas praticas de backup.

#### Recomendacao
- acao_sugerida: Nenhuma. Considerar backup offsite (S3/Backblaze) em producao.
- prioridade: baixa

---

### ACH-ID-005
- titulo: Env validation com Zod para 3 apps
- severidade: informativo
- categoria: configuracao
- status: confirmado
- resumo: packages/shared/src/env.ts define schemas Zod para web (AUTH_SECRET, AUTH_URL, Google OAuth), api (SENTRY_DSN) e worker. Funcao validateEnv(app) valida em startup e lista erros especificos.

#### Evidencia
- arquivo_ou_area: packages/shared/src/env.ts
- detalhe: 3 schemas: baseEnvSchema (DATABASE_URL, REDIS_URL, NODE_ENV), webEnvSchema, apiEnvSchema. Error message lista cada variavel faltante.

#### Impacto
- tecnico: Fail-fast se env incompleto. Previne runtime errors por env faltante.
- negocio: nenhum impacto direto.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

---

### ACH-ID-006
- titulo: Docker Compose prod com 7 servicos e redes isoladas
- severidade: informativo
- categoria: docker
- status: confirmado
- resumo: docker-compose.prod.yml define: postgres, redis, web, worker, nginx, certbot, prometheus, grafana. Rede interna isolada (bridge). Volumes persistentes para dados. Healthchecks em postgres e redis.

#### Evidencia
- arquivo_ou_area: docker-compose.prod.yml
- detalhe: 7 servicos. 6 volumes (postgres_data, redis_data, ssl_certs, certbot_www, prometheus_data, grafana_data). 1 network (internal).

#### Impacto
- tecnico: Infraestrutura completa em single-server deployment.
- negocio: Baixo custo operacional (1 VPS).

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

---

### ACH-ID-007
- titulo: Certbot com auto-renewal a cada 12h
- severidade: informativo
- categoria: ssl
- status: confirmado
- resumo: O container certbot roda um loop que executa `certbot renew` a cada 12h, garantindo renovacao automatica de certificados SSL.

#### Evidencia
- arquivo_ou_area: docker-compose.prod.yml:98-106
- detalhe: `entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew --webroot -w /var/www/certbot --quiet; sleep 12h & wait $${!}; done'"`

#### Impacto
- tecnico: Certificados SSL sempre validos.
- negocio: Sem downtime por certificado expirado.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

---

### ACH-ID-008
- titulo: Grafana exposta sem autenticacao adicional
- severidade: baixo
- categoria: seguranca-infra
- status: confirmado
- resumo: Grafana e acessivel via /grafana/ no nginx sem autenticacao adicional alem do password default do Grafana (admin/${GRAFANA_PASSWORD:-admin}). Nao ha basic auth no nginx nem IP whitelist.

#### Evidencia
- arquivo_ou_area: deploy/nginx.conf:69-76, docker-compose.prod.yml:128
- detalhe: `location /grafana/ { proxy_pass http://grafana:3000/grafana/; }`. Password default: admin.

#### Impacto
- tecnico: Grafana acessivel publicamente, exposicao de metricas operacionais.
- negocio: Potencial vazamento de informacoes operacionais.

#### Recomendacao
- acao_sugerida: Adicionar autenticacao basic_auth no nginx ou IP whitelist para /grafana/.
- prioridade: media
