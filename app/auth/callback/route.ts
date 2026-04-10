import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { sendChiropractorWelcomeEmailIfNeeded } from '@/app/lib/chiropractor-welcome-email.server';

/**
 * Supabase Auth email confirmation / OAuth redirect handler.
 * Set Site URL and Redirect URLs in Supabase Dashboard to include this path.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextRaw = searchParams.get('next');
  const next = nextRaw?.startsWith('/') ? nextRaw : '/account';

  if (!code) {
    return NextResponse.redirect(`${origin}/signin?error=auth_callback`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            /* set from Server Component only — ignore if middleware context */
          }
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error('auth callback exchange:', error.message);
    return NextResponse.redirect(`${origin}/signin?error=auth_exchange`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const meta = user?.user_metadata as { role?: string; first_name?: string; last_name?: string } | undefined;
  if (
    user?.id &&
    user.email &&
    user.email_confirmed_at &&
    meta?.role === 'chiropractor'
  ) {
    void sendChiropractorWelcomeEmailIfNeeded({
      userId: user.id,
      email: user.email,
      firstName: meta.first_name ?? null,
      lastName: meta.last_name ?? null,
      emailConfirmedAt: user.email_confirmed_at,
    });
  }

  return NextResponse.redirect(`${origin}${next}`);
}
