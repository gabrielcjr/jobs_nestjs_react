#!/bin/bash
set -eo pipefail

# ==============================================================================
# DevATS Automated Stale Job Pruning Cron Script
# 
# Usage:
#   ./cron_prune_stale_jobs.sh [DAYS] [DRY_RUN]
#
# Examples:
#   ./cron_prune_stale_jobs.sh          # Prune jobs first ingested >45 days ago
#   ./cron_prune_stale_jobs.sh 30       # Prune jobs first ingested >30 days ago
#   ./cron_prune_stale_jobs.sh 45 true  # Dry-run audit (no mutations)
#
# Crontab schedule recommendation (Run daily at 03:00 UTC):
#   0 3 * * * /home/ubuntu/jobs_nestjs_react/cron_prune_stale_jobs.sh >> /var/log/findjobs_prune_cron.log 2>&1
# ==============================================================================

DAYS="${1:-45}"
DRY_RUN="${2:-false}"
BACKEND_URL="${DEVATS_BACKEND_URL:-http://127.0.0.1:3001}"

# Determine writable log destination
if [ -w "/var/log" ] || ([ ! -e "/var/log/findjobs_prune_cron.log" ] && [ -w "/var/log" ]) || [ -w "/var/log/findjobs_prune_cron.log" ]; then
  LOGFILE="/var/log/findjobs_prune_cron.log"
else
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  LOGFILE="${SCRIPT_DIR}/cron_prune.log"
fi

log() {
  local timestamp
  timestamp="$(date -u '+%Y-%m-%d %H:%M:%S UTC')"
  echo "[$timestamp] $1" | tee -a "$LOGFILE"
}

log "================================================================================"
log "Starting automated stale job pruning (threshold: ${DAYS} days, dryRun: ${DRY_RUN})..."

RAW_OUTPUT=$(curl -s -S -w "\nHTTP_STATUS:%{http_code}" -X POST "${BACKEND_URL}/api/v1/jobs/prune" \
  -H "Content-Type: application/json" \
  -d "{\"days\": ${DAYS}, \"dryRun\": ${DRY_RUN}}" 2>&1 || true)

HTTP_BODY=$(echo "$RAW_OUTPUT" | sed '$d')
HTTP_STATUS=$(echo "$RAW_OUTPUT" | grep "HTTP_STATUS:" | cut -d':' -f2 | tr -d '[:space:]')

if [ "$HTTP_STATUS" = "200" ]; then
  log "SUCCESS: Stale jobs pruning executed successfully (HTTP $HTTP_STATUS)."
  log "Response: $HTTP_BODY"
  log "Automated stale job pruning run finished."
  exit 0
else
  log "ERROR: Stale jobs pruning failed with HTTP status: '${HTTP_STATUS}'"
  log "Response / Error: $HTTP_BODY"
  exit 1
fi
