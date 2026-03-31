import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/app/lib/stripe.server';
import { syncProfileFromStripeSubscription } from '@/app/lib/subscription-sync.server';
import {
  CHECKOUT_CLAIM_COOKIE,
  verifyCheckoutClaimToken,
} from '@/app/lib/checkout-claim.server';

export const dynamic = 'force-dynamic';

/**
 * After guest checkout + signUpChiropractor: attach Stripe subscription to the new user profile.
 * Requires httpOnly cookie from POST /api/checkout/verify-return (or body checkoutSessionId + valid claim flow).
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 501 });
  }
  if (!url || !anon || !service || url === 'https://placeholder.supabase.co') {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 501 });
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
  if (userErr || !user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(CHECKOUT_CLAIM_COOKIE)?.value;
  const claim = rawCookie ? verifyCheckoutClaimToken(rawCookie) : null;
  if (!claim) {
    return NextResponse.json({ error: 'Missing or invalid checkout claim' }, { status: 400 });
  }

  const userEmail = user.email.trim().toLowerCase();
  if (userEmail !== claim.email) {
    return NextResponse.json({ error: 'Email does not match checkout' }, { status: 403 });
  }

  const admin = createClient(url, service);
  const { data: row, error: fetchErr } = await admin
    .from('checkout_signup_claims')
    .select('linked_user_id, stripe_customer_id, stripe_subscription_id')
    .eq('stripe_checkout_session_id', claim.sessionId)
    .maybeSingle();

  if (fetchErr || !row) {
    return NextResponse.json({ error: 'Checkout claim not found' }, { status: 404 });
  }

  const linked = row.linked_user_id as string | null;
  if (linked && linked !== user.id) {
    return NextResponse.json({ error: 'This checkout is already linked to another account' }, { status: 409 });
  }
  if (linked === user.id) {
    cookieStore.delete(CHECKOUT_CLAIM_COOKIE);
    return NextResponse.json({ ok: true, alreadyLinked: true });
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || profile.role !== 'chiropractor') {
    return NextResponse.json({ error: 'Chiropractor account required' }, { status: 403 });
  }

  const customerId = row.stripe_customer_id as string;
  const subId = row.stripe_subscription_id as string;

  try {
    const subBefore = await stripe.subscriptions.retrieve(subId);
    await stripe.subscriptions.update(subId, {
      metadata: {
        ...subBefore.metadata,
        supabase_user_id: user.id,
      },
    });
  } catch (e) {
    console.error('link-stripe-checkout subscription metadata:', e);
    return NextResponse.json({ error: 'Could not link subscription' }, { status: 500 });
  }

  const sub = await stripe.subscriptions.retrieve(subId);
  try {
    await syncProfileFromStripeSubscription(admin, user.id, customerId, sub);
  } catch (e) {
    console.error('link-stripe-checkout sync:', e);
    return NextResponse.json({ error: 'Could not sync subscription to profile' }, { status: 500 });
  }

  const { error: updErr } = await admin
    .from('checkout_signup_claims')
    .update({ linked_user_id: user.id, consumed_at: new Date().toISOString() })
    .eq('stripe_checkout_session_id', claim.sessionId);

  if (updErr) {
    console.error('link-stripe-checkout consume:', updErr);
  }

  cookieStore.delete(CHECKOUT_CLAIM_COOKIE);
  return NextResponse.json({ ok: true });
}
