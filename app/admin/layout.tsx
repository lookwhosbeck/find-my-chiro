import { cookies } from 'next/headers';
import type { ReactNode } from 'react';

import { MovynAdminChrome } from '@/components/layout/movyn-admin-chrome';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const defaultOpen =
    cookieStore.get('sidebar_state')?.value === 'true' || cookieStore.get('sidebar_state') === undefined;

  return <MovynAdminChrome defaultOpen={defaultOpen}>{children}</MovynAdminChrome>;
}
