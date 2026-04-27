#!/usr/bin/env bash
# ACH-045 seguranca: tighten permissions on every dotenv file in the repo
# tree and on the host's deployment directory. Run after `git pull` on
# production hosts; idempotent.
#
# Usage:
#   bash scripts/lock-env-perms.sh                # repo root
#   bash scripts/lock-env-perms.sh /etc/wbc/env   # explicit path

set -euo pipefail

ROOT="${1:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"

if [[ ! -d "$ROOT" ]]; then
  echo "lock-env-perms.sh: target directory does not exist: $ROOT" >&2
  exit 1
fi

# Match .env, .env.production, .env.local, .env.example.local etc. We
# intentionally cover *.local files too because the canonical .env.example
# is fine at 644 (no secrets), but the *.local* variants frequently are.
shopt -s nullglob
for f in "$ROOT"/.env "$ROOT"/.env.* "$ROOT"/apps/*/.env "$ROOT"/apps/*/.env.*; do
  [[ -f "$f" ]] || continue
  case "$f" in
    *.example) continue ;;
  esac
  current=$(stat -f "%A" "$f" 2>/dev/null || stat -c "%a" "$f" 2>/dev/null || echo "?")
  if [[ "$current" != "600" ]]; then
    chmod 600 "$f"
    echo "chmod 600 $f (was $current)"
  fi
done
