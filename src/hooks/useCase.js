// useCase() — the data bridge the architecture has assumed all along
// (DATA_CONTRACT §1: "the frontend reads a case through useCase()").
//
// useCase(caseId) -> { caseData, loading, error, refresh, running, actions }
//   caseData: the case object; every part is a { status, data, error?, updatedAt }
//   envelope, so a screen's loading/empty/error scaffolding maps 1:1 to part status.
//   actions:  research / analyze / generate / answerGap — each POSTs, then notifies
//   every mounted screen via the ll:case:changed CustomEvent (jobStore's ll:jobs:changed
//   pattern). While any part is 'pending', the hook polls so long server-side runs
//   (research is minutes of live LLM + search) animate as real part-status progress.

import React from 'react';
import * as caseApi from '../api/caseApi.js';
import { getActiveCaseId } from '../utils/jobStore.js';

const POLL_MS = 2500;
const PARTS = ['dossiers', 'decodedRole', 'fit', 'gaps', 'cvDraft', 'coverLetter'];

export function useCase(caseId) {
  const [caseData, setCaseData] = React.useState(null);
  const [loading, setLoading] = React.useState(Boolean(caseId));
  const [error, setError] = React.useState(null);
  const [running, setRunning] = React.useState({});

  const refresh = React.useCallback(async () => {
    if (!caseId) {
      setCaseData(null);
      setLoading(false);
      return;
    }
    try {
      setCaseData(await caseApi.getCase(caseId));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  React.useEffect(() => {
    setCaseData(null);
    setError(null);
    setLoading(Boolean(caseId));
    refresh();
  }, [refresh, caseId]);

  React.useEffect(() => {
    window.addEventListener('ll:case:changed', refresh);
    return () => window.removeEventListener('ll:case:changed', refresh);
  }, [refresh]);

  // Poll while any part is being produced server-side.
  const anyPending = Boolean(caseData) && PARTS.some((p) => caseData[p] && caseData[p].status === 'pending');
  React.useEffect(() => {
    if (!anyPending) return undefined;
    const t = setInterval(refresh, POLL_MS);
    return () => clearInterval(t);
  }, [anyPending, refresh]);

  const actions = React.useMemo(() => {
    const wrap = (name, fn) => async (...args) => {
      setRunning((r) => ({ ...r, [name]: true }));
      try {
        return await fn(...args);
      } finally {
        setRunning((r) => ({ ...r, [name]: false }));
        caseApi.notifyCaseChanged();
      }
    };
    return {
      research: wrap('research', () => caseApi.research(caseId)),
      analyze: wrap('analyze', () => caseApi.analyze(caseId)),
      generate: wrap('generate', () => caseApi.generate(caseId)),
      answerGap: wrap('answerGap', (gapId, payload) => caseApi.answerGap(caseId, gapId, payload)),
    };
  }, [caseId]);

  return { caseData, loading, error, refresh, running, actions };
}

// Tracks the localStorage-backed active case id (set when Matchanalys starts a case)
// and re-reads it on the same events jobStore already dispatches.
export function useActiveCaseId() {
  const [id, setId] = React.useState(() => getActiveCaseId());
  React.useEffect(() => {
    const sync = () => setId(getActiveCaseId());
    for (const ev of ['ll:jobs:changed', 'll:case:changed', 'storage']) window.addEventListener(ev, sync);
    return () => {
      for (const ev of ['ll:jobs:changed', 'll:case:changed', 'storage']) window.removeEventListener(ev, sync);
    };
  }, []);
  return id;
}

// The common screen-side composition: the active case, ready to render.
export function useActiveCase() {
  return useCase(useActiveCaseId());
}
