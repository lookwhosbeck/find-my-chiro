/**
 * Supabase API key resolution for hosted projects.
 *
 * New keys (recommended): publishable `sb_publishable_...`, secret `sb_secret_...`
 * Legacy keys (still supported): long JWT `anon` and `service_role` from the Legacy API Keys tab.
 *
 * Both styles work as the second argument to `createClient(url, key)`.
 *
 * @see https://supabase.com/docs/guides/api/api-keys
 */

/** Browser + server: low-privilege key for user-scoped / RLS queries. */
export function getSupabaseClientApiKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    ''
  );
}

/** Server-only: elevated key (bypasses RLS). Never use in client bundles or `NEXT_PUBLIC_*`. */
export function getSupabaseServiceApiKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    ''
  );
}
