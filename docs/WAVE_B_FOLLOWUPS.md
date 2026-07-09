# Wave B hardening — follow-ups

Deferred items surfaced during **Progress Support Wave A** (merged to `main` in `d603511`, via an independent whole-branch review). Neither is a Wave A blocker; both are Wave B hardening. Tracked here in-repo because the GitHub issue tracker was not used for these.

## #3 — Replace the `activity` denylist with a server-owned-collection write policy  (OPEN)

**Where:** `server/dev-server.cjs` — the generic collection route `POST` / `DELETE /api/collection/:name`.

**Issue:** the route is write-open for **every** collection except `activity`, which is guarded only by a hardcoded `name === 'activity'` denylist. A client can upsert/delete rows in `jobs`, `filterSet`, `jobSources`, `jobRules`, and any future Wave-B collection.

**Severity: low.**
- The scary version — forge a `datafact` row to fake a keyword-align basis — is **confirmed impossible**: datafacts live in a separate Map (`server/skeleton/store/index.cjs`, not `collection_records`), and `applyAlign`'s guard reads `store.getDatafact`. A `POST /api/collection/datafact` row is never read by the align path.
- Real exposure is limited to the user's own local `jobs` / `filterSet` / etc. on an unauthenticated, local-only dev server.

**Proposed fix (Wave B):** replace the single-name denylist with an explicit per-collection **write policy** — an allowlist of client-writable collections, or a "server-owned" set (`activity` + any future derived / server-emitted collections) the generic route refuses client writes to. Scales as collections multiply, instead of adding a name to a denylist each time.

## #2 — `/letter-draft` hung-socket hardening  (being handled separately)

`/letter-draft` had no try/catch, so a gate-thrown draft threw unhandled and hung the socket (no HTTP response). Being hardened to return a 500 on its own branch off this merge; the mandated no-false-positive test is being decoupled from throw-propagation to assert only the zero-record invariant. Remove this note once that branch merges.
