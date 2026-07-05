// The HTTP side of the useCase() data bridge (Stream 2). Thin same-origin fetch
// wrappers over the dev server's case routes. Every case part comes back as a
// status envelope { status: 'absent'|'pending'|'ready'|'failed', data, error?, updatedAt }.
//
// 207 responses (partial results: research with a failed decoder, generate with one
// failed generator) are returned as data (ok:false in the body), NOT thrown — the
// caller decides how to surface a partial outcome. Other non-2xx throw.

async function request(path, opts = {}) {
  const res = await fetch(path, {
    headers: { 'content-type': 'application/json' },
    ...opts,
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    // non-JSON body (proxy error page etc.) — fall through to the status check
  }
  if (!res.ok && res.status !== 207) {
    throw new Error((body && body.error) || `HTTP ${res.status}`);
  }
  return body;
}

export function createCase({ company, role, sourceInput }) {
  return request('/api/case', {
    method: 'POST',
    body: JSON.stringify({ company, role, sourceInput }),
  }).then((b) => b.case);
}

export function listCases() {
  return request('/api/cases').then((b) => b.cases);
}

export function getCase(caseId) {
  return request(`/api/case/${encodeURIComponent(caseId)}`).then((b) => b.case);
}

// researcher -> four dossiers -> brokered decoder -> decodedRole. Slow (minutes, live
// LLM + search) — callers poll GET case for part-status progress while this runs.
export function research(caseId) {
  return request(`/api/case/${encodeURIComponent(caseId)}/research`, { method: 'POST' });
}

// gap-analyzer -> fit + gaps.
export function analyze(caseId) {
  return request(`/api/case/${encodeURIComponent(caseId)}/analyze`, { method: 'POST' });
}

// cv-builder + writer -> cvDraft + coverLetter (207 when one fails).
export function generate(caseId) {
  return request(`/api/case/${encodeURIComponent(caseId)}/generate`, { method: 'POST' });
}

// The fill-gap loop. outcome: 'accepted' (datafact minted, requirement flips to match)
// or 'stays_gap' (the honest no — never hidden).
export function answerGap(caseId, gapId, { answer, requirementId, tags }) {
  return request(`/api/case/${encodeURIComponent(caseId)}/gap/${encodeURIComponent(gapId)}/answer`, {
    method: 'POST',
    body: JSON.stringify({ answer, requirementId, tags }),
  });
}

export function searchJobs(query) {
  return request('/api/jobs/search', { method: 'POST', body: JSON.stringify(query) });
}

// The stored jobs collection, raw canonical shape (decision/signal/matchedRules preserved) —
// the triage view reads this, not the UI-normalized /api/jobs/search output.
export function listJobs() {
  return request('/api/jobs').then((b) => b.jobs);
}

// The ONE decision write. The result row AND the ad layover both call this — never a local/
// localStorage decision. On success it dispatches ll:jobs:changed so every mounted useJobs
// refetches, making a decision taken on one surface reflect immediately on the other.
// decision: 'approved' | 'rejected' | 'new' ('new' = reopen, clears reason/note server-side).
export function decideJob(jobId, { decision, reason = null, note = null }) {
  return request(`/api/job/${encodeURIComponent(jobId)}/decide`, {
    method: 'POST',
    body: JSON.stringify({ decision, reason, note }),
  }).then((b) => {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('ll:jobs:changed'));
    return b.job;
  });
}

// Clear all stored jobs. Dispatches ll:jobs:changed so mounted useJobs hooks refetch.
export function clearJobs() {
  return request('/api/job/clear', { method: 'POST' }).then((b) => {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('ll:jobs:changed'));
    return b;
  });
}

// Cross-screen sync, same pattern as jobStore's ll:jobs:changed.
export function notifyCaseChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('ll:case:changed'));
}
