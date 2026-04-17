import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseClient } from './supabase-client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let placeholderClient: SupabaseClient | null = null;

/**
 * Lazy placeholder: avoids spinning up a GoTrue instance (and the "multiple
 * GoTrueClient instances" warning) at module-import time when envs ARE set,
 * which is the common case. Only created if `supabase` is accessed without
 * real credentials.
 */
function getPlaceholder(): SupabaseClient {
  if (!placeholderClient) {
    console.warn(
      'Supabase environment variables are not set. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file',
    );
    placeholderClient = createClient('https://placeholder.supabase.co', 'placeholder-key');
  }
  return placeholderClient;
}

/**
 * Browser: same singleton as `createSupabaseClient()` (avoids multiple GoTrue clients).
 * Server: anon client for SSR / server code paths, or placeholder when unset.
 */
export const supabase: SupabaseClient =
  typeof window !== 'undefined'
    ? (() => {
        try {
          return createSupabaseClient();
        } catch {
          return getPlaceholder();
        }
      })()
    : !supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://placeholder.supabase.co'
      ? getPlaceholder()
      : createClient(supabaseUrl, supabaseAnonKey);
