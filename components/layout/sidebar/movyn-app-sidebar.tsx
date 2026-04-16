'use client';

import * as React from 'react';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { MovynLogo } from '@/app/components/MovynLogo';
import { MovynNavMain, type MovynNavMainGroup } from '@/components/layout/sidebar/movyn-nav-main';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useIsTablet } from '@/hooks/use-mobile';

export function MovynAppSidebar({
  navGroups,
  footer,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  navGroups: MovynNavMainGroup[];
  footer: ReactNode;
}) {
  const pathname = usePathname();
  const { setOpen, setOpenMobile, isMobile } = useSidebar();
  const isTablet = useIsTablet();

  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [pathname, isMobile, setOpenMobile]);

  useEffect(() => {
    setOpen(!isTablet);
  }, [isTablet, setOpen]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-sidebar-border border-b px-2 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="data-[slot=sidebar-menu-button]:p-2">
              <Link href="/" className="gap-2">
                <MovynLogo variant="standard" className="h-8 w-auto shrink-0" />
                <span className="truncate font-medium">Movyn</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="h-full">
          <MovynNavMain groups={navGroups} />
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter className="border-sidebar-border gap-2 border-t p-2">{footer}</SidebarFooter>
    </Sidebar>
  );
}
