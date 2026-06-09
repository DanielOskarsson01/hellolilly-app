const http = require('node:http');
const path = require('node:path');
const { createServer: createViteServer } = require('vite');
const {
  DEFAULT_JOB_SEARCH,
  JOB_SEARCH_PROVIDERS,
  sourceLabel,
} = require('./job-search-config.cjs');

const PORT = Number(process.env.PORT || 5173);
const PIPELINE_MODULES_DIR = process.env.PIPELINE_MODULES_DIR
  || path.resolve(__dirname, '../../OnlyiGaming/content-pipeline-modules-v2');
const executeApiSearch = require(path.join(
  PIPELINE_MODULES_DIR,
  'modules/step-1-discovery/api-search/execute.js'
));

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
  const score = Math.min(96, Math.max(64, 76 + (item._score || 0) * 4 + matched.length * 2));
  const tags = [source, ...matched.slice(0, 2), item._signal === 'high' ? 'Hög signal' : null].filter(Boolean);

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

function makeLogger(logs) {
  return {
    info: (message) => logs.push({ level: 'info', message }),
    warn: (message) => logs.push({ level: 'warn', message }),
    error: (message) => logs.push({ level: 'error', message }),
  };
}

async function runJobSearch(body) {
  const keywords = cleanList(body.keywords, DEFAULT_JOB_SEARCH.keywords, 8);
  const excludeKeywords = cleanList(body.excludeKeywords, DEFAULT_JOB_SEARCH.excludeKeywords, 20);
  const sources = cleanList(body.sources, DEFAULT_JOB_SEARCH.sources, 5);
  const maxResults = Math.max(5, Math.min(Number(body.maxResults || DEFAULT_JOB_SEARCH.maxResults), 50));
  const municipality = String(body.municipality || DEFAULT_JOB_SEARCH.municipality).trim();
  const providers = JOB_SEARCH_PROVIDERS.filter((provider) => sources.includes(provider.id));
  const logs = [];

  if (providers.length === 0) {
    return {
      ok: true,
      jobs: [],
      summary: { total_items: 0, description: 'No providers selected', errors: [] },
      meta: { keywords, sources, providerCalls: 0 },
      logs,
    };
  }

  const tools = {
    logger: makeLogger(logs),
    progress: { update: (current, total, message) => logs.push({ level: 'progress', message, current, total }) },
    http: {
      get: async (url, opts = {}) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), opts.timeout || 15000);
        try {
          const res = await fetch(url, {
            headers: {
              accept: 'application/json',
              'user-agent': 'HelloLilly job-search prototype',
              ...(opts.headers || {}),
            },
            signal: controller.signal,
          });
          const responseBody = await res.text();
          return { status: res.status, body: responseBody };
        } finally {
          clearTimeout(timeout);
        }
      },
    },
  };

  const output = await executeApiSearch(
    { entities: [{ name: 'HelloLilly live job search' }] },
    {
      search_input: 'keywords',
      keywords,
      exclude_keywords: excludeKeywords,
      max_results: maxResults,
      providers,
      provider_params: municipality ? { jobtech: { municipality } } : {},
      requests_per_minute: 120,
      score_rules: [
        { field: 'title', patterns: keywords, score: 2, label: 'Search term' },
        { field: 'location', patterns: ['vasteras', 'västerås', 'remote', 'sverige'], score: 1, label: 'Location' },
      ],
    },
    tools
  );

  const rawItems = output.results?.[0]?.items || [];
  const jobs = rawItems.map((item) => normalizeJob(item, keywords)).slice(0, 40);
  const meta = output.results?.[0]?.meta || {};

  return {
    ok: true,
    jobs,
    summary: output.summary,
    meta: {
      ...meta,
      keywords,
      sources: providers.map((provider) => provider.id),
      municipality,
    },
    logs,
  };
}

async function start() {
  const vite = await createViteServer({
    root: path.resolve(__dirname, '..'),
    server: { middlewareMode: true },
    appType: 'spa',
  });

  const server = http.createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/api/health') {
      return sendJson(res, 200, { ok: true, service: 'hello-lilly-dev-server' });
    }

    if (req.method === 'POST' && req.url === '/api/jobs/search') {
      try {
        const body = await readJson(req);
        const result = await runJobSearch(body);
        return sendJson(res, 200, result);
      } catch (err) {
        return sendJson(res, 500, {
          ok: false,
          error: err.message || 'Job search failed',
        });
      }
    }

    vite.middlewares(req, res);
  });

  server.listen(PORT, () => {
    console.log(`HelloLilly dev server: http://127.0.0.1:${PORT}/`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
