#!/usr/bin/env python3
"""
Wave 1 — AMEND the datafact pool after the Coinhero ingest-gap repair (blocker B1).

39 distinct Coinhero result bullets — Daniel's pre-approved CV lines from the reference variants
source (JobSearch/CVs/generate_core_cvs.js) — were ADDED to the store by
scripts/ingest-coinhero-results.cjs, because the original ingest never read them. This recomputes
the pool checksums + pool_sha256 (same sha() and `SELECT id, data ... ORDER BY id` as
build-manifest.py) and records a manifest amendment.

ADDITIVE-ONLY invariant, asserted here: every one of the previous 144 pool items is still present
with an IDENTICAL sha256 — nothing existing changed, only new rows were added. Captures / ads /
run_config / phase0_decisions / corpus_version are left untouched (corpus_version derives from the
curated corpus, not the pool).

  python3 harness/phase0/amend-pool-coinhero.py
"""
import os, json, hashlib, sqlite3, datetime

HL = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MANIFEST = os.path.join(HL, "harness", "phase0", "MANIFEST.json")
SNAPSHOT = os.path.join(HL, "harness", "phase0", "local", "corpus", "corpus-snapshot.json")
AMEND_DATE = os.environ.get("AMEND_DATE", datetime.date.today().isoformat())

def sha(b):
    return hashlib.sha256(b if isinstance(b, bytes) else b.encode("utf-8")).hexdigest()

db = sqlite3.connect(os.path.join(HL, "server", "data", "store.db"))
rows = db.execute("SELECT id, data FROM datafacts ORDER BY id").fetchall()
db.close()
pool_items = [{"id": r[0], "sha256": sha(r[1])} for r in rows]
pool_sha = sha("".join(i["id"] + i["sha256"] for i in pool_items))

manifest = json.load(open(MANIFEST))
old_items = manifest["corpus"]["datafact_pool"]["items"]
old_pool_sha = manifest["corpus"]["datafact_pool"]["pool_sha256"]
old_count = len(old_items)

if old_pool_sha == pool_sha:
    print(f"pool_sha256 already current ({pool_sha[:16]}...) — nothing to amend.")
    raise SystemExit(0)

# ---- ADDITIVE-ONLY assertion: every previous item survives byte-identical ----
new_by_id = {i["id"]: i["sha256"] for i in pool_items}
changed = [i for i in old_items if new_by_id.get(i["id"]) != i["sha256"]]
if changed:
    raise SystemExit(f"ABORT: {len(changed)} previously-committed pool items changed sha256 "
                     f"(e.g. {changed[0]['id']}) — the ingest was NOT additive-only.")
added = len(pool_items) - old_count
print(f"pool {old_count} -> {len(pool_items)} (+{added}); all previous items unchanged ✓")

manifest["corpus"]["datafact_pool"]["count"] = len(pool_items)
manifest["corpus"]["datafact_pool"]["pool_sha256"] = pool_sha
manifest["corpus"]["datafact_pool"]["items"] = pool_items

amendment = {
    "date": AMEND_DATE,
    "change": f"Added {added} distinct Coinhero job_result datafacts. ADDITIVE ONLY: new content-hash ids, the previous {old_count} facts untouched (all case references still resolve), tagged ['job-result','Coinhero'], each carrying source = the reference variants file.",
    "source": "JobSearch/CVs/generate_core_cvs.js (VARIANTS.*.jobs.coinhero.bullets) — Daniel's pre-approved CV lines, the same curated source the reference oracle renders; imported, not authored (Route-B class).",
    "reason": "Ingest gap (blocker B1): Coinhero results lived in the reference variants files, which the original cv_data.json ingest never read, so the pool had one Coinhero intro and ZERO result bullets. Under the review-#2 strict pre-write gate (>=1 bullet per job), no valid Coinhero could be built and every parity run failed. Approved by Daniel.",
    "script": "scripts/ingest-coinhero-results.cjs + harness/phase0/amend-pool-coinhero.py",
    "previous_pool_sha256": old_pool_sha,
    "new_pool_sha256": pool_sha,
    "oracle_unchanged": "The three captured reference outputs (0e baseline), ads, run_config, phase0_decisions, and corpus_version are untouched; this amends the pool (count + checksums) only.",
}
manifest.setdefault("amendments", [])
if not any(a.get("new_pool_sha256") == pool_sha for a in manifest["amendments"]):
    manifest["amendments"].append(amendment)
json.dump(manifest, open(MANIFEST, "w"), indent=2, ensure_ascii=False)

if os.path.exists(SNAPSHOT):
    snap = json.load(open(SNAPSHOT))
    snap["datafact_pool"]["count"] = len(pool_items)
    snap["datafact_pool"]["pool_sha256"] = pool_sha
    snap["datafact_pool"]["items"] = pool_items
    json.dump(snap, open(SNAPSHOT, "w"), indent=2, ensure_ascii=False)
    print("Patched local corpus-snapshot.json (pool checksums only).")

print("Amended MANIFEST.json.")
print(f"  pool_sha256: {old_pool_sha[:16]}... -> {pool_sha[:16]}...")
print(f"  pool items: {old_count} -> {len(pool_items)} | amendment dated {AMEND_DATE}")
print("  captures / ads / run_config / phase0_decisions / corpus_version: UNCHANGED")
