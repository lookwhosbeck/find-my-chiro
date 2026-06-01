import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
  checkoutSessionEmail,
  getStripe,
  getStripePriceIdAnnual,
  getStripePriceIdMonthly,
  isCheckoutSessionPaymentComplete,
  resolveCheckoutSessionCustomerId,
} from '@/app/lib/stripe.server';
import {
  CHECKOUT_CLAIM_COOKIE,
  signCheckoutClaim,
  type CheckoutClaimPayload,
} from '@/app/lib/checkout-claim.server';

export const dynamic = 'force-dynamic';

const GUEST_FLOW = 'chiropractor_guest';

function planFromSubscriptionPriceId(priceId: string | null): 'monthly' | 'annual' {
  const m = getStripePriceIdMonthly();
  const a = getStripePriceIdAnnual();
  if (priceId && a && priceId === a) return 'annual';
  if (priceId && m && priceId === m) return 'monthly';
  return 'monthly';
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 501 });
  }
  if (!url || !service || url === 'https://placeholder.supabase.co') {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 501 });
  }

  const body = (await req.json().catch(() => null)) as { sessionId?: string } | null;
  const sessionId = body?.sessionId?.trim();
  if (!sessionId || !sessionId.startsWith('cs_')) {
    return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
  }

  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.retrieve>>;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer', 'payment_intent'],
    });
  } catch {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (session.metadata?.app_signup_flow !== GUEST_FLOW) {
    return NextResponse.json({ error: 'Not a guest signup checkout' }, { status: 400 });
  }

  if (session.status !== 'complete' || !isCheckoutSessionPaymentComplete(session.payment_status)) {
    return NextResponse.json(
      { error: 'Payment not complete', status: session.status, payment_status: session.payment_status },
      { status: 400 },
    );
  }

  const customerId = await resolveCheckoutSessionCustomerId(stripe, session);
  if (!customerId) {
    return NextResponse.json({ error: 'Missing customer' }, { status: 400 });
  }

  const emailRaw = checkoutSessionEmail(session);
  if (!emailRaw) {
    return NextResponse.json({ error: 'No email on checkout session' }, { status: 400 });
  }

  const admin = createClient(url, service);

  if (session.mode === 'payment') {
    if (session.metadata?.signup_plan?.trim() !== 'free') {
      return NextResponse.json({ error: 'Unexpected payment checkout' }, { status: 400 });
    }
    const signupPlan: CheckoutClaimPayload['plan'] = 'free';

    const { error: upsertErr } = await admin.from('checkout_signup_claims').upsert(
      {
        stripe_checkout_session_id: sessionId,
        stripe_customer_id: customerId,
        stripe_subscription_id: null,
        email: emailRaw.toLowerCase(),
        price_id: null,
      },
      { onConflict: 'stripe_checkout_session_id' },
    );

    if (upsertErr) {
      console.error('verify-return upsert (payment):', upsertErr);
      return NextResponse.json({ error: 'Could not save checkout claim' }, { status: 500 });
    }

    const payload: Omit<CheckoutClaimPayload, 'exp'> = {
      sessionId,
      email: emailRaw.toLowerCase(),
      customerId,
      subscriptionId: null,
      priceId: null,
      plan: signupPlan,
    };
    const token = signCheckoutClaim(payload);

    const cookieStore = await cookies();
    cookieStore.set(CHECKOUT_CLAIM_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 2,
    });

    return NextResponse.json({
      email: emailRaw,
      plan: signupPlan,
      subscriptionStatus: 'free',
      priceId: null,
    });
  }

  if (session.mode !== 'subscription') {
    return NextResponse.json({ error: 'Invalid checkout mode' }, { status: 400 });
  }

  const subRef = session.subscription;
  const subId = typeof subRef === 'string' ? subRef : subRef?.id;
  if (!subId) {
    return NextResponse.json({ error: 'Missing subscription' }, { status: 400 });
  }

  const sub =
    typeof subRef === 'object' && subRef && 'status' in subRef
      ? subRef
      : await stripe.subscriptions.retrieve(subId);
  const priceId = sub.items.data[0]?.price?.id ?? null;
  const plan = planFromSubscriptionPriceId(priceId);

  const { error: upsertErr } = await admin.from('checkout_signup_claims').upsert(
    {
      stripe_checkout_session_id: sessionId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subId,
      email: emailRaw.toLowerCase(),
      price_id: priceId,
    },
    { onConflict: 'stripe_checkout_session_id' },
  );

  if (upsertErr) {
    console.error('verify-return upsert:', upsertErr);
    return NextResponse.json({ error: 'Could not save checkout claim' }, { status: 500 });
  }

  const payload: Omit<CheckoutClaimPayload, 'exp'> = {
    sessionId,
    email: emailRaw.toLowerCase(),
    customerId,
    subscriptionId: subId,
    priceId,
    plan,
  };
  const token = signCheckoutClaim(payload);

  const cookieStore = await cookies();
  cookieStore.set(CHECKOUT_CLAIM_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 2,
  });

  return NextResponse.json({
    email: emailRaw,
    plan,
    subscriptionStatus: sub.status,
    priceId,
  });
}
