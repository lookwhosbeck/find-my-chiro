import { NextResponse } from 'next/server';

import { requireBearerUser } from '@/app/lib/referrals-api.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireBearerUser(req);
  if (auth.ok === false) return auth.response;

  const referralId = params.id?.trim();
  if (!referralId) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const { supabaseService, user } = auth;

  const { data: referral, error: rErr } = await supabaseService
    .from('referrals')
    .select('*')
    .eq('id', referralId)
    .maybeSingle();

  if (rErr || !referral) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const row = referral as {
    referring_chiropractor_id: string;
    receiving_chiropractor_id: string;
  };

  if (row.referring_chiropractor_id !== user.id && row.receiving_chiropractor_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: events, error: eErr } = await supabaseService
    .from('referral_events')
    .select('*')
    .eq('referral_id', referralId)
    .order('created_at', { ascending: true });

  if (eErr) {
    console.error('referral events:', eErr);
    return NextResponse.json({ error: 'Failed to load events' }, { status: 500 });
  }

  const otherId =
    user.id === row.referring_chiropractor_id ? row.receiving_chiropractor_id : row.referring_chiropractor_id;

  const { data: otherProfileRaw } = await supabaseService
    .from('profiles')
    .select('id, first_name, last_name, email')
    .eq('id', otherId)
    .maybeSingle();

  const otherProfile = otherProfileRaw as {
    first_name?: string | null;
    last_name?: string | null;
  } | null;

  const otherLabel = otherProfile
    ? `Dr. ${[otherProfile.first_name, otherProfile.last_name].filter(Boolean).join(' ')}`.trim()
    : 'Colleague';

  return NextResponse.json({
    referral,
    events: events ?? [],
    otherParty: {
      id: otherId,
      label: otherLabel,
      direction: user.id === row.referring_chiropractor_id ? 'receiving' : 'referring',
    },
  });
}
