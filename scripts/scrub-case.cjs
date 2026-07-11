'use strict';

// One-off cleanup: remove given cases AND their activity-log rows, using the store's
// OWN primitives (removeCase / removeRecord) — never a hand-edit of the SQLite file.
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

const caseLine = (c) => `  ${c.meta.id}  "${c.meta.company || '?'}" / "${c.meta.role || '?'}"  (${c.meta.status})`;
console.log(`cases before (${store.listCases().length}):`);
for (const c of store.listCases()) console.log(caseLine(c));

const before = store.listRecords('activity');
const toRemove = before.filter((r) => targets.has(r.caseId));
console.log(`activity: ${before.length} rows total, ${toRemove.length} match {${[...targets].join(', ')}}`);

for (const r of toRemove) {
  const ok = store.removeRecord('activity', r.id); // write-through DELETE in the sqlite adapter
  console.log(`  ${ok ? 'removed' : 'MISS  '} ${r.id}  ${r.type}  "${r.label}"`);
}

for (const id of targets) {
  const ok = store.removeCase(id); // write-through DELETE in the sqlite adapter
  console.log(`  ${ok ? 'removed case' : 'NO SUCH CASE'} ${id}`);
}

const leftoverActs = store.listRecords('activity').filter((r) => targets.has(r.caseId));
const leftoverCases = store.listCases().filter((c) => targets.has(c.meta.id));
console.log(`cases after (${store.listCases().length}):`);
for (const c of store.listCases()) console.log(caseLine(c));
console.log(`leftovers matching targets: ${leftoverActs.length} activity rows, ${leftoverCases.length} cases (expect 0/0)`);

if (typeof store.close === 'function') store.close();
process.exit(leftoverActs.length === 0 && leftoverCases.length === 0 ? 0 : 1);
