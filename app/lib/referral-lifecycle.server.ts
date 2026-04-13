import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { sendReferralOutcomeEmailToReferringIfNeeded } from './referral-emails.server';
import { verifyReferralActionToken } from './referral-action-token.server';
import { canTransitionReferralStatus, nextStatusForAction, type ReferralStatus } from './referrals-domain';

export type ReferralRowLite = {
  id: string;
  referring_chiropractor_id: string;
  receiving_chiropractor_id: string;
  status: ReferralStatus;
  patient_first_name: string;
  patient_last_initial: string;
};

export async function loadReferralLite(
  supabase: SupabaseClient,
  id: string,
): Promise<ReferralRowLite | null> {
  const { data, error } = await supabase
    .from('referrals')
    .select('id, referring_chiropractor_id, receiving_chiropractor_id, status, patient_first_name, patient_last_initial')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return data as ReferralRowLite;
}

export function canActorRespondToReferral(
  referral: ReferralRowLite,
  actorUserId: string | null,
  tokenPayload: { rid: string; recv: string } | null,
): boolean {
  if (tokenPayload && tokenPayload.rid === referral.id && tokenPayload.recv === referral.receiving_chiropractor_id) {
    return true;
  }
  if (actorUserId && actorUserId === referral.receiving_chiropractor_id) {
    return true;
  }
  return false;
}

export async function markReferralViewedIfNeeded(
  supabase: SupabaseClient,
  referral: ReferralRowLite,
  actorUserId: string | null,
): Promise<{ updated: boolean }> {
  if (referral.status !== 'sent') return { updated: false };

  const viewedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('referrals')
    .update({ status: 'viewed', viewed_at: viewedAt })
    .eq('id', referral.id)
    .eq('status', 'sent')
    .select('id')
    .maybeSingle();

  if (error || !data) return { updated: false };

  await supabase.from('referral_events').insert({
    referral_id: referral.id,
    event_type: 'viewed',
    actor_user_id: actorUserId,
    metadata: {},
  });

  return { updated: true };
}

export async function applyReferralResponse(
  supabase: SupabaseClient,
  referralId: string,
  action: 'accept' | 'decline',
  actorUserId: string | null,
  token: string | null,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const payload = token ? verifyReferralActionToken(token) : null;
  if (token && !payload) {
    return { ok: false, status: 400, error: 'Invalid or expired link.' };
  }

  const referral = await loadReferralLite(supabase, referralId);
  if (!referral) {
    return { ok: false, status: 404, error: 'Referral not found.' };
  }

  if (payload && (payload.rid !== referral.id || payload.recv !== referral.receiving_chiropractor_id)) {
    return { ok: false, status: 403, error: 'This link does not match this referral.' };
  }

  if (!canActorRespondToReferral(referral, actorUserId, payload)) {
    return { ok: false, status: 403, error: 'Not authorized to respond to this referral.' };
  }

  const next =
    action === 'accept' ? nextStatusForAction('accept') : nextStatusForAction('decline');
  const from = referral.status;
  if (!canTransitionReferralStatus(from, next === 'accepted' ? 'accepted' : 'declined')) {
    return { ok: false, status: 409, error: `Referral is already ${referral.status}.` };
  }

  const respondedAt = new Date().toISOString();
  const { data: updated, error: upErr } = await supabase
    .from('referrals')
    .update({ status: next, responded_at: respondedAt })
    .eq('id', referralId)
    .in('status', ['sent', 'viewed'])
    .select('id')
    .maybeSingle();

  if (upErr || !updated) {
    return { ok: false, status: 409, error: 'Could not update referral (it may have already been answered).' };
  }

  await supabase.from('referral_events').insert({
    referral_id: referralId,
    event_type: next === 'accepted' ? 'accepted' : 'declined',
    actor_user_id: actorUserId,
    metadata: { viaToken: Boolean(payload) },
  });

  try {
    await sendReferralOutcomeEmailToReferringIfNeeded(
      supabase,
      referralId,
      next === 'accepted' ? 'accepted' : 'declined',
    );
  } catch (e) {
    console.error('referral outcome email:', e);
  }

  return { ok: true };
}
