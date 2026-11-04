import 'server-only';

import { unstable_cache } from 'next/cache';

import { getFoundingAvailability, getStripe } from '@/app/lib/stripe.server';
import { FOUNDING_MEMBERS_CAP } from '@/lib/founding-promo';

export type PublicFoundingAvailability = {
  available: boolean;
  remaining: number;
  cap: number;
};

async function loadFoundingAvailability(): Promise<PublicFoundingAvailability> {
  const stripe = getStripe();
  if (!stripe) {
    return { available: false, remaining: 0, cap: FOUNDING_MEMBERS_CAP };
  }

  const availability = await getFoundingAvailability(stripe);
  return {
    available: availability.available,
    remaining: availability.remaining,
    cap: FOUNDING_MEMBERS_CAP,
  };
}

/** Stripe redemption count, cached briefly so the site banner does not call Stripe on every request. */
export const getCachedFoundingAvailability = unstable_cache(
  loadFoundingAvailability,
  // Include promo id so rotating FOUNDING1000 after test redemptions busts the Data Cache.
  ['founding-availability', process.env.STRIPE_FOUNDING_PROMOTION_CODE_ID ?? 'none'],
  { revalidate: 60, tags: ['founding-availability'] },
);
