import 'server-only';

import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { canUseTrustSensitiveFeatures } from './capabilities';
import { isPremiumProfile } from './subscription';

export async function requireBearerUser(req: Request): Promise<
  | { ok: true; user: User; supabaseService: SupabaseClient<any> }
  | { ok: false; response: NextResponse }
> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !anon || !service || url === 'https://placeholder.supabase.co') {
    return { ok: false, response: NextResponse.json({ error: 'Server not configured' }, { status: 503 }) };
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const jwt = authHeader.slice(7);

  const supabaseAuth = createClient(url, anon);
  const {
    data: { user },
    error: userErr,
  } = await supabaseAuth.auth.getUser(jwt);

  if (userErr || !user?.id) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  /** Tables `referrals` / `referral_events` are not in generated types yet */
  const supabaseService = createClient(url, service) as SupabaseClient<any>;
  return { ok: true, user, supabaseService };
}

export type ReferrerEligibility = {
  eligible: boolean;
  reason?: string;
};

/**
 * Server-side gate: chiropractor role + premium + license approved.
 */
export async function getReferrerEligibility(
  supabaseService: SupabaseClient<any>,
  userId: string,
): Promise<ReferrerEligibility> {
  const { data: profile, error: pErr } = await supabaseService
    .from('profiles')
    .select('role, subscription_status, current_period_end')
    .eq('id', userId)
    .maybeSingle();

  if (pErr || !profile) {
    return { eligible: false, reason: 'profile_not_found' };
  }
  if (profile.role !== 'chiropractor') {
    return { eligible: false, reason: 'not_chiropractor' };
  }

  const { data: chiro, error: cErr } = await supabaseService
    .from('chiropractors')
    .select('license_verification_status')
    .eq('id', userId)
    .maybeSingle();

  if (cErr || !chiro) {
    return { eligible: false, reason: 'chiropractor_row_missing' };
  }

  const premium = isPremiumProfile(profile);
  const trust = canUseTrustSensitiveFeatures(profile, chiro);
  if (!premium) return { eligible: false, reason: 'premium_required' };
  if (!trust) return { eligible: false, reason: 'license_not_approved' };

  return { eligible: true };
}

export function siteBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  return '';
}
