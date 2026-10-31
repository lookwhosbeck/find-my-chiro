import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import {
  appOriginFromRequest,
  getFoundingAvailability,
  getStripe,
  getStripePriceIdMonthly,
  getStripePriceIdVerification,
  lineItemsForSignupCheckout,
  type SignupCheckoutPlan,
} from '@/app/lib/stripe.server';

export const dynamic = 'force-dynamic';

const GUEST_FLOW = 'chiropractor_guest';

function isPromotionExhausted(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('message' in error)) return false;
  const message = String(error.message).toLowerCase();
  return (
    message.includes('redemption') ||
    message.includes('expired') ||
    message.includes('promotion code') ||
    message.includes('coupon')
  );
}

/**
 * Hosted Checkout for chiropractor signup before a Supabase user exists.
 * — Founding: $0 Premium subscription, 100% off forever, no card.
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
  if (raw !== 'free' && raw !== 'monthly' && raw !== 'annual' && raw !== 'founding') {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }
  const plan = raw as SignupCheckoutPlan;

  const origin = appOriginFromRequest(req);
  const successUrl = `${origin}/signup?checkout_session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/signup?checkout_canceled=1`;

  if (plan === 'founding') {
    const monthly = getStripePriceIdMonthly();
    const availability = await getFoundingAvailability(stripe);
    if (!monthly || !availability.available || !availability.promotionCodeId) {
      return NextResponse.json(
        { error: 'Founding spots are full.', code: 'founding_full' },
        { status: 409 },
      );
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [{ price: monthly, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      discounts: [{ promotion_code: availability.promotionCodeId }],
      payment_method_collection: 'if_required',
      metadata: {
        app_signup_flow: GUEST_FLOW,
        signup_plan: 'founding',
      },
      subscription_data: {
        metadata: {
          app_signup_flow: GUEST_FLOW,
          signup_plan: 'founding',
        },
      },
    };

    try {
      const session = await stripe.checkout.sessions.create(sessionParams);
      if (!session.url) {
        return NextResponse.json({ error: 'No checkout URL returned' }, { status: 500 });
      }
      return NextResponse.json({ url: session.url });
    } catch (e) {
      console.error('guest-session founding:', e);
      if (isPromotionExhausted(e)) {
        return NextResponse.json(
          { error: 'Founding spots are full.', code: 'founding_full' },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: 'Could not start checkout' }, { status: 500 });
    }
  }

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
    sessionParams.customer_creation = 'always';
  } else {
    sessionParams.mode = 'subscription';
    sessionParams.payment_method_collection = 'if_required';
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
