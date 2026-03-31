import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseClient } from './supabase-client';

const placeholder = createClient('https://placeholder.supabase.co', 'placeholder-key');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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
          console.warn(
            'Supabase environment variables are not set. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file',
          );
          return placeholder;
        }
      })()
    : !supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://placeholder.supabase.co'
      ? (() => {
          console.warn(
            'Supabase environment variables are not set. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file',
          );
          return placeholder;
        })()
      : createClient(supabaseUrl, supabaseAnonKey);
