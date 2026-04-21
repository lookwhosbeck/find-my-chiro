import 'server-only';

import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

import { getChiropractors, type Chiropractor } from '@/app/lib/queries';

function toFiniteNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/**
 * Lightweight rows for the home hero map (id + coords only; small SSR payload).
 */
async function fetchHomeMapChiropractors(limit: number): Promise<Chiropractor[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://placeholder.supabase.co') {
    return [];
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase
    .from('chiropractors')
    .select(
      `
      id,
      organizations ( latitude, longitude )
    `,
    )
    .eq('accepting_new_patients', true)
    .limit(limit)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('fetchHomeMapChiropractors:', error);
    return [];
  }

  const rows = (data || []) as Array<{
    id?: string;
    organizations?: { latitude?: unknown; longitude?: unknown } | { latitude?: unknown; longitude?: unknown }[] | null;
  }>;

  return rows.map((item) => {
    const org = Array.isArray(item.organizations) ? item.organizations[0] : item.organizations;
    const lat = toFiniteNumber(org?.latitude);
    const lng = toFiniteNumber(org?.longitude);
    return {
      id: item.id?.toString() || '',
      firstName: '',
      lastName: '',
      latitude: lat,
      longitude: lng,
    } as Chiropractor;
  });
}

export const getCachedHomeMarqueeChiropractors = unstable_cache(
  async () => getChiropractors(14),
  ['home-marquee-chiropractors'],
  { revalidate: 300, tags: ['home-chiropractors'] },
);

export const getCachedHomeMapChiropractors = unstable_cache(
  async () => fetchHomeMapChiropractors(2000),
  ['home-map-chiropractors-points'],
  { revalidate: 300, tags: ['home-chiropractors'] },
);
