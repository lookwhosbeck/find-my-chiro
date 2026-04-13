import { createSupabaseClient } from './supabase-client';

export async function getAccessTokenOrNull(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const supabase = createSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

export async function fetchReferralCanRefer(): Promise<boolean> {
  const token = await getAccessTokenOrNull();
  if (!token) return false;
  const res = await fetch('/api/referrals/eligibility', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return false;
  const j = (await res.json()) as { canRefer?: boolean };
  return Boolean(j.canRefer);
}

export async function createReferralRequest(body: {
  receivingChiropractorId: string;
  patientEmail: string;
  patientFirstName: string;
  patientLastInitial: string;
  notes?: string;
  searchFilters: Record<string, unknown>;
}): Promise<
  | { ok: true; referral: unknown; emailWarning?: string | null }
  | { ok: false; error: string; field?: string }
> {
  const token = await getAccessTokenOrNull();
  if (!token) return { ok: false, error: 'Sign in to send referrals.' };
  const res = await fetch('/api/referrals', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const j = (await res.json()) as {
    error?: string;
    field?: string;
    referral?: unknown;
    emailWarning?: string | null;
  };
  if (!res.ok) {
    return { ok: false, error: j.error || 'Request failed', field: j.field };
  }
  return { ok: true, referral: j.referral, emailWarning: j.emailWarning ?? null };
}
