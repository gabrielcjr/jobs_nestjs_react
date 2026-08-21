#!/bin/bash
set -eo pipefail

# ==============================================================================
# DevATS Automated Daily ATS Ingestion Sync Cron Script
# 
# Usage:
#   ./cron_daily_sync.sh [TIER] [CONCURRENCY]
#
# Examples:
#   ./cron_daily_sync.sh          # Default tier 4, concurrency 8
#   ./cron_daily_sync.sh 2 4      # Tier 2, concurrency 4
#
# Crontab schedule recommendation (Run daily at 02:00 UTC):
#   0 2 * * * /home/ubuntu/jobs_nestjs_react/cron_daily_sync.sh >> /var/log/findjobs_cron.log 2>&1
# ==============================================================================

TIER="${1:-4}"
CONCURRENCY="${2:-8}"
BACKEND_URL="${DEVATS_BACKEND_URL:-http://127.0.0.1:3001}"

# Determine writable log destination
if [ -w "/var/log" ] || ([ ! -e "/var/log/findjobs_cron.log" ] && [ -w "/var/log" ]) || [ -w "/var/log/findjobs_cron.log" ]; then
  LOGFILE="/var/log/findjobs_cron.log"
else
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  LOGFILE="${SCRIPT_DIR}/cron_daily_sync.log"
fi

log() {
  local timestamp
  timestamp="$(date -u '+%Y-%m-%d %H:%M:%S UTC')"
  echo "[$timestamp] $1" | tee -a "$LOGFILE"
}

log "================================================================================"
log "Starting daily ATS discovery run (tier: ${TIER}, concurrency: ${CONCURRENCY})..."

RAW_OUTPUT=$(curl -s -S -w "\nHTTP_STATUS:%{http_code}" -X POST "${BACKEND_URL}/api/v1/ingest/start-csv-discovery" \
  -H "Content-Type: application/json" \
  -d "{\"tier\": ${TIER}, \"concurrency\": ${CONCURRENCY}}" 2>&1 || true)

HTTP_BODY=$(echo "$RAW_OUTPUT" | sed '$d')
HTTP_STATUS=$(echo "$RAW_OUTPUT" | grep "HTTP_STATUS:" | cut -d':' -f2 | tr -d '[:space:]')

if [ "$HTTP_STATUS" = "200" ]; then
  log "SUCCESS: Daily ATS discovery triggered successfully (HTTP $HTTP_STATUS)."
  log "Response: $HTTP_BODY"
  log "Daily ATS discovery run completed."
  exit 0
else
  log "ERROR: Daily ATS discovery trigger failed with HTTP status: '${HTTP_STATUS}'"
  log "Response / Error: $HTTP_BODY"
  exit 1
fi
