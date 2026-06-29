'use strict';

// linkedin-job-fetcher. Standalone-runnable: imports NOTHING — uses only injected `tools`.
//
//   input  = { ids?: [...], urls?: [...], id?, url? }   (LinkedIn URLs or bare numeric ids)
//   output = { ok, results:[{ jobId, status, ... }], summary:{ ok, expired, rate_limited, error } }
//            + writes the ok ones into the `jobs` collection (canonical shape, source 'linkedin').
//
// The guest endpoint returns the posting as static HTML with a browser User-Agent. We parse only
// here (title/company/location/body); everything downstream sees the canonical shape. Every input
// produces a result row with a status — expired/rate_limited/error are surfaced, never dropped.

const GUEST_URL = 'https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/';
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

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

function firstMatch(html, regexes) {
  for (const re of regexes) {
    const m = html.match(re);
    if (m && m[1]) return m[1];
  }
  return '';
}

// The description body is the bulk of the fragment; take everything after the known markup marker
// and strip it to text (robust to nested markup we don't model). Falls back to the whole fragment.
function extractDescription(html, utils) {
  for (const cls of ['show-more-less-html__markup', 'description__text', 'jobs-description__content']) {
    const i = html.indexOf(cls);
    if (i !== -1) {
      const gt = html.indexOf('>', i);
      if (gt !== -1) return utils.stripHtml(html.slice(gt + 1));
    }
  }
  return utils.stripHtml(html);
}

// NOTE: these selectors target the LinkedIn guest jobPosting markup as best understood; the
// transport/status/id logic is solid, but the selectors should be validated against a real
// response and adjusted if LinkedIn shifts class names (a parse tweak, not a structural change).
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

module.exports = async function execute(input, options, tools) {
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
};
