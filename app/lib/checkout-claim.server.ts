import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';

export const CHECKOUT_CLAIM_COOKIE = 'fmc_checkout_claim';

export type CheckoutClaimPayload = {
  sessionId: string;
  email: string;
  customerId: string;
  /** Null when checkout was verification fee only (free plan). */
  subscriptionId: string | null;
  priceId: string | null;
  plan: 'free' | 'monthly' | 'annual';
  exp: number;
};

function getSecret(): string {
  const s = process.env.CHECKOUT_CLAIM_SECRET?.trim() || process.env.STRIPE_SECRET_KEY?.trim();
  if (!s) {
    throw new Error('CHECKOUT_CLAIM_SECRET or STRIPE_SECRET_KEY is required for checkout claims');
  }
  return s;
}

function encode(payload: CheckoutClaimPayload): string {
  const json = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = createHmac('sha256', getSecret()).update(json).digest('base64url');
  return `${json}.${sig}`;
}

export function signCheckoutClaim(payload: Omit<CheckoutClaimPayload, 'exp'>, ttlSeconds = 7200): string {
  const full: CheckoutClaimPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  return encode(full);
}

export function verifyCheckoutClaimToken(token: string): CheckoutClaimPayload | null {
  try {
    const dot = token.indexOf('.');
    if (dot < 1) return null;
    const json = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = createHmac('sha256', getSecret()).update(json).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(json, 'base64url').toString('utf8')) as CheckoutClaimPayload;
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (!payload.sessionId?.startsWith('cs_')) return null;
    if (payload.subscriptionId !== null && !payload.subscriptionId.startsWith('sub_')) {
      return null;
    }
    if (!payload.email?.trim()) return null;
    return payload;
  } catch {
    return null;
  }
}
