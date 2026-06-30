'use strict';

// stage2-filter. Standalone-runnable: imports NOTHING — uses only injected `tools`.
//
//   reads  filterSet.stage_2 (the store-backed reject codes + their editable `match` patterns) and
//          every job with a non-empty text_content body.
//   writes signal + matchedRules (stage:2 tagged) onto each job IN PLACE (same id) — flag-never-hide.
//   output { ok, scanned, flagged, skipped, perCode }.
//
// Body-only: it applies the patterns to text_content. A body-less job (needs_body / empty body) is
// skipped — it has no description to filter on yet (enrich it first). Merges with stage-1 flags
// (any matchedRule whose stage !== 2 is preserved); idempotent (re-run replaces just the stage:2 set).

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Build { code, regexes } for each reject code from its store-backed `match` patterns.
// Word-boundary, case-insensitive — multi-word phrases and single tokens both match safely
// (\bquota\b won't hit "quotation"; \bus hours\b won't hit "campus hours").
function compileRules(stage2) {
  const compiled = [];
  for (const entry of Object.values(stage2 || {})) {
    if (!entry || !Array.isArray(entry.match) || !entry.match.length) continue;
    const code = entry.reason_code;
    if (!code) continue;
    const regexes = entry.match
      .map((p) => String(p).trim())
      .filter(Boolean)
      .map((p) => ({ pattern: p, re: new RegExp(`\\b${escapeRegex(p.toLowerCase())}\\b`, 'i') }));
    if (regexes.length) compiled.push({ code, regexes });
  }
  return compiled;
}

// The stage-2 rules a body triggers — at most one rule per code (first matching pattern).
function bodyRules(text, compiled) {
  const hay = String(text || '').toLowerCase();
  const rules = [];
  for (const { code, regexes } of compiled) {
    const hit = regexes.find((r) => r.re.test(hay));
    if (hit) rules.push({ rule: code, term: hit.pattern, stage: 2 });
  }
  return rules;
}

module.exports = async function execute(input, options, tools) {
  const filterSet = tools.store.getRecord('filterSet', 'active');

  let scanned = 0;
  let flagged = 0;
  let skipped = 0;
  const perCode = {};

  // Stage-2 not configured at all → leave jobs untouched. (When stage_2 IS present but a code's
  // patterns are emptied, we still process — so emptying patterns CLEARS the stale stage:2 flags.)
  if (!filterSet || !filterSet.stage_2) {
    if (tools.logger) tools.logger.info('stage2-filter: no stage_2 in the filter set — no-op');
    return { ok: true, scanned: 0, flagged: 0, skipped: tools.store.listRecords('jobs').length, perCode };
  }
  const compiled = compileRules(filterSet.stage_2);

  for (const job of tools.store.listRecords('jobs')) {
    if (!job.text_content || !String(job.text_content).trim()) { skipped += 1; continue; } // body-less — nothing to filter on
    scanned += 1;

    const stage2Rules = bodyRules(job.text_content, compiled);
    const kept = (job.matchedRules || []).filter((r) => r.stage !== 2); // preserve stage-1, replace stage-2
    const matchedRules = [...kept, ...stage2Rules];
    const signal = matchedRules.length ? 'low' : 'neutral';

    tools.store.putRecord('jobs', { ...job, signal, matchedRules }); // in place, same id; only signal/matchedRules change
    if (tools._partialItems) tools._partialItems.push(job.externalId);

    if (stage2Rules.length) {
      flagged += 1;
      for (const r of stage2Rules) perCode[r.rule] = (perCode[r.rule] || 0) + 1;
    }
  }

  if (tools.logger) tools.logger.info(`stage2-filter: scanned ${scanned}, flagged ${flagged}, skipped ${skipped} (body-less) — ${JSON.stringify(perCode)}`);
  return { ok: true, scanned, flagged, skipped, perCode };
};
