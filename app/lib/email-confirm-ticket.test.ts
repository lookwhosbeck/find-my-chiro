import { afterEach, describe, expect, it } from 'vitest';

import {
  EMAIL_CONFIRM_TTL_SECONDS,
  signEmailConfirmTicket,
  verifyEmailConfirmTicket,
} from './email-confirm-ticket';

describe('email confirm ticket', () => {
  const previous = process.env.SUPABASE_SEND_EMAIL_HOOK_SECRET;

  afterEach(() => {
    if (previous === undefined) delete process.env.SUPABASE_SEND_EMAIL_HOOK_SECRET;
    else process.env.SUPABASE_SEND_EMAIL_HOOK_SECRET = previous;
  });

  it('accepts a ticket for the same link within 7 days', () => {
    process.env.SUPABASE_SEND_EMAIL_HOOK_SECRET = 'test-secret';
    const ticket = signEmailConfirmTicket('user-1', 'pkce_abc');
    expect(ticket).toBeTruthy();
    expect(verifyEmailConfirmTicket(ticket!, 'pkce_abc')).toBe('user-1');
    expect(EMAIL_CONFIRM_TTL_SECONDS).toBe(60 * 60 * 24 * 7);
  });

  it('rejects a ticket presented with a different token hash', () => {
    process.env.SUPABASE_SEND_EMAIL_HOOK_SECRET = 'test-secret';
    const ticket = signEmailConfirmTicket('user-1', 'pkce_abc');
    expect(verifyEmailConfirmTicket(ticket!, 'pkce_other')).toBeNull();
  });

  it('rejects an expired ticket', () => {
    process.env.SUPABASE_SEND_EMAIL_HOOK_SECRET = 'test-secret';
    const now = Date.now;
    Date.now = () => 1_000_000_000_000;
    const ticket = signEmailConfirmTicket('user-1', 'pkce_abc');
    Date.now = () => 1_000_000_000_000 + (EMAIL_CONFIRM_TTL_SECONDS + 5) * 1000;
    expect(verifyEmailConfirmTicket(ticket!, 'pkce_abc')).toBeNull();
    Date.now = now;
  });
});
