import { NextResponse } from 'next/server';

import { sendInitialReferralEmailsIfNeeded } from '@/app/lib/referral-emails.server';
import { computeMatchForReferral } from '@/app/lib/referral-match.server';
import {
  buildSearchContextSummary,
  validateReferralCreate,
  type ReferralCreateInput,
} from '@/app/lib/referrals-domain';
import {
  ensureChiropractorRowForReferrerIfNeeded,
  getReferrerEligibility,
  requireBearerUser,
} from '@/app/lib/referrals-api.server';
import type { PatientSearchFilters } from '@/app/lib/queries';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const auth = await requireBearerUser(req);
  if (auth.ok === false) return auth.response;

  const { supabaseService, user } = auth;

  const { data: sent, error: e1 } = await supabaseService
    .from('referrals')
    .select('*')
    .eq('referring_chiropractor_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  const { data: received, error: e2 } = await supabaseService
    .from('referrals')
    .select('*')
    .eq('receiving_chiropractor_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (e1 || e2) {
    console.error('referrals list:', e1, e2);
    return NextResponse.json({ error: 'Failed to load referrals' }, { status: 500 });
  }

  return NextResponse.json({ sent: sent ?? [], received: received ?? [] });
}

export async function POST(req: Request) {
  const auth = await requireBearerUser(req);
  if (auth.ok === false) return auth.response;

  const { supabaseService, user } = auth;

  const elig = await getReferrerEligibility(supabaseService, user.id);
  if (!elig.eligible) {
    return NextResponse.json(
      { error: 'Referrals require an active subscription and approved license.', code: elig.reason },
      { status: 403 },
    );
  }

  const { data: actorProfile } = await supabaseService.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const actorRole = typeof actorProfile?.role === 'string' ? actorProfile.role : '';
  const stub = await ensureChiropractorRowForReferrerIfNeeded(supabaseService, user.id, actorRole);
  if (stub.ok === false) {
    return NextResponse.json(
      { error: 'Could not prepare your account to record a referral.', code: stub.error },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const input: ReferralCreateInput = {
    receivingChiropractorId: String(b.receivingChiropractorId ?? ''),
    patientEmail: String(b.patientEmail ?? ''),
    patientFirstName: String(b.patientFirstName ?? ''),
    patientLastInitial: String(b.patientLastInitial ?? ''),
    notes: b.notes != null ? String(b.notes) : null,
    searchFilters: (b.searchFilters as PatientSearchFilters) ?? {},
  };

  const validated = validateReferralCreate(input);
  if (validated.ok === false) {
    return NextResponse.json({ error: validated.error, field: validated.field }, { status: 400 });
  }

  const n = validated.normalized;
  if (n.receivingChiropractorId === user.id) {
    return NextResponse.json({ error: 'You cannot refer a patient to yourself.' }, { status: 400 });
  }

  const matchResult = await computeMatchForReferral(supabaseService, n.receivingChiropractorId, n.searchFilters);
  if (!matchResult) {
    return NextResponse.json({ error: 'Receiving chiropractor not found or not accepting referrals.' }, { status: 404 });
  }

  const matchSummary = buildSearchContextSummary(n.searchFilters);

  const insertPayload = {
    referring_chiropractor_id: user.id,
    receiving_chiropractor_id: n.receivingChiropractorId,
    patient_email: n.patientEmail,
    patient_first_name: n.patientFirstName,
    patient_last_initial: n.patientLastInitial,
    notes: n.notes,
    search_filters_snapshot: n.searchFilters as object,
    match_score: matchResult.matchScore,
    match_summary: matchSummary,
    status: 'sent',
  };

  const { data: created, error: insErr } = await supabaseService
    .from('referrals')
    .insert(insertPayload)
    .select('id')
    .single();

  if (insErr || !created?.id) {
    console.error('referral insert:', insErr);
    return NextResponse.json({ error: 'Could not create referral' }, { status: 500 });
  }

  const referralId = created.id as string;

  await supabaseService.from('referral_events').insert({
    referral_id: referralId,
    event_type: 'created',
    actor_user_id: user.id,
    metadata: { source: 'api' },
  });

  const sendResult = await sendInitialReferralEmailsIfNeeded(supabaseService, referralId);
  if (sendResult.ok === false) {
    console.error('referral initial emails:', sendResult.error);
  }

  const anyReferralTemplate = Boolean(
    process.env.BREVO_REFERRAL_PATIENT_TEMPLATE_ID?.trim() ||
      process.env.BREVO_REFERRAL_SENDER_COPY_TEMPLATE_ID?.trim() ||
      process.env.BREVO_REFERRAL_RECEIVING_DC_TEMPLATE_ID?.trim(),
  );
  if (sendResult.ok && process.env.BREVO_API_KEY?.trim() && anyReferralTemplate) {
    await supabaseService.from('referral_events').insert({
      referral_id: referralId,
      event_type: 'emails_sent',
      metadata: {},
    });
  }

  const { data: row } = await supabaseService.from('referrals').select('*').eq('id', referralId).single();

  return NextResponse.json({
    referral: row,
    emailWarning: sendResult.ok === false ? sendResult.error : null,
  });
}
