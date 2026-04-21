import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import {
  appOriginFromRequest,
  getStripe,
  getStripePriceIdVerification,
  lineItemsForSignupCheckout,
  type SignupCheckoutPlan,
} from '@/app/lib/stripe.server';

export const dynamic = 'force-dynamic';

const GUEST_FLOW = 'chiropractor_guest';

/**
 * Hosted Checkout for chiropractor signup before a Supabase user exists.
 * — Free: payment mode, license verification fee only.
 * — Premium: subscription mode, verification + monthly or annual.
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 501 });
  }

  const body = (await req.json().catch(() => null)) as { plan?: string } | null;
  const raw = typeof body?.plan === 'string' ? body.plan.toLowerCase().trim() : '';
  if (raw !== 'free' && raw !== 'monthly' && raw !== 'annual') {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }
  const plan = raw as SignupCheckoutPlan;

  const verificationConfigured = !!getStripePriceIdVerification();
  if (!verificationConfigured) {
    return NextResponse.json({ error: 'Verification price is not configured' }, { status: 501 });
  }

  let lineItems: Stripe.Checkout.SessionCreateParams['line_items'];
  try {
    lineItems = lineItemsForSignupCheckout(plan, { includeVerification: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid checkout configuration';
    return NextResponse.json({ error: msg }, { status: 501 });
  }

  const origin = appOriginFromRequest(req);
  const successUrl = `${origin}/signup?checkout_session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/signup?checkout_canceled=1`;

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    line_items: lineItems,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      app_signup_flow: GUEST_FLOW,
      signup_plan: plan,
    },
    allow_promotion_codes: true,
  };

  if (plan === 'free') {
    sessionParams.mode = 'payment';
  } else {
    sessionParams.mode = 'subscription';
    sessionParams.subscription_data = {
      metadata: {
        app_signup_flow: GUEST_FLOW,
        signup_plan: plan,
      },
    };
  }

  try {
    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      return NextResponse.json({ error: 'No checkout URL returned' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error('guest-session:', e);
    return NextResponse.json({ error: 'Could not start checkout' }, { status: 500 });
  }
}
