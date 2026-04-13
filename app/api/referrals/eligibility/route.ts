import { NextResponse } from 'next/server';

import { getReferrerEligibility, requireBearerUser } from '@/app/lib/referrals-api.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const auth = await requireBearerUser(req);
  if (auth.ok === false) return auth.response;

  const elig = await getReferrerEligibility(auth.supabaseService, auth.user.id);
  return NextResponse.json({
    canRefer: elig.eligible,
    reason: elig.reason ?? null,
  });
}
