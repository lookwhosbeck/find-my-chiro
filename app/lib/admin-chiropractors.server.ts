import 'server-only';

import { createClient } from '@supabase/supabase-js';

export type AdminChiroRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  practiceName: string | null;
  subscriptionStatus: string | null;
  verificationStatus: string;
  signedUpAt: string | null;
  submittedForReviewAt: string | null;
};

export async function fetchAdminChiropractorRows(options?: { limit?: number; offset?: number }): Promise<AdminChiroRow[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !service || url === 'https://placeholder.supabase.co') {
    return [];
  }

  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  const admin = createClient(url, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: rows, error } = await admin
    .from('chiropractors')
    .select(
      `
      id,
      license_verification_status,
      submitted_for_review_at,
      profiles!inner (
        first_name,
        last_name,
        email,
        subscription_status,
        created_at
      ),
      organizations ( name )
    `,
    )
    .order('created_at', { ascending: false, referencedTable: 'profiles' })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('fetchAdminChiropractorRows:', error);
    return [];
  }

  return (rows || []).map((row: Record<string, unknown>) => {
    const profiles = row.profiles as
      | {
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          subscription_status?: string | null;
          created_at?: string | null;
        }
      | null;
    const org = row.organizations as { name?: string | null } | null;
    return {
      id: String(row.id),
      firstName: profiles?.first_name ?? '',
      lastName: profiles?.last_name ?? '',
      email: profiles?.email ?? null,
      practiceName: org?.name ?? null,
      subscriptionStatus: profiles?.subscription_status ?? null,
      verificationStatus: String(row.license_verification_status ?? ''),
      signedUpAt: profiles?.created_at ?? null,
      submittedForReviewAt: (row.submitted_for_review_at as string | null) ?? null,
    };
  });
}
