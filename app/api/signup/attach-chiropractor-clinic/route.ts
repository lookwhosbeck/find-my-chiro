import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Links signup clinic → organizations + chiropractors.organization_id using the service role.
 * Use when client-side insert returns no row id (RLS SELECT) or insert fails.
 * Requires SUPABASE_SERVICE_ROLE_KEY (server only — never expose to the client).
 */
export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anon || !service || url === 'https://placeholder.supabase.co') {
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

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const admin = createClient(url, service);

  const { data: chiro, error: chiroErr } = await admin
    .from('chiropractors')
    .select('id, organization_id')
    .eq('id', user.id)
    .maybeSingle();

  if (chiroErr || !chiro) {
    return NextResponse.json({ error: 'Not a chiropractor' }, { status: 400 });
  }
  if (chiro.organization_id) {
    return NextResponse.json({ ok: true, organizationId: chiro.organization_id, alreadyLinked: true });
  }

  const str = (k: string) => String(body[k] ?? '').trim();

  const hasLoc =
    str('clinicName') || str('address') || str('city') || str('state') || str('zip');
  if (!hasLoc) {
    return NextResponse.json({ error: 'No clinic data' }, { status: 400 });
  }

  const orgPayload = {
    name: str('clinicName') || 'My practice',
    address_line_1: str('address') || null,
    city: str('city') || null,
    state: str('state') || null,
    zip_code: str('zip') || null,
    updated_at: new Date().toISOString(),
  };

  const { data: inserted, error: insErr } = await admin
    .from('organizations')
    .insert(orgPayload)
    .select('id')
    .single();

  if (insErr || !inserted?.id) {
    console.error('attach-chiropractor-clinic insert:', insErr);
    return NextResponse.json({ error: insErr?.message || 'Organization insert failed' }, { status: 500 });
  }

  const { error: upErr } = await admin
    .from('chiropractors')
    .update({ organization_id: inserted.id, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, organizationId: inserted.id });
}
