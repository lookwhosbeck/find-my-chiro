import 'server-only';

import { createHmac, timingSafeEqual } from 'crypto';

export type ReferralSignedTokenPayload = {
  /** Referral row id */
  rid: string;
  /** Receiving chiropractor user id — must match row */
  recv: string;
  exp: number;
  v: 1;
};

function getSecret(): string {
  const s =
    process.env.REFERRAL_ACTION_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    process.env.STRIPE_SECRET_KEY?.trim();
  if (!s) {
    throw new Error('REFERRAL_ACTION_SECRET (or CRON_SECRET) is not configured');
  }
  return s;
}

function signPayload(payloadJson: string): string {
  const h = createHmac('sha256', getSecret());
  h.update(payloadJson);
  return h.digest('base64url');
}

/**
 * URL-safe token: base64url(json).base64url(hmac)
 */
export function signReferralActionToken(payload: ReferralSignedTokenPayload): string {
  const payloadJson = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = signPayload(payloadJson);
  return `${payloadJson}.${sig}`;
}

export function verifyReferralActionToken(token: string): ReferralSignedTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadB64, sig] = parts;
    if (!payloadB64 || !sig) return null;
    const expected = signPayload(payloadB64);
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(sig, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const json = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const data = JSON.parse(json) as ReferralSignedTokenPayload;
    if (data.v !== 1 || typeof data.rid !== 'string' || typeof data.recv !== 'string' || typeof data.exp !== 'number') {
      return null;
    }
    if (Date.now() / 1000 > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

export function referralTokenExpiresInSeconds(secondsFromNow: number): number {
  return Math.floor(Date.now() / 1000) + secondsFromNow;
}

/** Default 30-day window for email action links */
export const REFERRAL_TOKEN_TTL_SEC = 60 * 60 * 24 * 30;
