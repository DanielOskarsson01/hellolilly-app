const DEFAULT_QUERY = {
  keywords: ['lager', 'logistik', 'truck'],
  sources: ['jobtech'],
  municipality: '1980',
  maxResults: 20,
};

async function searchJobs(query = {}) {
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')) {
    throw new Error('Live API är inte aktiv på GitHub Pages. Visar sparade exempel.');
  }

  const response = await fetch('/api/jobs/search', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...DEFAULT_QUERY, ...query }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Jobbsokningen misslyckades');
  }
  return payload;
}

export { DEFAULT_QUERY, searchJobs };
