// Decides whether a POST /generate outcome is a REAL, complete application — and, when it
// is not, the honest card message. This is the single guard against a phantom-complete card.
//
// Contract (server/dev-server.cjs /generate): the route runs cv-builder + writer, then sets
//   ok = (cvDraft.status === 'ready' && coverLetter.status === 'ready')
// and returns 200 when ok, else 207 with ok:false (a partial/total failure). caseApi.request
// does NOT throw on 207 — it resolves the body — so ok:false arrives as a normal result, and a
// thrown error (network / 5xx) is the other failure mode. Both mean NOT complete.
//
// `res` is the resolved /generate body (or null when the call threw); `err` is the thrown error.
export function generateOutcome(res, err = null) {
  if (err) {
    return { complete: false, tone: 'error',
      message: 'Kunde inte skapa ansökan — försök igen.' };
  }
  if (res && res.ok) {
    return { complete: true, tone: 'ok', message: null };
  }
  const cvOk = !!res && res.cvDraftStatus === 'ready';
  const letterOk = !!res && res.coverLetterStatus === 'ready';
  if (cvOk && !letterOk) {
    return { complete: false, tone: 'partial',
      message: 'CV:t skapades, men det personliga brevet misslyckades. Ingen ansökan markeras som klar — försök igen.' };
  }
  if (!cvOk && letterOk) {
    return { complete: false, tone: 'partial',
      message: 'Brevet skapades, men CV:t misslyckades. Ingen ansökan markeras som klar — försök igen.' };
  }
  return { complete: false, tone: 'error',
    message: 'CV och brev kunde inte skapas. Ingen ansökan markeras som klar — försök igen.' };
}
