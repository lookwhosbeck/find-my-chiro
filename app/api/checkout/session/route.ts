import { createClient } from '@supabase/supabase-js';
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

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 501 });
  }
  if (!url || !anon || url === 'https://placeholder.supabase.co') {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 501 });
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const jwt = authHeader.slice(7);

  const supabaseAuth = createClient(url, anon);
  const {
    data: { user },
    error: userErr,
  } = await supabaseAuth.auth.getUser(jwt);
  if (userErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    plan?: string;
    embedded?: boolean;
  } | null;
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const embedded = body.embedded === true;

  let plan: SignupCheckoutPlan = 'monthly';
  if (typeof body.plan === 'string') {
    const p = body.plan.toLowerCase().trim();
    if (p === 'free' || p === 'monthly' || p === 'annual') {
      plan = p;
    }
  }

  if (!getStripePriceIdVerification()) {
    return NextResponse.json({ error: 'Verification price is not configured' }, { status: 501 });
  }

  const { data: profile, error: profErr } = await supabaseAuth
    .from('profiles')
    .select('role, email, stripe_customer_id, license_verification_fee_paid_at')
    .eq('id', user.id)
    .maybeSingle();

  if (profErr || !profile || profile.role !== 'chiropractor') {
    return NextResponse.json({ error: 'Chiropractor account required' }, { status: 403 });
  }

  const verificationPaid = !!profile.license_verification_fee_paid_at;
  if (plan === 'free' && verificationPaid) {
    return NextResponse.json({ error: 'Verification fee already paid' }, { status: 400 });
  }

  const includeVerification = !verificationPaid;

  let lineItems: Stripe.Checkout.SessionCreateParams['line_items'];
  try {
    lineItems = lineItemsForSignupCheckout(plan, { includeVerification });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid checkout configuration';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const origin = appOriginFromRequest(req);
  const email =
    user.email ||
    (typeof profile.email === 'string' ? profile.email : null) ||
    undefined;

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    client_reference_id: user.id,
    line_items: lineItems,
    metadata: { supabase_user_id: user.id, signup_plan: plan },
    allow_promotion_codes: true,
  };

  if (plan === 'free') {
    sessionParams.mode = 'payment';
  } else {
    sessionParams.mode = 'subscription';
    sessionParams.subscription_data = {
      metadata: { supabase_user_id: user.id, signup_plan: plan },
    };
  }

  if (embedded) {
    sessionParams.ui_mode = 'embedded';
    sessionParams.return_url = `${origin}/signup?session_id={CHECKOUT_SESSION_ID}`;
    sessionParams.redirect_on_completion = 'if_required';
  } else {
    sessionParams.success_url = `${origin}/account?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
    sessionParams.cancel_url = `${origin}/account?checkout=canceled`;
  }

  const existingCustomer =
    typeof profile.stripe_customer_id === 'string' ? profile.stripe_customer_id.trim() : '';
  if (existingCustomer) {
    sessionParams.customer = existingCustomer;
  } else if (email) {
    sessionParams.customer_email = email;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  if (embedded) {
    if (!session.client_secret) {
      return NextResponse.json({ error: 'No client secret returned' }, { status: 500 });
    }
    return NextResponse.json({ clientSecret: session.client_secret });
  }

  if (!session.url) {
    return NextResponse.json({ error: 'No checkout URL returned' }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
