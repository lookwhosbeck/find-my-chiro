'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export type MovynNavMainItem = {
  title: string;
  href: string;
  icon?: LucideIcon;
  /** When true, renders a non-interactive row (e.g. “Coming soon”). */
  disabled?: boolean;
};

export type MovynNavMainGroup = {
  title: string;
  items: MovynNavMainItem[];
};

export function MovynNavMain({ groups }: { groups: MovynNavMainGroup[] }) {
  const pathname = usePathname();

  return (
    <>
      {groups.map((nav) => (
        <SidebarGroup key={nav.title}>
          <SidebarGroupLabel>{nav.title}</SidebarGroupLabel>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              {nav.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild={!item.disabled}
                    isActive={!item.disabled && pathname === item.href}
                    tooltip={item.title}
                    disabled={item.disabled}
                    className={cn(
                      'hover:text-foreground active:text-foreground hover:bg-[var(--primary)]/10 active:bg-[var(--primary)]/10',
                      item.disabled && 'pointer-events-none opacity-50',
                    )}
                  >
                    {item.disabled ? (
                      <span className="flex w-full items-center gap-2">
                        {item.icon ? <item.icon className="size-4 shrink-0" /> : null}
                        <span>{item.title}</span>
                      </span>
                    ) : (
                      <Link href={item.href} className="flex w-full items-center gap-2">
                        {item.icon ? <item.icon className="size-4 shrink-0" /> : null}
                        <span>{item.title}</span>
                      </Link>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
