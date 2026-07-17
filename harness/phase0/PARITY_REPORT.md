# Wave 1 — Parity Harness Report

**Run date:** 2026-07-16 · **Overall:** ✅ PASS

## Run integrity (D12)
- Tailor model: `claude-sonnet-4-6` · Decoder (input step): `claude-opus-4-8 (upstream input step; recorded, not the parity-graded model)`
- Sampling: tailor temperature=0 (stable selection; sonnet-4-6 honours it); decoder temperature not sent (deprecated on opus-4-8). maxTokens tailor=2000, decoder=3000
- Corpus version: `a1d95743a06d969900f3ce103de5fc7f83be7dbef6c5628d03524b712906429f`
- Pool: 144 datafacts · pool_sha256 `2752555246fd1cbb225599357677b957fadb15785997f93b63af1f08e5309b24`
- Runs per ad: 3 · Ads: primary (Wrknest), control (Ramen Bae), second (Aloi AI)
- Distinct source ids resolved across all runs: 55
- Selections are datafact ids (opaque refs, no content) — fixture-law safe to commit.

## P1 (structure) + P2 (provenance) — every run
| ad | run | P1 | P2 | sections | errors |
|----|-----|----|----|----------|--------|
| primary | 1 | ✅ | ✅ | 8 | — |
| primary | 2 | ✅ | ✅ | 8 | — |
| primary | 3 | ✅ | ✅ | 8 | — |
| control | 1 | ✅ | ✅ | 8 | — |
| control | 2 | ✅ | ✅ | 8 | — |
| control | 3 | ✅ | ✅ | 8 | — |
| second | 1 | ✅ | ✅ | 8 | — |
| second | 2 | ✅ | ✅ | 8 | — |
| second | 3 | ✅ | ✅ | 8 | — |

**Every run passed P1 and P2:** ✅ yes

## P3 (job sensitivity)
Pass rule: **min(primary-vs-control distance) > max(within-ad distance)**.
- min cross-ad (primary↔control) distance: **0.0855** (9 pairs)
- max within-ad distance: **0.0663**
- **P3: ✅ PASS**

> ⚠️ **Margin dependency (ledger #2):** this pass is load-bearing on tailor **temperature=0** — the recorded intended setting for stable selection (`server/submodules/cv-tailor/manifest.cjs`). The margin is thin (Δ 0.0192 = 0.0855 − 0.0663); at a non-zero temperature the within-ad distances would rise and could flip the result. Any re-run must hold temperature=0 for this result to stand.

Within-ad pair distances: primary 0.0145, 0.0663, 0.0655 · control 0.0088, 0.0172, 0.01 · second 0.0295, 0.0392, 0.0395

## Scope honesty (brief finding 15)
P3 proves the selection RESPONDS to the ad; it does not prove the response is RELEVANT — that is
P4 dimension 2, scored by Daniel against each ad's captured reference. P4 is a separate human step.
