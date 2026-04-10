import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

import { sendChiropractorProfileNudgeEmailIfNeeded } from '@/app/lib/chiropractor-welcome-email.server';
import { evaluateChiropractorSearchReadiness } from '@/app/lib/profile-completeness';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HOURS_48_MS = 48 * 60 * 60 * 1000;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const bearer = req.headers.get('authorization');
  if (bearer === `Bearer ${secret}`) return true;
  const alt = req.headers.get('x-cron-secret');
  return alt === secret;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !service || url === 'https://placeholder.supabase.co') {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 501 });
  }

  const admin = createClient(url, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const cutoff = Date.now() - HOURS_48_MS;
  const confirmedIds: string[] = [];

  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      console.error('cron nudge: listUsers', error);
      return NextResponse.json({ error: 'Could not list users' }, { status: 500 });
    }
    const users = data?.users ?? [];
    for (const user of users) {
      const confirmedAt = user.email_confirmed_at ? Date.parse(user.email_confirmed_at) : NaN;
      if (!Number.isFinite(confirmedAt) || confirmedAt > cutoff) continue;
      confirmedIds.push(user.id);
    }
    if (users.length < 200) break;
    page += 1;
  }

  if (!confirmedIds.length) {
    return NextResponse.json({ ok: true, considered: 0, sent: 0, skipped: 0 });
  }

  const { data: profileRows, error: profileErr } = await admin
    .from('profiles')
    .select('id, role, profile_nudge_email_sent_at')
    .in('id', confirmedIds)
    .eq('role', 'chiropractor')
    .is('profile_nudge_email_sent_at', null);

  if (profileErr) {
    console.error('cron nudge: profiles', profileErr);
    return NextResponse.json({ error: 'Could not load profiles' }, { status: 500 });
  }

  const targetIds = (profileRows ?? []).map((r) => r.id);
  if (!targetIds.length) {
    return NextResponse.json({ ok: true, considered: 0, sent: 0, skipped: 0 });
  }

  const [{ data: chiroRows, error: chiroErr }, { data: mods }, { data: focus }, { data: phil }, { data: pay }] =
    await Promise.all([
      admin
        .from('chiropractors')
        .select('id, license_verification_status, organizations(address_line_1, city, state, zip_code)')
        .in('id', targetIds),
      admin.from('chiropractor_modalities').select('chiropractor_id').in('chiropractor_id', targetIds),
      admin.from('chiropractor_focus_areas').select('chiropractor_id').in('chiropractor_id', targetIds),
      admin.from('chiropractor_philosophies').select('chiropractor_id').in('chiropractor_id', targetIds),
      admin.from('chiropractor_payment_models').select('chiropractor_id').in('chiropractor_id', targetIds),
    ]);

  if (chiroErr) {
    console.error('cron nudge: chiropractors', chiroErr);
    return NextResponse.json({ error: 'Could not load chiropractors' }, { status: 500 });
  }

  const modalitiesSet = new Set((mods ?? []).map((r) => r.chiropractor_id));
  const focusSet = new Set((focus ?? []).map((r) => r.chiropractor_id));
  const philosophySet = new Set((phil ?? []).map((r) => r.chiropractor_id));
  const paymentSet = new Set((pay ?? []).map((r) => r.chiropractor_id));

  let sent = 0;
  let skipped = 0;
  let considered = 0;

  for (const row of chiroRows ?? []) {
    if (row.license_verification_status === 'approved') {
      skipped += 1;
      continue;
    }
    considered += 1;

    const orgRaw = row.organizations as
      | { address_line_1?: string | null; city?: string | null; state?: string | null; zip_code?: string | null }
      | { address_line_1?: string | null; city?: string | null; state?: string | null; zip_code?: string | null }[]
      | null;
    const org = Array.isArray(orgRaw) ? orgRaw[0] : orgRaw;

    const readiness = evaluateChiropractorSearchReadiness({
      addressLine1: org?.address_line_1 ?? null,
      city: org?.city ?? null,
      state: org?.state ?? null,
      zipCode: org?.zip_code ?? null,
      modalities: modalitiesSet.has(row.id) ? ['set'] : [],
      focusAreas: focusSet.has(row.id) ? ['set'] : [],
      philosophies: philosophySet.has(row.id) ? ['set'] : [],
      paymentModels: paymentSet.has(row.id) ? ['set'] : [],
    });

    if (readiness.isSearchReady) {
      skipped += 1;
      continue;
    }

    const result = await sendChiropractorProfileNudgeEmailIfNeeded(row.id);
    if (result.sent) sent += 1;
    else skipped += 1;
  }

  return NextResponse.json({ ok: true, considered, sent, skipped });
}
