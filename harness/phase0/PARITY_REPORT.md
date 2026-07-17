# Wave 1 — Parity Harness Report

**Run date:** 2026-07-17 · **Overall:** ❌ FAIL

## Run integrity (D12)
- Tailor model: `claude-sonnet-4-6` · Decoder (input step): `claude-sonnet-4-6 (single-model chain; decode + tailor same model — finding 7)`
- Sampling: HelloLilly: decoder temperature not sent, maxTokens 3000; tailor temperature=0 (stable selection), maxTokens 2000 — single model claude-sonnet-4-6. Reference oracle samples at temperature 0.2 / maxTokens 8000 (recorded divergence, same model; backstopped by P4).
- Corpus version: `a1d95743a06d969900f3ce103de5fc7f83be7dbef6c5628d03524b712906429f`
- Pool: 144 datafacts · pool_sha256 `2752555246fd1cbb225599357677b957fadb15785997f93b63af1f08e5309b24`
- Runs per ad: 3 · Ads: primary (Wrknest), control (Ramen Bae), second (Aloi AI)
- Distinct source ids resolved across all runs: 0
- Selections are datafact ids (opaque refs, no content) — fixture-law safe to commit.

## P1 (structure) + P2 (provenance) — every run
| ad | run | P1 | P2 | sections | errors |
|----|-----|----|----|----------|--------|
| primary | 1 | TAILOR FAILED | — | — | cv-tailor: draft failed pre-write validation — experience item datafact_f65adb5d does not belong to job coinhero (false attribution) |
| primary | 2 | TAILOR FAILED | — | — | cv-tailor: draft failed pre-write validation — experience item datafact_887cb869 does not belong to job coinhero (false attribution) |
| primary | 3 | TAILOR FAILED | — | — | cv-tailor: draft failed pre-write validation — experience item datafact_f65adb5d does not belong to job coinhero (false attribution) |
| control | 1 | TAILOR FAILED | — | — | cv-tailor: draft failed pre-write validation — duplicate id datafact_d712adee in section experience |
| control | 2 | TAILOR FAILED | — | — | cv-tailor: draft failed pre-write validation — job coinhero has no bullets |
| control | 3 | TAILOR FAILED | — | — | cv-tailor: draft failed pre-write validation — experience item datafact_f65adb5d does not belong to job coinhero (false attribution) |
| second | 1 | TAILOR FAILED | — | — | cv-tailor: draft failed pre-write validation — experience item datafact_f65adb5d does not belong to job coinhero (false attribution) |
| second | 2 | TAILOR FAILED | — | — | cv-tailor: draft failed pre-write validation — experience item datafact_f65adb5d does not belong to job coinhero (false attribution) |
| second | 3 | TAILOR FAILED | — | — | cv-tailor: draft failed pre-write validation — experience item datafact_f65adb5d does not belong to job coinhero (false attribution) |

**Every run passed P1 and P2:** ❌ no

## P3 (job sensitivity)
Pass rule: **min(primary-vs-control distance) > max(within-ad distance)**.
- min cross-ad (primary↔control) distance: **0** (9 pairs)
- max within-ad distance: **0**
- **P3: ❌ FAIL**

> ⚠️ **Margin dependency (ledger #2):** this pass is load-bearing on tailor **temperature=0** — the recorded intended setting for stable selection (`server/submodules/cv-tailor/manifest.cjs`). The margin is thin (Δ 0 = 0 − 0); at a non-zero temperature the within-ad distances would rise and could flip the result. Any re-run must hold temperature=0 for this result to stand.

Within-ad pair distances: primary 0, 0, 0 · control 0, 0, 0 · second 0, 0, 0

## Scope honesty (brief finding 15)
P3 proves the selection RESPONDS to the ad; it does not prove the response is RELEVANT — that is
P4 dimension 2, scored by Daniel against each ad's captured reference. P4 is a separate human step.
