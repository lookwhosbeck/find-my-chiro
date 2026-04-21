import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { checkoutSessionIncludesVerificationPrice, getStripe } from '@/app/lib/stripe.server';
import {
  syncProfileAfterVerificationPayment,
  syncProfileFromStripeSubscription,
} from '@/app/lib/subscription-sync.server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 501 });
  }
  if (!url || !anon || !service || url === 'https://placeholder.supabase.co') {
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

  const body = (await req.json().catch(() => null)) as { sessionId?: string } | null;
  const sessionId = typeof body?.sessionId === 'string' ? body.sessionId.trim() : '';
  if (!sessionId || !sessionId.startsWith('cs_')) {
    return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
  }

  const admin = createClient(url, service);
  const { data: profile, error: profileErr } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profileErr || !profile || profile.role !== 'chiropractor') {
    return NextResponse.json({ error: 'Chiropractor account required' }, { status: 403 });
  }

  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.retrieve>>;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });
  } catch {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (session.status !== 'complete') {
    return NextResponse.json({ error: 'Checkout session is not complete' }, { status: 409 });
  }

  const userIdFromSession =
    session.client_reference_id?.trim() || session.metadata?.supabase_user_id?.trim() || null;
  if (!userIdFromSession || userIdFromSession !== user.id) {
    return NextResponse.json({ error: 'Session does not belong to this user' }, { status: 403 });
  }

  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
  if (!customerId) {
    return NextResponse.json({ error: 'Missing customer' }, { status: 400 });
  }

  if (session.mode === 'payment') {
    const paidVerification = await checkoutSessionIncludesVerificationPrice(stripe, sessionId);
    if (!paidVerification) {
      return NextResponse.json({ error: 'Invalid payment checkout' }, { status: 400 });
    }
    try {
      await syncProfileAfterVerificationPayment(admin, user.id, customerId);
      return NextResponse.json({ ok: true, subscriptionStatus: 'free' });
    } catch (e) {
      console.error('confirm-session verification sync:', e);
      return NextResponse.json({ error: 'Could not sync verification payment to profile' }, { status: 500 });
    }
  }

  if (session.mode !== 'subscription') {
    return NextResponse.json({ error: 'Invalid checkout mode' }, { status: 400 });
  }

  const subRef = session.subscription;
  const subId = typeof subRef === 'string' ? subRef : subRef?.id;
  if (!subId) {
    return NextResponse.json({ error: 'Missing subscription' }, { status: 400 });
  }

  try {
    const subBefore =
      typeof subRef === 'object' && subRef && 'status' in subRef
        ? subRef
        : await stripe.subscriptions.retrieve(subId);
    await stripe.subscriptions.update(subId, {
      metadata: {
        ...subBefore.metadata,
        supabase_user_id: user.id,
      },
    });
  } catch (e) {
    console.error('confirm-session metadata update:', e);
    return NextResponse.json({ error: 'Could not link subscription' }, { status: 500 });
  }

  try {
    const sub = await stripe.subscriptions.retrieve(subId);
    const feePaid = await checkoutSessionIncludesVerificationPrice(stripe, sessionId);
    await syncProfileFromStripeSubscription(admin, user.id, customerId, sub, {
      licenseVerificationFeePaid: feePaid,
    });
    return NextResponse.json({ ok: true, subscriptionStatus: sub.status });
  } catch (e) {
    console.error('confirm-session sync:', e);
    return NextResponse.json({ error: 'Could not sync subscription to profile' }, { status: 500 });
  }
}
