'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ClipboardList } from 'lucide-react';

import { getMovynDashboardProviderStyle } from '@/components/layout/movyn-dashboard-layout';
import { MovynAppSidebar } from '@/components/layout/sidebar/movyn-app-sidebar';
import { MovynSiteHeader } from '@/components/layout/header/movyn-site-header';
import { Button } from '@/components/ui/button';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { createSupabaseClient } from '@/app/lib/supabase-client';
import { accountSettingsHref } from '@/lib/movyn-account-routes';
import { useRouter } from 'next/navigation';

export function MovynAdminChrome({ defaultOpen, children }: { defaultOpen: boolean; children: ReactNode }) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push('/');
  };

  return (
    <SidebarProvider defaultOpen={defaultOpen} className="min-h-svh" style={getMovynDashboardProviderStyle()}>
      <MovynAppSidebar
        variant="inset"
        navGroups={[
          {
            title: 'Admin',
            items: [{ title: 'Chiropractors', href: '/admin', icon: ClipboardList }],
          },
        ]}
        footer={
          <div className="flex w-full flex-col gap-1">
            <Button variant="ghost" size="sm" className="justify-start" asChild>
              <Link href={accountSettingsHref('profile')}>My account</Link>
            </Button>
            <Button variant="ghost" size="sm" className="justify-start" asChild>
              <Link href="/">Back to home</Link>
            </Button>
            <Button variant="ghost" size="sm" className="justify-start" onClick={() => void handleSignOut()}>
              Sign out
            </Button>
          </div>
        }
      />
      <SidebarInset className="flex min-h-svh flex-col overflow-hidden md:peer-data-[variant=inset]:shadow-sm">
        <MovynSiteHeader title="Chiropractor signups" />
        <div className="bg-muted/40 flex min-h-0 flex-1 flex-col">
          <div className="@container/main p-(--content-padding) flex min-h-0 flex-1 flex-col overflow-y-auto xl:group-data-[theme-content-layout=centered]/layout:container xl:group-data-[theme-content-layout=centered]/layout:mx-auto">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
