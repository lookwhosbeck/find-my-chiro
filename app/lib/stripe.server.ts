import 'server-only';
import Stripe from 'stripe';

let stripeSingleton: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key, {
      typescript: true,
    });
  }
  return stripeSingleton;
}

export function getStripePriceIdVerification(): string | null {
  return process.env.STRIPE_PRICE_ID_VERIFICATION?.trim() || null;
}

export function getStripePriceIdMonthly(): string | null {
  return process.env.STRIPE_PRICE_ID_MONTHLY?.trim() || null;
}

export function getStripePriceIdAnnual(): string | null {
  return process.env.STRIPE_PRICE_ID_ANNUAL?.trim() || null;
}

export function resolvePriceIdFromPlan(plan: string): string | null {
  const p = plan.toLowerCase().trim();
  if (p === 'monthly') return getStripePriceIdMonthly();
  if (p === 'annual' || p === 'yearly') return getStripePriceIdAnnual();
  return null;
}

export function isAllowedSubscriptionPriceId(priceId: string): boolean {
  const m = getStripePriceIdMonthly();
  const a = getStripePriceIdAnnual();
  return priceId === m || priceId === a;
}

export function isAllowedVerificationPriceId(priceId: string): boolean {
  const v = getStripePriceIdVerification();
  return !!v && priceId === v;
}

export type SignupCheckoutPlan = 'free' | 'monthly' | 'annual';

/** Line items for chiropractor signup: optional verification + optional Premium recurring. */
export function lineItemsForSignupCheckout(
  plan: SignupCheckoutPlan,
  opts: { includeVerification: boolean },
): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const verification = getStripePriceIdVerification();
  const items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  if (opts.includeVerification) {
    if (!verification) {
      throw new Error('STRIPE_PRICE_ID_VERIFICATION is not configured');
    }
    items.push({ price: verification, quantity: 1 });
  }
  if (plan === 'monthly' || plan === 'annual') {
    const subPrice = resolvePriceIdFromPlan(plan);
    if (!subPrice || !isAllowedSubscriptionPriceId(subPrice)) {
      throw new Error('Invalid subscription price for plan');
    }
    items.push({ price: subPrice, quantity: 1 });
  }
  if (items.length === 0) {
    throw new Error('Checkout requires at least one line item');
  }
  return items;
}

/** Whether the completed Checkout Session included the one-time verification price. */
export async function checkoutSessionIncludesVerificationPrice(
  stripe: Stripe,
  sessionId: string,
): Promise<boolean> {
  const v = getStripePriceIdVerification();
  if (!v) return false;
  const lines = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100 });
  return lines.data.some((li) => {
    const p = li.price;
    const id = typeof p === 'string' ? p : p?.id;
    return id === v;
  });
}

/** Stripe marks $0 checkouts (e.g. 100% coupons) as no_payment_required instead of paid. */
export function isCheckoutSessionPaymentComplete(paymentStatus: string | null | undefined): boolean {
  return paymentStatus === 'paid' || paymentStatus === 'no_payment_required';
}

export function appOriginFromRequest(req: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, '');
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  if (host) return `${proto}://${host}`.replace(/\/$/, '');
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, '')}`;
  return 'http://localhost:3000';
}
