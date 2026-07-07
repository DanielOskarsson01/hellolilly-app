#!/usr/bin/env bash
# Demo (a) — letter save-and-resume across restart
# Proves: POST /api/case/:id/letter-draft writes paragraphs + decisions to SQLite;
# they survive a full server kill-and-restart with no db wipe.

set -euo pipefail
WORKTREE="$(cd "$(dirname "$0")/../.." && pwd)"
PORT=5291
BASE="http://127.0.0.1:$PORT"
DB="$WORKTREE/server/data/store-demo-a.db"
PASS=0

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]]; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  rm -f "$DB" "${DB}-wal" "${DB}-shm"
}
trap cleanup EXIT

echo "=== DEMO (a): letter save-and-resume across server restart ==="
echo

# ── Step 1: fresh db, start server ───────────────────────────────────────────
rm -f "$DB" "${DB}-wal" "${DB}-shm"
echo "[1] Starting server on port $PORT with fresh db …"
STORE_PATH="$DB" PORT=$PORT node "$WORKTREE/server/dev-server.cjs" > /tmp/demo-a-server.log 2>&1 &
SERVER_PID=$!

# wait for readiness (retry up to 40s)
HEALTH=$(curl -s --retry 40 --retry-delay 1 --retry-connrefused "$BASE/api/health")
echo "    health: $HEALTH"
DURABLE=$(echo "$HEALTH" | jq -r '.store.durable')
if [[ "$DURABLE" != "true" ]]; then
  echo "FAIL: store.durable is not true before restart"
  exit 1
fi
echo "    store.durable=true ✓"
echo

# ── Step 2: create case ───────────────────────────────────────────────────────
echo "[2] Creating case …"
CASE_RESP=$(curl -s -X POST "$BASE/api/case" \
  -H 'content-type: application/json' \
  -d '{"company":"BettingCo","role":"Head of Acquisition","sourceInput":"Job ad text here"}')
echo "    $CASE_RESP"
CASE_ID=$(echo "$CASE_RESP" | jq -r '.case.meta.id')
if [[ -z "$CASE_ID" || "$CASE_ID" == "null" ]]; then
  echo "FAIL: could not create case"
  exit 1
fi
echo "    caseId=$CASE_ID ✓"
echo

# ── Step 3: write letter draft ───────────────────────────────────────────────
echo "[3] Writing letter-draft (paragraphs + decisions) …"
DRAFT_RESP=$(curl -s -X POST "$BASE/api/case/$CASE_ID/letter-draft" \
  -H 'content-type: application/json' \
  -d '{"language":"en","paragraphs":["Edited para 1","Edited para 2"],"decisions":{"Overclaims 5 years":"soften","Fabricated cert":"cut"}}')
echo "    $DRAFT_RESP"
echo

# ── Step 4: pre-restart GET — sanity check ───────────────────────────────────
echo "[4] GET /api/case/:id (pre-restart sanity) …"
GET1=$(curl -s "$BASE/api/case/$CASE_ID")
PARA1=$(echo "$GET1" | jq -r '.case.coverLetterDraft.data.paragraphs[0]')
PARA2=$(echo "$GET1" | jq -r '.case.coverLetterDraft.data.paragraphs[1]')
DEC1=$(echo "$GET1" | jq -r '.case.coverLetterDraft.data.decisions["Overclaims 5 years"]')
DEC2=$(echo "$GET1" | jq -r '.case.coverLetterDraft.data.decisions["Fabricated cert"]')
echo "    paragraphs[0]=$PARA1"
echo "    paragraphs[1]=$PARA2"
echo "    decisions[Overclaims 5 years]=$DEC1"
echo "    decisions[Fabricated cert]=$DEC2"
if [[ "$PARA1" != "Edited para 1" || "$PARA2" != "Edited para 2" ]]; then
  echo "FAIL: pre-restart paragraphs mismatch"
  exit 1
fi
if [[ "$DEC1" != "soften" || "$DEC2" != "cut" ]]; then
  echo "FAIL: pre-restart decisions mismatch"
  exit 1
fi
echo "    pre-restart data intact ✓"
echo

# ── Step 5: kill server, restart (NO wipe) ───────────────────────────────────
echo "[5] Killing server (pid=$SERVER_PID) …"
kill "$SERVER_PID" 2>/dev/null || true
wait "$SERVER_PID" 2>/dev/null || true
unset SERVER_PID
echo "    Server stopped. DB NOT wiped."
echo "    Restarting …"
STORE_PATH="$DB" PORT=$PORT node "$WORKTREE/server/dev-server.cjs" > /tmp/demo-a-server2.log 2>&1 &
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

# ── Step 6: post-restart GET — persistence check ─────────────────────────────
echo "[6] GET /api/case/:id (post-restart — must still have data) …"
GET2=$(curl -s "$BASE/api/case/$CASE_ID")
PARA1_R=$(echo "$GET2" | jq -r '.case.coverLetterDraft.data.paragraphs[0]')
PARA2_R=$(echo "$GET2" | jq -r '.case.coverLetterDraft.data.paragraphs[1]')
DEC1_R=$(echo "$GET2" | jq -r '.case.coverLetterDraft.data.decisions["Overclaims 5 years"]')
DEC2_R=$(echo "$GET2" | jq -r '.case.coverLetterDraft.data.decisions["Fabricated cert"]')
echo "    paragraphs[0]=$PARA1_R"
echo "    paragraphs[1]=$PARA2_R"
echo "    decisions[Overclaims 5 years]=$DEC1_R"
echo "    decisions[Fabricated cert]=$DEC2_R"

FAIL=0
if [[ "$PARA1_R" != "Edited para 1" ]]; then echo "FAIL: paragraphs[0] mismatch post-restart"; FAIL=1; fi
if [[ "$PARA2_R" != "Edited para 2" ]]; then echo "FAIL: paragraphs[1] mismatch post-restart"; FAIL=1; fi
if [[ "$DEC1_R" != "soften" ]]; then echo "FAIL: decision[Overclaims 5 years] mismatch post-restart"; FAIL=1; fi
if [[ "$DEC2_R" != "cut" ]]; then echo "FAIL: decision[Fabricated cert] mismatch post-restart"; FAIL=1; fi
if [[ "$DURABLE2" != "true" ]]; then echo "FAIL: store.durable not true post-restart"; FAIL=1; fi

echo
if [[ "$FAIL" -eq 0 ]]; then
  echo "DEMO (a) PASS — paragraphs and decisions survived server restart; store.durable=true"
  PASS=1
else
  echo "DEMO (a) FAIL — see mismatches above"
  exit 1
fi
