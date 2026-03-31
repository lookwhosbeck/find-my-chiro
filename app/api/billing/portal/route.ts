import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { appOriginFromRequest, getStripe } from '@/app/lib/stripe.server';
import { isPremiumProfile } from '@/app/lib/subscription';

export const dynamic = 'force-dynamic';

/**
 * Stripe Customer Portal — chiropractors with an active subscription only.
 */
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

  const { data: profile, error: profErr } = await supabaseAuth
    .from('profiles')
    .select('role, stripe_customer_id, subscription_status')
    .eq('id', user.id)
    .maybeSingle();

  if (profErr || !profile || profile.role !== 'chiropractor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!isPremiumProfile(profile)) {
    return NextResponse.json({ error: 'Premium subscription required' }, { status: 403 });
  }

  const customerId =
    typeof profile.stripe_customer_id === 'string' ? profile.stripe_customer_id.trim() : '';
  if (!customerId) {
    return NextResponse.json({ error: 'No Stripe customer on file' }, { status: 400 });
  }

  const origin = appOriginFromRequest(req);
  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/account`,
  });

  if (!portal.url) {
    return NextResponse.json({ error: 'No portal URL returned' }, { status: 500 });
  }

  return NextResponse.json({ url: portal.url });
}
