import { createBrowserClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

declare global {
  // eslint-disable-next-line no-var
  var __supabaseClient: SupabaseClient | undefined;
}

/**
 * Returns a singleton Supabase client that persists the session in cookies
 * so that the Next.js middleware (which reads cookies via @supabase/ssr's
 * createServerClient) can see the authenticated user.
 */
export function createSupabaseClient(): SupabaseClient {
  if (typeof window !== 'undefined') {
    if (!global.__supabaseClient) {
      if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://placeholder.supabase.co') {
        throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file');
      }

      global.__supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
    }
    return global.__supabaseClient;
  }

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://placeholder.supabase.co') {
    throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

