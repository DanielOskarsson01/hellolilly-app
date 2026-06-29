'use strict';

// job-ingest — bring in LinkedIn jobs that can't be API-searched, from a CSV upload (Daniel's
// annotated tracking export). Parses the CSV, repairs UTF-8-read-as-Latin-1 mojibake, and maps each
// row to the SAME canonical job shape the discovery/fetcher emit, into the `jobs` collection. Jobs
// land stage-1-ready (title/company/location/url known); the description body is enriched later by
// linkedin-job-fetcher (a separate step — see README). Imports nothing (require-guard intact).
module.exports = {
  id: 'job-ingest',
  description: 'Ingest a CSV of LinkedIn jobs into the jobs collection as canonical stage-1 records (deduped by externalId, existing decisions preserved). Repairs mojibake; returns the LinkedIn urls for downstream body enrichment.',
  reads: [],
  writes: [],
  capabilities: ['store', 'logger', 'utils'],
  options: {},
};
