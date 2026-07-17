// Valvet slice 1 — the vault screen's four envelope states as a pure function, so the
// state machine is testable without a DOM (mirrors the repo's { absent | pending | ready
// | failed } envelope convention, data-contract §0). Precedence: a load in flight is
// PENDING; then a parse error is FAILED; then rows present are READY; otherwise ABSENT.

export function deriveVaultState({ loading, error, count } = {}) {
  if (loading) return 'pending';
  if (error) return 'failed';
  if (count > 0) return 'ready';
  return 'absent';
}
