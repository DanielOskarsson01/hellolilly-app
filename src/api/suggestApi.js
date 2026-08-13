// Wave 2 — client for the document intake + suggestion engine routes. Same-origin fetch
// wrappers mirroring caseApi.js. The session block rides on accept/person-mint so the
// acceptance event records session + device (attested, not authenticated — D23).

async function request(path, opts = {}) {
  const res = await fetch(path, { headers: { 'content-type': 'application/json' }, ...opts });
  let body = null;
  try { body = await res.json(); } catch { /* non-JSON error page — fall through */ }
  if (!res.ok && ![207, 409, 422, 429].includes(res.status)) throw new Error((body && body.error) || `HTTP ${res.status}`);
  return body;
}

function notify(name) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ll:collection:changed', { detail: { name } }));
  }
}

// A stable per-tab session id — recorded on acceptance events (5.4).
export function session() {
  let id = null;
  try {
    id = sessionStorage.getItem('ll-session');
    if (!id) { id = 'sess_' + Math.random().toString(36).slice(2, 10); sessionStorage.setItem('ll-session', id); }
  } catch { id = 'sess_unknown'; }
  return { sessionId: id, device: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown' };
}

export function listDocuments() {
  return request('/api/documents').then((b) => b.documents);
}

// -> { ok:true, document, spans }
//  | { ok:false, error, failure:'parse_failed'|'rejected' } (explicit failed envelope)
//  | { ok:false, failure:'duplicate', duplicate } (same name/content — confirm to save anyway)
// A file upload sends { filename, dataBase64 } (extracted to text server-side); paste sends { text }.
export function uploadDocument({ name, text, attestedClass, ownership = 'mine', filename, dataBase64, confirmDuplicate }) {
  const payload = { name, attestedClass, ownership };
  if (typeof dataBase64 === 'string') { payload.filename = filename; payload.dataBase64 = dataBase64; }
  else payload.text = text;
  if (confirmDuplicate) payload.confirmDuplicate = true;
  return request('/api/documents', { method: 'POST', body: JSON.stringify(payload) })
    .then((b) => { if (b && b.ok) { notify('activity'); } return b; });
}

export function deleteDocument(id) {
  return request(`/api/documents/${encodeURIComponent(id)}`, { method: 'DELETE' })
    .then((b) => { notify('activity'); return b; });
}

// Draft proposals from the attested material (optionally focused by a case's decoded ad).
export function suggestFacts({ caseId = null, documentIds = null } = {}) {
  return request('/api/suggest', { method: 'POST', body: JSON.stringify({ caseId, documentIds }) });
}

// Serving the review mints each proposal's single-use nonce (5.4).
export function listProposals() {
  return request('/api/proposals');
}

export function acceptProposal(id, { nonce, finalText, attribution }) {
  return request(`/api/proposals/${encodeURIComponent(id)}/accept`, {
    method: 'POST', body: JSON.stringify({ nonce, finalText, attribution, session: session() }),
  }).then((b) => {
    if (b && b.ok) { notify('activity'); if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('ll:case:changed')); }
    return b;
  });
}

export function rejectProposal(id, reason = '') {
  return request(`/api/proposals/${encodeURIComponent(id)}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
}

// The D22 first-class person-typed mint — no friction.
export function mintPersonFact({ text, attribution }) {
  return request('/api/facts/person', { method: 'POST', body: JSON.stringify({ text, attribution, session: session() }) })
    .then((b) => { if (b && b.ok) notify('activity'); return b; });
}

// Section 4A — the pre-draft pool-vs-requirement comparison for a case.
export function getTarget(caseId) {
  return request(`/api/case/${encodeURIComponent(caseId)}/target`);
}
