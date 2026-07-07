import React from 'react';
import { Clover } from './primitives.jsx';
import { pickSlot } from './partSlot.mjs';

/** STATUS — canonical slot names as a constant for callers. */
export const STATUS = {
  PENDING: 'pending',
  READY:   'ready',
  FAILED:  'failed',
  ABSENT:  'absent',
};

/** PartSkeleton — pending bars shown while a part is loading.
 *  Ported from design/design/ll-case.jsx.
 *  @param {{ lines?: number }} props
 */
export function PartSkeleton({ lines = 3 }) {
  return (
    <div className="ll-skel" aria-busy="true" aria-label="Laddar">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="ll-skel__bar" style={{ width: (90 - i * 12) + '%' }} />
      ))}
    </div>
  );
}

/** PartState — icon + title + body block for failed/absent/empty CTAs.
 *  Ported from design/design/ll-case.jsx.
 *  @param {{ icon?: string, title?: string, body?: string, tone?: string, children?: React.ReactNode }} props
 */
export function PartState({ icon = 'sparkle', title, body, tone = '', children }) {
  return (
    <div className={`ll-partstate${tone ? ' ll-partstate--' + tone : ''}`}>
      <Clover size={34} color={tone === 'fail' ? '#B12E66' : '#2B6CF0'} />
      <h3>{title}</h3>
      {body && <p>{body}</p>}
      {children}
    </div>
  );
}

/** PartGate — maps a case-part status envelope to one of four UI slots, once,
 *  for every screen. The `absent` and `failed` slots are passed by each screen
 *  so the CTA copy (e.g. "Generate") is screen-specific.
 *
 *  Props:
 *   status   — 'ready' | 'pending' | 'failed' | 'absent' | unknown
 *   busy     — truthy while an in-flight action is running; forces pending slot
 *   pending  — JSX to show while pending (default: <PartSkeleton />)
 *   failed   — JSX to show on failure (default: null)
 *   absent   — JSX to show when absent (default: null)
 *   children — rendered when status is ready
 */
export function PartGate({ status, busy, pending, failed, absent, children }) {
  const slot = pickSlot(status, { busy });
  if (slot === 'ready')   return <>{children}</>;
  if (slot === 'pending') return pending || <PartSkeleton />;
  if (slot === 'failed')  return failed  || null;
  /* absent */            return absent  || null;
}
