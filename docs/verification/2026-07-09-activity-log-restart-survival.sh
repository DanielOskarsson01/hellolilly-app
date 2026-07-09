#!/usr/bin/env bash
# Durability demo — activity records survive a full server restart.
# Proves: confirmed state changes (case_created, letter_draft_saved) are logged to
# the `activity` collection in SQLite and survive a server kill-and-restart, no wipe.

set -euo pipefail
WORKTREE="$(cd "$(dirname "$0")/../.." && pwd)"
PORT=5293
BASE="http://127.0.0.1:$PORT"
DB="$WORKTREE/server/data/store-activity-demo.db"

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]]; then kill "$SERVER_PID" 2>/dev/null || true; wait "$SERVER_PID" 2>/dev/null || true; fi
  rm -f "$DB" "${DB}-wal" "${DB}-shm"
}
trap cleanup EXIT

start_server() {
  STORE_PATH="$DB" PORT=$PORT node "$WORKTREE/server/dev-server.cjs" > /tmp/activity-demo-server.log 2>&1 &
  SERVER_PID=$!
  curl -s --retry 40 --retry-delay 1 --retry-connrefused "$BASE/api/health" > /dev/null
}

echo "=== DEMO: activity log survives server restart ==="
rm -f "$DB" "${DB}-wal" "${DB}-shm"

echo "[1] start server (fresh db)"; start_server

echo "[2] create a case (logs case_created)"
CASE_ID=$(curl -s -X POST "$BASE/api/case" -H 'content-type: application/json' \
  -d '{"company":"BettingCo","role":"Head of Acquisition"}' | jq -r '.case.meta.id')
echo "    caseId=$CASE_ID"

echo "[3] save a letter draft (logs letter_draft_saved)"
curl -s -X POST "$BASE/api/case/$CASE_ID/letter-draft" -H 'content-type: application/json' \
  -d '{"language":"sv","paragraphs":["Stycke ett.","Stycke tva."],"decisions":{}}' > /dev/null

BEFORE=$(curl -s "$BASE/api/collection/activity" | jq '.records | length')
echo "    activity records before restart: $BEFORE"
if [[ "$BEFORE" != "2" ]]; then echo "FAIL: expected 2 activity records, got $BEFORE"; exit 1; fi

echo "[4] kill server"
kill "$SERVER_PID"; wait "$SERVER_PID" 2>/dev/null || true; SERVER_PID=""

echo "[5] restart server on the SAME db"; start_server

AFTER=$(curl -s "$BASE/api/collection/activity" | jq '.records | length')
TYPES=$(curl -s "$BASE/api/collection/activity" | jq -r '[.records[].type] | sort | join(",")')
echo "    activity records after restart: $AFTER ($TYPES)"
if [[ "$AFTER" != "2" ]]; then echo "FAIL: activity did not survive restart ($AFTER)"; exit 1; fi
if [[ "$TYPES" != "case_created,letter_draft_saved" ]]; then echo "FAIL: unexpected types after restart: $TYPES"; exit 1; fi

echo
echo "PASS ✓ — activity records survived the restart with identical types."
