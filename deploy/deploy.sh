#!/usr/bin/env bash
set -euo pipefail

# WBC Platform — Deploy script for Hostinger KVM8 VPS
# Usage: ./deploy/deploy.sh [first-run|update|ssl]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[WBC]${NC} $1"; }
warn() { echo -e "${YELLOW}[WBC]${NC} $1"; }
err()  { echo -e "${RED}[WBC]${NC} $1" >&2; }

# ACH-014: Sentry release marker. Silently no-ops if SENTRY_AUTH_TOKEN/ORG/PROJECT
# are not set — this keeps local/manual deploys unaffected.
send_sentry_release() {
  local release="$1"
  if [ -z "${SENTRY_AUTH_TOKEN:-}" ] || [ -z "${SENTRY_ORG:-}" ] || [ -z "${SENTRY_PROJECT:-}" ]; then
    return 0
  fi
  curl -fsS -X POST \
    "https://sentry.io/api/0/organizations/${SENTRY_ORG}/releases/" \
    -H "Authorization: Bearer ${SENTRY_AUTH_TOKEN}" \
    -H 'Content-Type: application/json' \
    -d "{\"version\":\"${release}\",\"projects\":[\"${SENTRY_PROJECT}\"]}" \
    >/dev/null 2>&1 || warn "Sentry release marker failed (ignored)."
}

# ACH-014: Grafana annotation with tag=deploy. Silently no-ops when vars absent.
send_grafana_annotation() {
  local text="$1"
  if [ -z "${GRAFANA_URL:-}" ] || [ -z "${GRAFANA_API_KEY:-}" ]; then
    return 0
  fi
  local now_ms
  now_ms=$(($(date +%s) * 1000))
  curl -fsS -X POST \
    "${GRAFANA_URL%/}/api/annotations" \
    -H "Authorization: Bearer ${GRAFANA_API_KEY}" \
    -H 'Content-Type: application/json' \
    -d "{\"time\":${now_ms},\"tags\":[\"deploy\"],\"text\":\"${text}\"}" \
    >/dev/null 2>&1 || warn "Grafana annotation failed (ignored)."
}

# ACH-012: Apply SQL files in packages/db/prisma/migrations/manual/ after
# `prisma migrate deploy`. Tracked via the `_manual_migrations` table so each
# file runs exactly once per database. A fresh environment therefore cannot
# boot without RLS policies or other manual schema pieces.
apply_manual_migrations() {
  local manual_dir="packages/db/prisma/migrations/manual"
  if [ ! -d "$manual_dir" ]; then
    return 0
  fi
  log "Applying manual SQL migrations from ${manual_dir}..."
  docker compose -f docker-compose.prod.yml exec -T postgres \
    psql -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-wbc}" <<'SQL'
CREATE TABLE IF NOT EXISTS _manual_migrations (
  name TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
SQL
  for sql_file in "$manual_dir"/*.sql; do
    [ -f "$sql_file" ] || continue
    local name
    name="$(basename "$sql_file")"
    local already_applied
    already_applied=$(docker compose -f docker-compose.prod.yml exec -T postgres \
      psql -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-wbc}" -tAc \
      "SELECT 1 FROM _manual_migrations WHERE name = '${name}'" 2>/dev/null || echo "")
    if [ "$already_applied" = "1" ]; then
      log "  skip ${name} (already applied)"
      continue
    fi
    log "  applying ${name}"
    docker compose -f docker-compose.prod.yml exec -T postgres \
      psql -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-wbc}" < "$sql_file"
    docker compose -f docker-compose.prod.yml exec -T postgres \
      psql -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-wbc}" \
      -c "INSERT INTO _manual_migrations (name) VALUES ('${name}')"
  done
}

# ACH-009: block until /api/health reports ready; fail fast otherwise.
wait_for_ready() {
  local url="${1:-http://localhost:3000/api/health}"
  local attempts="${2:-30}"
  log "Waiting for readiness: $url"
  for i in $(seq 1 "$attempts"); do
    if curl -fsS --max-time 3 "$url" >/dev/null 2>&1; then
      log "Service is ready after ${i} attempt(s)."
      return 0
    fi
    sleep 2
  done
  err "Service did not become ready within $((attempts * 2))s."
  return 1
}

# ── Pre-checks ────────────────────────────────────────────────
check_deps() {
  for cmd in docker; do
    if ! command -v "$cmd" &>/dev/null; then
      err "$cmd is not installed"
      exit 1
    fi
  done

  if ! docker compose version &>/dev/null; then
    err "docker compose plugin is not installed"
    exit 1
  fi

  if [ ! -f .env.production ]; then
    err ".env.production not found. Copy .env.production.example and fill in values."
    exit 1
  fi
}

# ── SSL Certificate (first time) ─────────────────────────────
setup_ssl() {
  source .env.production
  local domain="${DOMAIN:?DOMAIN not set in .env.production}"

  log "Obtaining SSL certificate for $domain..."

  # Start nginx temporarily with self-signed cert for ACME challenge
  mkdir -p deploy/ssl-temp
  openssl req -x509 -nodes -days 1 -newkey rsa:2048 \
    -keyout deploy/ssl-temp/privkey.pem \
    -out deploy/ssl-temp/fullchain.pem \
    -subj "/CN=$domain" 2>/dev/null

  # Copy temp certs to volume
  docker compose -f docker-compose.prod.yml up -d nginx
  docker cp deploy/ssl-temp/fullchain.pem wbc-nginx:/etc/nginx/ssl/fullchain.pem
  docker cp deploy/ssl-temp/privkey.pem wbc-nginx:/etc/nginx/ssl/privkey.pem
  docker compose -f docker-compose.prod.yml restart nginx

  # Request real certificate (ACH-013: --keep-until-expiring + --non-interactive
  # so this step is idempotent across runs; only renews within ~30 days of expiry).
  docker compose -f docker-compose.prod.yml run --rm certbot \
    certonly --webroot -w /var/www/certbot \
    -d "$domain" \
    --email "admin@$domain" \
    --agree-tos --no-eff-email \
    --keep-until-expiring --non-interactive

  # Copy real certs
  docker compose -f docker-compose.prod.yml run --rm certbot \
    sh -c "cp /etc/letsencrypt/live/$domain/fullchain.pem /etc/letsencrypt/fullchain.pem && \
           cp /etc/letsencrypt/live/$domain/privkey.pem /etc/letsencrypt/privkey.pem"

  rm -rf deploy/ssl-temp
  docker compose -f docker-compose.prod.yml restart nginx

  log "SSL certificate obtained for $domain"
}

# ── First Run ─────────────────────────────────────────────────
first_run() {
  check_deps

  log "Building all images..."
  docker compose -f docker-compose.prod.yml build

  log "Starting database and redis..."
  docker compose -f docker-compose.prod.yml up -d postgres redis
  sleep 5

  log "Running database migrations..."
  docker compose -f docker-compose.prod.yml run --rm web \
    npx prisma migrate deploy

  log "Marking baseline as applied (if first run)..."
  docker compose -f docker-compose.prod.yml run --rm web \
    npx prisma migrate resolve --applied 0_baseline 2>/dev/null || true

  log "Starting all services..."
  docker compose -f docker-compose.prod.yml up -d

  # ACH-012: apply manual SQL migrations after Prisma finishes.
  apply_manual_migrations

  log "Setup SSL..."
  setup_ssl

  # ACH-009: block until the app is actually serving requests.
  wait_for_ready "http://localhost:3000/api/health" 30

  # ACH-014: record the deploy in Sentry + Grafana (no-op when not configured).
  local release
  release="first-run-$(git rev-parse --short HEAD 2>/dev/null || date +%s)"
  send_sentry_release "$release"
  send_grafana_annotation "first-run: $release"

  log "Deploy complete! Services running:"
  docker compose -f docker-compose.prod.yml ps
}

# ── Update (rebuild + restart) ────────────────────────────────
update() {
  check_deps

  log "Pulling latest code..."
  git pull origin main

  log "Rebuilding images..."
  docker compose -f docker-compose.prod.yml build web worker

  log "Running database migrations..."
  docker compose -f docker-compose.prod.yml run --rm web \
    npx prisma migrate deploy

  # ACH-012: apply manual SQL migrations on update too (each file runs once).
  apply_manual_migrations

  log "Restarting services (zero-downtime)..."
  docker compose -f docker-compose.prod.yml up -d --no-deps web worker

  log "Cleaning old images..."
  docker image prune -f

  # ACH-009: don't declare success until /api/health passes.
  wait_for_ready "http://localhost:3000/api/health" 30

  # ACH-014: record the deploy.
  local release
  release="update-$(git rev-parse --short HEAD 2>/dev/null || date +%s)"
  send_sentry_release "$release"
  send_grafana_annotation "update: $release"

  log "Update complete!"
  docker compose -f docker-compose.prod.yml ps
}

# ── Main ──────────────────────────────────────────────────────
case "${1:-}" in
  first-run)
    first_run
    ;;
  update)
    update
    ;;
  ssl)
    setup_ssl
    ;;
  *)
    echo "Usage: $0 {first-run|update|ssl}"
    echo ""
    echo "  first-run  — Build, migrate, start all services, setup SSL"
    echo "  update     — Pull, rebuild web+worker, migrate, restart"
    echo "  ssl        — Obtain/renew SSL certificate"
    exit 1
    ;;
esac
