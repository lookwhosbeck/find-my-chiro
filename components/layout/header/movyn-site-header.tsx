'use client';

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSidebar } from '@/components/ui/sidebar';

/**
 * Kit-style top bar: collapse control, optional “Account → section” breadcrumb, actions (e.g. Edit/Save).
 */
export function MovynSiteHeader({
  title,
  actions,
  breadcrumbParent,
}: {
  title: string;
  actions?: ReactNode;
  /** When set, shows parent link (e.g. Account) then current `title` as the page crumb. */
  breadcrumbParent?: { label: string; href: string };
}) {
  const { toggleSidebar, open } = useSidebar();

  return (
    <header className="sticky top-0 z-50 flex h-[--header-height] shrink-0 items-center gap-2 border-b bg-background/40 backdrop-blur-md transition-[width,height] ease-linear md:rounded-tl-xl md:rounded-tr-xl">
      <div className="flex w-full min-w-0 items-center gap-1 px-4 lg:gap-2">
        <Button type="button" onClick={toggleSidebar} size="icon" variant="ghost" aria-label="Toggle sidebar">
          {open ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
        </Button>
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            {breadcrumbParent ? (
              <Breadcrumb>
                <BreadcrumbList className="sm:gap-2">
                  <BreadcrumbItem className="min-w-0">
                    <BreadcrumbLink asChild>
                      <Link href={breadcrumbParent.href} className="truncate">
                        {breadcrumbParent.label}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="[&>svg]:size-3.5" />
                  <BreadcrumbItem className="min-w-0">
                    <BreadcrumbPage className="truncate font-medium">{title}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            ) : (
              <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
            )}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      </div>
    </header>
  );
}
