import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { applyReferralResponse } from '@/app/lib/referral-lifecycle.server';
import { verifyReferralActionToken } from '@/app/lib/referral-action-token.server';
import { requireBearerUser } from '@/app/lib/referrals-api.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Accept or decline a referral. Body: { token?: string, referralId?: string, action: 'accept' | 'decline' }
 * Either `token` (signed link) or Bearer + `referralId` as receiving chiropractor.
 */
export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !service || url === 'https://placeholder.supabase.co') {
    return NextResponse.json({ error: 'Server not configured' }, { status: 503 });
  }

  const supabaseService = createClient(url, service) as SupabaseClient<any>;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const actionRaw = String(body.action ?? '').toLowerCase();
  if (actionRaw !== 'accept' && actionRaw !== 'decline') {
    return NextResponse.json({ error: 'action must be accept or decline' }, { status: 400 });
  }
  const action = actionRaw === 'accept' ? 'accept' : 'decline';

  const token = typeof body.token === 'string' ? body.token.trim() : '';
  const referralIdParam = typeof body.referralId === 'string' ? body.referralId.trim() : '';

  let referralId = referralIdParam;
  let actorUserId: string | null = null;
  let tokenForApply: string | null = null;

  if (token) {
    const payload = verifyReferralActionToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired link.' }, { status: 400 });
    }
    referralId = payload.rid;
    tokenForApply = token;
  } else {
    const auth = await requireBearerUser(req);
    if (auth.ok === false) return auth.response;
    actorUserId = auth.user.id;
    if (!referralId) {
      return NextResponse.json({ error: 'referralId required when not using token' }, { status: 400 });
    }
  }

  const result = await applyReferralResponse(supabaseService, referralId, action, actorUserId, tokenForApply);

  if (result.ok === false) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}
