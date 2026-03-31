import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import {
  appOriginFromRequest,
  getStripe,
  isAllowedSubscriptionPriceId,
  resolvePriceIdFromPlan,
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

  const body = (await req.json().catch(() => null)) as { plan?: string; priceId?: string } | null;
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  let priceId = typeof body.priceId === 'string' ? body.priceId.trim() : '';
  if (!priceId && typeof body.plan === 'string') {
    priceId = resolvePriceIdFromPlan(body.plan) ?? '';
  }
  if (!priceId || !isAllowedSubscriptionPriceId(priceId)) {
    return NextResponse.json({ error: 'Invalid plan or price' }, { status: 400 });
  }

  const { data: profile, error: profErr } = await supabaseAuth
    .from('profiles')
    .select('role, email, stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profErr || !profile || profile.role !== 'chiropractor') {
    return NextResponse.json({ error: 'Chiropractor account required' }, { status: 403 });
  }

  const origin = appOriginFromRequest(req);
  const email =
    user.email ||
    (typeof profile.email === 'string' ? profile.email : null) ||
    undefined;

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    client_reference_id: user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/account?checkout=success`,
    cancel_url: `${origin}/account?checkout=canceled`,
    metadata: { supabase_user_id: user.id },
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
    allow_promotion_codes: true,
  };

  const existingCustomer =
    typeof profile.stripe_customer_id === 'string' ? profile.stripe_customer_id.trim() : '';
  if (existingCustomer) {
    sessionParams.customer = existingCustomer;
  } else if (email) {
    sessionParams.customer_email = email;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  if (!session.url) {
    return NextResponse.json({ error: 'No checkout URL returned' }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
