const JOB_SEARCH_PROVIDERS = [
  {
    id: 'jobtech',
    name: 'JobTech / Platsbanken',
    mode: 'search',
    url: 'https://jobsearch.api.jobtechdev.se/search',
    keyword_param: 'q',
    limit_param: 'limit',
    results_path: 'hits',
    filter_fields: [],
    field_map: {
      url: ['webpage_url', 'application_details.url'],
      title: 'headline',
      company: 'employer.name',
      location: 'workplace_address.municipality',
      snippet: 'description.text',
      postedAt: 'publication_date',
      externalId: 'id',
    },
    auth: null,
  },
  {
    id: 'remoteok',
    name: 'RemoteOK',
    mode: 'feed',
    url: 'https://remoteok.com/api',
    results_path: '$slice_first',
    filter_fields: ['position', 'description', 'company', 'tags'],
    field_map: {
      url: ['url', '$remoteok_slug'],
      title: 'position',
      company: 'company',
      location: 'location',
      snippet: 'description',
      postedAt: 'date',
      externalId: 'id',
    },
    auth: null,
  },
  {
    id: 'remotive',
    name: 'Remotive',
    mode: 'feed',
    url: 'https://remotive.com/api/remote-jobs',
    results_path: 'jobs',
    filter_fields: ['title', 'description', 'company_name', 'category'],
    field_map: {
      url: 'url',
      title: 'title',
      company: 'company_name',
      location: 'candidate_required_location',
      snippet: 'description',
      postedAt: 'publication_date',
      externalId: 'id',
    },
    auth: null,
  },
];

const DEFAULT_JOB_SEARCH = {
  keywords: ['marknadschef', 'head of marketing', 'marketing manager'],
  excludeKeywords: ['intern', 'junior', 'student', 'praktikant'],
  sources: ['jobtech'],
  municipality: '1980',
  maxResults: 20,
};

function sourceLabel(source) {
  if (source === 'jobtech') return 'Platsbanken';
  if (source === 'remoteok') return 'RemoteOK';
  if (source === 'remotive') return 'Remotive';
  return source || 'API';
}

module.exports = {
  DEFAULT_JOB_SEARCH,
  JOB_SEARCH_PROVIDERS,
  sourceLabel,
};
