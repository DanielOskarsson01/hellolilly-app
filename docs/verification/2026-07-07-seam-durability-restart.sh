#!/usr/bin/env bash
# Demo (b) — seam durability: approve + job→case link survive server restart
# Proves: job decision ('approved') and caseId link written via the HTTP API
# are persisted in SQLite and survive a full server kill-and-restart.

set -euo pipefail
WORKTREE="$(cd "$(dirname "$0")/../.." && pwd)"
PORT=5292
BASE="http://127.0.0.1:$PORT"
DB="$WORKTREE/server/data/store-demo-b.db"
JOB_ID="job_demo1"
CASE_ID_LINK="case_demo1"

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]]; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  rm -f "$DB" "${DB}-wal" "${DB}-shm"
}
trap cleanup EXIT

echo "=== DEMO (b): seam durability — approve + job→case link survive restart ==="
echo

# ── Step 1: fresh db + seed a job directly via node ──────────────────────────
rm -f "$DB" "${DB}-wal" "${DB}-shm"
echo "[1] Seeding synthetic job '$JOB_ID' directly into the SQLite store …"
node -e "
'use strict';
const { bootstrapStore } = require('$WORKTREE/server/store-bootstrap.cjs');
const { store } = bootstrapStore({ storePath: '$DB' });
store.putRecord('jobs', {
  id: '$JOB_ID',
  externalId: 'ext1',
  source: 'demo',
  title: 'Head of Acquisition',
  company: 'BettingJobs',
  location: 'Remote',
  url: 'https://example.com/job1',
  snippet: 'Lead acquisition strategy across key iGaming markets',
  decision: 'new',
  signal: 'neutral',
  matchedRules: []
});
store.close();
console.log('Seeded $JOB_ID into $DB');
"

echo "    Job seeded ✓"
echo

# ── Step 2: start server ──────────────────────────────────────────────────────
echo "[2] Starting server on port $PORT …"
STORE_PATH="$DB" PORT=$PORT node "$WORKTREE/server/dev-server.cjs" > /tmp/demo-b-server.log 2>&1 &
SERVER_PID=$!
HEALTH=$(curl -s --retry 40 --retry-delay 1 --retry-connrefused "$BASE/api/health")
echo "    health: $HEALTH"
DURABLE=$(echo "$HEALTH" | jq -r '.store.durable')
if [[ "$DURABLE" != "true" ]]; then
  echo "FAIL: store.durable not true"
  exit 1
fi
echo "    store.durable=true ✓"
echo

# ── Step 3: approve the job ───────────────────────────────────────────────────
echo "[3] POST /api/job/$JOB_ID/decide {decision:'approved'} …"
DECIDE_RESP=$(curl -s -X POST "$BASE/api/job/$JOB_ID/decide" \
  -H 'content-type: application/json' \
  -d '{"decision":"approved"}')
echo "    $DECIDE_RESP"
DEC=$(echo "$DECIDE_RESP" | jq -r '.job.decision')
if [[ "$DEC" != "approved" ]]; then
  echo "FAIL: decision not 'approved' in response"
  exit 1
fi

# verify via GET /api/jobs
JOBS1=$(curl -s "$BASE/api/jobs")
DEC_IN_LIST=$(echo "$JOBS1" | jq -r --arg id "$JOB_ID" '.jobs[] | select(.id==$id) | .decision')
echo "    GET /api/jobs → $JOB_ID.decision=$DEC_IN_LIST"
if [[ "$DEC_IN_LIST" != "approved" ]]; then
  echo "FAIL: decision not 'approved' in job list"
  exit 1
fi
echo "    job is approved ✓"
echo

# ── Step 4: link job → case ───────────────────────────────────────────────────
echo "[4] POST /api/job/$JOB_ID/case {caseId:'$CASE_ID_LINK'} …"
LINK_RESP=$(curl -s -X POST "$BASE/api/job/$JOB_ID/case" \
  -H 'content-type: application/json' \
  -d "{\"caseId\":\"$CASE_ID_LINK\"}")
echo "    $LINK_RESP"
CASE_IN_RESP=$(echo "$LINK_RESP" | jq -r '.job.caseId')
if [[ "$CASE_IN_RESP" != "$CASE_ID_LINK" ]]; then
  echo "FAIL: caseId not '$CASE_ID_LINK' in link response"
  exit 1
fi
echo "    caseId=$CASE_ID_LINK ✓"
echo

# ── Step 5: kill, restart (NO wipe) ──────────────────────────────────────────
echo "[5] Killing server (pid=$SERVER_PID) …"
kill "$SERVER_PID" 2>/dev/null || true
wait "$SERVER_PID" 2>/dev/null || true
unset SERVER_PID
echo "    Server stopped. DB NOT wiped."
echo "    Restarting …"
STORE_PATH="$DB" PORT=$PORT node "$WORKTREE/server/dev-server.cjs" > /tmp/demo-b-server2.log 2>&1 &
SERVER_PID=$!
HEALTH2=$(curl -s --retry 40 --retry-delay 1 --retry-connrefused "$BASE/api/health")
echo "    health (post-restart): $HEALTH2"
DURABLE2=$(echo "$HEALTH2" | jq -r '.store.durable')
if [[ "$DURABLE2" != "true" ]]; then
  echo "FAIL: store.durable not true after restart"
  exit 1
fi
echo "    store.durable=true (post-restart) ✓"
echo

# ── Step 6: post-restart verification ────────────────────────────────────────
echo "[6] GET /api/jobs (post-restart) — decision and caseId must still be present …"
JOBS2=$(curl -s "$BASE/api/jobs")
JOB_ENTRY=$(echo "$JOBS2" | jq --arg id "$JOB_ID" '.jobs[] | select(.id==$id)')
echo "    job entry: $JOB_ENTRY"
DEC_R=$(echo "$JOB_ENTRY" | jq -r '.decision')
CASE_R=$(echo "$JOB_ENTRY" | jq -r '.caseId')
echo "    decision=$DEC_R"
echo "    caseId=$CASE_R"

FAIL=0
if [[ "$DEC_R" != "approved" ]]; then echo "FAIL: decision not 'approved' post-restart (got: $DEC_R)"; FAIL=1; fi
if [[ "$CASE_R" != "$CASE_ID_LINK" ]]; then echo "FAIL: caseId not '$CASE_ID_LINK' post-restart (got: $CASE_R)"; FAIL=1; fi
if [[ "$DURABLE2" != "true" ]]; then echo "FAIL: store.durable not true post-restart"; FAIL=1; fi

echo
if [[ "$FAIL" -eq 0 ]]; then
  echo "DEMO (b) PASS — job decision (approved) and caseId link survived server restart; store.durable=true"
else
  echo "DEMO (b) FAIL — see mismatches above"
  exit 1
fi
