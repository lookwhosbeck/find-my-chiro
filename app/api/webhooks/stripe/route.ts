import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/app/lib/stripe.server';
import {
  clearSubscriptionToFree,
  syncProfileFromStripeSubscription,
  userIdFromSubscriptionMetadata,
} from '@/app/lib/subscription-sync.server';

export const dynamic = 'force-dynamic';

async function resolveUserIdForCustomer(
  admin: SupabaseClient,
  customerId: string,
): Promise<string | null> {
  const { data } = await admin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  const id = data && typeof data === 'object' && 'id' in data ? (data as { id: string }).id : null;
  return id ?? null;
}

async function handleCheckoutSessionCompleted(
  stripe: Stripe,
  admin: SupabaseClient,
  session: Stripe.Checkout.Session,
): Promise<void> {
  if (session.mode !== 'subscription') return;
  const userId =
    (session.client_reference_id?.trim() || session.metadata?.supabase_user_id?.trim()) ?? null;
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
  const subRef = session.subscription;
  const subId = typeof subRef === 'string' ? subRef : subRef?.id;
  if (!userId || !customerId || !subId) {
    console.warn('checkout.session.completed: missing userId, customer, or subscription', {
      userId,
      customerId,
      subId,
    });
    return;
  }
  const sub = await stripe.subscriptions.retrieve(subId);
  await syncProfileFromStripeSubscription(admin, userId, customerId, sub);
}

async function handleSubscriptionUpdated(
  stripe: Stripe,
  admin: SupabaseClient,
  sub: Stripe.Subscription,
): Promise<void> {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  let userId = userIdFromSubscriptionMetadata(sub);
  if (!userId) {
    userId = await resolveUserIdForCustomer(admin, customerId);
  }
  if (!userId) {
    console.warn('customer.subscription.updated: could not resolve user', { customerId, subId: sub.id });
    return;
  }
  if (sub.status === 'canceled' || sub.status === 'unpaid' || sub.status === 'incomplete_expired') {
    await clearSubscriptionToFree(admin, userId);
    return;
  }
  await syncProfileFromStripeSubscription(admin, userId, customerId, sub);
}

async function handleSubscriptionDeleted(admin: SupabaseClient, sub: Stripe.Subscription): Promise<void> {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  let userId = userIdFromSubscriptionMetadata(sub);
  if (!userId) {
    userId = await resolveUserIdForCustomer(admin, customerId);
  }
  if (!userId) {
    console.warn('customer.subscription.deleted: could not resolve user', { customerId, subId: sub.id });
    return;
  }
  await clearSubscriptionToFree(admin, userId);
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const whsec = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripe || !whsec) {
    return NextResponse.json({ error: 'Stripe webhook not configured' }, { status: 501 });
  }
  if (!url || !service || url === 'https://placeholder.supabase.co') {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 501 });
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, whsec);
  } catch (e) {
    console.error('Stripe webhook signature:', e);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const admin = createClient(url, service);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(stripe, admin, session);
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(stripe, admin, sub);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(admin, sub);
        break;
      }
      case 'invoice.paid':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subRef = invoice.subscription;
        const subId = typeof subRef === 'string' ? subRef : subRef?.id;
        if (!subId) break;
        const sub = await stripe.subscriptions.retrieve(subId);
        await handleSubscriptionUpdated(stripe, admin, sub);
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error('Stripe webhook handler error:', event.type, e);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
