// Generic named-collection client (D5). Thin same-origin fetch wrappers over the
// dev server's /api/collection routes, mirroring caseApi.js. On a successful write
// it dispatches ll:collection:changed { name } so every mounted useCollection(name)
// refetches. `activity` is read-only from the client (the server emits it).

async function request(path, opts = {}) {
  const res = await fetch(path, { headers: { 'content-type': 'application/json' }, ...opts });
  let body = null;
  try { body = await res.json(); } catch { /* non-JSON error page — fall through */ }
  if (!res.ok && res.status !== 207) throw new Error((body && body.error) || `HTTP ${res.status}`);
  return body;
}

function dispatchCollectionChanged(name) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ll:collection:changed', { detail: { name } }));
  }
}

export function listCollection(name) {
  return request(`/api/collection/${encodeURIComponent(name)}`).then((b) => b.records);
}

export function upsertRecord(name, record) {
  return request(`/api/collection/${encodeURIComponent(name)}`, { method: 'POST', body: JSON.stringify(record) })
    .then((b) => { dispatchCollectionChanged(name); return b.record; });
}

export function removeCollectionRecord(name, id) {
  return request(`/api/collection/${encodeURIComponent(name)}/${encodeURIComponent(id)}`, { method: 'DELETE' })
    .then((b) => { dispatchCollectionChanged(name); return b; });
}

export { dispatchCollectionChanged };
