import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClientApiKey } from './supabase-keys';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = getSupabaseClientApiKey();

// Use a global variable to ensure singleton across module boundaries
declare global {
  // eslint-disable-next-line no-var
  var __supabaseClient: SupabaseClient | undefined;
}

// Client-side Supabase client for use in client components
export function createSupabaseClient(): SupabaseClient {
  // In development, use global variable to persist across hot reloads
  // In production, use module-level variable
  if (typeof window !== 'undefined') {
    if (!global.__supabaseClient) {
      if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://placeholder.supabase.co') {
        throw new Error(
          'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) in your .env.local file',
        );
      }
      
      global.__supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    }
    return global.__supabaseClient;
  }

  // Server-side: create new instance (shouldn't happen in client components)
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://placeholder.supabase.co') {
    throw new Error(
      'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) in your .env.local file',
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

