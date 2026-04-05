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

  # Request real certificate
  docker compose -f docker-compose.prod.yml run --rm certbot \
    certonly --webroot -w /var/www/certbot \
    -d "$domain" \
    --email "admin@$domain" \
    --agree-tos --no-eff-email

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

  log "Setup SSL..."
  setup_ssl

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

  log "Restarting services (zero-downtime)..."
  docker compose -f docker-compose.prod.yml up -d --no-deps web worker

  log "Cleaning old images..."
  docker image prune -f

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
