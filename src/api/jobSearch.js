const FIXED_MUNICIPALITY = '0180';

const DEFAULT_QUERY = {
  keywords: ['lager', 'logistik', 'truck'],
  sources: ['jobtech'],
  municipality: FIXED_MUNICIPALITY,
  maxResults: 20,
};

const PROVIDERS = {
  jobtech: {
    label: 'Platsbanken',
    type: 'Platsbanken',
    mode: 'search',
    buildUrl: ({ keyword, maxResults, municipality }) => {
      const url = new URL('https://jobsearch.api.jobtechdev.se/search');
      url.searchParams.set('q', keyword);
      url.searchParams.set('limit', String(maxResults));
      if (municipality) url.searchParams.set('municipality', municipality);
      return url.toString();
    },
    extract: (data) => data.hits || [],
    map: (item) => ({
      id: `jobtech-${item.id}`,
      co: item.employer?.name || 'Platsbanken',
      t: item.headline || 'Roll utan titel',
      city: item.workplace_address?.municipality || 'Sverige',
      type: 'Platsbanken',
      source: 'jobtech',
      url: item.webpage_url || item.application_details?.url,
      snippet: item.description?.text || '',
      postedAt: item.publication_date,
    }),
  },
  remoteok: {
    label: 'RemoteOK',
    type: 'Remote',
    mode: 'feed',
    buildUrl: () => 'https://remoteok.com/api',
    extract: (data) => Array.isArray(data) ? data.slice(1) : [],
    map: (item) => ({
      id: `remoteok-${item.id || item.slug}`,
      co: item.company || 'RemoteOK',
      t: item.position || 'Remote role',
      city: item.location || 'Remote',
      type: 'Remote',
      source: 'remoteok',
      url: item.url || (item.slug ? `https://remoteok.com/remote-jobs/${item.slug}` : undefined),
      snippet: item.description || '',
      postedAt: item.date,
    }),
  },
  remotive: {
    label: 'Remotive',
    type: 'Remote',
    mode: 'feed',
    buildUrl: () => 'https://remotive.com/api/remote-jobs',
    extract: (data) => data.jobs || [],
    map: (item) => ({
      id: `remotive-${item.id}`,
      co: item.company_name || 'Remotive',
      t: item.title || 'Remote role',
      city: item.candidate_required_location || 'Remote',
      type: 'Remote',
      source: 'remotive',
      url: item.url,
      snippet: item.description || '',
      postedAt: item.publication_date,
    }),
  },
};

function stripHtml(value) {
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
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

function matchesKeywords(job, keywords) {
  if (!keywords.length) return true;
  const haystack = `${job.t} ${job.co} ${job.city} ${job.snippet}`.toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

function scoreJob(job, keywords) {
  const title = job.t.toLowerCase();
  const location = job.city.toLowerCase();
  const matched = keywords.filter((keyword) => `${title} ${job.snippet}`.toLowerCase().includes(keyword.toLowerCase()));
  let score = 76 + matched.length * 4;
  if (keywords.some((keyword) => title.includes(keyword.toLowerCase()))) score += 6;
  if (location.includes('västerås') || location.includes('vasteras') || location.includes('remote')) score += 4;
  return {
    score: Math.min(96, Math.max(64, score)),
    matched,
  };
}

function normalizeJob(job, provider, keywords) {
  const cleanSnippet = stripHtml(job.snippet);
  const { score, matched } = scoreJob({ ...job, snippet: cleanSnippet }, keywords);
  const tags = [provider.label, ...matched.slice(0, 2), score >= 88 ? 'Hög signal' : null].filter(Boolean);

  return {
    ...job,
    co: job.co || provider.label,
    logo: colorForCompany(job.co || provider.label),
    snippet: cleanSnippet.slice(0, 220),
    tags: tags.length ? tags : [provider.label],
    match: score,
    when: relativeDate(job.postedAt),
    hot: score >= 88,
  };
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function searchProvider(providerId, query) {
  const provider = PROVIDERS[providerId];
  if (!provider) return { jobs: [], apiCalls: 0, errors: [`Unknown provider: ${providerId}`] };

  const { keywords, maxResults, municipality } = query;
  const jobsById = new Map();
  const errors = [];
  let apiCalls = 0;

  if (provider.mode === 'search') {
    for (const keyword of keywords) {
      try {
        const data = await fetchJson(provider.buildUrl({ keyword, maxResults, municipality }));
        apiCalls += 1;
        for (const raw of provider.extract(data)) {
          const mapped = provider.map(raw);
          if (!mapped.url || jobsById.has(mapped.id)) continue;
          jobsById.set(mapped.id, normalizeJob(mapped, provider, keywords));
        }
      } catch (err) {
        errors.push(`${provider.label}: ${err.message}`);
      }
    }
  } else {
    try {
      const data = await fetchJson(provider.buildUrl({ maxResults, municipality }));
      apiCalls += 1;
      for (const raw of provider.extract(data)) {
        const mapped = provider.map(raw);
        if (!mapped.url || jobsById.has(mapped.id)) continue;
        if (!matchesKeywords(mapped, keywords)) continue;
        jobsById.set(mapped.id, normalizeJob(mapped, provider, keywords));
      }
    } catch (err) {
      errors.push(`${provider.label}: ${err.message}`);
    }
  }

  return { jobs: Array.from(jobsById.values()), apiCalls, errors };
}

async function searchJobs(query = {}) {
  const { keywords, sources, maxResults, municipality } = normalizeJobQuery(query);

  const settled = await Promise.all(sources.map((source) => searchProvider(source, {
    keywords,
    maxResults,
    municipality,
  })));

  const jobsById = new Map();
  let apiCalls = 0;
  const errors = [];
  for (const result of settled) {
    apiCalls += result.apiCalls;
    errors.push(...result.errors);
    for (const job of result.jobs) {
      if (!jobsById.has(job.id)) jobsById.set(job.id, job);
    }
  }

  const jobs = Array.from(jobsById.values())
    .sort((a, b) => (b.match || 0) - (a.match || 0))
    .slice(0, 40);

  return {
    ok: true,
    jobs,
    summary: {
      total_items: jobs.length,
      description: `${jobs.length} livejobb från ${sources.map((source) => PROVIDERS[source]?.label || source).join(', ')}`,
      errors,
    },
    meta: {
      total_found: jobs.length,
      api_calls: apiCalls,
      keywords_searched: keywords.length,
      errors: errors.length,
      keywords,
      sources,
      municipality,
    },
  };
}

function normalizeJobQuery(query = {}) {
  const merged = { ...DEFAULT_QUERY, ...query };
  return {
    keywords: cleanList(merged.keywords, DEFAULT_QUERY.keywords, 8),
    sources: cleanList(merged.sources, DEFAULT_QUERY.sources, 5),
    maxResults: Math.max(5, Math.min(Number(merged.maxResults || DEFAULT_QUERY.maxResults), 50)),
    municipality: FIXED_MUNICIPALITY,
  };
}

export { DEFAULT_QUERY, FIXED_MUNICIPALITY, normalizeJobQuery, searchJobs };
