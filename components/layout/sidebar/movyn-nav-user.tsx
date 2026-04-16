'use client';

import Link from 'next/link';
import { HomeIcon, LogOutIcon, ShieldIcon } from 'lucide-react';
import { DotsVerticalIcon } from '@radix-ui/react-icons';

import { UserAvatar } from '@/app/components/UserAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

export function MovynNavUser({
  displayName,
  email,
  avatarUrl,
  firstName,
  lastName,
  showAdminLink,
  onSignOut,
}: {
  displayName: string;
  email: string;
  avatarUrl?: string;
  firstName?: string | null;
  lastName?: string | null;
  showAdminLink?: boolean;
  onSignOut: () => void;
}) {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserAvatar
                avatarUrl={avatarUrl}
                firstName={firstName}
                lastName={lastName}
                email={email}
                size={36}
                variant="roundedSquare"
                fallbackTone="accountHero"
                alt=""
              />
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="text-muted-foreground truncate text-xs">{email}</span>
              </div>
              <DotsVerticalIcon className="ml-auto size-4 shrink-0 opacity-70" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <UserAvatar
                  avatarUrl={avatarUrl}
                  firstName={firstName}
                  lastName={lastName}
                  email={email}
                  size={32}
                  variant="roundedSquare"
                  fallbackTone="accountHero"
                  alt=""
                />
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="text-muted-foreground truncate text-xs">{email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/" className="flex cursor-pointer items-center gap-2">
                <HomeIcon className="size-4" />
                Back to home
              </Link>
            </DropdownMenuItem>
            {showAdminLink ? (
              <DropdownMenuItem asChild>
                <Link href="/admin" className="flex cursor-pointer items-center gap-2">
                  <ShieldIcon className="size-4" />
                  Admin panel
                </Link>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => void onSignOut()}>
              <LogOutIcon className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
