'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  ClipboardList,
  CreditCard,
  Heart,
  LayoutDashboard,
  MessageSquare,
  Send,
  Settings2,
  Sparkles,
  Stethoscope,
  User,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';

import { MovynLogo } from '@/app/components/MovynLogo';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const NAV_ICONS: Record<string, LucideIcon> = {
  chiropractors: ClipboardList,
  welcome: Sparkles,
  profile: User,
  practice: Building2,
  specialties: Stethoscope,
  membership: CreditCard,
  referrals: Send,
  preferences: Settings2,
  messages: MessageSquare,
  favorites: Heart,
  groups: Users,
};

export type DashboardNavItem = { id: string; label: string };

export type DashboardShellProps = {
  /** Label above primary nav (default “Account”) */
  navGroupLabel?: string;
  /** Primary navigation (clickable) */
  navItems: DashboardNavItem[];
  /** Shown muted / disabled under “Coming soon” */
  comingSoonItems?: DashboardNavItem[];
  activeId: string;
  onNavigate: (id: string) => void;
  pageTitle: string;
  headerActions?: ReactNode;
  /** Row under header: avatar + welcome (optional) */
  subheader?: ReactNode;
  sidebarFooter?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function DashboardShell({
  navGroupLabel = 'Account',
  navItems,
  comingSoonItems = [],
  activeId,
  onNavigate,
  pageTitle,
  headerActions,
  subheader,
  sidebarFooter,
  children,
  className,
}: DashboardShellProps) {
  return (
    <SidebarProvider
      className={cn('min-h-svh', className)}
      style={
        {
          '--sidebar-width': '16rem',
          '--header-height': '3.5rem',
        } as CSSProperties
      }
    >
      <Sidebar variant="inset" collapsible="icon">
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
            <SidebarGroup>
              <SidebarGroupLabel>{navGroupLabel}</SidebarGroupLabel>
              <SidebarMenu>
                {navItems.map((item) => {
                  const Icon = NAV_ICONS[item.id] ?? LayoutDashboard;
                  const isActive = activeId === item.id;
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        type="button"
                        isActive={isActive}
                        tooltip={item.label}
                        onClick={() => onNavigate(item.id)}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
            {comingSoonItems.length > 0 ? (
              <SidebarGroup>
                <SidebarGroupLabel>Coming soon</SidebarGroupLabel>
                <SidebarMenu>
                  {comingSoonItems.map((item) => {
                    const Icon = NAV_ICONS[item.id] ?? LayoutDashboard;
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton type="button" disabled className="opacity-50" tooltip={item.label}>
                          <Icon className="size-4 shrink-0" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroup>
            ) : null}
          </ScrollArea>
        </SidebarContent>
        <SidebarFooter className="border-sidebar-border gap-2 border-t p-2">
          {sidebarFooter}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex min-h-svh flex-col overflow-hidden md:peer-data-[variant=inset]:shadow-sm">
        <header className="bg-background flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-0.5" />
          <Separator orientation="vertical" className="mr-1 h-4" />
          <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
            <h1 className="truncate text-lg font-semibold tracking-tight">{pageTitle}</h1>
            {headerActions ? <div className="flex shrink-0 items-center gap-2">{headerActions}</div> : null}
          </div>
        </header>
        {subheader ? (
          <div className="bg-card text-card-foreground border-b px-4 py-3">{subheader}</div>
        ) : null}
        <div className="bg-muted/30 flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function dashboardToolbarActions(opts: {
  onEdit: () => void;
  onSave: () => void;
  editDisabled: boolean;
  saveDisabled: boolean;
  saving: boolean;
}) {
  return (
    <>
      <Button type="button" variant="outline" size="sm" disabled={opts.editDisabled} onClick={opts.onEdit}>
        Edit
      </Button>
      <Button type="button" size="sm" disabled={opts.saveDisabled} onClick={opts.onSave}>
        {opts.saving ? 'Saving…' : 'Save'}
      </Button>
    </>
  );
}
