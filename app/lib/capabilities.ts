/**
 * Client-side capability checks (mirror rules in API routes for security).
 */

import { isPremiumProfile, type SubscriptionStatusRow } from './subscription';

export type LicenseVerificationStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | string
  | null
  | undefined;

export function canUsePremiumFeatures(profile: {
  subscription_status?: SubscriptionStatusRow;
  current_period_end?: string | null;
}): boolean {
  return isPremiumProfile(profile);
}

/** Referrals, public ratings, etc.: paid + staff-approved license */
export function canUseTrustSensitiveFeatures(
  profile: {
    role?: string | null;
    subscription_status?: SubscriptionStatusRow;
    current_period_end?: string | null;
  },
  chiro: { license_verification_status?: LicenseVerificationStatus },
): boolean {
  if (profile.role === 'admin') return true;
  if (!isPremiumProfile(profile)) return false;
  return chiro.license_verification_status === 'approved';
}
