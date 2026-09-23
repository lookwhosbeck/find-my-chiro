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

function paymentIntentFromSession(session: Stripe.Checkout.Session): Stripe.PaymentIntent | null {
  const piRef = session.payment_intent;
  if (!piRef) return null;
  if (typeof piRef === 'object' && 'id' in piRef) return piRef;
  return null;
}

function paymentIntentIdFromSession(session: Stripe.Checkout.Session): string | null {
  const piRef = session.payment_intent;
  if (!piRef) return null;
  return typeof piRef === 'string' ? piRef : piRef.id ?? null;
}

/** True when Checkout finished and payment succeeded (handles brief Stripe lag after redirect). */
export function isCheckoutSessionReadyForFulfillment(session: Stripe.Checkout.Session): boolean {
  if (session.status !== 'complete') return false;
  if (isCheckoutSessionPaymentComplete(session.payment_status)) return true;
  const pi = paymentIntentFromSession(session);
  return pi?.status === 'succeeded' || pi?.status === 'processing';
}

export function checkoutSessionEmail(session: Stripe.Checkout.Session): string {
  const fromDetails =
    session.customer_details?.email?.trim() ||
    session.customer_email?.trim() ||
    (typeof session.customer === 'object' &&
    session.customer &&
    !('deleted' in session.customer)
      ? (session.customer as { email?: string | null }).email?.trim()
      : '') ||
    '';
  if (fromDetails) return fromDetails;

  const pi = paymentIntentFromSession(session);
  const fromPi =
    pi?.receipt_email?.trim() ||
    (typeof pi?.latest_charge === 'object' &&
    pi.latest_charge &&
    'billing_details' in pi.latest_charge
      ? (pi.latest_charge as { billing_details?: { email?: string | null } }).billing_details?.email?.trim()
      : '') ||
    '';
  return fromPi || '';
}

export async function checkoutSessionEmailResolved(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
): Promise<string> {
  const direct = checkoutSessionEmail(session);
  if (direct) return direct;

  const piId = paymentIntentIdFromSession(session);
  if (!piId) return '';

  const pi = await stripe.paymentIntents.retrieve(piId, { expand: ['latest_charge'] });
  return checkoutSessionEmail({ ...session, payment_intent: pi });
}

/**
 * Payment-mode Checkout often omits session.customer unless customer_creation is always.
 * Resolve from session, PaymentIntent, or create/reuse a Customer by checkout email.
 */
export async function resolveCheckoutSessionCustomerId(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  opts?: { email?: string },
): Promise<string | null> {
  const fromSession =
    typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;
  if (fromSession) return fromSession;

  const piId = paymentIntentIdFromSession(session);
  if (piId) {
    const pi =
      paymentIntentFromSession(session) ??
      (await stripe.paymentIntents.retrieve(piId));
    const fromPi = typeof pi.customer === 'string' ? pi.customer : pi.customer?.id ?? null;
    if (fromPi) return fromPi;
  }

  const email = opts?.email?.trim() || (await checkoutSessionEmailResolved(stripe, session));
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

const CHECKOUT_FULFILLMENT_RETRIES = 6;
const CHECKOUT_FULFILLMENT_DELAY_MS = 400;

/** Retrieve Checkout Session, waiting briefly for Stripe to mark payment complete after redirect. */
export async function retrieveCheckoutSessionForFulfillment(
  stripe: Stripe,
  sessionId: string,
): Promise<Stripe.Checkout.Session> {
  let last: Stripe.Checkout.Session | null = null;
  for (let attempt = 0; attempt < CHECKOUT_FULFILLMENT_RETRIES; attempt += 1) {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer', 'payment_intent.latest_charge'],
    });
    last = session;
    if (isCheckoutSessionReadyForFulfillment(session)) {
      return session;
    }
    if (attempt < CHECKOUT_FULFILLMENT_RETRIES - 1) {
      await new Promise((resolve) => setTimeout(resolve, CHECKOUT_FULFILLMENT_DELAY_MS * (attempt + 1)));
    }
  }
  return last!;
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
