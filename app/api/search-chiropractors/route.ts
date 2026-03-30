import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { searchChiropractorsWithClient } from '@/app/lib/chiropractor-search.server';
import { clampSearchRadiusMiles } from '@/app/lib/search-radius';
import type { PatientSearchFilters } from '@/app/lib/queries';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const raw = body.filters as PatientSearchFilters | undefined;
    const limit = typeof body.limit === 'number' ? body.limit : 20;

    if (!raw || typeof raw !== 'object') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const filters: PatientSearchFilters = {
      ...raw,
      searchRadius: clampSearchRadiusMiles(
        typeof raw.searchRadius === 'number' && !Number.isNaN(raw.searchRadius) ? raw.searchRadius : 25
      ),
    };

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key || url === 'https://placeholder.supabase.co') {
      return NextResponse.json([]);
    }

    const supabase = createClient(url, key);
    const results = await searchChiropractorsWithClient(supabase, filters, limit);
    return NextResponse.json(results);
  } catch (e) {
    console.error('search-chiropractors route:', e);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
