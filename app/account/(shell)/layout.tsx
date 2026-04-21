import { cookies } from 'next/headers';
import type { ReactNode } from 'react';

import { MovynAccountDashboardShell } from './account-dashboard-client';
import { fetchAccountShellProfileSummary } from './account-shell-data.server';

export default async function AccountShellLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const defaultOpen =
    cookieStore.get('sidebar_state')?.value === 'true' || cookieStore.get('sidebar_state') === undefined;

  const initialProfileSummary = await fetchAccountShellProfileSummary();

  return (
    <MovynAccountDashboardShell defaultOpen={defaultOpen} initialProfileSummary={initialProfileSummary}>
      {children}
    </MovynAccountDashboardShell>
  );
}
