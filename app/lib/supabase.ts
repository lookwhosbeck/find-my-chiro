import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClientApiKey } from './supabase-keys';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = getSupabaseClientApiKey();

// Create a dummy client if env vars are not set to prevent errors
// This allows the app to run without Supabase configured (useful for development)
let supabase: SupabaseClient;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables are not set. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) to your .env.local file',
  );
  // Create a client with placeholder values to prevent runtime errors
  // This will fail on actual queries, but won't crash the app
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };

