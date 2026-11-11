import { createHmac, timingSafeEqual } from 'crypto';

/** Signup confirmation links stay valid for 7 days, independent of Supabase's shorter OTP window. */
export const EMAIL_CONFIRM_TTL_SECONDS = 60 * 60 * 24 * 7;

type EmailConfirmTicketPayload = {
  userId: string;
  tokenHash: string;
  exp: number;
};

function ticketSecret(): string | null {
  const secret = process.env.SUPABASE_SEND_EMAIL_HOOK_SECRET?.trim();
  return secret || null;
}

export function signEmailConfirmTicket(userId: string, tokenHash: string): string | null {
  const secret = ticketSecret();
  if (!secret || !userId || !tokenHash) return null;
  const payload: EmailConfirmTicketPayload = {
    userId,
    tokenHash,
    exp: Math.floor(Date.now() / 1000) + EMAIL_CONFIRM_TTL_SECONDS,
  };
  const json = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = createHmac('sha256', secret).update(json).digest('base64url');
  return `${json}.${sig}`;
}

/** Returns the user id when the ticket matches this link's token hash and has not expired. */
export function verifyEmailConfirmTicket(ticket: string, tokenHash: string): string | null {
  const secret = ticketSecret();
  if (!secret || !ticket || !tokenHash) return null;
  try {
    const dot = ticket.indexOf('.');
    if (dot < 1) return null;
    const json = ticket.slice(0, dot);
    const sig = ticket.slice(dot + 1);
    const expected = createHmac('sha256', secret).update(json).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(
      Buffer.from(json, 'base64url').toString('utf8'),
    ) as EmailConfirmTicketPayload;
    if (payload.tokenHash !== tokenHash) return null;
    if (typeof payload.userId !== 'string' || !payload.userId) return null;
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload.userId;
  } catch {
    return null;
  }
}
