import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

import { sendChiropractorWelcomeEmailIfNeeded } from '@/app/lib/chiropractor-welcome-email.server';

/**
 * OAuth / PKCE `?code=` redirect handler.
 * Email confirmation links should use `/auth/confirm` (token_hash + verifyOtp)
 * so they work outside the signup browser. This route still accepts token_hash
 * as a fallback for older links.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const typeRaw = searchParams.get('type');
  const nextRaw = searchParams.get('next');
  const next = nextRaw?.startsWith('/') ? nextRaw : '/account';

  if (!code && !(tokenHash && typeRaw)) {
    return NextResponse.redirect(`${origin}/signin?error=auth_callback`);
  }

  const redirectResponse = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            redirectResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  if (tokenHash && typeRaw) {
    const { error } = await supabase.auth.verifyOtp({
      type: typeRaw as EmailOtpType,
      token_hash: tokenHash,
    });
    if (error) {
      console.error('auth callback verifyOtp:', error.message);
      return NextResponse.redirect(`${origin}/signin?error=auth_exchange`);
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('auth callback exchange:', error.message);
      return NextResponse.redirect(`${origin}/signin?error=auth_exchange`);
    }
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

  return redirectResponse;
}
