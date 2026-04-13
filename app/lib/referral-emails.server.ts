import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { sendBrevoReferralTemplateEmail } from './brevo-transactional.server';
import {
  REFERRAL_TOKEN_TTL_SEC,
  referralTokenExpiresInSeconds,
  signReferralActionToken,
} from './referral-action-token.server';
import { siteBaseUrl } from './referrals-api.server';

function envTemplateId(key: string): number | null {
  const v = process.env[key]?.trim();
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function drName(first?: string | null, last?: string | null): string {
  const f = first?.trim() || '';
  const l = last?.trim() || '';
  const core = `${f} ${l}`.trim();
  return core ? `Dr. ${core}` : 'A colleague';
}

function withTrailingDot(v?: string | null): string {
  const core = v?.trim() || '';
  if (!core) return '';
  return core.endsWith('.') ? core : `${core}.`;
}

type ReferralRow = {
  id: string;
  referring_chiropractor_id: string;
  receiving_chiropractor_id: string;
  patient_email: string;
  patient_first_name: string;
  patient_last_initial: string;
  notes: string | null;
  match_score: number;
  match_summary: string | null;
  status: string;
  patient_intro_email_sent_at: string | null;
  referring_copy_email_sent_at: string | null;
  receiving_dc_email_sent_at: string | null;
};

async function loadReferral(supabase: SupabaseClient, id: string): Promise<ReferralRow | null> {
  const { data, error } = await supabase.from('referrals').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return data as ReferralRow;
}

async function loadProfileEmailName(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ email: string | null; first_name: string | null; last_name: string | null } | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('email, first_name, last_name')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as { email: string | null; first_name: string | null; last_name: string | null };
}

function buildRespondUrl(referralId: string, receivingId: string): string {
  const base = siteBaseUrl() || '';
  const exp = referralTokenExpiresInSeconds(REFERRAL_TOKEN_TTL_SEC);
  const token = signReferralActionToken({ rid: referralId, recv: receivingId, exp, v: 1 });
  const path = `/referral/respond?t=${encodeURIComponent(token)}`;
  if (base) return `${base}${path}`;
  return path;
}

function buildReceivingProfileUrl(receivingId: string): string {
  const base = siteBaseUrl() || '';
  const path = `/chiropractor/${receivingId}`;
  return base ? `${base}${path}` : path;
}

/**
 * Idempotent: sends patient intro, referring copy, and receiving DC emails when template IDs + Brevo are configured.
 */
export async function sendInitialReferralEmailsIfNeeded(
  supabase: SupabaseClient,
  referralId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!process.env.BREVO_API_KEY?.trim()) {
    console.warn('referral emails: BREVO_API_KEY missing, skipping sends');
    return { ok: true };
  }

  let row = await loadReferral(supabase, referralId);
  if (!row) return { ok: false, error: 'referral_not_found' };

  const referring = await loadProfileEmailName(supabase, row.referring_chiropractor_id);
  const receiving = await loadProfileEmailName(supabase, row.receiving_chiropractor_id);
  if (!referring?.email || !receiving?.email) {
    return { ok: false, error: 'missing_profile_email' };
  }

  const tPatient = envTemplateId('BREVO_REFERRAL_PATIENT_TEMPLATE_ID');
  const tReferring = envTemplateId('BREVO_REFERRAL_SENDER_COPY_TEMPLATE_ID');
  const tReceiving = envTemplateId('BREVO_REFERRAL_RECEIVING_DC_TEMPLATE_ID');

  try {
    const referringFirst = referring.first_name?.trim() || '';
    const referringLast = referring.last_name?.trim() || '';
    const receivingFirst = receiving.first_name?.trim() || '';
    const receivingLast = receiving.last_name?.trim() || '';
    const referringName = drName(referring.first_name, referring.last_name);
    const receivingName = drName(receiving.first_name, receiving.last_name);

    const buildBaseParams = (r: ReferralRow): Record<string, string> => {
      const respondUrl = buildRespondUrl(r.id, r.receiving_chiropractor_id);
      const practiceProfileUrl = buildReceivingProfileUrl(r.receiving_chiropractor_id);
      const patientLastInitialDot = withTrailingDot(r.patient_last_initial);
      const patientLabel = `${r.patient_first_name} ${patientLastInitialDot}`.trim();
      return {
        referringDoctorName: referringName,
        referringDocName: referringName,
        referringDoctorFirstName: referringFirst,
        referringDoctorLastName: referringLast,
        receivingDoctorName: receivingName,
        receivingDocName: receivingName,
        receivingDoctorFirstName: receivingFirst,
        receivingDoctorLastName: receivingLast,
        matchScore: String(r.match_score),
        searchSummary: r.match_summary ?? '',
        practiceProfileUrl,
        respondUrl,
        referralNotes: r.notes?.trim() ?? '',
        patientFirstName: r.patient_first_name,
        patientLastInitial: r.patient_last_initial,
        patientLastInitialWithDot: patientLastInitialDot,
        patientDisplayName: patientLabel,
        patientName: patientLabel,
        patientLabel,
      };
    };

    if (tPatient) {
      row = await loadReferral(supabase, referralId);
      if (row && !row.patient_intro_email_sent_at) {
        const patientLastInitialDot = withTrailingDot(row.patient_last_initial);
        const patientLabel = `${row.patient_first_name} ${patientLastInitialDot}`.trim();
        await sendBrevoReferralTemplateEmail({
          to: { email: row.patient_email, name: patientLabel },
          templateId: tPatient,
          params: {
            ...buildBaseParams(row),
            FIRSTNAME: row.patient_first_name,
            LASTNAME: patientLastInitialDot,
          },
        });
        const { error: u1 } = await supabase
          .from('referrals')
          .update({ patient_intro_email_sent_at: new Date().toISOString() })
          .eq('id', referralId)
          .is('patient_intro_email_sent_at', null);
        if (u1) console.error('referral patient email stamp:', u1);
      }
    }

    if (tReferring) {
      row = await loadReferral(supabase, referralId);
      if (row && !row.referring_copy_email_sent_at) {
        await sendBrevoReferralTemplateEmail({
          to: { email: referring.email, name: referringName },
          templateId: tReferring,
          params: {
            ...buildBaseParams(row),
            FIRSTNAME: referringFirst || 'Doctor',
            LASTNAME: referringLast,
          },
        });
        const { error: u2 } = await supabase
          .from('referrals')
          .update({ referring_copy_email_sent_at: new Date().toISOString() })
          .eq('id', referralId)
          .is('referring_copy_email_sent_at', null);
        if (u2) console.error('referring copy email stamp:', u2);
      }
    }

    if (tReceiving) {
      row = await loadReferral(supabase, referralId);
      if (row && !row.receiving_dc_email_sent_at) {
        await sendBrevoReferralTemplateEmail({
          to: { email: receiving.email, name: receivingName },
          templateId: tReceiving,
          params: {
            ...buildBaseParams(row),
            FIRSTNAME: receivingFirst || 'Doctor',
            LASTNAME: receivingLast,
          },
        });
        const { error: u3 } = await supabase
          .from('referrals')
          .update({ receiving_dc_email_sent_at: new Date().toISOString() })
          .eq('id', referralId)
          .is('receiving_dc_email_sent_at', null);
        if (u3) console.error('receiving dc email stamp:', u3);
      }
    }

    return { ok: true };
  } catch (e) {
    console.error('sendInitialReferralEmailsIfNeeded:', e);
    return { ok: false, error: e instanceof Error ? e.message : 'send_failed' };
  }
}

/** Optional push to referring DC; dashboard (Account → Referrals) remains the source of truth. No-ops if template env unset. */
export async function sendReferralOutcomeEmailToReferringIfNeeded(
  supabase: SupabaseClient,
  referralId: string,
  outcome: 'accepted' | 'declined',
): Promise<void> {
  if (!process.env.BREVO_API_KEY?.trim()) return;

  const key =
    outcome === 'accepted'
      ? 'BREVO_REFERRAL_ACCEPTED_TEMPLATE_ID'
      : 'BREVO_REFERRAL_DECLINED_TEMPLATE_ID';
  const templateId = envTemplateId(key);
  if (!templateId) return;

  const row = await loadReferral(supabase, referralId);
  if (!row) return;

  const referring = await loadProfileEmailName(supabase, row.referring_chiropractor_id);
  const receiving = await loadProfileEmailName(supabase, row.receiving_chiropractor_id);
  if (!referring?.email) return;

  const referringName = drName(referring.first_name, referring.last_name);
  const receivingName = drName(receiving?.first_name, receiving?.last_name);
  const patientLastInitialDot = withTrailingDot(row.patient_last_initial);
  const patientLabel = `${row.patient_first_name} ${patientLastInitialDot}`.trim();

  await sendBrevoReferralTemplateEmail({
    to: { email: referring.email, name: referringName },
    templateId,
    params: {
      referringDoctorName: referringName,
      referringDocName: referringName,
      receivingDoctorName: receivingName,
      receivingDocName: receivingName,
      patientDisplayName: patientLabel,
      patientName: patientLabel,
      patientFirstName: row.patient_first_name,
      patientLastInitial: row.patient_last_initial,
      patientLastInitialWithDot: patientLastInitialDot,
      outcome,
      matchScore: String(row.match_score),
      searchSummary: row.match_summary ?? '',
      practiceProfileUrl: buildReceivingProfileUrl(row.receiving_chiropractor_id),
      FIRSTNAME: referring.first_name?.trim() || 'Doctor',
      LASTNAME: referring.last_name?.trim() || '',
    },
  });
}
