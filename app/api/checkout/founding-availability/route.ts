import { NextResponse } from 'next/server';
import { FOUNDING_MEMBERS_CAP } from '@/lib/founding-promo';
import { getFoundingAvailability, getStripe } from '@/app/lib/stripe.server';

export const dynamic = 'force-dynamic';

/** Whether the first-1,000 founding checkout is still open. Does not expose the promotion code id. */
export async function GET() {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({
      available: false,
      remaining: 0,
      cap: FOUNDING_MEMBERS_CAP,
    });
  }

  const availability = await getFoundingAvailability(stripe);
  return NextResponse.json({
    available: availability.available,
    remaining: availability.remaining,
    cap: FOUNDING_MEMBERS_CAP,
  });
}
