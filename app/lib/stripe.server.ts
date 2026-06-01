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

export function checkoutSessionEmail(session: Stripe.Checkout.Session): string {
  return (
    session.customer_details?.email?.trim() ||
    session.customer_email?.trim() ||
    (typeof session.customer === 'object' &&
    session.customer &&
    !('deleted' in session.customer)
      ? (session.customer as { email?: string | null }).email?.trim()
      : '') ||
    ''
  );
}

/**
 * Payment-mode Checkout often omits session.customer unless customer_creation is always.
 * Resolve from session, PaymentIntent, or create/reuse a Customer by checkout email.
 */
export async function resolveCheckoutSessionCustomerId(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
): Promise<string | null> {
  const fromSession =
    typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;
  if (fromSession) return fromSession;

  const piRef = session.payment_intent;
  const piId = typeof piRef === 'string' ? piRef : piRef?.id;
  if (piId) {
    const pi = await stripe.paymentIntents.retrieve(piId);
    const fromPi = typeof pi.customer === 'string' ? pi.customer : pi.customer?.id ?? null;
    if (fromPi) return fromPi;
  }

  const email = checkoutSessionEmail(session);
  if (!email) return null;

  const existing = await stripe.customers.list({ email, limit: 1 });
  const match = existing.data[0];
  if (match?.id) return match.id;

  const created = await stripe.customers.create({
    email,
    metadata: { checkout_session_id: session.id },
  });
  return created.id;
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
