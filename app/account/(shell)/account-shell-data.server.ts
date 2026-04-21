import 'server-only';

import { createSupabaseServerClient } from '@/app/lib/supabase-server';

import type { AccountShellProfileSummary } from './account-shell-types';

export type { AccountShellProfileSummary } from './account-shell-types';

/**
 * One profiles row for instant account chrome (sidebar IA + user block) while the client shell loads detail.
 */
export async function fetchAccountShellProfileSummary(): Promise<AccountShellProfileSummary | null> {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user?.id) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, role, first_name, last_name, email')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error || !data) return null;
    const role = data.role as AccountShellProfileSummary['role'];
    if (role !== 'patient' && role !== 'chiropractor' && role !== 'admin') return null;

    return {
      id: String(data.id),
      role,
      first_name: data.first_name ?? null,
      last_name: data.last_name ?? null,
      email: data.email ?? null,
    };
  } catch {
    return null;
  }
}
