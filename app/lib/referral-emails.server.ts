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

function personName(first?: string | null, last?: string | null): string {
  const f = first?.trim() || '';
  const l = last?.trim() || '';
  return `${f} ${l}`.trim();
}

function doctorDisplayName(first?: string | null, last?: string | null): string {
  const core = personName(first, last);
  return core ? `Dr. ${core}` : 'A colleague';
}

function withTrailingDot(v?: string | null): string {
  const core = v?.trim() || '';
  if (!core) return '';
  return core.endsWith('.') ? core : `${core}.`;
}

function resolvedSearchSummary(raw?: string | null): string {
  const t = raw?.trim();
  if (t) return t;
  return 'the care preferences shared with your current chiropractor';
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
  created_at?: string | null;
};

type ChiroEmailContext = {
  practiceName: string;
  practiceCity: string;
  practiceAddress: string;
  practicePhone: string;
  practiceWebsite: string;
  firstTechnique: string;
  firstPhilosophy: string;
};

async function loadReferral(supabase: SupabaseClient, id: string): Promise<ReferralRow | null> {
  const { data, error } = await supabase.from('referrals').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return data as ReferralRow;
}

type ReferralEmailStampColumn =
  | 'patient_intro_email_sent_at'
  | 'referring_copy_email_sent_at'
  | 'receiving_dc_email_sent_at';

/** One winner per column: prevents duplicate Brevo sends when two workers race on the same referral. */
async function tryClaimReferralEmailSlot(
  supabase: SupabaseClient,
  referralId: string,
  column: ReferralEmailStampColumn,
): Promise<boolean> {
  const claimedAt = new Date().toISOString();
  const updateBody =
    column === 'patient_intro_email_sent_at'
      ? { patient_intro_email_sent_at: claimedAt }
      : column === 'referring_copy_email_sent_at'
        ? { referring_copy_email_sent_at: claimedAt }
        : { receiving_dc_email_sent_at: claimedAt };
  const { data, error } = await supabase
    .from('referrals')
    .update(updateBody)
    .eq('id', referralId)
    .is(column, null)
    .select('id')
    .maybeSingle();
  if (error) {
    console.error(`referral email claim (${column}):`, error);
    return false;
  }
  return Boolean(data?.id);
}

async function releaseReferralEmailSlot(
  supabase: SupabaseClient,
  referralId: string,
  column: ReferralEmailStampColumn,
): Promise<void> {
  const updateBody =
    column === 'patient_intro_email_sent_at'
      ? { patient_intro_email_sent_at: null }
      : column === 'referring_copy_email_sent_at'
        ? { referring_copy_email_sent_at: null }
        : { receiving_dc_email_sent_at: null };
  const { error } = await supabase.from('referrals').update(updateBody).eq('id', referralId);
  if (error) console.error(`referral email release (${column}):`, error);
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

async function loadChiroEmailContext(
  supabase: SupabaseClient,
  userId: string,
): Promise<ChiroEmailContext | null> {
  const { data, error } = await supabase
    .from('chiropractors')
    .select(
      `
      organizations(name, city, state, zip_code, address_line_1, phone, website),
      chiropractor_modalities(modalities(name)),
      chiropractor_philosophies(philosophies(name))
    `,
    )
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;

  const orgRaw = Array.isArray(data.organizations) ? data.organizations[0] : data.organizations;
  const org = (orgRaw ?? {}) as {
    name?: string | null;
    city?: string | null;
    state?: string | null;
    zip_code?: string | null;
    address_line_1?: string | null;
    phone?: string | null;
    website?: string | null;
  };

  const modalityRows = Array.isArray(data.chiropractor_modalities) ? data.chiropractor_modalities : [];
  const philosophyRows = Array.isArray(data.chiropractor_philosophies) ? data.chiropractor_philosophies : [];

  const firstTechnique = (() => {
    for (const row of modalityRows as Array<{ modalities?: { name?: string | null } | Array<{ name?: string | null }> }>) {
      const mRaw = row?.modalities;
      const m = Array.isArray(mRaw) ? mRaw[0] : mRaw;
      const name = m?.name?.trim();
      if (name) return name;
    }
    return '';
  })();

  const firstPhilosophy = (() => {
    for (const row of philosophyRows as Array<{ philosophies?: { name?: string | null } | Array<{ name?: string | null }> }>) {
      const pRaw = row?.philosophies;
      const p = Array.isArray(pRaw) ? pRaw[0] : pRaw;
      const name = p?.name?.trim();
      if (name) return name;
    }
    return '';
  })();

  const city = org.city?.trim() || '';
  const state = org.state?.trim() || '';
  const zip = org.zip_code?.trim() || '';
  const cityStateZip = [city, state].filter(Boolean).join(', ') + (zip ? (city || state ? ` ${zip}` : zip) : '');
  const address = [org.address_line_1?.trim() || '', cityStateZip.trim()].filter(Boolean).join(', ');

  return {
    practiceName: org.name?.trim() || '',
    practiceCity: city || '',
    practiceAddress: address || '',
    practicePhone: org.phone?.trim() || '',
    practiceWebsite: org.website?.trim() || '',
    firstTechnique,
    firstPhilosophy,
  };
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

function buildDashboardUrl(): string {
  const base = siteBaseUrl() || '';
  const path = '/account';
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
  const referringCtx = await loadChiroEmailContext(supabase, row.referring_chiropractor_id);
  const receivingCtx = await loadChiroEmailContext(supabase, row.receiving_chiropractor_id);
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
    const referringNameCore = personName(referring.first_name, referring.last_name) || 'A colleague';
    const receivingNameCore = personName(receiving.first_name, receiving.last_name) || 'A colleague';
    const referringNameDisplay = doctorDisplayName(referring.first_name, referring.last_name);
    const receivingNameDisplay = doctorDisplayName(receiving.first_name, receiving.last_name);

    const buildBaseParams = (r: ReferralRow): Record<string, string> => {
      const respondUrl = buildRespondUrl(r.id, r.receiving_chiropractor_id);
      const practiceProfileUrl = buildReceivingProfileUrl(r.receiving_chiropractor_id);
      const dashboardUrl = buildDashboardUrl();
      const patientLastInitialDot = withTrailingDot(r.patient_last_initial);
      const patientLabel = `${r.patient_first_name} ${patientLastInitialDot}`.trim();
      const patientInitials = `${r.patient_first_name} ${patientLastInitialDot}`.trim();
      const sentTimestamp = new Date(r.created_at || Date.now()).toLocaleString();
      const technique = receivingCtx?.firstTechnique || 'a compatible approach';
      const philosophy = receivingCtx?.firstPhilosophy || 'patient-centered care';
      const receivingDocCity = receivingCtx?.practiceCity || 'your area';
      const practiceName = receivingCtx?.practiceName || receivingNameDisplay;
      const practiceCity = receivingCtx?.practiceCity || receivingDocCity;
      const practiceAddress = receivingCtx?.practiceAddress || '';
      const practicePhone = receivingCtx?.practicePhone || '';
      const practiceWebsite = receivingCtx?.practiceWebsite || '';
      const referringDocPractice = referringCtx?.practiceName || '';
      const referringDocCity = referringCtx?.practiceCity || '';
      const referralNote = r.notes?.trim() || '';
      return {
        referringDoctorName: referringNameCore,
        referringDoctorDisplayName: referringNameDisplay,
        referringDocName: referringNameCore,
        referringDocDisplayName: referringNameDisplay,
        referringDoctorFirstName: referringFirst,
        referringDoctorLastName: referringLast,
        receivingDoctorName: receivingNameCore,
        receivingDoctorDisplayName: receivingNameDisplay,
        receivingDocName: receivingNameCore,
        receivingDocDisplayName: receivingNameDisplay,
        receivingDoctorFirstName: receivingFirst,
        receivingDoctorLastName: receivingLast,
        matchScore: String(r.match_score),
        searchSummary: resolvedSearchSummary(r.match_summary),
        practiceProfileUrl,
        receivingDocProfileUrl: practiceProfileUrl,
        respondUrl,
        dashboardUrl,
        referralNotes: referralNote,
        referringDocNote: referralNote,
        patientFirstName: r.patient_first_name,
        patientLastInitial: r.patient_last_initial,
        patientLastInitialWithDot: patientLastInitialDot,
        patientDisplayName: patientLabel,
        patientName: patientLabel,
        patientLabel,
        patientInitials,
        receivingDocCity,
        practiceName,
        practiceCity,
        practiceAddress,
        practicePhone,
        practiceWebsite,
        technique,
        philosophy,
        referringDocPractice,
        referringDocCity,
        durationOfCare: 'See dashboard for patient details',
        movingTimeline: 'See dashboard for patient timeline',
        sentTimestamp,
        referralId: r.id,
      };
    };

    const toSend: Array<{ run: () => Promise<void> }> = [];

    // Reload before each decision so concurrent workers see stamps from other sends / requests.
    if (tPatient) {
      const freshPatient = await loadReferral(supabase, referralId);
      if (!freshPatient) return { ok: false, error: 'referral_not_found' };
      row = freshPatient;
      if (!row.patient_intro_email_sent_at) {
        const r = row;
        toSend.push({
          run: async () => {
            const claimed = await tryClaimReferralEmailSlot(
              supabase,
              referralId,
              'patient_intro_email_sent_at',
            );
            if (!claimed) return;
            try {
              const patientLastInitialDot = withTrailingDot(r.patient_last_initial);
              const patientLabel = `${r.patient_first_name} ${patientLastInitialDot}`.trim();
              await sendBrevoReferralTemplateEmail({
                to: { email: r.patient_email, name: patientLabel },
                templateId: tPatient,
                params: {
                  ...buildBaseParams(r),
                  FIRSTNAME: r.patient_first_name,
                  LASTNAME: patientLastInitialDot,
                },
              });
            } catch (e) {
              await releaseReferralEmailSlot(supabase, referralId, 'patient_intro_email_sent_at');
              throw e;
            }
          },
        });
      }
    }

    if (tReferring) {
      const freshReferring = await loadReferral(supabase, referralId);
      if (!freshReferring) return { ok: false, error: 'referral_not_found' };
      row = freshReferring;
      if (!row.referring_copy_email_sent_at) {
        const r = row;
        toSend.push({
          run: async () => {
            const claimed = await tryClaimReferralEmailSlot(
              supabase,
              referralId,
              'referring_copy_email_sent_at',
            );
            if (!claimed) return;
            try {
              await sendBrevoReferralTemplateEmail({
                to: { email: referring.email!, name: referringNameDisplay },
                templateId: tReferring,
                params: {
                  ...buildBaseParams(r),
                  FIRSTNAME: referringFirst || 'Doctor',
                  LASTNAME: referringLast,
                },
              });
            } catch (e) {
              await releaseReferralEmailSlot(supabase, referralId, 'referring_copy_email_sent_at');
              throw e;
            }
          },
        });
      }
    }

    if (tReceiving) {
      const freshReceiving = await loadReferral(supabase, referralId);
      if (!freshReceiving) return { ok: false, error: 'referral_not_found' };
      row = freshReceiving;
      if (!row.receiving_dc_email_sent_at) {
        const r = row;
        toSend.push({
          run: async () => {
            const claimed = await tryClaimReferralEmailSlot(
              supabase,
              referralId,
              'receiving_dc_email_sent_at',
            );
            if (!claimed) return;
            try {
              await sendBrevoReferralTemplateEmail({
                to: { email: receiving.email!, name: receivingNameDisplay },
                templateId: tReceiving,
                params: {
                  ...buildBaseParams(r),
                  FIRSTNAME: receivingFirst || 'Doctor',
                  LASTNAME: receivingLast,
                },
              });
            } catch (e) {
              await releaseReferralEmailSlot(supabase, referralId, 'receiving_dc_email_sent_at');
              throw e;
            }
          },
        });
      }
    }

    const outcomes = await Promise.allSettled(toSend.map((t) => t.run()));

    const firstReject = outcomes.find((o): o is PromiseRejectedResult => o.status === 'rejected');
    if (firstReject) {
      const msg = firstReject.reason instanceof Error ? firstReject.reason.message : 'send_failed';
      throw new Error(msg);
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
  const referringCtx = await loadChiroEmailContext(supabase, row.referring_chiropractor_id);
  const receivingCtx = await loadChiroEmailContext(supabase, row.receiving_chiropractor_id);
  if (!referring?.email) return;

  const referringNameCore = personName(referring.first_name, referring.last_name) || 'A colleague';
  const receivingNameCore = personName(receiving?.first_name, receiving?.last_name) || 'A colleague';
  const referringNameDisplay = doctorDisplayName(referring.first_name, referring.last_name);
  const receivingNameDisplay = doctorDisplayName(receiving?.first_name, receiving?.last_name);
  const patientLastInitialDot = withTrailingDot(row.patient_last_initial);
  const patientLabel = `${row.patient_first_name} ${patientLastInitialDot}`.trim();
  const dashboardUrl = buildDashboardUrl();
  const practiceProfileUrl = buildReceivingProfileUrl(row.receiving_chiropractor_id);

  await sendBrevoReferralTemplateEmail({
    to: { email: referring.email, name: referringNameDisplay },
    templateId,
    params: {
      referringDoctorName: referringNameCore,
      referringDoctorDisplayName: referringNameDisplay,
      referringDocName: referringNameCore,
      referringDocDisplayName: referringNameDisplay,
      receivingDoctorName: receivingNameCore,
      receivingDoctorDisplayName: receivingNameDisplay,
      receivingDocName: receivingNameCore,
      receivingDocDisplayName: receivingNameDisplay,
      patientDisplayName: patientLabel,
      patientName: patientLabel,
      patientFirstName: row.patient_first_name,
      patientLastInitial: row.patient_last_initial,
      patientLastInitialWithDot: patientLastInitialDot,
      outcome,
      matchScore: String(row.match_score),
      searchSummary: resolvedSearchSummary(row.match_summary),
      practiceProfileUrl,
      receivingDocProfileUrl: practiceProfileUrl,
      dashboardUrl,
      referralId: row.id,
      patientInitials: patientLabel,
      receivingDocCity: receivingCtx?.practiceCity || 'your area',
      practiceName: receivingCtx?.practiceName || receivingNameDisplay,
      practiceCity: receivingCtx?.practiceCity || 'your area',
      practiceAddress: receivingCtx?.practiceAddress || '',
      practicePhone: receivingCtx?.practicePhone || '',
      practiceWebsite: receivingCtx?.practiceWebsite || '',
      technique: receivingCtx?.firstTechnique || 'a compatible approach',
      philosophy: receivingCtx?.firstPhilosophy || 'patient-centered care',
      referringDocPractice: referringCtx?.practiceName || '',
      referringDocCity: referringCtx?.practiceCity || '',
      referringDocNote: row.notes?.trim() || '',
      durationOfCare: 'See dashboard for patient details',
      movingTimeline: 'See dashboard for patient timeline',
      sentTimestamp: new Date(row.created_at || Date.now()).toLocaleString(),
      FIRSTNAME: referring.first_name?.trim() || 'Doctor',
      LASTNAME: referring.last_name?.trim() || '',
    },
  });
}
