'use strict';

// linkedin-job-fetcher. Standalone-runnable: imports NOTHING — uses only injected `tools`.
//
// Two modes (selected by input):
//   FETCH-NEW   input = { ids?, urls?, id?, url? }  → fetch each LinkedIn guest posting and store a
//               NEW canonical job (source 'linkedin'), skipping externalIds already in the store.
//   ENRICH      input = { enrich:true, limit?, delayMs? }  → fill the BODY of jobs already in the
//               store that are flagged needs_body (the body-less CSV-ingested jobs). It updates ONLY
//               text_content + needs_body + body_status, IN PLACE by the same record.id — never the
//               metadata or decision (the record was born from the authoritative source: job-ingest).
//
// The guest endpoint returns the posting as static HTML with a browser User-Agent. Every input/record
// produces a status (ok/expired/rate_limited/error/thin/no_id) — never silently dropped. needs_body is
// the retry cursor: success or a terminal 404 clears it; 429/error/thin leave it true for a later run.

const GUEST_URL = 'https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/';
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const MIN_BODY_CHARS = 40; // a real description is hundreds of chars; below this a 200 parsed to nothing

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// LinkedIn job ids are long numeric. Accept a bare id, or extract from any LinkedIn URL form,
// ignoring tracking params. Returns null if nothing job-id-shaped is present.
function extractJobId(input) {
  const s = String(input).trim();
  if (/^\d+$/.test(s)) return s; // a bare id
  const specific = s.match(/(?:jobs\/view\/|currentJobId=|jobPosting\/|\/view\/)(\d+)/);
  if (specific) return specific[1];
  // last resort: a long digit run, but ONLY inside a LinkedIn URL — never turn an arbitrary
  // non-LinkedIn URL with a tracking number into a phantom guest-endpoint fetch.
  if (/linkedin\./i.test(s)) {
    const loose = s.match(/(\d{8,})/);
    if (loose) return loose[1];
  }
  return null;
}

// Our own externalId form is `linkedin-<id>` (no dot, so extractJobId's URL paths don't catch it).
function idFromExternal(externalId) {
  const m = String(externalId || '').match(/^linkedin-(\d+)$/);
  return m ? m[1] : null;
}

function firstMatch(html, regexes) {
  for (const re of regexes) {
    const m = html.match(re);
    if (m && m[1]) return m[1];
  }
  return '';
}

// The description body is the content of the show-more markup div, bounded by its trailing
// show-more button — so the criteria list and "Referrals increase your chances… See who you know"
// page chrome are excluded. Falls back to everything-after for older/alternate markers.
function extractDescription(html, utils) {
  for (const cls of ['show-more-less-html__markup', 'description__text', 'jobs-description__content']) {
    const i = html.indexOf(cls);
    if (i !== -1) {
      const gt = html.indexOf('>', i);
      if (gt !== -1) {
        let region = html.slice(gt + 1);
        const end = region.indexOf('show-more-less-html__button');
        if (end !== -1) region = region.slice(0, end);
        return utils.stripHtml(region);
      }
    }
  }
  return utils.stripHtml(html);
}

// LinkedIn-specific parsing — the ONLY place LinkedIn internals are known. Validated against live
// guest responses: top-card-layout__title / topcard__org-name-link / topcard__flavor--bullet.
function parsePosting(html, tools) {
  const u = tools.utils;
  return {
    title: u.stripHtml(firstMatch(html, [
      /<h2[^>]*top-card-layout__title[^>]*>([\s\S]*?)<\/h2>/i,
      /<h1[^>]*>([\s\S]*?)<\/h1>/i,
    ])),
    company: u.stripHtml(firstMatch(html, [
      /topcard__org-name-link[^>]*>([\s\S]*?)<\/a>/i,
      /<a[^>]*org-name-link[^>]*>([\s\S]*?)<\/a>/i,
    ])),
    location: u.stripHtml(firstMatch(html, [
      /topcard__flavor--bullet[^>]*>([\s\S]*?)<\/span>/i,
    ])),
    text: extractDescription(html, u),
  };
}

// ─────────────────────────── FETCH-NEW (original behavior) ───────────────────────────
async function runFetchNew(input, options, tools) {
  const inputs = []
    .concat(input.ids || [], input.urls || [])
    .concat(input.id != null ? [input.id] : [])
    .concat(input.url != null ? [input.url] : []);

  const nowIso = new Date().toISOString();
  const results = [];
  const summary = { ok: 0, expired: 0, rate_limited: 0, error: 0 };
  const seen = new Set(tools.store.listRecords('jobs').map((j) => j.externalId));

  for (const raw of inputs) {
    const jobId = extractJobId(raw);
    if (!jobId) {
      results.push({ input: String(raw), status: 'error', error: 'could not extract a LinkedIn job id' });
      summary.error += 1;
      continue;
    }

    let res;
    try {
      res = await tools.http.get(`${GUEST_URL}${jobId}`, { headers: { 'user-agent': BROWSER_UA }, timeout: 15000 });
    } catch (err) {
      results.push({ jobId, status: 'error', error: err.message });
      summary.error += 1;
      continue;
    }

    if (res.status === 404) { results.push({ jobId, status: 'expired' }); summary.expired += 1; continue; }
    if (res.status === 429) { results.push({ jobId, status: 'rate_limited' }); summary.rate_limited += 1; continue; }
    if (res.status !== 200) { results.push({ jobId, status: 'error', error: `HTTP ${res.status}` }); summary.error += 1; continue; }

    const parsed = parsePosting(res.body || '', tools);
    const externalId = `linkedin-${jobId}`;
    const job = {
      id: tools.ids.mintId('job'),
      externalId,
      source: 'linkedin',
      title: parsed.title,
      company: parsed.company,
      location: parsed.location,
      url: `https://www.linkedin.com/jobs/view/${jobId}`,
      snippet: tools.utils.truncate(parsed.text, 220),
      text_content: parsed.text,
      needs_body: false,
      postedAt: null,
      decision: 'new',
      discoveredAt: nowIso,
    };
    if (!seen.has(externalId)) { // dedup; never clobber an existing decision
      tools.store.putRecord('jobs', job);
      seen.add(externalId);
      if (tools._partialItems) tools._partialItems.push(job);
    }
    results.push({ jobId, status: 'ok', externalId, title: job.title });
    summary.ok += 1;
  }

  if (tools.logger) {
    tools.logger.info(`linkedin-fetcher: ${summary.ok} ok, ${summary.expired} expired, ${summary.rate_limited} rate-limited, ${summary.error} error`);
  }
  return { ok: summary.error === 0 && summary.rate_limited === 0, results, summary };
}

// ─────────────────────────── ENRICH (fill bodies of needs_body jobs) ───────────────────────────
// In-place update by record.id; writes ONLY text_content / needs_body / body_status; carries every
// other field (decision, the CSV's authoritative metadata) through verbatim.
function patch(tools, job, changes) {
  const merged = { ...job, ...changes }; // job is a detached copy from listRecords; spread keeps the SAME id
  tools.store.putRecord('jobs', merged);
  if (tools._partialItems) tools._partialItems.push(job.externalId);
  return merged;
}

async function runEnrich(input, options, tools) {
  const limit = Number.isFinite(input.limit) ? input.limit : Infinity;
  const delayMs = Number.isFinite(input.delayMs) ? input.delayMs : 0;

  const all = tools.store.listRecords('jobs');
  const needBody = all.filter((j) => j.needs_body === true);
  const work = needBody.slice(0, limit === Infinity ? needBody.length : limit);
  const skipped = all.length - needBody.length; // already body-full / terminal — out of scope
  const deferred = needBody.length - work.length; // over the limit — picked up on the next run (the cursor stays)

  // NOTE: retryable statuses (429/error/thin/no_id) keep needs_body:true and are re-attempted every
  // run. For MVP there is no per-record attempt cap — a permanently-thin/no-id record would stay in
  // the work set (visible, flagged), never lost. Add a max-attempts guard if that ever matters.
  const results = [];
  const summary = { ok: 0, expired: 0, rate_limited: 0, error: 0, thin: 0, skipped, deferred };

  for (let i = 0; i < work.length; i += 1) {
    const job = work[i];
    const jobId = idFromExternal(job.externalId) || extractJobId(job.url);

    if (!jobId) {
      patch(tools, job, { body_status: 'no_id' }); // keep needs_body:true, never lose it
      results.push({ externalId: job.externalId, status: 'no_id' });
      summary.error += 1;
      continue;
    }

    let res;
    try {
      res = await tools.http.get(`${GUEST_URL}${jobId}`, { headers: { 'user-agent': BROWSER_UA }, timeout: 15000 });
    } catch (err) {
      patch(tools, job, { body_status: 'error' }); // retryable
      results.push({ externalId: job.externalId, status: 'error', error: err.message });
      summary.error += 1;
      continue;
    }

    if (res.status === 404) {
      patch(tools, job, { needs_body: false, body_status: 'expired' }); // terminal — body stays empty, record visible
      results.push({ externalId: job.externalId, status: 'expired' });
      summary.expired += 1;
      continue;
    }
    if (res.status === 429) {
      patch(tools, job, { body_status: 'rate_limited' }); // retryable
      results.push({ externalId: job.externalId, status: 'rate_limited' });
      summary.rate_limited += 1;
      continue;
    }
    if (res.status !== 200) {
      patch(tools, job, { body_status: 'error' }); // retryable
      results.push({ externalId: job.externalId, status: 'error', error: `HTTP ${res.status}` });
      summary.error += 1;
      continue;
    }

    const text = parsePosting(res.body || '', tools).text;
    if (text.trim().length < MIN_BODY_CHARS) {
      patch(tools, job, { body_status: 'thin' }); // retryable — never advance an empty body to stage-2
      results.push({ externalId: job.externalId, status: 'thin' });
      summary.thin += 1;
      continue;
    }

    // SUCCESS: add the body, leave everything else untouched.
    patch(tools, job, { text_content: text, needs_body: false, body_status: 'ok' });
    results.push({ externalId: job.externalId, status: 'ok', chars: text.length });
    summary.ok += 1;

    if (delayMs && i < work.length - 1) await sleep(delayMs); // pace to avoid a 429 cascade
  }

  if (tools.logger) {
    tools.logger.info(`enrich: ${summary.ok} ok, ${summary.expired} expired, ${summary.rate_limited} rate-limited, ${summary.thin} thin, ${summary.error} error of ${work.length} (skipped ${skipped})`);
  }
  return { ok: summary.error === 0 && summary.rate_limited === 0 && summary.thin === 0, mode: 'enrich', candidates: work.length, results, summary };
}

module.exports = async function execute(input, options, tools) {
  if (input && input.enrich) return runEnrich(input, options, tools);
  return runFetchNew(input || {}, options, tools);
};
