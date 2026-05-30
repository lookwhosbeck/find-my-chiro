import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

const BILLING_TRIGGER_FIX_HINT =
  'Profile billing columns may be blocked by a database trigger — apply migration 20260530120000_fix_profile_subscription_trigger_service_role_v12 on Supabase.';

export class BillingSyncVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BillingSyncVerificationError';
  }
}

async function verifyProfileBillingRow(
  admin: SupabaseClient,
  userId: string,
  expected: {
    stripe_customer_id: string;
    subscription_status: string;
    subscription_price_id?: string | null;
    license_verification_fee_paid?: boolean;
  },
): Promise<void> {
  const { data, error } = await admin
    .from('profiles')
    .select(
      'stripe_customer_id, subscription_status, subscription_price_id, license_verification_fee_paid_at',
    )
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('verifyProfileBillingRow:', error);
    throw error;
  }
  if (!data) {
    throw new BillingSyncVerificationError('Profile not found after billing sync');
  }

  if (data.stripe_customer_id !== expected.stripe_customer_id) {
    throw new BillingSyncVerificationError(
      `stripe_customer_id is "${data.stripe_customer_id ?? 'NULL'}" but expected "${expected.stripe_customer_id}". ${BILLING_TRIGGER_FIX_HINT}`,
    );
  }
  if (data.subscription_status !== expected.subscription_status) {
    throw new BillingSyncVerificationError(
      `subscription_status is "${data.subscription_status}" but expected "${expected.subscription_status}". ${BILLING_TRIGGER_FIX_HINT}`,
    );
  }
  if (
    expected.subscription_price_id !== undefined &&
    data.subscription_price_id !== expected.subscription_price_id
  ) {
    throw new BillingSyncVerificationError(
      `subscription_price_id is "${data.subscription_price_id ?? 'NULL'}" but expected "${expected.subscription_price_id ?? 'NULL'}". ${BILLING_TRIGGER_FIX_HINT}`,
    );
  }
  if (
    expected.license_verification_fee_paid === true &&
    !data.license_verification_fee_paid_at
  ) {
    throw new BillingSyncVerificationError(
      `license_verification_fee_paid_at was not saved. ${BILLING_TRIGGER_FIX_HINT}`,
    );
  }
}

export async function syncProfileFromStripeSubscription(
  admin: SupabaseClient,
  userId: string,
  customerId: string,
  subscription: Stripe.Subscription,
  opts?: { licenseVerificationFeePaid?: boolean },
): Promise<void> {
  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const row: Record<string, unknown> = {
    stripe_customer_id: customerId,
    subscription_status: subscription.status,
    subscription_price_id: priceId,
    current_period_end: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  };
  if (opts?.licenseVerificationFeePaid) {
    row.license_verification_fee_paid_at = new Date().toISOString();
  }
  const { error } = await admin.from('profiles').update(row).eq('id', userId);
  if (error) {
    console.error('syncProfileFromStripeSubscription:', error);
    throw error;
  }

  await verifyProfileBillingRow(admin, userId, {
    stripe_customer_id: customerId,
    subscription_status: subscription.status,
    subscription_price_id: priceId,
    license_verification_fee_paid: opts?.licenseVerificationFeePaid ? true : undefined,
  });
}

/** Free tier after verification-only Checkout; keeps subscription fields cleared. */
export async function syncProfileAfterVerificationPayment(
  admin: SupabaseClient,
  userId: string,
  customerId: string,
): Promise<void> {
  const { error } = await admin
    .from('profiles')
    .update({
      stripe_customer_id: customerId,
      subscription_status: 'free',
      subscription_price_id: null,
      current_period_end: null,
      license_verification_fee_paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  if (error) {
    console.error('syncProfileAfterVerificationPayment:', error);
    throw error;
  }

  await verifyProfileBillingRow(admin, userId, {
    stripe_customer_id: customerId,
    subscription_status: 'free',
    subscription_price_id: null,
    license_verification_fee_paid: true,
  });
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
