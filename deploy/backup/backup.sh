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
# ACH-014 compliance-privacidade: optional GPG encryption when
# BACKUP_GPG_RECIPIENT is set. Recipient must have an imported public key
# in the host keyring (`gpg --import /path/to/pubkey.asc`). Without the env
# var, we fall back to gzip-only (preserves dev-friendliness).
if [ -n "${BACKUP_GPG_RECIPIENT:-}" ] && command -v gpg >/dev/null 2>&1; then
  FILENAME="wbc_${TIMESTAMP}.sql.gz.gpg"
  docker exec wbc-postgres pg_dump \
    -U "${POSTGRES_USER:-wbc}" \
    -d "${POSTGRES_DB:-wbc}" \
    --no-owner \
    --no-privileges \
    | gzip \
    | gpg --batch --yes --trust-model always \
          --recipient "${BACKUP_GPG_RECIPIENT}" \
          --encrypt \
          --output "${BACKUP_DIR}/${FILENAME}"
  echo "[backup] Encrypted with GPG (recipient: ${BACKUP_GPG_RECIPIENT})"
else
  docker exec wbc-postgres pg_dump \
    -U "${POSTGRES_USER:-wbc}" \
    -d "${POSTGRES_DB:-wbc}" \
    --no-owner \
    --no-privileges \
    | gzip > "${BACKUP_DIR}/${FILENAME}"
fi

SIZE=$(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1)
echo "[backup] Created ${FILENAME} (${SIZE})"

# ACH-003: Optional off-host replication. Opt-in via BACKUP_S3_URL (e.g.
# "s3://wbc-backups/postgres/" or MinIO "mc"-style alias). If the variable is
# unset, we skip replication silently — local-only backups keep working for
# dev/staging. For prod, set BACKUP_S3_URL + AWS_* (or MC_HOST_*) credentials.
replicate_offsite() {
  if [ -z "${BACKUP_S3_URL:-}" ]; then
    return 0
  fi

  if command -v aws >/dev/null 2>&1; then
    echo "[backup] Replicating to ${BACKUP_S3_URL} via aws cli..."
    if aws s3 cp "${BACKUP_DIR}/${FILENAME}" "${BACKUP_S3_URL%/}/${FILENAME}"; then
      echo "[backup] Off-site replication OK"
    else
      echo "[backup] WARN: off-site replication failed (local backup preserved)" >&2
    fi
    return 0
  fi

  if command -v mc >/dev/null 2>&1; then
    echo "[backup] Replicating to ${BACKUP_S3_URL} via mc..."
    if mc cp "${BACKUP_DIR}/${FILENAME}" "${BACKUP_S3_URL%/}/${FILENAME}"; then
      echo "[backup] Off-site replication OK"
    else
      echo "[backup] WARN: off-site replication failed (local backup preserved)" >&2
    fi
    return 0
  fi

  echo "[backup] WARN: BACKUP_S3_URL set but neither aws-cli nor mc found" >&2
}

replicate_offsite

# Retention: delete backups older than RETENTION_DAYS
DELETED=$(find "$BACKUP_DIR" -name "wbc_*.sql.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
  echo "[backup] Deleted ${DELETED} backups older than ${RETENTION_DAYS} days"
fi

echo "[backup] Done. Current backups:"
ls -lh "$BACKUP_DIR"/wbc_*.sql.gz 2>/dev/null | tail -5
