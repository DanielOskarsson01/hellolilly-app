#!/usr/bin/env python3
"""
Wave 1 — AMEND the datafact-pool checksums after the competency-category enrichment
(scripts/enrich-competency-categories.cjs). This is a MANIFEST AMENDMENT, not a baseline
re-freeze (Daniel's binding condition): the three captured reference outputs, the ads, the
run config, and every 0e decision are left byte-for-byte untouched — only the pool's
per-item checksums + pool_sha256 move, because 25 competency facts gained a `category` field.

Uses the SAME sha() and the SAME `SELECT id, data FROM datafacts ORDER BY id` as
build-manifest.py, so the recomputed pool_sha256 is identical to a full rebuild's — but
nothing else in the manifest is regenerated (no RUN_DATE churn, no oracle re-hash).

Idempotent: appends the amendment only once (guarded on the resulting pool_sha256).

  python3 harness/phase0/amend-pool-checksums.py
"""
import os, json, hashlib, sqlite3, datetime

HL = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MANIFEST = os.path.join(HL, "harness", "phase0", "MANIFEST.json")
SNAPSHOT = os.path.join(HL, "harness", "phase0", "local", "corpus", "corpus-snapshot.json")
AMEND_DATE = os.environ.get("AMEND_DATE", datetime.date.today().isoformat())

def sha(b):
    return hashlib.sha256(b if isinstance(b, bytes) else b.encode("utf-8")).hexdigest()

# ---- recompute the pool checksums from the (enriched) store, exactly as build-manifest.py ----
db = sqlite3.connect(os.path.join(HL, "server", "data", "store.db"))
rows = db.execute("SELECT id, data FROM datafacts ORDER BY id").fetchall()
db.close()
pool_items = [{"id": r[0], "sha256": sha(r[1])} for r in rows]
pool_sha = sha("".join(i["id"] + i["sha256"] for i in pool_items))

manifest = json.load(open(MANIFEST))
old_pool_sha = manifest["corpus"]["datafact_pool"]["pool_sha256"]

if old_pool_sha == pool_sha:
    print(f"pool_sha256 already current ({pool_sha[:16]}...) — nothing to amend.")
    raise SystemExit(0)

# ---- patch MANIFEST.json (committed): pool checksums + an amendment entry ----
manifest["corpus"]["datafact_pool"]["pool_sha256"] = pool_sha
manifest["corpus"]["datafact_pool"]["items"] = pool_items

amendment = {
    "date": AMEND_DATE,
    "change": "Enriched the 25 competency datafacts with a `category` field {id, title, group, source}; ids unchanged, no facts added/deleted, all case references still resolve.",
    "source": "COMPETENCY_MASTER_POOL.json (category titles; checksummed as corpus.curated corpus.competency_pool). Item→category grouping is the pre-existing cv_data.competencies group carried on each fact (ingest-cv.cjs).",
    "reason": "The live datafact pool lacked the category structure the frozen template requires (TEMPLATE_DEFINITION.md §5 / JC1: 3 categories, 4-6 items). Route B, approved by Daniel.",
    "script": "scripts/enrich-competency-categories.cjs",
    "previous_pool_sha256": old_pool_sha,
    "new_pool_sha256": pool_sha,
    "oracle_unchanged": "The three captured reference outputs (0e baseline) are untouched; this amends the pool checksums only.",
}
manifest.setdefault("amendments", [])
if not any(a.get("new_pool_sha256") == pool_sha for a in manifest["amendments"]):
    manifest["amendments"].append(amendment)
json.dump(manifest, open(MANIFEST, "w"), indent=2, ensure_ascii=False)

# ---- patch the LOCAL corpus snapshot (never committed): pool checksums only ----
snap = json.load(open(SNAPSHOT))
snap["datafact_pool"]["pool_sha256"] = pool_sha
snap["datafact_pool"]["items"] = pool_items
json.dump(snap, open(SNAPSHOT, "w"), indent=2, ensure_ascii=False)

print("Amended MANIFEST.json + corpus-snapshot.json (pool checksums only).")
print(f"  pool_sha256: {old_pool_sha[:16]}... -> {pool_sha[:16]}...")
print(f"  pool items: {len(pool_items)} | amendment dated {AMEND_DATE}")
print("  captures / ads / run_config / phase0_decisions: UNCHANGED")
