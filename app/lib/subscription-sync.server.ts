import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

export async function syncProfileFromStripeSubscription(
  admin: SupabaseClient,
  userId: string,
  customerId: string,
  subscription: Stripe.Subscription,
): Promise<void> {
  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const row = {
    stripe_customer_id: customerId,
    subscription_status: subscription.status,
    subscription_price_id: priceId,
    current_period_end: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await admin.from('profiles').update(row).eq('id', userId);
  if (error) {
    console.error('syncProfileFromStripeSubscription:', error);
    throw error;
  }
}

export async function clearSubscriptionToFree(
  admin: SupabaseClient,
  userId: string,
  opts?: { keepStripeCustomerId?: boolean },
): Promise<void> {
  const { data: existing } = await admin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .maybeSingle();

  const patch: Record<string, unknown> = {
    subscription_status: 'free',
    subscription_price_id: null,
    current_period_end: null,
    updated_at: new Date().toISOString(),
  };
  if (opts?.keepStripeCustomerId === false) {
    patch.stripe_customer_id = null;
  } else if (existing?.stripe_customer_id) {
    patch.stripe_customer_id = existing.stripe_customer_id;
  }

  const { error } = await admin.from('profiles').update(patch).eq('id', userId);
  if (error) {
    console.error('clearSubscriptionToFree:', error);
    throw error;
  }
}

export function userIdFromSubscriptionMetadata(sub: Stripe.Subscription): string | null {
  const m = sub.metadata?.supabase_user_id?.trim();
  return m || null;
}
