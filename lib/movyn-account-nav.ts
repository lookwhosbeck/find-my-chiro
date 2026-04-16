/**
 * Single source of truth for account dashboard IA (sidebar labels + page titles).
 * Align with Figma node 2-17109 — adjust group titles here when design updates.
 */

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

import type { MovynNavMainGroup } from '@/components/layout/sidebar/movyn-nav-main';
import { accountSettingsHref, settingsSlugFromNavKey } from '@/lib/movyn-account-routes';
import type { AccountNavKey } from '@/lib/movyn-account-routes';

export type { AccountNavKey } from '@/lib/movyn-account-routes';

export const NAV_ICONS: Record<string, LucideIcon> = {
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

const SETTINGS_GROUP_LABEL = 'Settings';

export function accountPageTitle(nav: AccountNavKey): string {
  switch (nav) {
    case 'welcome':
      return 'Getting Started with Movyn';
    case 'profile':
      return 'Your Profile';
    case 'practice':
      return 'Your Practice';
    case 'specialties':
      return 'Specialties';
    case 'membership':
      return 'Membership';
    case 'preferences':
      return 'Your Preferences';
    case 'referrals':
      return 'Referrals';
    case 'messages':
      return 'Messages';
    case 'favorites':
      return 'Favorites';
    case 'groups':
      return 'Groups';
    default:
      return '';
  }
}

export function buildAccountSettingsNavGroups(
  navAvailable: { key: AccountNavKey; label: string }[],
  navComingSoonFiltered: { key: AccountNavKey; label: string }[],
): MovynNavMainGroup[] {
  const primaryItems = navAvailable.map(({ key, label }) => {
    const slug = settingsSlugFromNavKey(key);
    const href = slug ? accountSettingsHref(slug) : accountSettingsHref('profile');
    const Icon = NAV_ICONS[key] ?? LayoutDashboard;
    return { title: label, href, icon: Icon };
  });

  const comingItems = navComingSoonFiltered.map(({ key, label }) => ({
    title: label,
    href: '#',
    icon: NAV_ICONS[key] ?? LayoutDashboard,
    disabled: true as const,
  }));

  return [
    { title: SETTINGS_GROUP_LABEL, items: primaryItems },
    ...(comingItems.length
      ? [{ title: 'Coming soon', items: comingItems } satisfies MovynNavMainGroup]
      : []),
  ];
}
