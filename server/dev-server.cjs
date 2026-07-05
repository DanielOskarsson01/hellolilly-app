const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const { createServer: createViteServer } = require('vite');
const {
  DEFAULT_JOB_SEARCH,
  JOB_SEARCH_PROVIDERS,
  sourceLabel,
} = require('./job-search-config.cjs');
const { createHost } = require('./skeleton/host.cjs');
const { bootstrapStore, seedDatafactsIfEmpty } = require('./store-bootstrap.cjs');
const { createAnthropicClient } = require('./skeleton/clients/anthropic.cjs');
const { applyAnswer } = require('./skeleton/fill-gap/bullet-judge.cjs');

const PORT = Number(process.env.PORT || 5173);

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 100_000) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

// The A2 case API. `llm` is threaded explicitly because createHost does NOT expose its
// llm (host.cjs returns { store, registry, broker, loaded, invoke } — the llm is captured
// inside the broker). The live server passes the SAME llm to createHost and here.
// Returns an async handler: resolves true if it handled the request, false to fall through.
function createApiHandler(host, { preferencesPath, llm } = {}) {
  function readPreferences() {
    if (!preferencesPath) return undefined;
    try {
      if (!fs.existsSync(preferencesPath)) {
        console.warn(`[api] preferences not found at ${preferencesPath} — analyzing WITHOUT hard-filter preferences`);
        return undefined;
      }
      return JSON.parse(fs.readFileSync(preferencesPath, 'utf8'));
    } catch (err) {
      console.warn(`[api] preferences unreadable (${err.message}) — analyzing WITHOUT them`); // never swallow silently
      return undefined;
    }
  }

  return async function handle(req, res) {
    if (req.method === 'GET' && req.url === '/api/jobs') {
      const jobs = host.store.listRecords('jobs');
      sendJson(res, 200, { ok: true, jobs });
      return true;
    }

    // Job search — in-repo job-discovery through the host broker (Stream 2 rewire).
    if (req.method === 'POST' && req.url === '/api/jobs/search') {
      try {
        const body = await readJson(req);
        sendJson(res, 200, await runJobSearch(host, body));
      } catch (err) {
        sendJson(res, 500, { ok: false, error: err.message || 'Job search failed' });
      }
      return true;
    }

    // Case lifecycle (Stream 2): create + list. These make the UI able to start a case
    // over HTTP — before this, cases could only be born inside a script's own process.
    if (req.method === 'POST' && req.url === '/api/case') {
      try {
        const body = await readJson(req);
        const company = String(body.company || '').trim();
        const role = String(body.role || '').trim();
        if (!company || !role) {
          sendJson(res, 400, { ok: false, error: 'company and role are required' });
          return true;
        }
        const c = host.store.createCase({ company, role, sourceInput: body.sourceInput || null });
        sendJson(res, 201, { ok: true, case: c });
      } catch (err) {
        sendJson(res, 500, { ok: false, error: err.message });
      }
      return true;
    }

    if (req.method === 'GET' && req.url === '/api/cases') {
      const cases = host.store.listCases().map((c) => ({
        meta: c.meta,
        parts: Object.fromEntries(
          ['dossiers', 'decodedRole', 'fit', 'gaps', 'cvDraft', 'coverLetter']
            .map((p) => [p, { status: c[p].status, updatedAt: c[p].updatedAt }]),
        ),
      }));
      sendJson(res, 200, { ok: true, cases });
      return true;
    }

    if (req.method === 'POST' && req.url === '/api/job/clear') {
      const all = host.store.listRecords('jobs');
      for (const j of all) host.store.removeRecord('jobs', j.id);
      sendJson(res, 200, { ok: true, cleared: all.length });
      return true;
    }

    const decideMatch = req.method === 'POST' && req.url.match(/^\/api\/job\/([^/]+)\/decide$/);
    if (decideMatch) {
      const jobId = decideMatch[1];
      const body = await readJson(req);
      const decision = body && body.decision;
      if (!['new', 'approved', 'rejected'].includes(decision)) { sendJson(res, 400, { ok: false, error: 'invalid decision' }); return true; }
      if (decision === 'rejected' && !body.reason) { sendJson(res, 400, { ok: false, error: 'reason required' }); return true; }
      const job = host.store.getRecord('jobs', jobId);
      if (!job) { sendJson(res, 404, { ok: false, error: 'job not found' }); return true; }
      const updated = { ...job, decision,
        rejectReason: decision === 'rejected' ? body.reason : null,
        rejectNote:   decision === 'rejected' ? (body.note || null) : null };
      host.store.putRecord('jobs', updated);
      sendJson(res, 200, { ok: true, job: updated });
      return true;
    }

    const m = req.url.match(/^\/api\/case\/([^/]+)(\/analyze|\/generate|\/research|\/gap\/([^/]+)\/answer)?$/);
    if (!m) return false;
    const caseId = decodeURIComponent(m[1]);
    const action = m[2];

    if (req.method === 'GET' && !action) {
      const c = host.store.getCase(caseId);
      if (!c) { sendJson(res, 404, { ok: false, error: 'no such case' }); return true; }
      const { meta, dossiers, decodedRole, fit, gaps, cvDraft, coverLetter } = c;
      sendJson(res, 200, { ok: true, case: { meta, dossiers, decodedRole, fit, gaps, cvDraft, coverLetter } });
      return true;
    }

    if (req.method === 'POST' && action === '/research') {
      if (!host.store.getCase(caseId)) {
        sendJson(res, 404, { ok: false, error: 'no such case' });
        return true;
      }
      try {
        // researcher writes the four dossiers, then summons the decoder through the
        // broker (decodedRole). A partial run (dossiers ok, decoder failed) surfaces
        // as 207, never as a silent success.
        const { result } = await host.invoke('researcher', { caseId });
        sendJson(res, result.ok ? 200 : 207, result.ok ? { ok: true, ...result } : { ok: false, ...result });
      } catch (err) {
        sendJson(res, 500, { ok: false, error: err.message });
      }
      return true;
    }

    if (req.method === 'POST' && action === '/analyze') {
      try {
        const { result } = await host.invoke('gap-analyzer', { caseId, preferences: readPreferences() });
        const c = host.store.getCase(caseId);
        sendJson(res, 200, { ok: true, fit: c.fit.data, gaps: c.gaps.data, summary: result });
      } catch (err) {
        sendJson(res, 500, { ok: false, error: err.message });
      }
      return true;
    }

    if (req.method === 'POST' && m[3]) { // /gap/:gapId/answer
      const gapId = decodeURIComponent(m[3]);
      try {
        const body = await readJson(req);
        if (!body.answer || !body.requirementId) {
          sendJson(res, 400, { ok: false, error: 'answer and requirementId are required' });
          return true;
        }
        // Uses the threaded `llm` (NOT host.llm, which does not exist).
        const out = await applyAnswer(host.store, llm, {
          caseId, gapId, answer: body.answer, requirementId: body.requirementId, tags: body.tags || [],
        });
        sendJson(res, 200, { ok: true, ...out });
      } catch (err) {
        sendJson(res, 500, { ok: false, error: err.message });
      }
      return true;
    }

    if (req.method === 'POST' && action === '/generate') {
      const out = {};
      for (const id of ['cv-builder', 'writer']) {
        try { await host.invoke(id, { caseId }); } catch (err) { out[`${id}_error`] = err.message; }
      }
      const c = host.store.getCase(caseId);
      if (!c) { sendJson(res, 404, { ok: false, error: 'no such case' }); return true; }
      out.cvDraft = c.cvDraft.data;
      out.coverLetter = c.coverLetter.data;
      out.cvDraftStatus = c.cvDraft.status;
      out.coverLetterStatus = c.coverLetter.status;
      // ok ONLY when BOTH generators produced a ready part — never render a phantom-complete card.
      out.ok = c.cvDraft.status === 'ready' && c.coverLetter.status === 'ready';
      sendJson(res, out.ok ? 200 : 207, out);
      return true;
    }

    return false;
  };
}

function cleanList(value, fallback, max = 10) {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : fallback;
  const seen = new Set();
  return raw
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, max);
}

function colorForCompany(name = '') {
  const colors = ['#2B6CF0', '#2FA56A', '#F39A1E', '#8E7CF0', '#F0643C', '#1F9CA6'];
  const sum = Array.from(name).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return colors[sum % colors.length];
}

function relativeDate(value) {
  if (!value) return 'nyligen';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'nyligen';
  const diff = Date.now() - date.getTime();
  const hours = Math.round(diff / 36e5);
  if (hours < 1) return 'nyss';
  if (hours < 24) return `${hours} tim sedan`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'igar';
  if (days < 14) return `${days} dgr sedan`;
  return date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}

function normalizeJob(item, keywords) {
  const source = sourceLabel(item.source);
  const title = item.title || 'Roll utan titel';
  const company = item.company || source;
  const location = item.location || (item.source === 'jobtech' ? 'Sverige' : 'Remote');
  const matched = keywords.filter((keyword) => {
    const haystack = `${title} ${item.snippet || ''}`.toLowerCase();
    return haystack.includes(keyword.toLowerCase());
  });
  // Store-flagged (signal 'low' from reject/location rules) is down-ranked, never hidden.
  const flagged = item.signal === 'low';
  const score = Math.min(96, Math.max(64, 76 + (item._score || 0) * 4 + matched.length * 2 - (flagged ? 8 : 0)));
  const tags = [source, ...matched.slice(0, 2), flagged ? 'Nedtonad' : null].filter(Boolean);

  return {
    id: item.externalId || item.url || `${company}-${title}`,
    co: company,
    logo: colorForCompany(company),
    t: title,
    city: location,
    type: item.source === 'jobtech' ? 'Platsbanken' : 'Remote',
    tags: tags.length ? tags : [source],
    match: score,
    when: relativeDate(item.postedAt),
    hot: score >= 88,
    source: item.source,
    url: item.url,
    snippet: item.snippet,
  };
}

// Job search through the in-repo `job-discovery` submodule (no sibling-repo dependency —
// the OnlyiGaming api-search coupling is gone). The UI's search parameters become the
// store-backed filterSet (searchTerms/providers/maxResults/municipality); any reject rules
// already seeded on filterSet/active (from candidate preferences) are preserved. Discovery
// writes canonical records into the persistent `jobs` collection and returns the items it
// saw this run — new AND already-known — which we map to the UI job shape.
async function runJobSearch(host, body) {
  const keywords = cleanList(body.keywords, DEFAULT_JOB_SEARCH.keywords, 8);
  const excludeKeywords = cleanList(body.excludeKeywords, DEFAULT_JOB_SEARCH.excludeKeywords, 20);
  const sources = cleanList(body.sources, DEFAULT_JOB_SEARCH.sources, 5)
    .filter((s) => JOB_SEARCH_PROVIDERS.some((p) => p.id === s));
  const maxResults = Math.max(5, Math.min(Number(body.maxResults || DEFAULT_JOB_SEARCH.maxResults), 50));
  const municipality = String(body.municipality || DEFAULT_JOB_SEARCH.municipality).trim();

  if (sources.length === 0) {
    return {
      ok: true,
      jobs: [],
      summary: { total_items: 0, description: 'No providers selected', errors: [] },
      meta: { keywords, sources, municipality, providerCalls: 0 },
    };
  }

  const existing = host.store.getRecord('filterSet', 'active') || {};
  host.store.putRecord('filterSet', {
    ...existing,
    id: 'active',
    searchTerms: keywords,
    providers: sources,
    maxResults,
    municipality,
    // Exclude terms flag (down-rank), never hide — the store philosophy. THIS request's
    // terms only: merging with the record's own previous value would accumulate every
    // exclude ever sent into the persistent filterSet with no way to clear it.
    rejectTitleTerms: excludeKeywords,
  });

  const { result } = await host.invoke('job-discovery', {});
  const jobs = (result.items || [])
    .map((item) => normalizeJob(item, keywords))
    .sort((a, b) => b.match - a.match)
    .slice(0, 40);

  return {
    ok: true,
    jobs,
    summary: { total_items: result.found, added: result.added, errors: result.errors },
    meta: { keywords, sources, municipality, perProvider: result.perProvider },
  };
}

async function start() {
  const vite = await createViteServer({
    root: path.resolve(__dirname, '..'),
    server: { middlewareMode: true },
    appType: 'spa',
  });

  // A2 case API: one host (with the datafact pool seeded), one handler. The SAME llm is
  // passed to createHost and createApiHandler (host.llm does not exist — see createApiHandler).
  const llm = process.env.ANTHROPIC_API_KEY
    ? createAnthropicClient({ apiKey: process.env.ANTHROPIC_API_KEY })
    : null;
  // Durable store (D1): SQLite by default (STORE_ADAPTER=json|memory to override),
  // with a one-time migration from the Stream 2 JSON snapshot. server/data/ is
  // gitignored local state.
  const boot = bootstrapStore();
  const store = boot.store;
  const host = createHost({ llm, store });
  if (boot.migrated) {
    console.log(`[store] migrated legacy JSON snapshot into ${boot.path}`);
  }
  if (host.store.listDatafacts().length > 0) {
    console.log(`[store] ${boot.adapter} store at ${boot.path} (${host.store.listCases().length} cases, ${host.store.listDatafacts().length} datafacts)`);
  } else {
    try {
      // CV_DATA_PATH overrides the seed source (see scripts/seed-datafacts.cjs).
      const r = seedDatafactsIfEmpty(host.store, process.env.CV_DATA_PATH ? { jsonPath: process.env.CV_DATA_PATH } : undefined);
      console.log(`[api] seeded ${r.seeded} datafacts into the ${boot.adapter} store`);
    } catch (err) {
      console.warn(`[api] datafact seed skipped: ${err.message}`);
    }
  }
  // Shutdown: flush the JSON wrapper's debounce window / close the sqlite handle.
  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, () => {
      try {
        if (typeof host.store.flush === 'function') host.store.flush();
        if (typeof host.store.close === 'function') host.store.close();
      } catch (err) {
        console.error(`[store] shutdown persist on ${sig} failed: ${err.message}`);
      }
      process.exit(0);
    });
  }
  const preferencesPath = path.resolve(__dirname, '../docs/candidate_preferences.json');
  const handleCaseApi = createApiHandler(host, { preferencesPath, llm });

  const server = http.createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/api/health') {
      // "Is it durable?" is checkable here, not assumed.
      return sendJson(res, 200, {
        ok: true,
        service: 'hello-lilly-dev-server',
        store: {
          adapter: boot.adapter,
          path: boot.path,
          durable: boot.adapter !== 'memory',
          cases: host.store.listCases().length,
          datafacts: host.store.listDatafacts().length,
        },
      });
    }

    if (await handleCaseApi(req, res)) return;

    vite.middlewares(req, res);
  });

  server.listen(PORT, () => {
    console.log(`HelloLilly dev server: http://127.0.0.1:${PORT}/`);
  });
}

// Only boot the live server when run directly — `require('./dev-server.cjs')` (the API
// tests) must import createApiHandler without starting Vite / binding a port.
if (require.main === module) {
  start().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { createApiHandler };
