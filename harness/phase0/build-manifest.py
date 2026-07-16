#!/usr/bin/env python3
"""
Wave 1 Phase 0 (0c/0d) - build the committed MANIFEST + the local corpus snapshot.

FIXTURE LAW split:
  - COMMITTED (this repo): harness/phase0/MANIFEST.json - identifiers, content
    checksums, and each run's config ONLY. No real ad/CV/pool CONTENT.
  - LOCAL (never committed): harness/phase0/local/corpus/corpus-snapshot.json -
    the real datafact-pool state + curated-content refs used for the capture.

Checksums make the local snapshot verifiable on any machine that holds it; P2
resolves node source identifiers against the manifest.

Paths are env-overridable (REF_CV_DIR, RUN_DATE) so the reference dir - a LOCAL
PARITY REFERENCE, never committed - is not hard-baked.
"""
import os, json, hashlib, sqlite3, glob, datetime

HL = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
REF = os.environ.get("REF_CV_DIR",
    "/Users/danieloskarsson/Library/CloudStorage/Dropbox/Projects/JobSearch/CVs")
LOCAL = os.path.join(HL, "harness", "phase0", "local")
RUN_DATE = os.environ.get("RUN_DATE", datetime.date.today().isoformat())

def sha(b):
    return hashlib.sha256(b if isinstance(b, bytes) else b.encode("utf-8")).hexdigest()
def fsha(p):
    with open(p, "rb") as f: return sha(f.read()), os.path.getsize(p)

# ---- pinned ads (LOCAL) ----
ADS = [
    ("ad.primary.wrknest",  "PRIMARY", "primary-wrknest.txt",  "JobTech live API /ad/30629138"),
    ("ad.second.aloi",      "SECOND",  "second-aloi.txt",      "JobTech historical API /ad/31216243"),
    ("ad.control.ramenbae", "CONTROL", "control-ramenbae.txt", "RemoteOK page body (JSON-LD teaser was truncated)"),
]
ads = []
for aid, role, fn, src in ADS:
    h, n = fsha(os.path.join(LOCAL, "ads", fn))
    ads.append({"id": aid, "role": role, "local_file": f"ads/{fn}", "source": src, "sha256": h, "bytes": n})

# ---- captured reference outputs (LOCAL) ----
CAPS = [("capture.primary.wrknest", "ad.primary.wrknest", "primary-wrknest"),
        ("capture.second.aloi", "ad.second.aloi", "second-aloi"),
        ("capture.control.ramenbae", "ad.control.ramenbae", "control-ramenbae")]
captures = []
for cid, adid, role in CAPS:
    d = os.path.join(LOCAL, "captures", role)
    resp = glob.glob(os.path.join(d, "RESPONSE_*.json"))[0]
    cv = glob.glob(os.path.join(d, "CV_*_tailored.docx"))[0]
    sug = glob.glob(os.path.join(d, "SUGGESTIONS_*.docx"))[0]
    base_variant = json.load(open(resp)).get("base_variant")
    rh, _ = fsha(resp); ch, _ = fsha(cv); sh, _ = fsha(sug)
    captures.append({"id": cid, "ad_id": adid, "base_variant": base_variant,
                     "response_sha256": rh, "cv_docx_sha256": ch, "suggestions_docx_sha256": sh,
                     "run_date": RUN_DATE})

# ---- curated reference content (the pool the tailor selects from) ----
CURATED = [
    ("corpus.competency_pool", "COMPETENCY_MASTER_POOL.json"),
    ("corpus.job_variants",    "CV_JOB_VARIANTS.md"),
    ("corpus.section_variants","CV_SECTION_VARIANTS.md"),
    ("corpus.highlight_pool",  "highlight-pool.json"),
    ("corpus.master_cv",       "cv/MASTER_CV.md"),
    ("corpus.cv_data",         "cv_data.json"),
]
curated = []
for cid, rel in CURATED:
    h, n = fsha(os.path.join(REF, rel))
    curated.append({"id": cid, "ref_file": rel, "sha256": h, "bytes": n})
corpus_version = sha("".join(sorted(c["sha256"] for c in curated)))

# ---- datafact pool state (store.db) ----
db = sqlite3.connect(os.path.join(HL, "server", "data", "store.db"))
rows = db.execute("SELECT id, data FROM datafacts ORDER BY id").fetchall()
pool_items = [{"id": r[0], "sha256": sha(r[1])} for r in rows]
pool_sha = sha("".join(i["id"] + i["sha256"] for i in pool_items))
store_meta = {k: v for k, v in db.execute("SELECT key, value FROM meta").fetchall()}

# ---- reference code version (prompt lives in the code) ----
ref_tailored_sha, _ = fsha(os.path.join(REF, "generate-tailored-cv.js"))
ref_core_sha, _ = fsha(os.path.join(REF, "generate_core_cvs.js"))

# ---- LOCAL snapshot (never committed) ----
os.makedirs(os.path.join(LOCAL, "corpus"), exist_ok=True)
json.dump({
    "note": "LOCAL PARITY REFERENCE - real content, never committed (FIXTURE LAW).",
    "captured": RUN_DATE,
    "datafact_pool": {"count": len(pool_items), "pool_sha256": pool_sha, "items": pool_items},
    "curated": curated,
    "store_meta": store_meta,
}, open(os.path.join(LOCAL, "corpus", "corpus-snapshot.json"), "w"), indent=2, ensure_ascii=False)

# ---- COMMITTED manifest ----
manifest = {
    "wave": "Wave 1 - The Honest Tailor",
    "phase": "Phase 0 (0c-0d) baseline freeze",
    "brief": "docs/WAVE_1_BRIEF_honest-tailor_v3.4.md",
    "generated": RUN_DATE,
    "fixture_law_note": ("Real content (the 3 pinned ads, the 3 captured reference outputs, the "
                         "datafact-pool snapshot) is a LOCAL PARITY REFERENCE, never committed. "
                         "This manifest holds identifiers + content checksums + run config ONLY."),
    "model_substitution": {
        "original_model": "claude-sonnet-4-20250514",
        "original_status": "END-OF-LIFE 2026-06-15 (API returns 404 not_found)",
        "substitute_model": "claude-sonnet-4-6",
        "substituted_on": RUN_DATE,
        "reason": "EOL - original pinned model is dead; substitute is the current Sonnet (direct successor)",
        "approved_by": "Daniel",
        "method": "local copy of generate-tailored-cv.js with ONLY the model id changed (original untouched); diff at harness/phase0/local/reference-substitute/model-swap.diff",
    },
    "standing_rule_same_model": ("For all parity runs this wave, the reference substitute AND the "
                                 "HelloLilly tailor use THE SAME model id (claude-sonnet-4-6). The model "
                                 "is held constant so the machinery is the only variable the parity tests measure."),
    "run_config": {
        "model": "claude-sonnet-4-6",
        "sampling": {"temperature": 0.2, "max_tokens": 8000},
        "prompt_version": {"reference_tailored_sha256": ref_tailored_sha, "reference_core_sha256": ref_core_sha,
                           "note": "prompt is embedded in the reference code; sha of the unmodified original is the prompt version"},
        "corpus_version": corpus_version,
        "run_date": RUN_DATE,
    },
    "ads": ads,
    "captures": captures,
    "corpus": {
        "datafact_pool": {"count": len(pool_items), "pool_sha256": pool_sha,
                          "items": pool_items,
                          "note": "ids + per-item checksums (ids are opaque refs, checksums are hashes - no content)"},
        "curated": curated,
        "corpus_version": corpus_version,
    },
}
json.dump(manifest, open(os.path.join(HL, "harness", "phase0", "MANIFEST.json"), "w"), indent=2, ensure_ascii=False)
print("MANIFEST.json + local corpus-snapshot.json written.")
print(f"  ads: {len(ads)} | captures: {len(captures)} (variants: {[c['base_variant'] for c in captures]})")
print(f"  datafact pool: {len(pool_items)} items, pool_sha256={pool_sha[:16]}...")
print(f"  corpus_version={corpus_version[:16]}... | run_date={RUN_DATE}")
