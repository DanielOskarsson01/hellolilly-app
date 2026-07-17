-- Better CV Builder: reference PostgreSQL/Supabase schema
-- Version 1.0, 2026-07-17
-- Run as a reviewed migration, not by pasting into a production database.
-- The schema intentionally keeps a user_id on user-owned child rows so RLS is
-- simple, auditable, and independent of client-provided parent identifiers.

begin;

create schema if not exists extensions;
revoke create on schema extensions from public;
grant usage on schema extensions to service_role;
create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to service_role;
alter default privileges in schema private revoke execute on functions from public;

-- ---------------------------------------------------------------------------
-- Enumerations
-- ---------------------------------------------------------------------------

create type public.source_kind as enum
  ('cv', 'linkedin_export', 'certificate', 'portfolio', 'job_ad', 'other');

create type public.processing_state as enum
  ('pending_upload', 'uploaded', 'queued', 'running', 'needs_input',
   'succeeded', 'failed_retryable', 'failed_terminal', 'cancelled');

create type public.operation_state as enum
  ('queued', 'running', 'needs_input', 'succeeded', 'failed_retryable',
   'failed_terminal', 'cancelled');

create type public.fact_state as enum
  ('source_extracted', 'user_entered', 'user_confirmed', 'user_corrected',
   'inferred_unconfirmed', 'rejected', 'archived');

create type public.requirement_kind as enum
  ('eligibility_gate', 'essential', 'responsibility', 'preferred',
   'submission_constraint', 'context', 'boilerplate');

create type public.requirement_review_state as enum
  ('proposed', 'confirmed', 'corrected', 'excluded');

create type public.evidence_match as enum
  ('direct', 'partial', 'adjacent', 'none', 'unknown');

create type public.document_kind as enum
  ('cv', 'cover_letter', 'outreach_message');

create type public.document_version_state as enum
  ('draft', 'validating', 'needs_review', 'valid', 'superseded');

create type public.claim_state as enum
  ('pending', 'supported', 'needs_confirmation', 'unsupported', 'user_overridden');

create type public.claim_kind as enum
  ('factual', 'job_context', 'mixed', 'non_factual');

create type public.application_state as enum
  ('draft', 'ready', 'applied', 'follow_up', 'interview', 'offer',
   'rejected', 'withdrawn', 'archived');

create type public.consent_state as enum ('granted', 'denied', 'withdrawn');

create type public.deletion_state as enum
  ('requested', 'identity_reverified', 'access_revoked', 'deleting',
   'awaiting_backup_expiry', 'completed', 'failed');

create type public.data_export_state as enum
  ('requested', 'queued', 'running', 'succeeded', 'expired', 'failed', 'cancelled');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.prevent_immutable_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'immutable record cannot be updated';
end;
$$;

-- ---------------------------------------------------------------------------
-- Identity, account, consent, and admin
-- ---------------------------------------------------------------------------

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email_for_documents text,
  phone text,
  city text,
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  linkedin_url text,
  portfolio_url text,
  locale text not null default 'sv-SE',
  timezone text not null default 'Europe/Stockholm',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.consent_receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  anonymous_id uuid,
  purpose text not null check (purpose in
    ('essential', 'analytics', 'marketing', 'model_improvement', 'outcome_research')),
  state public.consent_state not null,
  policy_version text not null,
  jurisdiction text,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  check ((user_id is not null) <> (anonymous_id is not null))
);

create table public.admin_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('support', 'content_editor', 'billing_admin', 'security_admin')),
  created_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function private.is_admin(required_roles text[] default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_memberships m
    where m.user_id = auth.uid()
      and (m.expires_at is null or m.expires_at > now())
      and (required_roles is null or m.role = any(required_roles))
  );
$$;

revoke all on function private.is_admin(text[]) from public;
grant execute on function private.is_admin(text[]) to service_role;

-- ---------------------------------------------------------------------------
-- Career sources, chunks, and fact ledger
-- ---------------------------------------------------------------------------

create table public.source_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind public.source_kind not null,
  state public.processing_state not null default 'pending_upload',
  bucket text not null default 'career-sources',
  object_key text not null,
  original_filename text not null,
  detected_mime text,
  byte_size bigint check (byte_size is null or byte_size between 1 and 10485760),
  sha256_hex text check (sha256_hex is null or sha256_hex ~ '^[a-f0-9]{64}$'),
  malware_scan_state text not null default 'pending'
    check (malware_scan_state in ('pending', 'clean', 'rejected', 'error')),
  parser_version text,
  extraction_quality numeric(4,3) check (extraction_quality between 0 and 1),
  page_count integer check (page_count is null or page_count > 0),
  warnings jsonb not null default '[]'::jsonb,
  extracted_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, object_key)
);

create table public.source_chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_document_id uuid not null,
  page_number integer,
  block_index integer not null,
  reading_order integer not null,
  content text not null,
  content_sha256_hex text not null check (content_sha256_hex ~ '^[a-f0-9]{64}$'),
  bounding_box jsonb,
  extraction_confidence numeric(4,3) check (extraction_confidence between 0 and 1),
  created_at timestamptz not null default now(),
  unique (id, user_id),
  unique (source_document_id, block_index),
  check (content_sha256_hex = pg_catalog.encode(
    extensions.digest(pg_catalog.convert_to(content, 'UTF8'), 'sha256'), 'hex')),
  foreign key (source_document_id, user_id)
    references public.source_documents(id, user_id) on delete cascade
);

create table public.career_facts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lineage_id uuid not null default gen_random_uuid(),
  revision_number integer not null default 1 check (revision_number > 0),
  supersedes_fact_id uuid,
  fact_type text not null check (fact_type in
    ('identity', 'role', 'employer', 'date', 'responsibility', 'achievement',
     'metric', 'skill', 'tool', 'language', 'education', 'certification',
     'project', 'publication', 'volunteering', 'other')),
  subject_ref uuid,
  canonical_key text,
  value_json jsonb not null,
  normalized_text text not null,
  state public.fact_state not null,
  confidence numeric(4,3) check (confidence between 0 and 1),
  sensitivity text not null default 'ordinary'
    check (sensitivity in ('ordinary', 'contact', 'sensitive', 'special_category')),
  permitted_purposes text[] not null
    default array['matching', 'generation', 'render']::text[],
  classification_version text not null default 'policy-1.0',
  starts_on date,
  ends_on date,
  confirmed_at timestamptz,
  rejected_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, lineage_id, revision_number),
  check (ends_on is null or starts_on is null or ends_on >= starts_on),
  check (state not in ('user_confirmed', 'user_corrected') or confirmed_at is not null),
  check (permitted_purposes <@ array['matching', 'generation', 'render']::text[]),
  check (sensitivity <> 'contact' or not ('matching' = any(permitted_purposes))),
  check (sensitivity <> 'special_category' or cardinality(permitted_purposes) = 0),
  foreign key (supersedes_fact_id, user_id)
    references public.career_facts(id, user_id) deferrable initially deferred
);

create table public.fact_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fact_id uuid not null,
  source_chunk_id uuid not null,
  start_offset integer not null check (start_offset >= 0),
  end_offset integer not null check (end_offset > start_offset),
  evidence_role text not null default 'supports'
    check (evidence_role in ('supports', 'contradicts', 'context')),
  created_at timestamptz not null default now(),
  unique (fact_id, source_chunk_id, start_offset, end_offset),
  foreign key (fact_id, user_id)
    references public.career_facts(id, user_id) on delete cascade,
  foreign key (source_chunk_id, user_id)
    references public.source_chunks(id, user_id) on delete cascade
);

create table public.fact_conflicts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conflict_key text not null,
  fact_ids uuid[] not null check (cardinality(fact_ids) >= 2),
  state text not null default 'open' check (state in ('open', 'resolved', 'ignored')),
  resolution jsonb,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Job advert, requirements, analysis, evidence, and clarification
-- ---------------------------------------------------------------------------

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_document_id uuid,
  title text not null,
  company text,
  location text,
  source_url text,
  source_text text not null,
  source_sha256_hex text not null check (source_sha256_hex ~ '^[a-f0-9]{64}$'),
  language_code text,
  imported_at timestamptz,
  import_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (source_document_id, user_id)
    references public.source_documents(id, user_id)
    deferrable initially deferred
);

create table public.job_requirements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null,
  kind public.requirement_kind not null,
  review_state public.requirement_review_state not null default 'proposed',
  canonical_text text not null,
  source_text text not null,
  source_start integer not null check (source_start >= 0),
  source_end integer not null check (source_end > source_start),
  explicit_weight numeric(6,3) not null default 1 check (explicit_weight > 0),
  alternatives jsonb not null default '[]'::jsonb,
  constraints_json jsonb not null default '{}'::jsonb,
  parser_confidence numeric(4,3) check (parser_confidence between 0 and 1),
  parser_version text not null,
  model_version text,
  user_override jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (id, job_id, user_id),
  foreign key (job_id, user_id)
    references public.jobs(id, user_id) on delete cascade
);

create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null,
  state text not null default 'building' check (state in ('building', 'sealed')),
  requirement_snapshot jsonb not null,
  fact_snapshot jsonb not null,
  requirement_snapshot_hash text not null check (requirement_snapshot_hash ~ '^[a-f0-9]{64}$'),
  fact_snapshot_hash text not null check (fact_snapshot_hash ~ '^[a-f0-9]{64}$'),
  score_version text not null,
  score_json jsonb not null,
  normalized_children_sha256_hex text
    check (normalized_children_sha256_hex is null or normalized_children_sha256_hex ~ '^[a-f0-9]{64}$'),
  sealed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  unique (id, job_id, user_id),
  foreign key (job_id, user_id)
    references public.jobs(id, user_id) on delete cascade,
  check ((state = 'sealed') = (sealed_at is not null)),
  check ((state = 'sealed') = (normalized_children_sha256_hex is not null))
);

-- Immutable, normalized requirement snapshot used by this analysis. This prevents
-- later edits to job_requirements from changing historical evidence/score meaning.
create table public.analysis_requirements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_id uuid not null,
  source_requirement_id uuid not null,
  job_id uuid not null,
  ordinal integer not null,
  kind public.requirement_kind not null,
  canonical_text text not null,
  source_text text not null,
  source_start integer not null,
  source_end integer not null,
  explicit_weight numeric(6,3) not null check (explicit_weight > 0),
  alternatives jsonb not null default '[]'::jsonb,
  constraints_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  unique (id, analysis_id, user_id),
  unique (analysis_id, source_requirement_id),
  unique (analysis_id, ordinal),
  foreign key (analysis_id, job_id, user_id)
    references public.analyses(id, job_id, user_id) on delete cascade,
  foreign key (source_requirement_id, job_id, user_id)
    references public.job_requirements(id, job_id, user_id)
    deferrable initially deferred,
  check (source_end > source_start)
);

create table public.analysis_requirement_atoms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_id uuid not null,
  analysis_requirement_id uuid not null,
  ordinal integer not null check (ordinal > 0),
  canonical_text text not null,
  explicit_weight numeric(6,3) not null check (explicit_weight > 0),
  created_at timestamptz not null default now(),
  unique (id, user_id),
  unique (id, analysis_requirement_id, user_id),
  unique (analysis_requirement_id, ordinal),
  foreign key (analysis_requirement_id, analysis_id, user_id)
    references public.analysis_requirements(id, analysis_id, user_id) on delete cascade
);

create table public.requirement_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_id uuid not null,
  analysis_requirement_id uuid not null,
  match public.evidence_match not null,
  demonstrated_parts jsonb not null default '[]'::jsonb,
  missing_parts jsonb not null default '[]'::jsonb,
  rationale text not null,
  matcher_version text not null,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  unique (id, analysis_requirement_id, user_id),
  unique (analysis_requirement_id),
  foreign key (analysis_id, user_id)
    references public.analyses(id, user_id) on delete cascade,
  foreign key (analysis_requirement_id, analysis_id, user_id)
    references public.analysis_requirements(id, analysis_id, user_id) on delete cascade
);

create table public.assessment_facts (
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid not null,
  fact_id uuid not null,
  relationship text not null check (relationship in ('entails', 'supports', 'adjacent', 'context')),
  created_at timestamptz not null default now(),
  primary key (assessment_id, fact_id),
  foreign key (assessment_id, user_id)
    references public.requirement_assessments(id, user_id) on delete cascade,
  foreign key (fact_id, user_id)
    references public.career_facts(id, user_id) deferrable initially deferred
);

create table public.requirement_atom_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid not null,
  analysis_requirement_id uuid not null,
  atom_id uuid not null,
  match public.evidence_match not null check (match <> 'partial'),
  demonstrated_parts jsonb not null default '[]'::jsonb,
  missing_parts jsonb not null default '[]'::jsonb,
  rationale text not null,
  matcher_version text not null,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  unique (atom_id),
  foreign key (assessment_id, analysis_requirement_id, user_id)
    references public.requirement_assessments(id, analysis_requirement_id, user_id)
    on delete cascade,
  foreign key (atom_id, analysis_requirement_id, user_id)
    references public.analysis_requirement_atoms(id, analysis_requirement_id, user_id)
    on delete cascade
);

create table public.atom_assessment_facts (
  user_id uuid not null references auth.users(id) on delete cascade,
  atom_assessment_id uuid not null,
  fact_id uuid not null,
  relationship text not null check (relationship in ('entails', 'supports', 'adjacent', 'context')),
  created_at timestamptz not null default now(),
  primary key (atom_assessment_id, fact_id),
  foreign key (atom_assessment_id, user_id)
    references public.requirement_atom_assessments(id, user_id) on delete cascade,
  foreign key (fact_id, user_id)
    references public.career_facts(id, user_id) deferrable initially deferred
);

create table public.clarifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_id uuid not null,
  analysis_requirement_id uuid,
  question text not null,
  reason text not null,
  answerability_score numeric(4,3) check (answerability_score between 0 and 1),
  expected_coverage_gain numeric(4,3) check (expected_coverage_gain between 0 and 1),
  state text not null default 'open' check (state in ('open', 'answered', 'skipped')),
  answer_json jsonb,
  created_fact_id uuid,
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (analysis_id, user_id)
    references public.analyses(id, user_id) on delete cascade,
  foreign key (analysis_requirement_id, analysis_id, user_id)
    references public.analysis_requirements(id, analysis_id, user_id) on delete cascade,
  foreign key (created_fact_id, user_id)
    references public.career_facts(id, user_id) on delete set null (created_fact_id)
);

-- ---------------------------------------------------------------------------
-- Structured documents, versions, blocks, claims, and renders
-- ---------------------------------------------------------------------------

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid,
  analysis_id uuid,
  kind public.document_kind not null,
  title text not null,
  locale text not null check (locale in ('sv-SE', 'en-GB', 'en-US')),
  current_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (id, job_id, user_id),
  check (analysis_id is null or job_id is not null),
  foreign key (job_id, user_id)
    references public.jobs(id, user_id) on delete cascade,
  foreign key (analysis_id, job_id, user_id)
    references public.analyses(id, job_id, user_id) on delete set null (analysis_id)
);

create table public.document_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid not null,
  parent_version_id uuid,
  version_number integer not null check (version_number > 0),
  state public.document_version_state not null default 'draft',
  strategy_json jsonb not null,
  content_json jsonb not null,
  content_sha256_hex text not null check (content_sha256_hex ~ '^[a-f0-9]{64}$'),
  generation_run_id uuid,
  prompt_version text,
  model_version text,
  validator_version text,
  claim_integrity_json jsonb,
  communication_score_json jsonb,
  approved_by_user_at timestamptz,
  approved_content_sha256_hex text
    check (approved_content_sha256_hex is null or approved_content_sha256_hex ~ '^[a-f0-9]{64}$'),
  created_by text not null check (created_by in ('ai', 'user', 'system')),
  created_at timestamptz not null default now(),
  unique (id, user_id),
  unique (id, document_id, user_id),
  unique (document_id, version_number),
  check ((approved_by_user_at is null) = (approved_content_sha256_hex is null)),
  check (approved_content_sha256_hex is null or approved_content_sha256_hex = content_sha256_hex),
  check (approved_by_user_at is null or state in ('valid', 'superseded')),
  foreign key (document_id, user_id)
    references public.documents(id, user_id) on delete cascade,
  foreign key (parent_version_id, document_id, user_id)
    references public.document_versions(id, document_id, user_id)
    deferrable initially deferred
);

alter table public.documents
  add constraint documents_current_version_fk
  foreign key (current_version_id, id, user_id)
  references public.document_versions(id, document_id, user_id)
  deferrable initially deferred;

create table public.document_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_version_id uuid not null,
  block_key text not null,
  block_type text not null,
  ordinal integer not null,
  content_json jsonb not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  unique (id, document_version_id, user_id),
  unique (document_version_id, block_key),
  foreign key (document_version_id, user_id)
    references public.document_versions(id, user_id) on delete cascade
);

create table public.document_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_version_id uuid not null,
  document_block_id uuid not null,
  claim_text text not null,
  claim_kind public.claim_kind not null,
  start_offset integer,
  end_offset integer,
  state public.claim_state not null default 'pending',
  validation_codes text[] not null default '{}',
  validator_version text,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (document_version_id, user_id)
    references public.document_versions(id, user_id) on delete cascade,
  foreign key (document_block_id, document_version_id, user_id)
    references public.document_blocks(id, document_version_id, user_id) on delete cascade,
  check (
    (start_offset is null and end_offset is null)
    or (start_offset >= 0 and end_offset > start_offset
        and end_offset <= char_length(claim_text))
  )
);

create table public.claim_facts (
  user_id uuid not null references auth.users(id) on delete cascade,
  claim_id uuid not null,
  fact_id uuid not null,
  relationship text not null check (relationship in ('entails', 'supports', 'context')),
  created_at timestamptz not null default now(),
  primary key (claim_id, fact_id),
  foreign key (claim_id, user_id)
    references public.document_claims(id, user_id) on delete cascade,
  foreign key (fact_id, user_id)
    references public.career_facts(id, user_id) deferrable initially deferred
);

create table public.claim_requirements (
  user_id uuid not null references auth.users(id) on delete cascade,
  claim_id uuid not null,
  analysis_requirement_id uuid not null,
  relationship text not null check (relationship in ('addresses', 'context', 'unresolved')),
  created_at timestamptz not null default now(),
  primary key (claim_id, analysis_requirement_id),
  foreign key (claim_id, user_id)
    references public.document_claims(id, user_id) on delete cascade,
  foreign key (analysis_requirement_id, user_id)
    references public.analysis_requirements(id, user_id) deferrable initially deferred
);

create table public.claim_job_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  claim_id uuid not null,
  job_id uuid not null,
  source_start integer not null check (source_start >= 0),
  source_end integer not null check (source_end > source_start),
  relationship text not null check (relationship in ('entails', 'supports', 'context')),
  created_at timestamptz not null default now(),
  unique (claim_id, job_id, source_start, source_end),
  foreign key (claim_id, user_id)
    references public.document_claims(id, user_id) on delete cascade,
  foreign key (job_id, user_id)
    references public.jobs(id, user_id) deferrable initially deferred
);

create table public.render_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_version_id uuid not null,
  format text not null check (format in ('docx', 'pdf', 'txt_preview')),
  state public.processing_state not null default 'queued',
  template_version text not null,
  bucket text not null default 'document-renders',
  object_key text,
  byte_size bigint check (byte_size is null or byte_size > 0),
  sha256_hex text check (sha256_hex is null or sha256_hex ~ '^[a-f0-9]{64}$'),
  parser_check_json jsonb,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, object_key),
  foreign key (document_version_id, user_id)
    references public.document_versions(id, user_id) on delete cascade
);

-- ---------------------------------------------------------------------------
-- Applications, user preference learning, and outcome telemetry
-- ---------------------------------------------------------------------------

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null,
  submitted_document_id uuid,
  submitted_document_version_id uuid,
  state public.application_state not null default 'draft',
  applied_at timestamptz,
  next_action_at timestamptz,
  contact_name text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  check ((submitted_document_id is null) = (submitted_document_version_id is null)),
  foreign key (job_id, user_id)
    references public.jobs(id, user_id) on delete cascade,
  foreign key (submitted_document_id, job_id, user_id)
    references public.documents(id, job_id, user_id)
    deferrable initially deferred,
  foreign key (submitted_document_version_id, submitted_document_id, user_id)
    references public.document_versions(id, document_id, user_id)
    on delete set null (submitted_document_version_id, submitted_document_id)
);

create table public.application_outcomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null,
  outcome_type text not null check (outcome_type in
    ('screen', 'interview', 'assessment', 'offer', 'rejection', 'withdrawal', 'other')),
  occurred_at timestamptz,
  self_reported boolean not null default true,
  details_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  foreign key (application_id, user_id)
    references public.applications(id, user_id) on delete cascade
);

create table public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  preference_key text not null,
  value_json jsonb not null,
  learned_from text not null check (learned_from in ('explicit', 'accepted_edit', 'rejected_edit')),
  confidence numeric(4,3) check (confidence between 0 and 1),
  reset_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, preference_key)
);

create table public.edit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_version_id uuid not null,
  block_key text not null,
  event_type text not null check (event_type in
    ('suggestion_shown', 'accepted', 'edited', 'rejected', 'pinned', 'unpinned', 'restored')),
  structured_delta jsonb,
  content_fingerprint_before text,
  content_fingerprint_after text,
  occurred_at timestamptz not null default now(),
  foreign key (document_version_id, user_id)
    references public.document_versions(id, user_id) on delete cascade
);

-- ---------------------------------------------------------------------------
-- Plans, subscriptions, usage, operations, webhooks, and audit
-- ---------------------------------------------------------------------------

create table public.plan_catalog (
  catalog_id text primary key,
  plan_code text not null,
  version integer not null,
  name text not null,
  currency text not null,
  amount_minor integer not null check (amount_minor >= 0),
  billing_period text not null check (billing_period in ('none', 'week', 'month', 'year')),
  trial_days integer not null default 0 check (trial_days >= 0),
  limits_json jsonb not null check (jsonb_typeof(limits_json) = 'object'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (plan_code, version)
);

-- Pseudonymized billing identity/history can be retained for the separately
-- justified statutory/contractual period after the application account is erased.
create table public.billing_customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  subject_hash text not null check (subject_hash ~ '^[a-f0-9]{64}$'),
  provider text not null check (provider in ('stripe', 'paddle', 'manual')),
  provider_customer_id text,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  unique (provider, subject_hash),
  unique (provider, provider_customer_id)
);

create table public.customer_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  billing_customer_id uuid not null,
  provider text not null check (provider in ('stripe', 'paddle', 'manual')),
  provider_customer_id text,
  provider_subscription_id text,
  catalog_id text not null references public.plan_catalog(catalog_id),
  state text not null check (state in
    ('trialing', 'active', 'past_due', 'paused', 'cancelled', 'expired')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id),
  unique (provider, provider_subscription_id),
  foreign key (billing_customer_id, user_id)
    references public.billing_customers(id, user_id)
    deferrable initially deferred,
  check (current_period_end is null or current_period_start is null
         or current_period_end >= current_period_start)
);

create table public.subscription_history (
  id bigint generated always as identity primary key,
  billing_customer_id uuid not null references public.billing_customers(id) on delete restrict,
  provider text not null check (provider in ('stripe', 'paddle', 'manual')),
  provider_subscription_id text,
  catalog_id text references public.plan_catalog(catalog_id),
  event_type text not null,
  state text,
  period_start timestamptz,
  period_end timestamptz,
  amount_minor integer,
  currency text,
  provider_event_id text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('analysis', 'generation', 'render', 'ocr')),
  idempotency_key text not null,
  resource_id uuid,
  units integer not null default 1 check (units > 0),
  state text not null check (state in ('reserved', 'consumed', 'released')),
  occurred_at timestamptz not null default now(),
  unique (user_id, event_type, idempotency_key)
);

create table public.operations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  operation_type text not null,
  resource_type text not null,
  resource_id uuid not null,
  state public.operation_state not null default 'queued',
  idempotency_key text not null,
  request_sha256_hex text not null check (request_sha256_hex ~ '^[a-f0-9]{64}$'),
  attempt_count integer not null default 0,
  max_attempts integer not null default 3,
  lease_owner text,
  lease_expires_at timestamptz,
  heartbeat_at timestamptz,
  run_after timestamptz not null default now(),
  trace_id text not null,
  model_version text,
  prompt_version text,
  sanitized_error_code text,
  sanitized_error_detail jsonb,
  result_ref_json jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  dead_lettered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  check (max_attempts between 1 and 20),
  check (attempt_count between 0 and max_attempts)
);

create unique index operations_user_idempotency_uq
  on public.operations(user_id, operation_type, idempotency_key)
  where user_id is not null;
create unique index operations_system_idempotency_uq
  on public.operations(operation_type, idempotency_key)
  where user_id is null;

create table public.outbox_events (
  id bigint generated always as identity primary key,
  operation_id uuid not null references public.operations(id) on delete cascade,
  topic text not null,
  payload_json jsonb not null,
  state text not null default 'pending' check (state in ('pending', 'publishing', 'published', 'failed')),
  attempt_count integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  published_at timestamptz,
  sanitized_error_code text,
  created_at timestamptz not null default now(),
  unique (operation_id, topic),
  check (attempt_count >= 0)
);

create table public.model_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null,
  task_type text not null,
  operation_attempt integer not null check (operation_attempt > 0),
  call_index integer not null default 1 check (call_index > 0),
  provider text not null,
  model_name text not null,
  prompt_version text not null,
  prompt_sha256_hex text not null check (prompt_sha256_hex ~ '^[a-f0-9]{64}$'),
  schema_version text not null,
  temperature numeric(4,3) not null check (temperature between 0 and 2),
  max_output_tokens integer not null check (max_output_tokens > 0),
  trace_id text not null,
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  estimated_cost_minor integer check (estimated_cost_minor is null or estimated_cost_minor >= 0),
  status text not null check (status in ('started', 'succeeded', 'failed', 'cancelled')),
  sanitized_error_code text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (id, user_id),
  unique (operation_id, operation_attempt, task_type, call_index),
  foreign key (operation_id, user_id)
    references public.operations(id, user_id) on delete cascade
);

alter table public.document_versions
  add constraint document_versions_generation_run_fk
  foreign key (generation_run_id, user_id)
  references public.model_runs(id, user_id) deferrable initially deferred;

comment on column public.document_versions.content_sha256_hex is
  'SHA-256 of the canonical document envelope, including strategy, blocks, classified claims, and fact/job provenance links; never prose alone.';

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  payload_sha256_hex text not null check (payload_sha256_hex ~ '^[a-f0-9]{64}$'),
  encrypted_payload_bucket text
    check (encrypted_payload_bucket is null or encrypted_payload_bucket = 'billing-webhook-replay'),
  encrypted_payload_object_key text,
  encrypted_payload_expires_at timestamptz,
  signature_verified boolean not null,
  state text not null check (state in ('received', 'processed', 'ignored', 'failed')),
  attempt_count integer not null default 0,
  next_attempt_at timestamptz,
  sanitized_error_code text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_event_id),
  unique (encrypted_payload_object_key),
  check ((encrypted_payload_object_key is null) = (encrypted_payload_bucket is null)
         and (encrypted_payload_object_key is null) = (encrypted_payload_expires_at is null)),
  check (encrypted_payload_expires_at is null or encrypted_payload_expires_at > created_at),
  check (attempt_count >= 0)
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_type text not null check (actor_type in ('user', 'admin', 'service', 'worker')),
  action text not null,
  resource_type text not null,
  resource_id uuid,
  trace_id text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table public.data_exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  state public.data_export_state not null default 'requested',
  format text not null default 'zip' check (format in ('zip', 'json')),
  schema_version text not null,
  requested_scope jsonb not null default '{"scope":"all_account_data"}'::jsonb
    check (requested_scope->>'scope' = 'all_account_data'),
  manifest_json jsonb,
  bucket text not null default 'privacy-exports'
    check (bucket = 'privacy-exports'),
  object_key text,
  byte_size bigint check (byte_size is null or byte_size > 0),
  sha256_hex text check (sha256_hex is null or sha256_hex ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz,
  sanitized_error_code text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, object_key),
  check ((object_key is null) = (byte_size is null)
         and (object_key is null) = (sha256_hex is null)
         and (object_key is null) = (expires_at is null)),
  check (state <> 'succeeded' or object_key is not null),
  check (completed_at is null or completed_at >= created_at),
  check (expires_at is null or (completed_at is not null and expires_at > completed_at))
);

create table public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  subject_hash text not null check (subject_hash ~ '^[a-f0-9]{64}$'),
  state public.deletion_state not null default 'requested',
  identity_reverified_at timestamptz,
  access_revoked_at timestamptz,
  domain_deleted_at timestamptz,
  objects_deleted_at timestamptz,
  processors_notified_at timestamptz,
  backup_expiry_at timestamptz,
  completed_at timestamptz,
  failure_code text,
  status_token_hash text unique
    check (status_token_hash is null or status_token_hash ~ '^[a-f0-9]{64}$'),
  status_key_version text,
  completion_receipt_json jsonb,
  completion_receipt_issued_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status_token_hash is null) = (status_key_version is null)),
  check ((completion_receipt_json is null) = (completion_receipt_issued_at is null)),
  check (completion_receipt_json is null or state = 'completed')
);

create table public.deletion_steps (
  id uuid primary key default gen_random_uuid(),
  deletion_request_id uuid not null references public.deletion_requests(id) on delete cascade,
  system_name text not null,
  state text not null check (state in ('pending', 'running', 'succeeded', 'failed', 'not_applicable')),
  attempt_count integer not null default 0,
  provider_acknowledgement text,
  sanitized_error_code text,
  updated_at timestamptz not null default now(),
  unique (deletion_request_id, system_name)
);

-- ---------------------------------------------------------------------------
-- Support and public content
-- ---------------------------------------------------------------------------

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open', 'waiting_user', 'resolved', 'closed')),
  assigned_admin_id uuid references auth.users(id) on delete set null,
  diagnostic_access_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticket_id uuid not null,
  author_type text not null check (author_type in ('user', 'staff', 'system')),
  author_user_id uuid references auth.users(id) on delete set null,
  body text not null check (char_length(body) between 1 and 10000),
  created_at timestamptz not null default now(),
  foreign key (ticket_id, user_id)
    references public.support_tickets(id, user_id) on delete cascade
);

create table public.support_attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticket_id uuid not null,
  bucket text not null default 'support-attachments',
  object_key text not null,
  original_filename text not null,
  detected_mime text,
  byte_size bigint check (byte_size is null or byte_size between 1 and 10485760),
  sha256_hex text check (sha256_hex is null or sha256_hex ~ '^[a-f0-9]{64}$'),
  scan_state text not null default 'pending' check (scan_state in ('pending', 'clean', 'rejected', 'error')),
  created_at timestamptz not null default now(),
  unique (user_id, object_key),
  foreign key (ticket_id, user_id)
    references public.support_tickets(id, user_id) on delete cascade
);

create table public.diagnostic_access_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticket_id uuid not null,
  granted_to_admin_id uuid not null references auth.users(id) on delete cascade,
  scope_json jsonb not null,
  reason text not null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  foreign key (ticket_id, user_id)
    references public.support_tickets(id, user_id) on delete cascade,
  check (expires_at > granted_at)
);

create table public.content_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  locale text not null,
  title text not null,
  body_markdown text not null,
  status text not null default 'draft' check (status in ('draft', 'review', 'published', 'archived')),
  policy_version text,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (locale, slug)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index source_documents_user_state_idx on public.source_documents(user_id, state);
create index source_chunks_source_order_idx on public.source_chunks(source_document_id, reading_order);
create index career_facts_user_state_type_idx on public.career_facts(user_id, state, fact_type);
create index career_facts_subject_idx on public.career_facts(user_id, subject_ref);
create unique index career_facts_one_current_revision_uq
  on public.career_facts(user_id, lineage_id)
  where state not in ('rejected', 'archived');
create index fact_evidence_fact_idx on public.fact_evidence(fact_id);
create index jobs_user_created_idx on public.jobs(user_id, created_at desc);
create index job_requirements_job_kind_idx on public.job_requirements(job_id, kind);
create index analyses_job_created_idx on public.analyses(job_id, created_at desc);
create index analysis_requirements_analysis_idx on public.analysis_requirements(analysis_id, ordinal);
create index analysis_requirement_atoms_requirement_idx on public.analysis_requirement_atoms(analysis_requirement_id, ordinal);
create index requirement_assessments_analysis_idx on public.requirement_assessments(analysis_id, analysis_requirement_id);
create index assessment_facts_fact_idx on public.assessment_facts(fact_id);
create index atom_assessments_assessment_idx on public.requirement_atom_assessments(assessment_id, atom_id);
create index atom_assessment_facts_fact_idx on public.atom_assessment_facts(fact_id);
create index documents_user_job_idx on public.documents(user_id, job_id);
create index document_versions_document_idx on public.document_versions(document_id, version_number desc);
create index document_claims_version_state_idx on public.document_claims(document_version_id, state);
create index claim_requirements_requirement_idx on public.claim_requirements(analysis_requirement_id);
create index claim_job_sources_job_idx on public.claim_job_sources(job_id);
create index renders_version_idx on public.render_assets(document_version_id, format, created_at desc);
create index applications_user_state_idx on public.applications(user_id, state, updated_at desc);
create index operations_ready_idx on public.operations(state, run_after)
  where state in ('queued', 'failed_retryable');
create index operations_lease_idx on public.operations(lease_expires_at)
  where state = 'running';
create index outbox_ready_idx on public.outbox_events(state, next_attempt_at)
  where state in ('pending', 'failed');
create index model_runs_operation_idx on public.model_runs(operation_id, started_at);
create index audit_events_resource_idx on public.audit_events(resource_type, resource_id, occurred_at desc);
create index data_exports_user_created_idx on public.data_exports(user_id, created_at desc);
create index data_exports_active_idx on public.data_exports(state, created_at)
  where state in ('requested', 'queued', 'running');
create index deletion_requests_state_idx on public.deletion_requests(state, updated_at);
create index support_messages_ticket_idx on public.support_messages(ticket_id, created_at);
create index support_attachments_ticket_idx on public.support_attachments(ticket_id, created_at);
create index diagnostic_access_active_idx on public.diagnostic_access_grants(granted_to_admin_id, expires_at)
  where revoked_at is null;

-- ---------------------------------------------------------------------------
-- Trusted queue and entitlement functions. Only service_role can execute these;
-- the BFF still authenticates the caller and verifies resource ownership first.
-- ---------------------------------------------------------------------------

create or replace function private.claim_operations(
  p_worker_id text,
  p_limit integer default 10,
  p_lease_seconds integer default 60
)
returns setof public.operations
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_worker_id is null or char_length(p_worker_id) = 0 then
    raise exception 'worker id is required';
  end if;

  -- An expired final attempt is terminal, not permanently stuck as running.
  update public.operations
  set state = 'failed_terminal',
      sanitized_error_code = coalesce(sanitized_error_code, 'lease_expired'),
      dead_lettered_at = now(),
      completed_at = now(),
      lease_owner = null,
      lease_expires_at = null,
      updated_at = now()
  where state = 'running'
    and lease_expires_at < now()
    and attempt_count >= max_attempts;

  return query
  with candidates as (
    select o.id
    from public.operations o
    where (
        (o.state in ('queued', 'failed_retryable') and o.run_after <= now())
        or (o.state = 'running' and o.lease_expires_at < now())
      )
      and o.attempt_count < o.max_attempts
    order by o.run_after, o.created_at
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 10), 100))
  )
  update public.operations o
  set state = 'running',
      attempt_count = o.attempt_count + 1,
      lease_owner = p_worker_id,
      lease_expires_at = now() + make_interval(secs => greatest(15, least(coalesce(p_lease_seconds, 60), 900))),
      heartbeat_at = now(),
      started_at = coalesce(o.started_at, now()),
      sanitized_error_code = null,
      sanitized_error_detail = null,
      updated_at = now()
  from candidates c
  where o.id = c.id
  returning o.*;
end;
$$;

create or replace function private.heartbeat_operation(
  p_operation_id uuid,
  p_worker_id text,
  p_lease_seconds integer default 60
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected integer;
begin
  update public.operations
  set heartbeat_at = now(),
      lease_expires_at = now() + make_interval(secs => greatest(15, least(coalesce(p_lease_seconds, 60), 900))),
      updated_at = now()
  where id = p_operation_id
    and state = 'running'
    and lease_owner = p_worker_id;
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

create or replace function private.finish_operation(
  p_operation_id uuid,
  p_worker_id text,
  p_state public.operation_state,
  p_result_ref_json jsonb default null,
  p_error_code text default null,
  p_error_detail jsonb default null,
  p_retry_after_seconds integer default 5
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected integer;
begin
  if p_state is null or p_state not in ('needs_input', 'succeeded', 'failed_retryable',
                     'failed_terminal', 'cancelled') then
    raise exception 'invalid worker completion state';
  end if;

  update public.operations o
  set state = case
        when p_state = 'failed_retryable' and o.attempt_count >= o.max_attempts
          then 'failed_terminal'::public.operation_state
        else p_state
      end,
      result_ref_json = p_result_ref_json,
      sanitized_error_code = p_error_code,
      sanitized_error_detail = p_error_detail,
      run_after = case
        when p_state = 'failed_retryable' and o.attempt_count < o.max_attempts
          then now() + make_interval(secs => greatest(1, least(coalesce(p_retry_after_seconds, 5), 3600)))
        else o.run_after
      end,
      completed_at = case
        when p_state in ('succeeded', 'failed_terminal', 'cancelled')
          or (p_state = 'failed_retryable' and o.attempt_count >= o.max_attempts)
          then now()
        else null
      end,
      dead_lettered_at = case
        when p_state = 'failed_terminal'
          or (p_state = 'failed_retryable' and o.attempt_count >= o.max_attempts)
          then now()
        else o.dead_lettered_at
      end,
      lease_owner = null,
      lease_expires_at = null,
      heartbeat_at = now(),
      updated_at = now()
  where o.id = p_operation_id
    and o.state = 'running'
    and o.lease_owner = p_worker_id;
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

create or replace function private.reserve_usage(
  p_user_id uuid,
  p_event_type text,
  p_idempotency_key text,
  p_resource_id uuid,
  p_units integer default 1
)
returns public.usage_events
language plpgsql
security definer
set search_path = ''
as $$
declare
  limit_key text;
  allowed_units integer;
  used_units bigint;
  existing public.usage_events%rowtype;
  reservation public.usage_events%rowtype;
begin
  if p_user_id is null then
    raise exception 'user id is required';
  end if;
  if p_idempotency_key is null or char_length(p_idempotency_key) < 16 then
    raise exception 'idempotency key must contain at least 16 characters';
  end if;
  if p_units is null or p_units <= 0 then
    raise exception 'usage units must be positive';
  end if;

  limit_key := case p_event_type
    when 'analysis' then 'analyses_per_24h'
    when 'generation' then 'generations_per_24h'
    when 'render' then 'renders_per_24h'
    when 'ocr' then 'ocr_pages_per_24h'
    else null
  end;
  if limit_key is null then
    raise exception 'unknown usage event type';
  end if;

  -- Serializes quota decisions for this user and meter while preserving
  -- concurrency across different users/meters.
  perform pg_advisory_xact_lock(
    hashtextextended(p_user_id::text || ':' || p_event_type, 0)
  );

  select * into existing
  from public.usage_events
  where user_id = p_user_id
    and event_type = p_event_type
    and idempotency_key = p_idempotency_key;
  if found then
    if existing.units <> p_units
       or existing.resource_id is distinct from p_resource_id then
      raise exception 'idempotency key reused with different usage request';
    end if;
    return existing;
  end if;

  select (pc.limits_json ->> limit_key)::integer
  into allowed_units
  from public.customer_subscriptions cs
  join public.plan_catalog pc on pc.catalog_id = cs.catalog_id
  where cs.user_id = p_user_id
    and cs.state in ('trialing', 'active')
    and (cs.current_period_end is null or cs.current_period_end > now())
    and pc.active = true;

  if allowed_units is null then
    raise exception 'no active entitlement for usage meter %', limit_key;
  end if;
  if allowed_units < -1 then
    raise exception 'invalid plan-catalogue limit for meter %', limit_key;
  end if;

  select coalesce(sum(units), 0) into used_units
  from public.usage_events
  where user_id = p_user_id
    and event_type = p_event_type
    and state in ('reserved', 'consumed')
    and occurred_at >= now() - interval '24 hours';

  -- -1 is the explicit unlimited value in the versioned plan catalogue.
  if allowed_units <> -1 and used_units + p_units > allowed_units then
    raise exception 'usage limit exceeded for meter %', limit_key;
  end if;

  insert into public.usage_events (
    user_id, event_type, idempotency_key, resource_id, units, state
  ) values (
    p_user_id, p_event_type, p_idempotency_key, p_resource_id, p_units, 'reserved'
  )
  returning * into reservation;
  return reservation;
end;
$$;

create or replace function private.settle_usage(
  p_user_id uuid,
  p_event_type text,
  p_idempotency_key text,
  p_consume boolean
)
returns public.usage_events
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_row public.usage_events%rowtype;
  target_state text := case when p_consume then 'consumed' else 'released' end;
begin
  select * into event_row
  from public.usage_events
  where user_id = p_user_id
    and event_type = p_event_type
    and idempotency_key = p_idempotency_key
  for update;
  if not found then
    raise exception 'usage reservation not found';
  end if;

  if event_row.state = target_state then
    return event_row;
  end if;
  if event_row.state <> 'reserved' then
    raise exception 'usage reservation already settled as %', event_row.state;
  end if;

  update public.usage_events
  set state = target_state
  where id = event_row.id
  returning * into event_row;
  return event_row;
end;
$$;

create or replace function private.get_deletion_status_by_token_hash(
  p_status_token_hash text
)
returns table (
  id uuid,
  state public.deletion_state,
  access_revoked_at timestamptz,
  backup_expiry_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz,
  completion_receipt_json jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select d.id, d.state, d.access_revoked_at, d.backup_expiry_at,
         d.completed_at, d.created_at, d.completion_receipt_json
  from public.deletion_requests d
  where p_status_token_hash ~ '^[a-f0-9]{64}$'
    and d.status_token_hash = p_status_token_hash
  limit 1;
$$;

revoke all on function private.claim_operations(text, integer, integer) from public, authenticated;
revoke all on function private.heartbeat_operation(uuid, text, integer) from public, authenticated;
revoke all on function private.finish_operation(uuid, text, public.operation_state, jsonb, text, jsonb, integer) from public, authenticated;
revoke all on function private.reserve_usage(uuid, text, text, uuid, integer) from public, authenticated;
revoke all on function private.settle_usage(uuid, text, text, boolean) from public, authenticated;
revoke all on function private.get_deletion_status_by_token_hash(text) from public, authenticated;
grant execute on function private.claim_operations(text, integer, integer) to service_role;
grant execute on function private.heartbeat_operation(uuid, text, integer) to service_role;
grant execute on function private.finish_operation(uuid, text, public.operation_state, jsonb, text, jsonb, integer) to service_role;
grant execute on function private.reserve_usage(uuid, text, text, uuid, integer) to service_role;
grant execute on function private.settle_usage(uuid, text, text, boolean) to service_role;
grant execute on function private.get_deletion_status_by_token_hash(text) to service_role;

-- ---------------------------------------------------------------------------
-- Integrity and immutability guards
-- ---------------------------------------------------------------------------

create or replace function private.analysis_children_sha256(p_analysis_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select pg_catalog.encode(
    extensions.digest(
      pg_catalog.convert_to(
        pg_catalog.jsonb_build_object(
          'requirements', coalesce((
            select pg_catalog.jsonb_agg(
              pg_catalog.to_jsonb(r) - 'user_id' - 'created_at'
              order by r.ordinal, r.id)
            from public.analysis_requirements r
            where r.analysis_id = p_analysis_id
          ), '[]'::jsonb),
          'atoms', coalesce((
            select pg_catalog.jsonb_agg(
              pg_catalog.to_jsonb(a) - 'user_id' - 'created_at'
              order by a.analysis_requirement_id, a.ordinal, a.id)
            from public.analysis_requirement_atoms a
            where a.analysis_id = p_analysis_id
          ), '[]'::jsonb),
          'assessments', coalesce((
            select pg_catalog.jsonb_agg(
              pg_catalog.to_jsonb(a) - 'user_id' - 'created_at'
              order by a.analysis_requirement_id, a.id)
            from public.requirement_assessments a
            where a.analysis_id = p_analysis_id
          ), '[]'::jsonb),
          'assessment_facts', coalesce((
            select pg_catalog.jsonb_agg(
              pg_catalog.to_jsonb(af) - 'user_id' - 'created_at'
              order by af.assessment_id, af.fact_id)
            from public.assessment_facts af
            join public.requirement_assessments a
              on a.id = af.assessment_id and a.user_id = af.user_id
            where a.analysis_id = p_analysis_id
          ), '[]'::jsonb),
          'atom_assessments', coalesce((
            select pg_catalog.jsonb_agg(
              pg_catalog.to_jsonb(aa) - 'user_id' - 'created_at'
              order by aa.analysis_requirement_id, aa.atom_id, aa.id)
            from public.requirement_atom_assessments aa
            join public.requirement_assessments a
              on a.id = aa.assessment_id and a.user_id = aa.user_id
            where a.analysis_id = p_analysis_id
          ), '[]'::jsonb),
          'atom_assessment_facts', coalesce((
            select pg_catalog.jsonb_agg(
              pg_catalog.to_jsonb(aaf) - 'user_id' - 'created_at'
              order by aaf.atom_assessment_id, aaf.fact_id)
            from public.atom_assessment_facts aaf
            join public.requirement_atom_assessments aa
              on aa.id = aaf.atom_assessment_id and aa.user_id = aaf.user_id
            join public.requirement_assessments a
              on a.id = aa.assessment_id and a.user_id = aa.user_id
            where a.analysis_id = p_analysis_id
          ), '[]'::jsonb)
        )::text,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );
$$;

create or replace function private.protect_analysis_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  computed_hash text;
begin
  if old.state = 'building' and new.state = 'sealed' then
    if row(new.user_id, new.job_id, new.requirement_snapshot, new.fact_snapshot,
           new.requirement_snapshot_hash, new.fact_snapshot_hash,
           new.score_version, new.score_json, new.created_at)
       is distinct from
       row(old.user_id, old.job_id, old.requirement_snapshot, old.fact_snapshot,
           old.requirement_snapshot_hash, old.fact_snapshot_hash,
           old.score_version, old.score_json, old.created_at) then
      raise exception 'analysis core cannot change while sealing';
    end if;
    if not exists (
      select 1 from public.analysis_requirements r where r.analysis_id = old.id
    ) then
      raise exception 'sealed analysis requires at least one normalized requirement';
    end if;
    if exists (
      select 1
      from public.analysis_requirements r
      where r.analysis_id = old.id
        and not exists (
          select 1 from public.requirement_assessments a
          where a.analysis_requirement_id = r.id and a.analysis_id = old.id
        )
    ) then
      raise exception 'every normalized requirement requires one assessment';
    end if;
    if exists (
      select 1
      from public.analysis_requirement_atoms atom
      where atom.analysis_id = old.id
        and not exists (
          select 1 from public.requirement_atom_assessments aa
          where aa.atom_id = atom.id
        )
    ) then
      raise exception 'every normalized atom requires one typed assessment';
    end if;
    if exists (
      select 1
      from public.assessment_facts af
      join public.requirement_assessments a
        on a.id = af.assessment_id and a.user_id = af.user_id
      join public.career_facts f
        on f.id = af.fact_id and f.user_id = af.user_id
      where a.analysis_id = old.id
        and (f.state not in ('user_confirmed', 'user_corrected')
             or f.sensitivity = 'special_category'
             or not ('matching' = any(f.permitted_purposes)))
    ) or exists (
      select 1
      from public.atom_assessment_facts aaf
      join public.requirement_atom_assessments aa
        on aa.id = aaf.atom_assessment_id and aa.user_id = aaf.user_id
      join public.requirement_assessments a
        on a.id = aa.assessment_id and a.user_id = aa.user_id
      join public.career_facts f
        on f.id = aaf.fact_id and f.user_id = aaf.user_id
      where a.analysis_id = old.id
        and (f.state not in ('user_confirmed', 'user_corrected')
             or f.sensitivity = 'special_category'
             or not ('matching' = any(f.permitted_purposes)))
    ) then
      raise exception 'analysis evidence may reference only confirmed matching-eligible facts';
    end if;
    computed_hash := private.analysis_children_sha256(old.id);
    if new.normalized_children_sha256_hex is not null
       and new.normalized_children_sha256_hex <> computed_hash then
      raise exception 'analysis normalized-child hash mismatch';
    end if;
    new.normalized_children_sha256_hex := computed_hash;
    new.sealed_at := now();
    return new;
  end if;
  raise exception 'analysis is immutable except for building -> sealed';
end;
$$;

create or replace function private.require_analysis_building()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_analysis_id uuid;
  target_state text;
begin
  if tg_op = 'DELETE' and pg_catalog.pg_trigger_depth() > 1 then
    return old;
  end if;

  case tg_table_name
    when 'analysis_requirements', 'analysis_requirement_atoms', 'requirement_assessments' then
      target_analysis_id := case when tg_op = 'DELETE' then old.analysis_id else new.analysis_id end;
    when 'assessment_facts' then
      select a.analysis_id into target_analysis_id
      from public.requirement_assessments a
      where a.id = case when tg_op = 'DELETE' then old.assessment_id else new.assessment_id end;
    when 'requirement_atom_assessments' then
      select a.analysis_id into target_analysis_id
      from public.requirement_assessments a
      where a.id = case when tg_op = 'DELETE' then old.assessment_id else new.assessment_id end;
    when 'atom_assessment_facts' then
      select a.analysis_id into target_analysis_id
      from public.requirement_atom_assessments aa
      join public.requirement_assessments a
        on a.id = aa.assessment_id and a.user_id = aa.user_id
      where aa.id = case when tg_op = 'DELETE' then old.atom_assessment_id else new.atom_assessment_id end;
    else
      raise exception 'unsupported analysis child table %', tg_table_name;
  end case;

  select state into target_state from public.analyses where id = target_analysis_id;
  if target_state is distinct from 'building' then
    raise exception 'analysis children may change only while the parent is building';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function private.validate_fact_evidence_span()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  chunk_length integer;
begin
  select char_length(content) into chunk_length
  from public.source_chunks
  where id = new.source_chunk_id and user_id = new.user_id;
  if chunk_length is not null and new.end_offset > chunk_length then
    raise exception 'fact evidence span exceeds source chunk';
  end if;
  return new;
end;
$$;

create or replace function private.validate_requirement_span()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  source_length integer;
begin
  select char_length(source_text) into source_length
  from public.jobs
  where id = new.job_id and user_id = new.user_id;
  if source_length is not null and new.source_end > source_length then
    raise exception 'requirement span exceeds immutable job snapshot';
  end if;
  return new;
end;
$$;

create or replace function private.validate_job_source_document()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  source_kind public.source_kind;
  source_state public.processing_state;
begin
  if new.source_document_id is null then
    return new;
  end if;
  select kind, state into source_kind, source_state
  from public.source_documents
  where id = new.source_document_id and user_id = new.user_id;
  if source_kind <> 'job_ad' or source_state <> 'succeeded' then
    raise exception 'job source document must be a successfully extracted job advert';
  end if;
  return new;
end;
$$;

create or replace function private.protect_job_snapshot()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if row(new.user_id, new.source_document_id, new.title, new.company,
         new.location, new.source_url, new.source_text,
         new.source_sha256_hex, new.language_code, new.imported_at)
     is distinct from
     row(old.user_id, old.source_document_id, old.title, old.company,
         old.location, old.source_url, old.source_text,
         old.source_sha256_hex, old.language_code, old.imported_at) then
    raise exception 'job source snapshot is immutable; create a new job workspace';
  end if;
  return new;
end;
$$;

create or replace function private.validate_analysis_requirement_snapshot()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  current_requirement public.job_requirements%rowtype;
begin
  select * into current_requirement
  from public.job_requirements
  where id = new.source_requirement_id
    and job_id = new.job_id
    and user_id = new.user_id
  for share;

  if found and row(new.kind, new.canonical_text, new.source_text,
                   new.source_start, new.source_end, new.explicit_weight,
                   new.alternatives, new.constraints_json)
      is distinct from
      row(current_requirement.kind, current_requirement.canonical_text,
          current_requirement.source_text, current_requirement.source_start,
          current_requirement.source_end, current_requirement.explicit_weight,
          current_requirement.alternatives, current_requirement.constraints_json) then
    raise exception 'analysis requirement does not match reviewed requirement snapshot';
  end if;
  return new;
end;
$$;

create or replace function private.validate_subscription_customer()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  customer_provider text;
  customer_provider_id text;
begin
  select provider, provider_customer_id
  into customer_provider, customer_provider_id
  from public.billing_customers
  where id = new.billing_customer_id and user_id = new.user_id;
  if customer_provider is not null
     and (new.provider <> customer_provider
          or new.provider_customer_id is distinct from customer_provider_id) then
    raise exception 'subscription provider/customer must match billing customer';
  end if;
  return new;
end;
$$;

create or replace function private.validate_fact_revision()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  prior public.career_facts%rowtype;
begin
  if new.supersedes_fact_id is null then
    if new.revision_number <> 1 then
      raise exception 'initial fact revision must be 1';
    end if;
  else
    select * into prior
    from public.career_facts
    where id = new.supersedes_fact_id and user_id = new.user_id;
    if not found then
      raise exception 'superseded fact not found for owner';
    end if;
    if new.lineage_id <> prior.lineage_id
       or new.revision_number <> prior.revision_number + 1 then
      raise exception 'invalid fact revision lineage or number';
    end if;
  end if;
  return new;
end;
$$;

create or replace function private.prevent_fact_in_place_correction()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if row(new.user_id, new.lineage_id, new.revision_number,
         new.supersedes_fact_id, new.fact_type, new.subject_ref,
         new.canonical_key, new.value_json, new.normalized_text,
         new.starts_on, new.ends_on)
     is distinct from
     row(old.user_id, old.lineage_id, old.revision_number,
         old.supersedes_fact_id, old.fact_type, old.subject_ref,
         old.canonical_key, old.value_json, old.normalized_text,
         old.starts_on, old.ends_on) then
    raise exception 'fact corrections create a new revision';
  end if;
  return new;
end;
$$;

create or replace function private.protect_document_version_core()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if row(new.user_id, new.document_id, new.parent_version_id,
         new.version_number, new.strategy_json, new.content_json,
         new.content_sha256_hex, new.generation_run_id,
         new.prompt_version, new.model_version, new.created_by, new.created_at)
     is distinct from
     row(old.user_id, old.document_id, old.parent_version_id,
         old.version_number, old.strategy_json, old.content_json,
         old.content_sha256_hex, old.generation_run_id,
         old.prompt_version, old.model_version, old.created_by, old.created_at) then
    raise exception 'document version content is immutable; create a new version';
  end if;
  if old.state = 'valid' and new.state = 'needs_review' then
    if new.approved_by_user_at is not null or new.approved_content_sha256_hex is not null then
      raise exception 'invalidating a version must clear its exact-hash approval';
    end if;
  elsif old.state in ('valid', 'superseded')
        and row(new.validator_version, new.claim_integrity_json,
                new.communication_score_json, new.approved_by_user_at,
                new.approved_content_sha256_hex)
            is distinct from
            row(old.validator_version, old.claim_integrity_json,
                old.communication_score_json, old.approved_by_user_at,
                old.approved_content_sha256_hex) then
    raise exception 'final validation summaries and approval are immutable';
  end if;
  return new;
end;
$$;

create or replace function private.validate_document_version_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.state = 'valid' then
    if new.approved_by_user_at is null
       or new.approved_content_sha256_hex is distinct from new.content_sha256_hex then
      raise exception 'valid version requires approval of the exact content hash';
    end if;
    if not exists (
      select 1 from public.document_claims c
      where c.document_version_id = new.id and c.user_id = new.user_id
    ) then
      raise exception 'valid version requires classified claims';
    end if;
    if exists (
      select 1 from public.document_claims c
      where c.document_version_id = new.id and c.user_id = new.user_id
        and c.state <> 'supported'
    ) then
      raise exception 'valid version cannot contain unconfirmed, unsupported, or overridden claims';
    end if;
    if exists (
      select 1
      from public.document_claims c
      where c.document_version_id = new.id
        and c.user_id = new.user_id
        and c.claim_kind in ('factual', 'mixed')
        and not exists (
          select 1
          from public.claim_facts cf
          join public.career_facts f
            on f.id = cf.fact_id and f.user_id = cf.user_id
          where cf.claim_id = c.id
            and cf.user_id = c.user_id
            and cf.relationship in ('entails', 'supports')
            and f.state in ('user_confirmed', 'user_corrected')
            and f.sensitivity <> 'special_category'
            and 'render' = any(f.permitted_purposes)
        )
    ) then
      raise exception 'each factual claim requires an eligible confirmed fact';
    end if;
    if exists (
      select 1
      from public.document_claims c
      where c.document_version_id = new.id
        and c.user_id = new.user_id
        and c.claim_kind in ('job_context', 'mixed')
        and not exists (
          select 1 from public.claim_job_sources js
          where js.claim_id = c.id and js.user_id = c.user_id
            and js.relationship in ('entails', 'supports')
        )
    ) then
      raise exception 'each job-context claim requires an exact job source span';
    end if;
    if exists (
      select 1
      from public.document_claims c
      where c.document_version_id = new.id
        and c.user_id = new.user_id
        and (
          (c.claim_kind = 'factual' and exists (
            select 1 from public.claim_job_sources js
            where js.claim_id = c.id and js.user_id = c.user_id
          ))
          or (c.claim_kind = 'job_context' and exists (
            select 1 from public.claim_facts cf
            where cf.claim_id = c.id and cf.user_id = c.user_id
          ))
          or (c.claim_kind = 'non_factual' and (
            exists (select 1 from public.claim_facts cf
                    where cf.claim_id = c.id and cf.user_id = c.user_id)
            or exists (select 1 from public.claim_job_sources js
                       where js.claim_id = c.id and js.user_id = c.user_id)
          ))
        )
    ) then
      raise exception 'claim provenance links do not match claim kind';
    end if;
    if exists (
      select 1
      from public.document_claims c
      join public.claim_facts cf
        on cf.claim_id = c.id and cf.user_id = c.user_id
      join public.career_facts f
        on f.id = cf.fact_id and f.user_id = cf.user_id
      where c.document_version_id = new.id
        and c.user_id = new.user_id
        and (f.state not in ('user_confirmed', 'user_corrected')
             or f.sensitivity = 'special_category'
             or not ('render' = any(f.permitted_purposes)))
    ) then
      raise exception 'final claim links may reference only confirmed render-eligible facts';
    end if;
  end if;
  if new.state = old.state then
    return new;
  end if;
  if not (
    (old.state = 'draft' and new.state in ('validating', 'superseded'))
    or (old.state = 'validating' and new.state in ('needs_review', 'valid', 'superseded'))
    or (old.state = 'needs_review' and new.state in ('validating', 'valid', 'superseded'))
    or (old.state = 'valid' and new.state in ('needs_review', 'superseded'))
  ) then
    raise exception 'invalid document version transition: % -> %', old.state, new.state;
  end if;
  return new;
end;
$$;

create or replace function private.protect_document_block()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  old_version_state public.document_version_state;
  new_version_state public.document_version_state;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    select state into old_version_state
    from public.document_versions where id = old.document_version_id;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    select state into new_version_state
    from public.document_versions where id = new.document_version_id;
  end if;
  if old_version_state <> 'draft' or new_version_state <> 'draft' then
    raise exception 'blocks are frozen after draft';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function private.protect_document_claim()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  old_version_state public.document_version_state;
  new_version_state public.document_version_state;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    select state into old_version_state
    from public.document_versions where id = old.document_version_id;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    select state into new_version_state
    from public.document_versions where id = new.document_version_id;
  end if;
  if tg_op = 'INSERT' and new_version_state <> 'draft' then
    raise exception 'claims are frozen after draft';
  end if;
  if tg_op = 'DELETE' and old_version_state <> 'draft' then
    raise exception 'claims are frozen after draft';
  end if;
  if tg_op = 'UPDATE'
     and (old_version_state <> 'draft' or new_version_state <> 'draft')
     and row(new.user_id, new.document_version_id, new.document_block_id,
             new.claim_text, new.claim_kind, new.start_offset, new.end_offset, new.created_at)
         is distinct from
         row(old.user_id, old.document_version_id, old.document_block_id,
             old.claim_text, old.claim_kind, old.start_offset, old.end_offset, old.created_at) then
    raise exception 'claim text/provenance is immutable after draft';
  end if;
  if tg_op = 'UPDATE'
     and (old_version_state in ('valid', 'superseded')
          or new_version_state in ('valid', 'superseded'))
     and row(new.state, new.validation_codes, new.validator_version)
         is distinct from
         row(old.state, old.validation_codes, old.validator_version) then
    raise exception 'claim validation is frozen after final approval';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function private.protect_claim_link()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  old_version_state public.document_version_state;
  new_version_state public.document_version_state;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    select v.state into old_version_state
    from public.document_claims c
    join public.document_versions v on v.id = c.document_version_id
    where c.id = old.claim_id;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    select v.state into new_version_state
    from public.document_claims c
    join public.document_versions v on v.id = c.document_version_id
    where c.id = new.claim_id;
  end if;
  if old_version_state <> 'draft' or new_version_state <> 'draft' then
    raise exception 'claim provenance is frozen after draft';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function private.validate_claim_requirement_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  document_analysis_id uuid;
  requirement_analysis_id uuid;
begin
  select d.analysis_id into document_analysis_id
  from public.document_claims c
  join public.document_versions v on v.id = c.document_version_id
  join public.documents d on d.id = v.document_id
  where c.id = new.claim_id and c.user_id = new.user_id;

  select ar.analysis_id into requirement_analysis_id
  from public.analysis_requirements ar
  where ar.id = new.analysis_requirement_id and ar.user_id = new.user_id;

  if document_analysis_id is null or document_analysis_id <> requirement_analysis_id then
    raise exception 'claim requirement must belong to the document analysis';
  end if;
  return new;
end;
$$;

create or replace function private.validate_claim_job_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  document_job_id uuid;
  job_text_length integer;
begin
  select d.job_id, char_length(j.source_text)
  into document_job_id, job_text_length
  from public.document_claims c
  join public.document_versions v on v.id = c.document_version_id
  join public.documents d on d.id = v.document_id
  join public.jobs j on j.id = d.job_id and j.user_id = d.user_id
  where c.id = new.claim_id and c.user_id = new.user_id;

  if document_job_id is null or document_job_id <> new.job_id then
    raise exception 'claim job source must belong to the document job';
  end if;
  if new.source_end > job_text_length then
    raise exception 'claim job source span exceeds the immutable job snapshot';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'source_documents', 'career_facts', 'fact_conflicts', 'jobs',
    'job_requirements', 'clarifications', 'documents', 'render_assets',
    'applications', 'user_preferences', 'customer_subscriptions',
    'operations', 'data_exports', 'deletion_requests', 'support_tickets',
    'content_pages'
  ]
  loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function private.set_updated_at()',
      table_name || '_set_updated_at', table_name
    );
  end loop;
end;
$$;

create trigger analyses_transition_guard
before update on public.analyses
for each row execute function private.protect_analysis_transition();

create trigger analysis_requirements_build_guard
before insert or delete on public.analysis_requirements
for each row execute function private.require_analysis_building();

create trigger analysis_requirements_immutable_update
before update on public.analysis_requirements
for each row execute function private.prevent_immutable_update();

create trigger analysis_requirement_atoms_build_guard
before insert or delete on public.analysis_requirement_atoms
for each row execute function private.require_analysis_building();

create trigger analysis_requirement_atoms_immutable_update
before update on public.analysis_requirement_atoms
for each row execute function private.prevent_immutable_update();

create trigger requirement_assessments_immutable_update
before update on public.requirement_assessments
for each row execute function private.prevent_immutable_update();

create trigger requirement_assessments_build_guard
before insert or delete on public.requirement_assessments
for each row execute function private.require_analysis_building();

create trigger assessment_facts_immutable_update
before update on public.assessment_facts
for each row execute function private.prevent_immutable_update();

create trigger assessment_facts_build_guard
before insert or delete on public.assessment_facts
for each row execute function private.require_analysis_building();

create trigger requirement_atom_assessments_immutable_update
before update on public.requirement_atom_assessments
for each row execute function private.prevent_immutable_update();

create trigger requirement_atom_assessments_build_guard
before insert or delete on public.requirement_atom_assessments
for each row execute function private.require_analysis_building();

create trigger atom_assessment_facts_immutable_update
before update on public.atom_assessment_facts
for each row execute function private.prevent_immutable_update();

create trigger atom_assessment_facts_build_guard
before insert or delete on public.atom_assessment_facts
for each row execute function private.require_analysis_building();

create trigger career_facts_validate_revision
before insert on public.career_facts
for each row execute function private.validate_fact_revision();

create trigger career_facts_prevent_in_place_correction
before update on public.career_facts
for each row execute function private.prevent_fact_in_place_correction();

create trigger fact_evidence_validate_span
before insert or update on public.fact_evidence
for each row execute function private.validate_fact_evidence_span();

create trigger job_requirements_validate_span
before insert or update on public.job_requirements
for each row execute function private.validate_requirement_span();

create trigger jobs_validate_source_document
before insert on public.jobs
for each row execute function private.validate_job_source_document();

create trigger jobs_protect_snapshot
before update on public.jobs
for each row execute function private.protect_job_snapshot();

create trigger analysis_requirements_validate_snapshot
before insert on public.analysis_requirements
for each row execute function private.validate_analysis_requirement_snapshot();

create trigger customer_subscriptions_validate_customer
before insert or update on public.customer_subscriptions
for each row execute function private.validate_subscription_customer();

create trigger document_versions_protect_core
before update on public.document_versions
for each row execute function private.protect_document_version_core();

create trigger document_versions_validate_transition
before update on public.document_versions
for each row execute function private.validate_document_version_transition();

create trigger document_blocks_protect
before insert or update or delete on public.document_blocks
for each row execute function private.protect_document_block();

create trigger document_claims_protect
before insert or update or delete on public.document_claims
for each row execute function private.protect_document_claim();

create trigger claim_facts_protect
before insert or update or delete on public.claim_facts
for each row execute function private.protect_claim_link();

create trigger claim_requirements_protect
before insert or update or delete on public.claim_requirements
for each row execute function private.protect_claim_link();

create trigger claim_job_sources_protect
before insert or update or delete on public.claim_job_sources
for each row execute function private.protect_claim_link();

create trigger claim_requirements_validate_scope
before insert or update on public.claim_requirements
for each row execute function private.validate_claim_requirement_scope();

create trigger claim_job_sources_validate_scope
before insert or update on public.claim_job_sources
for each row execute function private.validate_claim_job_scope();

-- ---------------------------------------------------------------------------
-- RLS: owner isolation; privileged writes go through trusted server functions.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.consent_receipts enable row level security;
alter table public.admin_memberships enable row level security;
alter table public.source_documents enable row level security;
alter table public.source_chunks enable row level security;
alter table public.career_facts enable row level security;
alter table public.fact_evidence enable row level security;
alter table public.fact_conflicts enable row level security;
alter table public.jobs enable row level security;
alter table public.job_requirements enable row level security;
alter table public.analyses enable row level security;
alter table public.analysis_requirements enable row level security;
alter table public.analysis_requirement_atoms enable row level security;
alter table public.requirement_assessments enable row level security;
alter table public.assessment_facts enable row level security;
alter table public.requirement_atom_assessments enable row level security;
alter table public.atom_assessment_facts enable row level security;
alter table public.clarifications enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.document_blocks enable row level security;
alter table public.document_claims enable row level security;
alter table public.claim_facts enable row level security;
alter table public.claim_requirements enable row level security;
alter table public.claim_job_sources enable row level security;
alter table public.render_assets enable row level security;
alter table public.applications enable row level security;
alter table public.application_outcomes enable row level security;
alter table public.user_preferences enable row level security;
alter table public.edit_events enable row level security;
alter table public.plan_catalog enable row level security;
alter table public.billing_customers enable row level security;
alter table public.customer_subscriptions enable row level security;
alter table public.subscription_history enable row level security;
alter table public.usage_events enable row level security;
alter table public.operations enable row level security;
alter table public.outbox_events enable row level security;
alter table public.model_runs enable row level security;
alter table public.webhook_events enable row level security;
alter table public.audit_events enable row level security;
alter table public.data_exports enable row level security;
alter table public.deletion_requests enable row level security;
alter table public.deletion_steps enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.support_attachments enable row level security;
alter table public.diagnostic_access_grants enable row level security;
alter table public.content_pages enable row level security;

create policy profiles_owner_select on public.profiles
for select to authenticated using (user_id = auth.uid());
create policy profiles_owner_update on public.profiles
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy consent_owner_select on public.consent_receipts
for select to authenticated using (user_id = auth.uid());

create policy memberships_self_select on public.admin_memberships
for select to authenticated using (user_id = auth.uid());

-- Domain content is owner-readable. Mutations go through the authenticated BFF/
-- Edge Functions so transition rules, idempotency, audit, and related objects can
-- be updated transactionally. The trusted service role still verifies ownership.
create policy source_documents_owner_select on public.source_documents
for select to authenticated using (user_id = auth.uid());
create policy source_chunks_owner_select on public.source_chunks
for select to authenticated using (user_id = auth.uid());
create policy career_facts_owner_select on public.career_facts
for select to authenticated using (user_id = auth.uid());
create policy fact_evidence_owner_select on public.fact_evidence
for select to authenticated using (user_id = auth.uid());
create policy fact_conflicts_owner_select on public.fact_conflicts
for select to authenticated using (user_id = auth.uid());
create policy jobs_owner_select on public.jobs
for select to authenticated using (user_id = auth.uid());
create policy requirements_owner_select on public.job_requirements
for select to authenticated using (user_id = auth.uid());
create policy analyses_owner_select on public.analyses
for select to authenticated using (user_id = auth.uid() and state = 'sealed');
create policy analysis_requirements_owner_select on public.analysis_requirements
for select to authenticated using (
  user_id = auth.uid() and exists (
    select 1 from public.analyses a
    where a.id = analysis_id and a.user_id = auth.uid() and a.state = 'sealed'
  )
);
create policy analysis_requirement_atoms_owner_select on public.analysis_requirement_atoms
for select to authenticated using (
  user_id = auth.uid() and exists (
    select 1 from public.analyses a
    where a.id = analysis_id and a.user_id = auth.uid() and a.state = 'sealed'
  )
);
create policy requirement_assessments_owner_select on public.requirement_assessments
for select to authenticated using (
  user_id = auth.uid() and exists (
    select 1 from public.analyses a
    where a.id = analysis_id and a.user_id = auth.uid() and a.state = 'sealed'
  )
);
create policy assessment_facts_owner_select on public.assessment_facts
for select to authenticated using (
  user_id = auth.uid() and exists (
    select 1
    from public.requirement_assessments ra
    join public.analyses a on a.id = ra.analysis_id and a.user_id = ra.user_id
    where ra.id = assessment_id and ra.user_id = auth.uid() and a.state = 'sealed'
  )
);
create policy requirement_atom_assessments_owner_select on public.requirement_atom_assessments
for select to authenticated using (
  user_id = auth.uid() and exists (
    select 1
    from public.requirement_assessments ra
    join public.analyses a on a.id = ra.analysis_id and a.user_id = ra.user_id
    where ra.id = assessment_id and ra.user_id = auth.uid() and a.state = 'sealed'
  )
);
create policy atom_assessment_facts_owner_select on public.atom_assessment_facts
for select to authenticated using (
  user_id = auth.uid() and exists (
    select 1
    from public.requirement_atom_assessments aa
    join public.requirement_assessments ra
      on ra.id = aa.assessment_id and ra.user_id = aa.user_id
    join public.analyses a on a.id = ra.analysis_id and a.user_id = ra.user_id
    where aa.id = atom_assessment_id and aa.user_id = auth.uid() and a.state = 'sealed'
  )
);
create policy clarifications_owner_select on public.clarifications
for select to authenticated using (user_id = auth.uid());
create policy documents_owner_select on public.documents
for select to authenticated using (user_id = auth.uid());
create policy document_versions_owner_select on public.document_versions
for select to authenticated using (user_id = auth.uid());
create policy document_blocks_owner_select on public.document_blocks
for select to authenticated using (user_id = auth.uid());
create policy document_claims_owner_select on public.document_claims
for select to authenticated using (user_id = auth.uid());
create policy claim_facts_owner_select on public.claim_facts
for select to authenticated using (user_id = auth.uid());
create policy claim_requirements_owner_select on public.claim_requirements
for select to authenticated using (user_id = auth.uid());
create policy claim_job_sources_owner_select on public.claim_job_sources
for select to authenticated using (user_id = auth.uid());
create policy render_assets_owner_select on public.render_assets
for select to authenticated using (user_id = auth.uid());
create policy applications_owner_select on public.applications
for select to authenticated using (user_id = auth.uid());
create policy outcomes_owner_select on public.application_outcomes
for select to authenticated using (user_id = auth.uid());
create policy preferences_owner_select on public.user_preferences
for select to authenticated using (user_id = auth.uid());
create policy edit_events_owner_select on public.edit_events
for select to authenticated using (user_id = auth.uid());
create policy plans_public_select on public.plan_catalog
for select to anon, authenticated using (active = true);
create policy subscriptions_owner_select on public.customer_subscriptions
for select to authenticated using (user_id = auth.uid());
create policy usage_owner_select on public.usage_events
for select to authenticated using (user_id = auth.uid());
create policy operations_owner_select on public.operations
for select to authenticated using (user_id = auth.uid());
create policy model_runs_owner_select on public.model_runs
for select to authenticated using (user_id = auth.uid());
create policy data_exports_owner_select on public.data_exports
for select to authenticated using (user_id = auth.uid());
create policy deletion_requests_owner_select on public.deletion_requests
for select to authenticated using (user_id = auth.uid());
create policy deletion_steps_owner_select on public.deletion_steps
for select to authenticated using (
  exists (
    select 1 from public.deletion_requests d
    where d.id = deletion_request_id and d.user_id = auth.uid()
  )
);
create policy support_owner_select on public.support_tickets
for select to authenticated using (user_id = auth.uid());
create policy support_messages_owner_select on public.support_messages
for select to authenticated using (user_id = auth.uid());
create policy support_attachments_owner_select on public.support_attachments
for select to authenticated using (user_id = auth.uid());
create policy diagnostic_grants_owner_select on public.diagnostic_access_grants
for select to authenticated using (user_id = auth.uid());
create policy content_published_select on public.content_pages
for select to anon, authenticated using (status = 'published' and published_at <= now());
create policy audit_self_select on public.audit_events
for select to authenticated using (user_id = auth.uid());

-- No client policies are deliberately created for webhook_events. The service
-- role processes them. Domain mutations, source chunks, analyses, claims, renders,
-- subscriptions, usage events, operations, staff/admin access, and audit writes are server-only.

-- ---------------------------------------------------------------------------
-- Storage is private with no direct client policies. The BFF verifies ownership
-- and issues narrow, short-lived signed upload/preview/download URLs. User-owned
-- object names begin with the authenticated user's UUID; billing replay objects
-- use provider/event IDs and are never exposed to clients. Privacy export objects
-- are readable only through a short-lived URL issued after reauthorization.
-- ---------------------------------------------------------------------------

-- Sources, renders, support attachments, privacy exports, and encrypted short-TTL
-- billing replay objects are written/read/deleted by trusted services. Users
-- receive signed URLs only for their authorized source/render/support/export objects.

-- Explicit grants: do not rely on platform-wide default privileges. Authenticated
-- clients can read only tables with owner/public policies; all domain writes are
-- performed by the BFF except the narrowly scoped profile update.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select on public.consent_receipts, public.admin_memberships,
  public.source_documents, public.source_chunks, public.career_facts,
  public.fact_evidence, public.fact_conflicts, public.jobs,
  public.job_requirements, public.analyses, public.analysis_requirements,
  public.analysis_requirement_atoms, public.requirement_assessments,
  public.assessment_facts, public.requirement_atom_assessments,
  public.atom_assessment_facts,
  public.clarifications, public.documents, public.document_versions,
  public.document_blocks, public.document_claims, public.claim_facts,
  public.claim_requirements, public.claim_job_sources, public.render_assets,
  public.applications, public.application_outcomes, public.user_preferences,
  public.edit_events, public.customer_subscriptions, public.usage_events,
  public.operations, public.model_runs, public.audit_events,
  public.data_exports,
  public.deletion_requests, public.deletion_steps, public.support_tickets,
  public.support_messages, public.support_attachments,
  public.diagnostic_access_grants
to authenticated;
grant select on public.plan_catalog, public.content_pages to anon, authenticated;

commit;

-- Required follow-up migrations/configuration:
-- 1. Create the five private storage buckets and configure object-size/TTL limits.
-- 2. Mirror these explicit grants in future migrations; never restore broad
--    authenticated table/function/sequence defaults.
-- 3. Insert each operation and its outbox event in one BFF transaction; deploy an
--    idempotent dispatcher and call the included claim/heartbeat/finish functions.
-- 4. Seed and validate the versioned plan catalogue. Its meter keys must match the
--    included reserve/settle usage functions; -1 is the only unlimited sentinel.
-- 5. Add retention, billing-payload purge, deletion, and backup-expiry schedules
--    plus processor/provider acknowledgement steps.
-- 6. Keep domain mutations server-only. If a future direct-client write is added,
--    create a narrow transition-aware policy/RPC and add cross-user/state tests.
-- 7. Test every RLS table using owner, second user, anonymous, support, admin,
--    and service-role scenarios before deployment.
