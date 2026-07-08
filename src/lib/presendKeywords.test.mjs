import { test } from 'node:test';
import assert from 'node:assert';
import { extractAdTerms, scanCvKeywords } from './presendKeywords.mjs';

const decodedRole = { requirements: [
  { id: 'r1', requirement: 'Track "affiliate marketing" spend and CAC', weight: 0.9 },
  { id: 'r2', requirement: 'Own SEO', weight: 0.7 },
]};
const cvDraft = { sections: [{ key: 'exp', items: [
  { datafactRef: { id: 'df_aff' }, text: 'Built the affiliates department; owned SEO and paid.' },
  { datafactRef: { id: 'df_kpi' }, text: 'KPI ownership: CPA, LTV:CAC, churn.' },
]}]};

test('extractAdTerms: quoted phrases + ALLCAPS acronyms, deduped', () => {
  assert.deepEqual(extractAdTerms(decodedRole).sort(), ['CAC', 'SEO', 'affiliate marketing'].sort());
});

test('scan: SEO present in CV, affiliate marketing missing but has a lexical basis (df_aff)', () => {
  const { present, missing } = scanCvKeywords({ decodedRole, cvDraft });
  assert.ok(present.includes('SEO'));
  const aff = missing.find(m => m.term === 'affiliate marketing');
  assert.ok(aff && aff.alignable === true && aff.basisDatafactId === 'df_aff', 'affiliates ⊂ term → basis found');
});

test('scan: a term with no lexical basis is NOT alignable (refusable later)', () => {
  const role = { requirements: [{ id: 'r', requirement: 'Large-scale "token partnerships"', weight: 0.8 }] };
  const cv = { sections: [{ items: [{ datafactRef: { id: 'df1' }, text: 'Marketing funnels and CRM.' }] }] };
  const aff = scanCvKeywords({ decodedRole: role, cvDraft: cv }).missing.find(m => m.term === 'token partnerships');
  assert.ok(aff && aff.alignable === false && aff.basisDatafactId === null);
});
