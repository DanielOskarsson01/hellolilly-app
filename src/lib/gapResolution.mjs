// Gap-resolution gate logic (Matchanalys detail view).
//
// A gap is handled ONLY by a terminal resolution the user consciously reached:
// 'accepted' (filled via an approved answer) or 'skipped' (consciously not filled).
// Any other value — missing, half-written, legacy, or truthy junk — keeps the gap
// open and the "Skapa anpassad CV" gate closed. Fail-closed: an unknown state must
// never unlock a CV that claims the gaps are handled.

export const TERMINAL_RESOLUTIONS = ['accepted', 'skipped'];

export const isResolved = (gap) => TERMINAL_RESOLUTIONS.includes(gap && gap.resolution);

export const openGaps = (gaps) => (gaps || []).filter((g) => !isResolved(g));

export const skippedGaps = (gaps) => (gaps || []).filter((g) => g && g.resolution === 'skipped');

// The "Skapa anpassad CV" gate: open iff EVERY gap is terminally resolved.
export const cvGateOpen = (gaps) => openGaps(gaps).length === 0;
