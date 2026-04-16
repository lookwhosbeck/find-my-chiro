import type { CSSProperties } from 'react';

/**
 * Shared dashboard shell tokens (matches `shadcn-ui-kit-dashboard-main` auth layout).
 * Use with `SidebarProvider` + inset sidebar + `MovynSiteHeader` + muted canvas.
 */
export const movynDashboardProviderStyle = {
  '--sidebar-width': 'calc(var(--spacing) * 64)',
  '--header-height': 'calc(var(--spacing) * 14)',
  '--content-padding': 'calc(var(--spacing) * 4)',
  '--content-margin': 'calc(var(--spacing) * 1.5)',
  '--content-full-height':
    'calc(100vh - var(--header-height) - (var(--content-padding) * 2) - (var(--content-margin) * 2))',
} as const satisfies Record<string, string>;

export function getMovynDashboardProviderStyle(): CSSProperties {
  return { ...movynDashboardProviderStyle } as CSSProperties;
}
