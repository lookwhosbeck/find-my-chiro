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

type PremiumAccessProfile = {
  subscription_status?: SubscriptionStatusRow;
  current_period_end?: string | null;
  founding_member?: boolean | null;
};

/** Paid Premium, or a founding member whose access stays even if the $0 subscription is canceled. */
export function hasPremiumAccess(profile: PremiumAccessProfile): boolean {
  return profile.founding_member === true || isPremiumProfile(profile);
}

export function canUsePremiumFeatures(profile: PremiumAccessProfile): boolean {
  return hasPremiumAccess(profile);
}

/** Referrals, public ratings, etc.: premium or founding member + staff-approved license */
export function canUseTrustSensitiveFeatures(
  profile: PremiumAccessProfile & {
    role?: string | null;
  },
  chiro: { license_verification_status?: LicenseVerificationStatus },
): boolean {
  if (profile.role === 'admin') return true;
  if (!hasPremiumAccess(profile)) return false;
  return chiro.license_verification_status === 'approved';
}
