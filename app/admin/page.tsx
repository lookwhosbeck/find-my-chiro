import { redirect } from 'next/navigation';

import { AdminChiropractorsClient } from './AdminChiropractorsClient';
import { fetchAdminChiropractorRows } from '@/app/lib/admin-chiropractors.server';
import { createSupabaseServerClient } from '@/app/lib/supabase-server';
import { accountSettingsHref } from '@/lib/movyn-account-routes';

/**
 * Platform admin: server-rendered list; mutations use the existing PATCH API with Bearer token.
 */
export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return (
      <p className="text-muted-foreground text-sm">
        Supabase is not configured for this deployment. Add URL and anon key to build admin.
      </p>
    );
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect('/signin?redirect=/admin');
  }

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .maybeSingle();

  if (profileErr || profile?.role !== 'admin') {
    redirect(accountSettingsHref('profile'));
  }

  const initialRows = await fetchAdminChiropractorRows({ limit: 50, offset: 0 });

  return <AdminChiropractorsClient initialRows={initialRows} />;
}
