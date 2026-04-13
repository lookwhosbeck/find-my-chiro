import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { verifyReferralActionToken } from '@/app/lib/referral-action-token.server';
import { loadReferralLite, markReferralViewedIfNeeded } from '@/app/lib/referral-lifecycle.server';
import { requireBearerUser } from '@/app/lib/referrals-api.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Preview referral for the receiving chiropractor. With signed `t`, marks viewed once (status sent → viewed).
 * Without `t`, requires Bearer JWT and `referralId` query; user must be the receiving chiropractor.
 */
export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !service || url === 'https://placeholder.supabase.co') {
    return NextResponse.json({ error: 'Server not configured' }, { status: 503 });
  }

  const supabaseService = createClient(url, service) as SupabaseClient<any>;

  const token = req.nextUrl.searchParams.get('t')?.trim() ?? '';
  const referralIdParam = req.nextUrl.searchParams.get('referralId')?.trim() ?? '';

  let referralId = referralIdParam;
  let actorUserId: string | null = null;
  let signedPayload: ReturnType<typeof verifyReferralActionToken> = null;

  if (token) {
    signedPayload = verifyReferralActionToken(token);
    if (!signedPayload) {
      return NextResponse.json({ error: 'Invalid or expired link.' }, { status: 400 });
    }
    referralId = signedPayload.rid;
  } else {
    const auth = await requireBearerUser(req);
    if (auth.ok === false) return auth.response;
    actorUserId = auth.user.id;
    if (!referralId) {
      return NextResponse.json({ error: 'Missing referralId (or signed token t).' }, { status: 400 });
    }
  }

  const referral = await loadReferralLite(supabaseService, referralId);
  if (!referral) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  if (signedPayload) {
    if (signedPayload.recv !== referral.receiving_chiropractor_id) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }
  } else if (actorUserId !== referral.receiving_chiropractor_id) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  await markReferralViewedIfNeeded(supabaseService, referral, actorUserId);

  const refreshed = await loadReferralLite(supabaseService, referralId);

  const { data: refProfiles } = await supabaseService
    .from('profiles')
    .select('id, first_name, last_name')
    .in('id', [referral.referring_chiropractor_id, referral.receiving_chiropractor_id]);

  const byId = Object.fromEntries((refProfiles ?? []).map((p) => [p.id, p]));

  const referring = byId[referral.referring_chiropractor_id];
  const receiving = byId[referral.receiving_chiropractor_id];
  const referringLabel = referring
    ? `Dr. ${[referring.first_name, referring.last_name].filter(Boolean).join(' ')}`.trim()
    : 'Referring doctor';
  const receivingLabel = receiving
    ? `Dr. ${[receiving.first_name, receiving.last_name].filter(Boolean).join(' ')}`.trim()
    : 'You';

  return NextResponse.json({
    referralId: referral.id,
    status: refreshed?.status ?? referral.status,
    patientLabel: `${referral.patient_first_name} ${referral.patient_last_initial}.`,
    referringDoctorLabel: referringLabel,
    receivingDoctorLabel: receivingLabel,
  });
}
