# Wave 1 — Parity Harness Report

**Run date:** 2026-07-17 · **Overall:** ✅ PASS

## Run integrity (D12)
- Tailor model: `claude-sonnet-4-6` · Decoder (input step): `claude-sonnet-4-6 (single-model chain; decode + tailor same model — finding 7)`
- Sampling: HelloLilly: decoder temperature not sent, maxTokens 3000; tailor temperature=0 (stable selection), maxTokens 2000 — single model claude-sonnet-4-6. Reference oracle samples at temperature 0.2 / maxTokens 8000 (recorded divergence, same model; backstopped by P4).
- Corpus version: `a1d95743a06d969900f3ce103de5fc7f83be7dbef6c5628d03524b712906429f`
- Pool: 183 datafacts · pool_sha256 `18b878550ffa76026ba01f2efc8d779df7c5eb82f13f210670653dd60502d693`
- Runs per ad: 3 · Ads: primary (Wrknest), control (Ramen Bae), second (Aloi AI)
- Distinct source ids resolved across all runs: 87
- Selections are datafact ids (opaque refs, no content) — fixture-law safe to commit.

## P1 (structure) + P2 (provenance) — every run
| ad | run | P1 | P2 | sections | errors |
|----|-----|----|----|----------|--------|
| primary | 1 | ✅ | ✅ | 10 | — |
| primary | 2 | ✅ | ✅ | 10 | — |
| primary | 3 | ✅ | ✅ | 10 | — |
| control | 1 | ✅ | ✅ | 10 | — |
| control | 2 | ✅ | ✅ | 10 | — |
| control | 3 | ✅ | ✅ | 10 | — |
| second | 1 | ✅ | ✅ | 10 | — |
| second | 2 | ✅ | ✅ | 10 | — |
| second | 3 | ✅ | ✅ | 10 | — |

**Every run passed P1 and P2:** ✅ yes

## P3 (job sensitivity)
Pass rule: **min(primary-vs-control distance) > max(within-ad distance)**.
- min cross-ad (primary↔control) distance: **0.1771** (9 pairs)
- max within-ad distance: **0.1633**
- **P3: ✅ PASS**

> ⚠️ **Margin dependency (ledger #2):** this pass is load-bearing on tailor **temperature=0** — the recorded intended setting for stable selection (`server/submodules/cv-tailor/manifest.cjs`). The margin is thin (Δ 0.0138 = 0.1771 − 0.1633); at a non-zero temperature the within-ad distances would rise and could flip the result. Any re-run must hold temperature=0 for this result to stand.

Within-ad pair distances: primary 0.0473, 0.1633, 0.1226 · control 0.0502, 0.0315, 0.0813 · second 0.0673, 0.0068, 0.0671

## Scope honesty (brief finding 15)
P3 proves the selection RESPONDS to the ad; it does not prove the response is RELEVANT — that is
P4 dimension 2, scored by Daniel against each ad's captured reference. P4 is a separate human step.
