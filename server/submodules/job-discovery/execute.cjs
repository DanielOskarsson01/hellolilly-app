'use strict';

// job-discovery (Step 1). Standalone-runnable: imports NOTHING — uses only injected `tools`.
//
//   input  = { profile? }   (a schedule profile name, e.g. 'daily'|'weekly'; optional)
//   reads  = tools.store.getRecord('filterSet', 'active')   ← the operability principle: filters are DATA
//   writes = canonical job records into the `jobs` collection (decision: 'new'), deduped by externalId
//
// The provider catalog (how to call jobtech/remoteok/remotive) is TRANSPORT, owned here and copied
// from the pipeline's step-1. The FILTER SET (what to search for, which providers, reject rules) is
// store-backed editable data. Nothing is ever silently dropped: a job matching a reject rule is
// stored and flagged (signal:'low' + matchedRules), never hidden — that is the approval layer's call.

// ── Provider catalog (transport, rewrapped from pipeline step-1 / server/job-search-config.cjs) ──
const PROVIDERS = {
  jobtech: {
    id: 'jobtech', mode: 'search',
    url: 'https://jobsearch.api.jobtechdev.se/search',
    keyword_param: 'q', limit_param: 'limit', municipality_param: 'municipality', results_path: 'hits',
    filter_fields: [],
    field_map: {
      url: ['webpage_url', 'application_details.url'], title: 'headline', company: 'employer.name',
      location: 'workplace_address.municipality', snippet: 'description.text',
      postedAt: 'publication_date', externalId: 'id',
    },
  },
  remoteok: {
    id: 'remoteok', mode: 'feed',
    url: 'https://remoteok.com/api', results_path: '$slice_first',
    filter_fields: ['position', 'description', 'company', 'tags'],
    field_map: {
      url: ['url', '$remoteok_slug'], title: 'position', company: 'company', location: 'location',
      snippet: 'description', postedAt: 'date', externalId: 'id',
    },
  },
  remotive: {
    id: 'remotive', mode: 'feed',
    url: 'https://remotive.com/api/remote-jobs', results_path: 'jobs',
    filter_fields: ['title', 'description', 'company_name', 'category'],
    field_map: {
      url: 'url', title: 'title', company: 'company_name', location: 'candidate_required_location',
      snippet: 'description', postedAt: 'publication_date', externalId: 'id',
    },
  },
};

function getNested(obj, path) {
  return String(path).split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

// Resolve a field_map spec (a path, or an array of fallbacks incl. special markers) against an item.
function resolveField(item, spec, provider) {
  const specs = Array.isArray(spec) ? spec : [spec];
  for (const s of specs) {
    if (s === '$remoteok_slug') {
      if (item.id && item.company && item.position) {
        const slug = `${item.company}-${item.position}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return `https://remoteok.com/remote-jobs/${slug}-${item.id}`;
      }
      continue;
    }
    const v = getNested(item, s);
    if (v != null && v !== '') return v;
  }
  return undefined;
}

function extractResults(payload, provider) {
  if (provider.results_path === '$slice_first') {
    return Array.isArray(payload) ? payload.slice(1) : []; // remoteok: first element is a legal notice
  }
  const arr = getNested(payload, provider.results_path);
  return Array.isArray(arr) ? arr : [];
}

function matchesAnyTerm(item, terms, fields) {
  const hay = fields.map((f) => String(getNested(item, f) || '')).join(' ').toLowerCase();
  return terms.some((t) => hay.includes(String(t).toLowerCase()));
}

// Location is a stage-1, CARD-knowable filter (it's in the job metadata — no description-body
// fetch needed), so it's applied cheaply at discovery. Reads the seeded good/maybe/out lists from
// filterSet.stage_1.location. Returns a matched-rule when the location is explicitly OUT, or is
// present-but-not-on-good/maybe (off-target). A blank/unknown location is NOT penalized (we can't
// assess it — e.g. a remote-board job with no city). Never drops; only flags.
function locationRule(loc, locationRules) {
  if (!locationRules) return null;
  const l = String(loc || '').toLowerCase().trim();
  if (!l) return null; // unknown location — don't penalize what we can't assess
  const matchTerm = (list) => (list || []).map(String).find((term) => {
    const t = term.toLowerCase();
    return l.includes(t) || (l.length >= 3 && t.includes(l));
  });
  const outHit = matchTerm(locationRules.out);
  if (outHit) return { rule: 'location_out', term: outHit };
  if (matchTerm(locationRules.good) || matchTerm(locationRules.maybe)) return null; // acceptable area
  return { rule: 'location_off_target', term: loc }; // present, but not on the good/maybe list
}

// Stage-1 (card-knowable) flagging from the store-backed filter set. Computes a signal +
// matched rules; it NEVER drops a job — flagging is for the operator/approval layer.
function stage1Signal(canonical, filterSet) {
  const matchedRules = [];
  const title = String(canonical.title || '').toLowerCase();
  const company = String(canonical.company || '').toLowerCase();
  for (const term of filterSet.rejectTitleTerms || []) {
    if (title.includes(String(term).toLowerCase())) matchedRules.push({ rule: 'reject_title', term });
  }
  for (const bad of filterSet.badCompanies || []) {
    if (company.includes(String(bad).toLowerCase())) matchedRules.push({ rule: 'bad_company', term: bad });
  }
  const locRule = locationRule(canonical.location, filterSet.stage_1 && filterSet.stage_1.location);
  if (locRule) matchedRules.push(locRule);
  return { signal: matchedRules.length ? 'low' : 'neutral', matchedRules };
}

function toCanonical(item, provider, tools, nowIso) {
  const rawId = resolveField(item, provider.field_map.externalId, provider);
  const fullText = tools.utils.stripHtml(resolveField(item, provider.field_map.snippet, provider) || '');
  return {
    id: tools.ids.mintId('job'),
    externalId: `${provider.id}-${rawId}`,
    source: provider.id,
    title: resolveField(item, provider.field_map.title, provider) || '',
    company: resolveField(item, provider.field_map.company, provider) || '',
    location: resolveField(item, provider.field_map.location, provider) || '',
    url: resolveField(item, provider.field_map.url, provider) || '',
    snippet: tools.utils.truncate(fullText, 220),
    text_content: fullText,
    postedAt: resolveField(item, provider.field_map.postedAt, provider) || null,
    decision: 'new',
    discoveredAt: nowIso,
  };
}

async function searchProvider(provider, filterSet, tools) {
  const terms = filterSet.searchTerms || [];
  const limit = filterSet.maxResults || 20;
  const items = [];

  if (provider.mode === 'search') {
    for (const term of terms) {
      let url = `${provider.url}?${provider.keyword_param}=${encodeURIComponent(term)}&${provider.limit_param}=${limit}`;
      // Geography is filter-set DATA like everything else (e.g. jobtech municipality code).
      if (provider.municipality_param && filterSet.municipality) {
        url += `&${provider.municipality_param}=${encodeURIComponent(filterSet.municipality)}`;
      }
      const res = await tools.http.get(url, { timeout: 15000 });
      if (res.status !== 200) { if (tools.logger) tools.logger.warn(`${provider.id} ${res.status} for "${term}"`); continue; }
      items.push(...extractResults(tools.utils.parseJSON(res.body) || {}, provider));
    }
  } else { // feed: fetch once, filter client-side by the store-backed terms
    const res = await tools.http.get(provider.url, { timeout: 15000 });
    if (res.status !== 200) { if (tools.logger) tools.logger.warn(`${provider.id} ${res.status}`); return items; }
    const all = extractResults(tools.utils.parseJSON(res.body) || [], provider);
    for (const it of all) {
      if (!terms.length || matchesAnyTerm(it, terms, provider.filter_fields)) items.push(it);
    }
  }
  return items;
}

module.exports = async function execute(input, options, tools) {
  const filterSet = tools.store.getRecord('filterSet', 'active');
  if (!filterSet) throw new Error('job-discovery: no active filter set in the store (collection "filterSet", id "active") — seed it before discovery runs');

  const nowIso = new Date().toISOString();
  const providerIds = (filterSet.providers && filterSet.providers.length) ? filterSet.providers : Object.keys(PROVIDERS);
  // Map (not just a Set): a dedup hit surfaces the EXISTING record — with its decision —
  // in items[], so a caller rendering this run's results shows the stored truth.
  const existingByExternalId = new Map(tools.store.listRecords('jobs').map((j) => [j.externalId, j]));

  let found = 0;
  let added = 0;
  const perProvider = {};
  const errors = [];
  const items = []; // every record this run saw (new + already-known), in discovery order

  for (const pid of providerIds) {
    const provider = PROVIDERS[pid];
    if (!provider) { errors.push(`unknown provider: ${pid}`); continue; }
    let raw = [];
    try {
      raw = await searchProvider(provider, filterSet, tools);
    } catch (err) {
      errors.push(`${pid}: ${err.message}`);
      if (tools.logger) tools.logger.error(`${pid} search failed: ${err.message}`);
      continue;
    }
    perProvider[pid] = raw.length;
    found += raw.length;

    for (const item of raw) {
      const canonical = toCanonical(item, provider, tools, nowIso);
      if (!canonical.externalId || canonical.externalId.endsWith('-undefined')) continue;
      const existing = existingByExternalId.get(canonical.externalId);
      if (existing) { items.push(existing); continue; } // dedup; never clobber an existing decision
      const { signal, matchedRules } = stage1Signal(canonical, filterSet);
      canonical.signal = signal;
      canonical.matchedRules = matchedRules;
      tools.store.putRecord('jobs', canonical);
      existingByExternalId.set(canonical.externalId, canonical);
      items.push(canonical);
      added += 1;
      // checkpoint partial progress so a long multi-provider run doesn't lose everything on a later error
      if (tools._partialItems) tools._partialItems.push(canonical);
    }
  }

  if (tools.logger) tools.logger.info(`discovery: ${found} found, ${added} new across ${providerIds.join(', ')}`);
  return { ok: errors.length === 0, found, added, perProvider, errors, items };
};
