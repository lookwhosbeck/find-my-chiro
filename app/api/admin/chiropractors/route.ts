import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

type AdminAuthResult =
  | { ok: true }
  | { ok: false; response: NextResponse };

type AdminChiropractorRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  practiceName: string | null;
  subscriptionStatus: string | null;
  verificationStatus: string;
  signedUpAt: string | null;
  submittedForReviewAt: string | null;
};

async function requireAdmin(req: NextRequest): Promise<AdminAuthResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon || url === 'https://placeholder.supabase.co') {
    return { ok: false, response: NextResponse.json({ error: 'not_configured' }, { status: 501 }) };
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const jwt = authHeader.slice(7);

  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });

  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser();
  if (userErr || !user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: profile, error: profileErr } = await userClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileErr || profile?.role !== 'admin') {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { ok: true };
}

export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !service || url === 'https://placeholder.supabase.co') {
    return NextResponse.json({ error: 'not_configured' }, { status: 501 });
  }

  const auth = await requireAdmin(req);
  if (auth.ok === false) return auth.response;

  const admin = createClient(url, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: rows, error } = await admin
    .from('chiropractors')
    .select(
      `
      id,
      license_verification_status,
      submitted_for_review_at,
      profiles!inner (
        first_name,
        last_name,
        email,
        subscription_status,
        created_at
      ),
      organizations ( name )
    `,
    )
    .order('created_at', { ascending: false, referencedTable: 'profiles' });

  if (error) {
    console.error('admin chiropractors GET:', error);
    return NextResponse.json({ error: 'Failed to load chiropractors' }, { status: 500 });
  }

  const list: AdminChiropractorRow[] = (rows || []).map((row: Record<string, unknown>) => {
    const profiles = row.profiles as
      | {
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          subscription_status?: string | null;
          created_at?: string | null;
        }
      | null;
    const org = row.organizations as { name?: string | null } | null;
    return {
      id: String(row.id),
      firstName: profiles?.first_name ?? '',
      lastName: profiles?.last_name ?? '',
      email: profiles?.email ?? null,
      practiceName: org?.name ?? null,
      subscriptionStatus: profiles?.subscription_status ?? null,
      verificationStatus: String(row.license_verification_status ?? ''),
      signedUpAt: profiles?.created_at ?? null,
      submittedForReviewAt: (row.submitted_for_review_at as string | null) ?? null,
    };
  });

  return NextResponse.json(list);
}

export async function PATCH(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !service || url === 'https://placeholder.supabase.co') {
    return NextResponse.json({ error: 'not_configured' }, { status: 501 });
  }

  const auth = await requireAdmin(req);
  if (auth.ok === false) return auth.response;

  const body = (await req.json().catch(() => null)) as { id?: unknown; status?: unknown } | null;
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const id = typeof body.id === 'string' ? body.id.trim() : '';
  const status = body.status === 'approved' || body.status === 'rejected' ? body.status : null;
  if (!id || !status) {
    return NextResponse.json({ error: 'Expected { id: string, status: "approved" | "rejected" }' }, { status: 400 });
  }

  const admin = createClient(url, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: updated, error } = await admin
    .from('chiropractors')
    .update({ license_verification_status: status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('license_verification_status')
    .maybeSingle();

  if (error) {
    console.error('admin chiropractors PATCH:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!updated) {
    return NextResponse.json({ error: 'Chiropractor not found' }, { status: 404 });
  }

  if (updated.license_verification_status !== status) {
    console.error(
      `admin chiropractors PATCH: trigger reverted status. requested=${status}, actual=${updated.license_verification_status}`,
    );
    return NextResponse.json(
      { error: 'Status change was blocked by a database trigger. Check PostgREST service-role configuration.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, id, verificationStatus: updated.license_verification_status });
}
