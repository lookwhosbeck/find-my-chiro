import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Public reference data for signup. Prefer service role so RLS on `chiropractic_colleges`
 * does not block anonymous reads; falls back to anon if service role is unset.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon || url === 'https://placeholder.supabase.co') {
    return NextResponse.json([], { status: 200 });
  }

  const key = service?.trim() || anon;
  const db = createClient(url, key);

  const { data, error } = await db
    .from('chiropractic_colleges')
    .select('id, name, state, website_url, logo_url')
    .order('name', { ascending: true });

  if (error) {
    console.error('chiropractic-colleges:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data || []).map((item) => ({
    id: item.id,
    name: item.name,
    state: item.state || undefined,
    websiteUrl: item.website_url || undefined,
    logoUrl: item.logo_url || undefined,
  }));

  return NextResponse.json(rows);
}
