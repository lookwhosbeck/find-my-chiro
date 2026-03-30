import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin, geocodeOrganizationWithAdmin } from '@/app/lib/geocode-organization.server';

/**
 * POST JSON { organizationId: string }
 * Auth: Bearer session JWT. Caller must be the chiropractor linked to that organization.
 */
export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const admin = createSupabaseAdmin();

  if (!url || !anon || !admin || url === 'https://placeholder.supabase.co') {
    return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 501 });
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const jwt = authHeader.slice(7);

  const supabaseAuth = createClient(url, anon);
  const {
    data: { user },
    error: userErr,
  } = await supabaseAuth.auth.getUser(jwt);
  if (userErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { organizationId?: string } | null;
  const organizationId = typeof body?.organizationId === 'string' ? body.organizationId.trim() : '';
  if (!organizationId) {
    return NextResponse.json({ error: 'organizationId required' }, { status: 400 });
  }

  const { data: chiro, error: chiroErr } = await admin
    .from('chiropractors')
    .select('id, organization_id')
    .eq('id', user.id)
    .maybeSingle();

  if (chiroErr || !chiro?.organization_id || chiro.organization_id !== organizationId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const result = await geocodeOrganizationWithAdmin(admin, organizationId);
  if (result.ok === false) {
    const status =
      result.reason === 'not_configured'
        ? 501
        : result.reason === 'no_address'
          ? 400
          : result.reason === 'not_found'
            ? 404
            : 422;
    return NextResponse.json({ ok: false, reason: result.reason }, { status });
  }

  return NextResponse.json({
    ok: true,
    latitude: result.latitude,
    longitude: result.longitude,
  });
}
