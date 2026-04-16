import type { CSSProperties } from 'react';

/**
 * Shared dashboard shell tokens.
 * Values are direct rem numbers so they work under Tailwind v3 (no `--spacing` function).
 */
export const movynDashboardProviderStyle = {
  '--sidebar-width': '16rem',
  '--header-height': '3.5rem',
  '--content-padding': '1rem',
  '--content-margin': '0.375rem',
  '--content-full-height':
    'calc(100vh - var(--header-height) - (var(--content-padding) * 2) - (var(--content-margin) * 2))',
} as const satisfies Record<string, string>;

export function getMovynDashboardProviderStyle(): CSSProperties {
  return { ...movynDashboardProviderStyle } as CSSProperties;
}
