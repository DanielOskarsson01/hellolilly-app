// Bridge a Home live-search job to its canonical server job record.
//
// Home renders a live-search projection (normalizeJob: id = externalId), but the decide
// route keys jobs by the minted record id (job_xxx). job-discovery persists a canonical
// record per result (keyed by externalId), so we look the record up by externalId to get
// the real id decideJob needs.
//
// Returns null on a miss. Callers MUST fail honestly on null — never fall back to a local
// store, never show a "saved" confirmation. A confirmation is only ever truthful after the
// server write succeeds.
export function findServerJob(records, homeJob) {
  if (!homeJob) return null;
  const externalId = homeJob.id;
  if (!externalId) return null;
  return (records || []).find((r) => r && r.externalId === externalId) || null;
}
