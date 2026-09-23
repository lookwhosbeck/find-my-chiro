import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
  checkoutSessionEmail,
  checkoutSessionEmailResolved,
  getStripe,
  getStripePriceIdAnnual,
  getStripePriceIdMonthly,
  isCheckoutSessionReadyForFulfillment,
  resolveCheckoutSessionCustomerId,
  retrieveCheckoutSessionForFulfillment,
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

function rejectVerifyReturn(
  sessionId: string,
  code: string,
  error: string,
  details: Record<string, unknown>,
  status = 400,
) {
  console.error('verify-return rejected', { sessionId, code, error, ...details });
  return NextResponse.json({ error, code, ...details }, { status });
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
    return rejectVerifyReturn(sessionId ?? '', 'invalid_session_id', 'Invalid sessionId', {});
  }

  let session: Awaited<ReturnType<typeof retrieveCheckoutSessionForFulfillment>>;
  try {
    session = await retrieveCheckoutSessionForFulfillment(stripe, sessionId);
  } catch (e) {
    console.error('verify-return retrieve:', sessionId, e);
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (session.metadata?.app_signup_flow !== GUEST_FLOW) {
    return rejectVerifyReturn(sessionId, 'not_guest_checkout', 'Not a guest signup checkout', {
      app_signup_flow: session.metadata?.app_signup_flow ?? null,
      mode: session.mode,
    });
  }

  if (!isCheckoutSessionReadyForFulfillment(session)) {
    return rejectVerifyReturn(sessionId, 'payment_not_complete', 'Payment not complete', {
      status: session.status,
      payment_status: session.payment_status,
      retryable: true,
    });
  }

  const emailRaw = await checkoutSessionEmailResolved(stripe, session);
  if (!emailRaw) {
    return rejectVerifyReturn(sessionId, 'missing_email', 'No email on checkout session', {
      payment_status: session.payment_status,
      mode: session.mode,
    });
  }

  let customerId: string | null;
  try {
    customerId = await resolveCheckoutSessionCustomerId(stripe, session, { email: emailRaw });
  } catch (e) {
    console.error('verify-return resolve customer:', sessionId, e);
    return NextResponse.json({ error: 'Could not resolve Stripe customer' }, { status: 500 });
  }

  if (!customerId) {
    return rejectVerifyReturn(sessionId, 'missing_customer', 'Missing customer', {
      email: emailRaw,
      payment_status: session.payment_status,
    });
  }

  const admin = createClient(url, service);

  if (session.mode === 'payment') {
    if (session.metadata?.signup_plan?.trim() !== 'free') {
      return rejectVerifyReturn(sessionId, 'unexpected_payment_checkout', 'Unexpected payment checkout', {
        signup_plan: session.metadata?.signup_plan ?? null,
      });
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
    return rejectVerifyReturn(sessionId, 'invalid_mode', 'Invalid checkout mode', { mode: session.mode });
  }

  const subRef = session.subscription;
  const subId = typeof subRef === 'string' ? subRef : subRef?.id;
  if (!subId) {
    return rejectVerifyReturn(sessionId, 'missing_subscription', 'Missing subscription', {
      mode: session.mode,
    });
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
