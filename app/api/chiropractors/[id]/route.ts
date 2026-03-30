import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { mapChiropractorDataFromNormalizedSchema } from '@/app/lib/queries';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!url || !anon || url === 'https://placeholder.supabase.co') {
      return NextResponse.json({ error: 'Not configured' }, { status: 503 });
    }

    const key = service || anon;
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from('chiropractors')
      .select(
        `
        *,
        profiles!inner(first_name, last_name, avatar_url),
        organizations!inner(name, city, state, zip_code, phone, website, address_line_1, latitude, longitude),
        chiropractor_modalities(modality_id, modalities!inner(name)),
        chiropractor_focus_areas(focus_area_id, focus_areas!inner(name)),
        chiropractor_payment_models(payment_model_id, payment_models!inner(name)),
        chiropractor_philosophies(philosophy_id, philosophies!inner(name))
      `
      )
      .eq('id', id)
      .eq('accepting_new_patients', true)
      .maybeSingle();

    if (error) {
      console.error('chiropractor by id:', error);
      return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const [mapped] = mapChiropractorDataFromNormalizedSchema([data]);
    if (!mapped?.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(mapped);
  } catch (e) {
    console.error('chiropractors/[id]:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
