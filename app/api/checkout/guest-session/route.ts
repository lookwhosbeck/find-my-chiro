import { NextRequest, NextResponse } from 'next/server';
import {
  appOriginFromRequest,
  getStripe,
  isAllowedSubscriptionPriceId,
  resolvePriceIdFromPlan,
} from '@/app/lib/stripe.server';

export const dynamic = 'force-dynamic';

const GUEST_FLOW = 'chiropractor_guest';

/**
 * Hosted Checkout for chiropractor signup before a Supabase user exists.
 * Success redirect includes checkout_session_id for /signup verify step.
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 501 });
  }

  const body = (await req.json().catch(() => null)) as { plan?: string } | null;
  const plan = typeof body?.plan === 'string' ? body.plan.toLowerCase().trim() : '';
  const priceId = resolvePriceIdFromPlan(plan);
  if (!priceId || !isAllowedSubscriptionPriceId(priceId)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const origin = appOriginFromRequest(req);
  const successUrl = `${origin}/signup?checkout_session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/signup?checkout_canceled=1`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        app_signup_flow: GUEST_FLOW,
      },
      subscription_data: {
        metadata: {
          app_signup_flow: GUEST_FLOW,
        },
      },
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json({ error: 'No checkout URL returned' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error('guest-session:', e);
    return NextResponse.json({ error: 'Could not start checkout' }, { status: 500 });
  }
}
