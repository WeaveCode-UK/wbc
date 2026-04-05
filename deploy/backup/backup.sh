#!/usr/bin/env bash
set -euo pipefail

# WBC Database Backup Script
# Runs inside the postgres container via docker exec
# Usage: called by cron or manually via ./deploy/backup/backup.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
BACKUP_DIR="${PROJECT_DIR}/backups"
RETENTION_DAYS=30

# Load env
source "${PROJECT_DIR}/.env.production"

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="wbc_${TIMESTAMP}.sql.gz"

echo "[backup] Starting backup at $(date)"

# Dump database from postgres container
docker exec wbc-postgres pg_dump \
  -U "${POSTGRES_USER:-wbc}" \
  -d "${POSTGRES_DB:-wbc}" \
  --no-owner \
  --no-privileges \
  | gzip > "${BACKUP_DIR}/${FILENAME}"

SIZE=$(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1)
echo "[backup] Created ${FILENAME} (${SIZE})"

# Retention: delete backups older than RETENTION_DAYS
DELETED=$(find "$BACKUP_DIR" -name "wbc_*.sql.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
  echo "[backup] Deleted ${DELETED} backups older than ${RETENTION_DAYS} days"
fi

echo "[backup] Done. Current backups:"
ls -lh "$BACKUP_DIR"/wbc_*.sql.gz 2>/dev/null | tail -5
