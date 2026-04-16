import type { AccountSettingsSlug } from '@/lib/movyn-account-routes';

export const DASHBOARD_PREVIEW_BASE = '/dev/dashboard-preview' as const;

export type PreviewSlug = AccountSettingsSlug;

export function previewSectionHref(slug: PreviewSlug): string {
  return `${DASHBOARD_PREVIEW_BASE}/${slug}`;
}
