import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

import { sendChiropractorWelcomeEmailIfNeeded } from '@/app/lib/chiropractor-welcome-email.server';

const OTP_TYPES = new Set<string>([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
]);

/**
 * Email confirmation / magic-link handler using token_hash + verifyOtp.
 * Works across devices and email in-app browsers (unlike PKCE code exchange).
 *
 * Links from Brevo auth emails point here:
 * `/auth/confirm?token_hash=...&type=email&next=/account`
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const typeRaw = searchParams.get('type');
  const nextRaw = searchParams.get('next');
  const next = nextRaw?.startsWith('/') ? nextRaw : '/account';

  if (!tokenHash || !typeRaw || !OTP_TYPES.has(typeRaw)) {
    return NextResponse.redirect(`${origin}/signin?error=auth_callback`);
  }

  const type = typeRaw as EmailOtpType;
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

  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) {
    console.error('auth confirm verifyOtp:', error.message);
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

  return redirectResponse;
}
