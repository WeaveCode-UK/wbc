#!/usr/bin/env bash
set -euo pipefail

# Installs daily backup cron job at 3:00 AM
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="${SCRIPT_DIR}/backup.sh"

CRON_LINE="0 3 * * * ${BACKUP_SCRIPT} >> /var/log/wbc-backup.log 2>&1"

# Check if already installed
if crontab -l 2>/dev/null | grep -q "wbc.*backup"; then
  echo "Backup cron already installed."
else
  (crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -
  echo "Backup cron installed: daily at 3:00 AM"
fi

echo "Current crontab:"
crontab -l 2>/dev/null | grep -i "backup" || echo "  (none)"
