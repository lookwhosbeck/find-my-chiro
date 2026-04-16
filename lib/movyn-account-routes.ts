/** Kit-style account URLs: `/account/settings/...` (aligned with template settings subtree). */

export const ACCOUNT_SETTINGS_BASE = '/account/settings' as const;

export type AccountSettingsSlug =
  | 'getting-started'
  | 'profile'
  | 'practice'
  | 'specialties'
  | 'membership'
  | 'referrals'
  | 'preferences';

export function accountSettingsHref(slug: AccountSettingsSlug): string {
  return `${ACCOUNT_SETTINGS_BASE}/${slug}`;
}

/** Map URL segment (last path part under settings) to legacy nav key used by account UI. */
export type AccountNavKey =
  | 'welcome'
  | 'profile'
  | 'practice'
  | 'specialties'
  | 'membership'
  | 'preferences'
  | 'referrals'
  | 'messages'
  | 'favorites'
  | 'groups';

export function navKeyFromSettingsSlug(slug: string | null | undefined): AccountNavKey | null {
  if (!slug) return null;
  switch (slug) {
    case 'getting-started':
      return 'welcome';
    case 'profile':
      return 'profile';
    case 'practice':
      return 'practice';
    case 'specialties':
      return 'specialties';
    case 'membership':
      return 'membership';
    case 'referrals':
      return 'referrals';
    case 'preferences':
      return 'preferences';
    default:
      return null;
  }
}

export function settingsSlugFromNavKey(key: AccountNavKey): AccountSettingsSlug | null {
  switch (key) {
    case 'welcome':
      return 'getting-started';
    case 'profile':
      return 'profile';
    case 'practice':
      return 'practice';
    case 'specialties':
      return 'specialties';
    case 'membership':
      return 'membership';
    case 'referrals':
      return 'referrals';
    case 'preferences':
      return 'preferences';
    default:
      return null;
  }
}

export function parseSettingsSlugFromPathname(pathname: string): string | null {
  const prefix = `${ACCOUNT_SETTINGS_BASE}/`;
  if (!pathname.startsWith(prefix)) return null;
  const rest = pathname.slice(prefix.length);
  const seg = rest.split('/')[0];
  return seg && seg.length > 0 ? seg : null;
}
