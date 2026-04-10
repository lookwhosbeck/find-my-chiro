import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

import { sendChiropractorWelcomeEmailIfNeeded } from '@/app/lib/chiropractor-welcome-email.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Idempotent: sends Brevo E2 (welcome + Loom) once the user is a confirmed chiropractor.
 */
export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anon || url === 'https://placeholder.supabase.co') {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 501 });
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
  if (userErr || !user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const firstName = typeof meta?.first_name === 'string' ? meta.first_name : null;
  const lastName = typeof meta?.last_name === 'string' ? meta.last_name : null;

  const result = await sendChiropractorWelcomeEmailIfNeeded({
    userId: user.id,
    email: user.email,
    firstName,
    lastName,
    emailConfirmedAt: user.email_confirmed_at ?? null,
  });

  return NextResponse.json(result);
}
