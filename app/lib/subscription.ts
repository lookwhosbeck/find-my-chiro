/**
 * Client-safe subscription helpers (derive from profile row; do not trust for security).
 * Server routes must re-check tier with the same rules.
 */

export type SubscriptionStatusRow = string | null | undefined;

export function isPremiumProfile(row: {
  subscription_status?: SubscriptionStatusRow;
  current_period_end?: string | null;
}): boolean {
  const s = row.subscription_status?.toLowerCase() ?? '';
  if (s === 'active' || s === 'trialing') return true;
  return false;
}
