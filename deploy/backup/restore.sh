#!/usr/bin/env bash
set -euo pipefail

# WBC Database Restore Script
# Usage: ./deploy/backup/restore.sh backups/wbc_20260405_030000.sql.gz

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

source "${PROJECT_DIR}/.env.production"

BACKUP_FILE="${1:-}"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup-file.sql.gz>"
  echo ""
  echo "Available backups:"
  ls -lh "${PROJECT_DIR}/backups"/wbc_*.sql.gz 2>/dev/null || echo "  No backups found"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: File not found: $BACKUP_FILE"
  exit 1
fi

echo "WARNING: This will REPLACE the current database with the backup."
echo "Backup: $BACKUP_FILE"
echo ""
read -p "Continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

echo "[restore] Stopping web and worker..."
docker compose -f "${PROJECT_DIR}/docker-compose.prod.yml" stop web worker

echo "[restore] Restoring from ${BACKUP_FILE}..."
gunzip -c "$BACKUP_FILE" | docker exec -i wbc-postgres psql \
  -U "${POSTGRES_USER:-wbc}" \
  -d "${POSTGRES_DB:-wbc}" \
  --quiet

echo "[restore] Restarting services..."
docker compose -f "${PROJECT_DIR}/docker-compose.prod.yml" up -d web worker

echo "[restore] Done."
