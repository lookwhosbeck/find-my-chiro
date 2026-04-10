import 'server-only';

/**
 * Canonical public origin (no trailing slash) when no Request is available.
 * Used for auth email links and other server-only redirects.
 *
 * 1. NEXT_PUBLIC_SITE_URL — e.g. https://movynalong.com on Vercel (recommended).
 * 2. VERCEL_URL — set automatically by Vercel on each deployment (preview + prod).
 */
export function canonicalAppOrigin(): string {
  const envSite = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envSite) return envSite.replace(/\/$/, '');
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, '')}`;
  return 'http://localhost:3000';
}

export function defaultAuthCallbackUrl(): string {
  return `${canonicalAppOrigin()}/auth/callback`;
}
