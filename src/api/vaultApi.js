// Valvet slice 1 — client for the Coach Vault (D21). Same-origin fetch over the dev
// server's /api/vault routes. The vault is a separate local store; these two calls are
// the ONLY way the UI touches it. The CSV is posted as raw text (not JSON) — the server
// parses it. A non-2xx REJECTS so the screen renders the FAILED envelope, never a result.

async function jsonOrThrow(res) {
  let body = null;
  try { body = await res.json(); } catch { /* non-JSON error page — fall through */ }
  if (!res.ok) throw new Error((body && body.error) || `HTTP ${res.status}`);
  return body;
}

export function getVault() {
  return fetch('/api/vault').then(jsonOrThrow); // { ok, count, rows }
}

export function uploadVault(csvText) {
  return fetch('/api/vault', {
    method: 'POST',
    headers: { 'content-type': 'text/csv' },
    body: csvText,
  }).then(jsonOrThrow); // { ok, count, skipped, rows }
}
