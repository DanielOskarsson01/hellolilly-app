import React from 'react';
import { Clover, Button } from '../components/primitives.jsx';
import { Topbar } from '../components/shell.jsx';
import { CoachSidebar } from './coach.jsx';
import { getVault, uploadVault } from '../api/vaultApi.js';
import { deriveVaultState } from '../lib/vaultEnvelope.mjs';

// Valvet — ditt nätverk (Coach Vault, D21 · slice 1: ingest + view only).
// Advocacy posture (D14): the vault is the coach's own professional equity, so the copy
// is calm and owner-serving — it helps you read YOUR network, it never audits it. The
// lock line comes first in every state: the promise (only JA/NEJ + row-id ever leaves the
// machine) is the whole reason a coach would trust her connections to this at all.

function LockBanner() {
  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'flex-start',
      background: 'var(--ll-blue-tint-2)', border: '1px solid var(--ll-border)',
      borderRadius: 12, padding: '13px 16px', marginBottom: 18,
    }}>
      <span style={{ fontSize: 18, lineHeight: 1.3 }}>🔒</span>
      <p style={{ fontSize: 13.5, color: 'var(--ll-ink-soft)', lineHeight: 1.5, margin: 0 }}>
        <b style={{ color: 'var(--ll-blue-deep)' }}>Endast lokalt på DIN dator.</b>{' '}
        HelloLilly kan aldrig läsa raderna — endast JA/NEJ + rad-ID lämnar någonsin maskinen.
      </p>
    </div>
  );
}

// The upload control — shared by ABSENT (first import) and FAILED (retry). `replace`
// switches the copy for a vault that already exists (re-import replaces it wholesale).
function Uploader({ file, setFile, onUpload, replace }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="file"
          accept=".csv,text/csv"
          aria-label="Välj din Connections-fil (CSV)"
          onChange={(e) => setFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
        />
        <Button variant="primary" size="sm" icon="arrow" disabled={!file} onClick={onUpload}>Läs in</Button>
      </div>
      {replace && (
        <p className="cap" style={{ marginTop: 8, color: 'var(--ll-ink-soft)' }}>
          Ny inläsning ersätter hela valvet.
        </p>
      )}
      <p className="cap" style={{ marginTop: 10, color: 'var(--ll-ink-soft)' }}>
        Hämta: LinkedIn → Settings → Data privacy → Get a copy of your data → Connections.
      </p>
    </div>
  );
}

function ContactRow({ c }) {
  const parts = [c.position, c.company].filter(Boolean).join(' · ');
  return (
    <div style={{ padding: '11px 0', borderBottom: '1px solid var(--ll-border)' }}>
      <div style={{ fontWeight: 700, color: 'var(--ll-ink)' }}>{c.name || '(namn saknas)'}</div>
      <div className="cap" style={{ color: 'var(--ll-ink-soft)', marginTop: 2 }}>
        {parts || '—'}{c.connectedOn ? ` · ${c.connectedOn}` : ''}
      </div>
    </div>
  );
}

function Valvet() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [count, setCount] = React.useState(0);
  const [rows, setRows] = React.useState([]);
  const [skipped, setSkipped] = React.useState(0);
  const [file, setFile] = React.useState(null);
  const [filter, setFilter] = React.useState('');

  React.useEffect(() => {
    let alive = true;
    getVault()
      .then((b) => { if (!alive) return; setCount(b.count); setRows(b.rows); setLoading(false); })
      .catch((e) => { if (!alive) return; setError(e.message); setLoading(false); });
    return () => { alive = false; };
  }, []);

  const onUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const text = await file.text();
      const b = await uploadVault(text);
      setCount(b.count);
      setRows(b.rows);
      setSkipped(b.skipped || 0);
      setFile(null);
    } catch (e) {
      setError(e.message || 'Filen kunde inte läsas');
    } finally {
      setLoading(false);
    }
  };

  const state = deriveVaultState({ loading, error, count });

  const q = filter.trim().toLowerCase();
  const shown = q
    ? rows.filter((c) => `${c.name} ${c.position} ${c.company}`.toLowerCase().includes(q))
    : rows;

  return (
    <div className="ll app app--warm" data-screen-label="Valvet">
      <CoachSidebar active="valvet" />
      <div className="main">
        <Topbar name="Daniel Oskarsson" />
        <div className="content content--narrow" style={{ paddingTop: 14 }}>
          <div className="hero-greet">
            <div>
              <span className="cap" style={{ fontWeight: 700, color: 'var(--ll-blue)' }}>Coachnätverk</span>
              <h1 style={{ marginTop: 6 }}>Valvet — ditt nätverk</h1>
            </div>
          </div>

          <div className="card card--pad" style={{ marginTop: 14 }}>
            <LockBanner />

            {state === 'pending' && (
              <p style={{ color: 'var(--ll-ink-soft)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clover size={18} color="#2B6CF0" /> Läser in ditt nätverk …
              </p>
            )}

            {state === 'absent' && (
              <div>
                <p style={{ color: 'var(--ll-ink-soft)', lineHeight: 1.6, marginBottom: 14, maxWidth: '64ch' }}>
                  Läs in en export av dina LinkedIn-kontakter. Den stannar här på din dator — bara du ser raderna.
                </p>
                <Uploader file={file} setFile={setFile} onUpload={onUpload} replace={false} />
              </div>
            )}

            {state === 'failed' && (
              <div>
                <div style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  background: 'var(--ll-coral-soft, #fdece9)', border: '1px solid #f2c4bb',
                  borderRadius: 12, padding: '13px 16px', marginBottom: 16,
                }}>
                  <span style={{ fontSize: 16, lineHeight: 1.4 }}>⚠️</span>
                  <p style={{ fontSize: 14, color: '#9a3320', lineHeight: 1.5, margin: 0 }}>
                    Filen kunde inte läsas — inget har sparats. Kontrollera att det är LinkedIns Connections-export.
                  </p>
                </div>
                <Uploader file={file} setFile={setFile} onUpload={onUpload} replace={count > 0} />
              </div>
            )}

            {state === 'ready' && (
              <div>
                <div className="between" style={{ alignItems: 'baseline', marginBottom: 10 }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900 }}>
                    Ditt valv: {count} kontakter
                  </h2>
                  {skipped > 0 && (
                    <span className="cap" style={{ color: 'var(--ll-ink-soft)' }}>
                      {skipped} rad{skipped === 1 ? '' : 'er'} kunde inte tolkas och hoppades över.
                    </span>
                  )}
                </div>

                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filtrera på namn, roll eller företag…"
                  aria-label="Filtrera kontakter"
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 10,
                    border: '1px solid var(--ll-border)', marginBottom: 6, fontSize: 14,
                  }}
                />

                <div>
                  {shown.map((c) => <ContactRow key={c.id} c={c} />)}
                  {shown.length === 0 && (
                    <p className="cap" style={{ color: 'var(--ll-ink-soft)', padding: '12px 0' }}>
                      Ingen kontakt matchar filtret.
                    </p>
                  )}
                </div>

                <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--ll-border)' }}>
                  <Uploader file={file} setFile={setFile} onUpload={onUpload} replace />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export { Valvet };
