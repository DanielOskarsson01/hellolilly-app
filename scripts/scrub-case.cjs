'use strict';

// One-off cleanup: remove activity-log rows belonging to given case ids, using the
// store's OWN removeRecord primitive — never a hand-edit of the SQLite file.
//
// Why activity-only: the store exposes no case-delete primitive (see index.cjs
// exports), and cases are invisible in the job-driven UI anyway. What matters for the
// demo and Wave B's data is a clean activity feed, so we scrub only the activity rows
// and leave the (undeletable) case records in place. A real case delete/archive route
// is logged as a Wave-B follow-up.
//
// Reads come from the in-memory store loaded at boot, so the dev server won't reflect
// this until it restarts. Run with the server STOPPED, then restart it:
//     (stop dev server)  →  node scripts/scrub-case.cjs <caseId> [<caseId> ...]  →  npm run dev
//
// Usage: node scripts/scrub-case.cjs <caseId> [<caseId> ...]

const { bootstrapStore } = require('../server/store-bootstrap.cjs');

const ids = process.argv.slice(2);
if (ids.length === 0) {
  console.error('usage: node scripts/scrub-case.cjs <caseId> [<caseId> ...]');
  process.exit(1);
}
const targets = new Set(ids);

const { store, path: dbPath } = bootstrapStore();
console.log(`db: ${dbPath}`);

const before = store.listRecords('activity');
const toRemove = before.filter((r) => targets.has(r.caseId));
console.log(`activity: ${before.length} rows total, ${toRemove.length} match {${[...targets].join(', ')}}`);

for (const r of toRemove) {
  const ok = store.removeRecord('activity', r.id); // write-through DELETE in the sqlite adapter
  console.log(`  ${ok ? 'removed' : 'MISS  '} ${r.id}  ${r.type}  "${r.label}"`);
}

const leftover = store.listRecords('activity').filter((r) => targets.has(r.caseId));
console.log(`activity: ${leftover.length} matching rows remain (expect 0)`);

// Honest about what was NOT removed: the case records themselves have no delete primitive.
const strayCases = store.listCases().filter((c) => targets.has(c.meta.id));
if (strayCases.length) {
  console.log(`left in place (no case-delete primitive): ${strayCases.map((c) => c.meta.id).join(', ')}`);
}

if (typeof store.close === 'function') store.close();
process.exit(leftover.length === 0 ? 0 : 1);
