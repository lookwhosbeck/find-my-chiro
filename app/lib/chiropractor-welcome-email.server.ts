import 'server-only';

import { createClient } from '@supabase/supabase-js';

import { canonicalAppOrigin } from '@/app/lib/app-origin.server';
import {
  sendBrevoChiropractorProfileLiveEmail,
  sendBrevoChiropractorProfileNudgeEmail,
  sendBrevoChiropractorWelcomeEmail,
} from '@/app/lib/brevo-transactional.server';

export type ChiropractorWelcomeResult =
  | { sent: true }
  | { sent: false; skippedReason: string };

/**
 * Sends Brevo E2 once per chiropractor after email is confirmed (idempotent via profiles column).
 */
export async function sendChiropractorWelcomeEmailIfNeeded(args: {
  userId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  /** ISO timestamp from auth user; skip if unconfirmed */
  emailConfirmedAt?: string | null;
}): Promise<ChiropractorWelcomeResult> {
  if (!args.emailConfirmedAt) {
    return { sent: false, skippedReason: 'email_not_confirmed' };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const loomUrl = process.env.CHIRO_WELCOME_LOOM_URL?.trim();
  const templateId = Number(process.env.BREVO_CHIRO_WELCOME_TEMPLATE_ID ?? '12');

  if (!url || !service || url === 'https://placeholder.supabase.co') {
    return { sent: false, skippedReason: 'supabase_not_configured' };
  }
  if (!loomUrl) {
    return { sent: false, skippedReason: 'loom_url_not_configured' };
  }

  const admin = createClient(url, service);
  const { data: row, error } = await admin
    .from('profiles')
    .select('id, role, chiropractor_welcome_email_sent_at')
    .eq('id', args.userId)
    .maybeSingle();

  if (error) {
    console.error('chiropractor welcome: profile select', error);
    return { sent: false, skippedReason: 'profile_error' };
  }
  if (!row) {
    return { sent: false, skippedReason: 'no_profile' };
  }
  if (row.role !== 'chiropractor') {
    return { sent: false, skippedReason: 'not_chiropractor' };
  }
  if (row.chiropractor_welcome_email_sent_at) {
    return { sent: false, skippedReason: 'already_sent' };
  }

  const profileUrl = `${canonicalAppOrigin()}/chiropractor/${args.userId}`;
  const displayName = [args.firstName, args.lastName].filter(Boolean).join(' ').trim() || args.email;

  try {
    await sendBrevoChiropractorWelcomeEmail({
      to: { email: args.email, name: displayName },
      profileUrl,
      loomUrl,
      templateId,
    });
  } catch (e) {
    console.error('chiropractor welcome: brevo', e);
    return { sent: false, skippedReason: 'brevo_error' };
  }

  const now = new Date().toISOString();
  const { error: upErr } = await admin
    .from('profiles')
    .update({ chiropractor_welcome_email_sent_at: now, updated_at: now })
    .eq('id', args.userId)
    .is('chiropractor_welcome_email_sent_at', null);

  if (upErr) {
    console.error('chiropractor welcome: profile update', upErr);
  }

  return { sent: true };
}

export async function sendChiropractorProfileLiveEmailIfNeeded(userId: string): Promise<ChiropractorWelcomeResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const templateId = Number(process.env.BREVO_CHIRO_PROFILE_LIVE_TEMPLATE_ID ?? '15');

  if (!url || !service || url === 'https://placeholder.supabase.co') {
    return { sent: false, skippedReason: 'supabase_not_configured' };
  }

  const admin = createClient(url, service);
  const { data: row, error } = await admin
    .from('profiles')
    .select('id, role, first_name, last_name, email, license_approved_email_sent_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('chiropractor live: profile select', error);
    return { sent: false, skippedReason: 'profile_error' };
  }
  if (!row) return { sent: false, skippedReason: 'no_profile' };
  if (row.role !== 'chiropractor') return { sent: false, skippedReason: 'not_chiropractor' };
  if (row.license_approved_email_sent_at) return { sent: false, skippedReason: 'already_sent' };
  if (!row.email) return { sent: false, skippedReason: 'no_email' };

  const profileUrl = `${canonicalAppOrigin()}/chiropractor/${userId}`;
  const displayName = [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || row.email;

  try {
    await sendBrevoChiropractorProfileLiveEmail({
      to: { email: row.email, name: displayName },
      profileUrl,
      templateId,
    });
  } catch (e) {
    console.error('chiropractor live: brevo', e);
    return { sent: false, skippedReason: 'brevo_error' };
  }

  const now = new Date().toISOString();
  const { error: upErr } = await admin
    .from('profiles')
    .update({ license_approved_email_sent_at: now, updated_at: now })
    .eq('id', userId)
    .is('license_approved_email_sent_at', null);

  if (upErr) {
    console.error('chiropractor live: profile update', upErr);
  }

  return { sent: true };
}

export async function sendChiropractorProfileNudgeEmailIfNeeded(userId: string): Promise<ChiropractorWelcomeResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const templateId = Number(process.env.BREVO_CHIRO_PROFILE_NUDGE_TEMPLATE_ID ?? '14');

  if (!url || !service || url === 'https://placeholder.supabase.co') {
    return { sent: false, skippedReason: 'supabase_not_configured' };
  }

  const admin = createClient(url, service);
  const { data: row, error } = await admin
    .from('profiles')
    .select('id, role, first_name, last_name, email, profile_nudge_email_sent_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('chiropractor nudge: profile select', error);
    return { sent: false, skippedReason: 'profile_error' };
  }
  if (!row) return { sent: false, skippedReason: 'no_profile' };
  if (row.role !== 'chiropractor') return { sent: false, skippedReason: 'not_chiropractor' };
  if (row.profile_nudge_email_sent_at) return { sent: false, skippedReason: 'already_sent' };
  if (!row.email) return { sent: false, skippedReason: 'no_email' };

  const profileUrl = `${canonicalAppOrigin()}/account`;
  const displayName = [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || row.email;

  try {
    await sendBrevoChiropractorProfileNudgeEmail({
      to: { email: row.email, name: displayName },
      profileUrl,
      templateId,
    });
  } catch (e) {
    console.error('chiropractor nudge: brevo', e);
    return { sent: false, skippedReason: 'brevo_error' };
  }

  const now = new Date().toISOString();
  const { error: upErr } = await admin
    .from('profiles')
    .update({ profile_nudge_email_sent_at: now, updated_at: now })
    .eq('id', userId)
    .is('profile_nudge_email_sent_at', null);

  if (upErr) {
    console.error('chiropractor nudge: profile update', upErr);
  }

  return { sent: true };
}
