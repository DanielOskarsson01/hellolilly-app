import React from 'react';
import { Icon } from '../components/primitives.jsx';
import { Sidebar } from '../components/shell.jsx';
import { ToolHeader } from './cvActivity.jsx';
import { useCollection } from '../hooks/useCollection.js';

// Presentation is VIEW-SIDE, keyed by `type` — never stored on the record. This is
// what lets a later coach view render the SAME collection with no migration (spec §2.1).
const TYPE_PRESENTATION = {
  case_created:       { ic: 'briefcase', tint: 'ic-blue' },
  research_run:       { ic: 'search',    tint: 'ic-blue' },
  analysis_run:       { ic: 'target',    tint: 'ic-green' },
  cv_generated:       { ic: 'cv',        tint: 'ic-blue' },
  letter_generated:   { ic: 'letter',    tint: 'ic-lilac' },
  gap_filled:         { ic: 'bulb',      tint: 'ic-amber' },
  letter_draft_saved: { ic: 'letter',    tint: 'ic-lilac' },
  keyword_aligned:    { ic: 'sparkle',   tint: 'ic-green' },
  job_approved:       { ic: 'briefcase', tint: 'ic-green' },
  job_rejected:       { ic: 'briefcase', tint: 'ic-coral' },
  job_reopened:       { ic: 'briefcase', tint: 'ic-amber' },
  job_linked:         { ic: 'target',    tint: 'ic-blue' },
};
const FALLBACK = { ic: 'target', tint: 'ic-blue' };

function detailLine(r) {
  const m = r.meta || {};
  switch (r.type) {
    case 'case_created':       return `${m.company ?? ''} · ${m.role ?? ''}`;
    case 'analysis_run':       return `${m.gapsFound ?? 0} luckor`;
    case 'keyword_aligned':    return `Term: ${m.term ?? ''}`;
    case 'letter_draft_saved': return `${m.paragraphCount ?? 0} stycken`;
    case 'research_run':       return m.partial ? 'Delvis (avkodaren misslyckades)' : '';
    case 'job_rejected':       return `${m.company ?? ''}${m.reason ? ` — ${m.reason}` : ''}`;
    case 'job_approved':
    case 'job_reopened':
    case 'job_linked':         return `${m.company ?? m.title ?? ''}`;
    default:                   return '';
  }
}

function ActivityLog() {
  const { records, status, error } = useCollection('activity');
  const rows = [...records].sort((a, b) => new Date(b.at) - new Date(a.at));
  return (
    <div className="ll app app--warm" data-screen-label="Aktivitetslogg (verifiering)">
      <Sidebar active="activity-log" />
      <div className="main">
        <ToolHeader title="Aktivitetslogg (verifiering)" />
        <div className="content content--narrow" style={{ paddingTop: 18, maxWidth: 820, margin: '0 auto', width: '100%' }}>
          <div className="card card--pad" style={{ marginBottom: 16, borderLeft: '3px solid var(--ll-amber)' }}>
            <p className="muted" style={{ fontSize: 13.5, margin: 0 }}>
              Verifieringsvy — en rå kronologisk lista över den riktiga aktivitetsloggen.
              Detta är <b>inte</b> den färdiga Min aktivitet-vyn (den designas i Wave B).
            </p>
          </div>

          {status === 'pending' && <p className="muted">Hämtar aktivitet…</p>}

          {status === 'failed' && (
            <div className="feedbackline">
              <Icon name="lock" size={18} style={{ color: 'var(--ll-coral)' }} />
              Kunde inte hämta aktiviteten: {error?.message || String(error)}
            </div>
          )}

          {status === 'ready' && rows.length === 0 && (
            <div className="card card--pad" style={{ textAlign: 'center' }}>
              <Icon name="target" size={26} />
              <h3 style={{ marginTop: 8 }}>Ingen aktivitet än</h3>
              <p className="muted" style={{ marginTop: 6 }}>
                Loggen fylls på när du kör verktygen — varje bekräftad åtgärd loggas automatiskt server-side.
              </p>
            </div>
          )}

          {status === 'ready' && rows.length > 0 && (
            <div className="atimeline">
              {rows.map((r) => {
                const p = TYPE_PRESENTATION[r.type] || FALLBACK;
                const detail = detailLine(r);
                return (
                  <div className="aitem" key={r.id}>
                    <div className="aitem__rail"><div className={`aitem__ic ${p.tint}`}><Icon name={p.ic} size={20} /></div></div>
                    <div className="aitem__card">
                      <div className="aitem__top">
                        <span className="aitem__t">{r.label}</span>
                        <span className="aitem__time">{new Date(r.at).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                      {detail && <p className="aitem__m">{detail}</p>}
                      <div style={{ marginTop: 10 }}>
                        <span className="aitem__auto"><Icon name="sparkle" size={12} />{r.source === 'system' ? 'Loggades automatiskt' : 'Manuell'}</span>
                        <span className="cap" style={{ marginLeft: 8, opacity: 0.6 }}>{r.type}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { ActivityLog };
