#!/usr/bin/env bash
# HG2 — Postgres backup runner.
#
# Pipes a pg_dump → gpg (symmetric, AES-256) → S3-compatible upload
# (works with Cloudflare R2, AWS S3, MinIO, Backblaze B2, …). Designed
# to be invoked by a system cron (see README in this directory) on the
# host that has network access to the production Postgres.
#
# What it does NOT do:
#   - it does not snapshot Redis (queue state is reconstructible)
#   - it does not snapshot uploaded media (lives in object storage already)
#   - it does not roll its own retention; that lives in the bucket lifecycle
#
# Required env (read from the cron environment, not the script):
#   DATABASE_URL              full Postgres connection string
#   BACKUP_S3_ENDPOINT        e.g. https://<accountid>.r2.cloudflarestorage.com
#   BACKUP_S3_BUCKET          bucket name (must exist already)
#   BACKUP_S3_REGION          set to "auto" for R2; "us-east-1" etc. for S3
#   BACKUP_S3_ACCESS_KEY_ID   bucket-scoped access key
#   BACKUP_S3_SECRET_KEY      paired secret
#   BACKUP_ENCRYPTION_KEY     gpg symmetric passphrase (≥32 bytes recommended)
#
# Optional env:
#   BACKUP_PREFIX             default "wbc/postgres" (folder inside the bucket)
#   BACKUP_RETAIN_LOCAL_DIR   default "/var/backups/wbc" (last 2 dumps kept on disk)
#
# Exit codes:
#   0 success
#   1 missing required env
#   2 pg_dump failure
#   3 encrypt failure
#   4 upload failure

set -euo pipefail

require() {
  local var="$1"
  if [[ -z "${!var:-}" ]]; then
    echo "[pg-backup] FATAL: $var is required" >&2
    exit 1
  fi
}

require DATABASE_URL
require BACKUP_S3_ENDPOINT
require BACKUP_S3_BUCKET
require BACKUP_S3_REGION
require BACKUP_S3_ACCESS_KEY_ID
require BACKUP_S3_SECRET_KEY
require BACKUP_ENCRYPTION_KEY

PREFIX="${BACKUP_PREFIX:-wbc/postgres}"
LOCAL_DIR="${BACKUP_RETAIN_LOCAL_DIR:-/var/backups/wbc}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BASENAME="wbc-${TIMESTAMP}.sql.gz.gpg"
LOCAL_PATH="${LOCAL_DIR}/${BASENAME}"
REMOTE_KEY="${PREFIX}/${BASENAME}"

mkdir -p "$LOCAL_DIR"

echo "[pg-backup] dump → encrypt → ${REMOTE_KEY}"

# pg_dump streams to stdout; pigz/gzip compresses; gpg encrypts symmetrically.
# `--exit-on-error` makes pg_dump abort the pipeline if anything in the
# database is unreadable, instead of silently producing a partial dump.
if ! pg_dump --no-owner --no-privileges --exit-on-error "$DATABASE_URL" \
  | gzip -9 \
  | gpg --batch --yes --symmetric --cipher-algo AES256 \
        --passphrase "$BACKUP_ENCRYPTION_KEY" \
        --output "$LOCAL_PATH"; then
  rc=$?
  case "$rc" in
    1) echo "[pg-backup] pg_dump failed" >&2; exit 2 ;;
    *) echo "[pg-backup] encrypt failed (rc=$rc)" >&2; exit 3 ;;
  esac
fi

# AWS CLI v2 talks to any S3-compatible endpoint via --endpoint-url.
# Credentials come from env (AWS_*) for this single command — we don't
# write them to ~/.aws/credentials so the host can run multiple backup
# jobs against different buckets without collision.
if ! AWS_ACCESS_KEY_ID="$BACKUP_S3_ACCESS_KEY_ID" \
     AWS_SECRET_ACCESS_KEY="$BACKUP_S3_SECRET_KEY" \
     AWS_DEFAULT_REGION="$BACKUP_S3_REGION" \
     aws s3 cp "$LOCAL_PATH" "s3://${BACKUP_S3_BUCKET}/${REMOTE_KEY}" \
       --endpoint-url "$BACKUP_S3_ENDPOINT" \
       --only-show-errors; then
  echo "[pg-backup] upload failed" >&2
  exit 4
fi

# Local retention: keep the last 2 dumps on disk so a same-day restore
# doesn't have to re-download from the bucket. Bucket retention is the
# real source of truth and lives in the bucket lifecycle policy.
ls -1t "${LOCAL_DIR}"/wbc-*.sql.gz.gpg 2>/dev/null | tail -n +3 | xargs -r rm --

SIZE=$(stat -c '%s' "$LOCAL_PATH" 2>/dev/null || stat -f '%z' "$LOCAL_PATH")
echo "[pg-backup] OK ${REMOTE_KEY} (${SIZE} bytes)"
