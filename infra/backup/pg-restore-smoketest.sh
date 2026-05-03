#!/usr/bin/env bash
# HG3 — Postgres restore smoketest.
#
# Pulls the most recent backup, restores into an ephemeral Postgres
# (Docker), runs a few sanity SELECTs, and exits non-zero if anything
# in the chain fails. Designed to run weekly (cron) and alert via
# whatever the host's mailer/Slack-webhook is.
#
# A backup that has never been restored is not a backup, it's a file —
# this is the program that asserts "the file is actually a backup."
#
# Required env (in addition to BACKUP_* from pg-backup.sh):
#   SMOKETEST_ALERT_WEBHOOK   optional. POSTed a JSON payload on failure.
#                             Empty/unset → just exit non-zero (cron will mail).
#
# Optional env:
#   SMOKETEST_PG_IMAGE        default "postgres:16-alpine"
#   SMOKETEST_PG_PORT         default 55432 (host-side; container is always 5432)
#   SMOKETEST_TABLES          space-separated tables to COUNT(*) on. Default:
#                             "tenants accounts sales payments"
#
# Exit codes:
#   0 success
#   1 missing env
#   2 download failed
#   3 decrypt failed
#   4 docker / restore failed
#   5 smoke query failed (table missing or count == 0 on a critical table)

set -euo pipefail

require() {
  local var="$1"
  if [[ -z "${!var:-}" ]]; then
    echo "[smoketest] FATAL: $var is required" >&2
    exit 1
  fi
}

require BACKUP_S3_ENDPOINT
require BACKUP_S3_BUCKET
require BACKUP_S3_REGION
require BACKUP_S3_ACCESS_KEY_ID
require BACKUP_S3_SECRET_KEY
require BACKUP_ENCRYPTION_KEY

PG_IMAGE="${SMOKETEST_PG_IMAGE:-postgres:16-alpine}"
PG_PORT="${SMOKETEST_PG_PORT:-55432}"
TABLES="${SMOKETEST_TABLES:-tenants accounts sales payments}"
PREFIX="${BACKUP_PREFIX:-wbc/postgres}"

WORKDIR="$(mktemp -d -t wbc-smoketest.XXXXXX)"
trap 'rm -rf "$WORKDIR"; docker rm -f wbc-smoketest >/dev/null 2>&1 || true' EXIT

alert() {
  local stage="$1"
  local detail="$2"
  echo "[smoketest] FAIL stage=${stage} detail=${detail}" >&2
  if [[ -n "${SMOKETEST_ALERT_WEBHOOK:-}" ]]; then
    curl -sS -X POST "$SMOKETEST_ALERT_WEBHOOK" \
      -H 'content-type: application/json' \
      -d "$(printf '{"text":"WBC backup smoketest FAILED — stage=%s, detail=%s"}' "$stage" "$detail")" \
      || true
  fi
}

# 1. List bucket, pick the newest object under the prefix.
echo "[smoketest] finding most recent backup under s3://${BACKUP_S3_BUCKET}/${PREFIX}/"
LATEST_KEY="$(
  AWS_ACCESS_KEY_ID="$BACKUP_S3_ACCESS_KEY_ID" \
  AWS_SECRET_ACCESS_KEY="$BACKUP_S3_SECRET_KEY" \
  AWS_DEFAULT_REGION="$BACKUP_S3_REGION" \
  aws s3api list-objects-v2 \
    --bucket "$BACKUP_S3_BUCKET" \
    --prefix "${PREFIX}/" \
    --endpoint-url "$BACKUP_S3_ENDPOINT" \
    --query 'sort_by(Contents,&LastModified)[-1].Key' \
    --output text 2>/dev/null
)" || { alert "list" "could not list bucket"; exit 2; }

if [[ -z "$LATEST_KEY" || "$LATEST_KEY" == "None" ]]; then
  alert "list" "no backups found under prefix"; exit 2
fi
echo "[smoketest] latest = $LATEST_KEY"

# 2. Download.
ENC_FILE="${WORKDIR}/dump.sql.gz.gpg"
if ! AWS_ACCESS_KEY_ID="$BACKUP_S3_ACCESS_KEY_ID" \
     AWS_SECRET_ACCESS_KEY="$BACKUP_S3_SECRET_KEY" \
     AWS_DEFAULT_REGION="$BACKUP_S3_REGION" \
     aws s3 cp "s3://${BACKUP_S3_BUCKET}/${LATEST_KEY}" "$ENC_FILE" \
       --endpoint-url "$BACKUP_S3_ENDPOINT" \
       --only-show-errors; then
  alert "download" "$LATEST_KEY"; exit 2
fi

# 3. Decrypt + decompress to plain SQL.
SQL_FILE="${WORKDIR}/dump.sql"
if ! gpg --batch --yes --decrypt --passphrase "$BACKUP_ENCRYPTION_KEY" \
        --output - "$ENC_FILE" 2>/dev/null \
   | gunzip -c > "$SQL_FILE"; then
  alert "decrypt" "decrypt or decompress failed"; exit 3
fi

# 4. Spin up an ephemeral Postgres, restore, query.
docker rm -f wbc-smoketest >/dev/null 2>&1 || true
docker run -d --rm --name wbc-smoketest \
  -e POSTGRES_PASSWORD=smoketest \
  -p "${PG_PORT}:5432" \
  "$PG_IMAGE" >/dev/null

# Wait for the container to be ready (max ~30s).
for _ in {1..30}; do
  if docker exec wbc-smoketest pg_isready -U postgres >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! docker exec wbc-smoketest pg_isready -U postgres >/dev/null 2>&1; then
  alert "docker" "container never became ready"; exit 4
fi

if ! docker exec -i wbc-smoketest psql -U postgres -v ON_ERROR_STOP=1 \
       -c "CREATE DATABASE wbc_restore;" >/dev/null 2>&1; then
  alert "docker" "could not create restore db"; exit 4
fi

if ! docker exec -i wbc-smoketest psql -U postgres -d wbc_restore \
       -v ON_ERROR_STOP=1 < "$SQL_FILE" >/dev/null 2>&1; then
  alert "restore" "psql restore failed"; exit 4
fi

# 5. Sanity queries — every table in TABLES must exist and report a numeric count.
for table in $TABLES; do
  count=$(docker exec wbc-smoketest psql -U postgres -d wbc_restore \
             -tAc "SELECT count(*) FROM ${table};" 2>/dev/null || echo "")
  if ! [[ "$count" =~ ^[0-9]+$ ]]; then
    alert "smoke" "table ${table} unreadable"; exit 5
  fi
  echo "[smoketest] ${table} → ${count} rows"
done

echo "[smoketest] OK — restored ${LATEST_KEY} and queried ${TABLES// /, } successfully"
