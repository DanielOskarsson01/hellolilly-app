/** pickSlot — pure slot-picker, no React dependency.
 *  Maps a case-part envelope status + optional busy flag to a UI slot name.
 *
 *  @param {string} status  - 'ready' | 'pending' | 'failed' | 'absent' | unknown
 *  @param {{ busy?: boolean }} opts
 *  @returns {'pending'|'failed'|'absent'|'ready'}
 */
export function pickSlot(status, { busy } = {}) {
  if (busy) return 'pending';
  if (status === 'ready') return 'ready';
  if (status === 'failed') return 'failed';
  if (status === 'pending') return 'pending';
  return 'absent';
}
