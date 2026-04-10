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
