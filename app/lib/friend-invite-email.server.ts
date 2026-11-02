import 'server-only';

import { createClient } from '@supabase/supabase-js';

import { canonicalAppOrigin } from '@/app/lib/app-origin.server';
import { sendBrevoFriendInviteEmail } from '@/app/lib/brevo-transactional.server';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export type FriendInviteResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

/**
 * Sends a Brevo E10 friend-invite email from a signed-in chiropractor to one address.
 */
export async function sendFriendInviteEmail(args: {
  inviterUserId: string;
  inviteeEmail: string;
}): Promise<FriendInviteResult> {
  const inviteeEmail = args.inviteeEmail.trim().toLowerCase();
  if (!EMAIL_RE.test(inviteeEmail) || inviteeEmail.length > 320) {
    return { ok: false, error: 'Enter a valid email', status: 400 };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const templateIdRaw = process.env.BREVO_FRIEND_INVITE_TEMPLATE_ID?.trim() ?? '29';
  const templateId = Number(templateIdRaw);

  if (!url || !service || url === 'https://placeholder.supabase.co') {
    return { ok: false, error: 'Supabase not configured', status: 501 };
  }
  if (!process.env.BREVO_API_KEY?.trim()) {
    return { ok: false, error: 'Email is not configured', status: 503 };
  }
  if (!Number.isFinite(templateId) || templateId <= 0) {
    return { ok: false, error: 'Invite email template is not configured', status: 503 };
  }

  const admin = createClient(url, service);
  const { data: row, error } = await admin
    .from('profiles')
    .select('id, role, first_name, last_name, email')
    .eq('id', args.inviterUserId)
    .maybeSingle();

  if (error) {
    console.error('friend invite: profile select', error);
    return { ok: false, error: 'Could not load your profile', status: 500 };
  }
  if (!row || row.role !== 'chiropractor') {
    return { ok: false, error: 'Only chiropractors can send invites', status: 403 };
  }

  const inviterEmail =
    typeof row.email === 'string' ? row.email.trim().toLowerCase() : '';
  if (inviterEmail && inviterEmail === inviteeEmail) {
    return { ok: false, error: 'Invite someone other than yourself', status: 400 };
  }

  const inviterName =
    [row.first_name, row.last_name].filter(Boolean).join(' ').trim() ||
    inviterEmail ||
    'A colleague';

  const signupUrl = `${canonicalAppOrigin()}/signup`;

  try {
    await sendBrevoFriendInviteEmail({
      to: { email: inviteeEmail },
      inviterName,
      signupUrl,
      templateId,
    });
  } catch (e) {
    console.error('friend invite: brevo', e);
    return { ok: false, error: 'Could not send the invite email', status: 502 };
  }

  return { ok: true };
}
