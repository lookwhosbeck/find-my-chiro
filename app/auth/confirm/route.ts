import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient, type EmailOtpType, type SupabaseClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

import { sendChiropractorWelcomeEmailIfNeeded } from '@/app/lib/chiropractor-welcome-email.server';
import { verifyEmailConfirmTicket } from '@/app/lib/email-confirm-ticket';

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
    const ticket = searchParams.get('ticket');
    const userId = ticket ? verifyEmailConfirmTicket(ticket, tokenHash) : null;
    const renewed = userId
      ? await signInWithFreshLink(supabase, userId)
      : false;
    if (!renewed) {
      console.error('auth confirm verifyOtp:', error.message);
      return NextResponse.redirect(`${origin}/signin?error=verify_expired`);
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

/**
 * Supabase's own OTP window is shorter than 7 days. A signed ticket on the
 * email link lets us mint a fresh session for that same user until the ticket expires.
 */
async function signInWithFreshLink(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) return false;

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: userData, error: userError } = await admin.auth.admin.getUserById(userId);
  const email = userData.user?.email;
  if (userError || !email) {
    console.error('auth confirm ticket user:', userError?.message ?? 'missing email');
    return false;
  }

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });
  const hashedToken = link?.properties?.hashed_token;
  if (linkError || !hashedToken) {
    console.error('auth confirm ticket link:', linkError?.message ?? 'missing token');
    return false;
  }

  const { error } = await supabase.auth.verifyOtp({
    type: 'magiclink',
    token_hash: hashedToken,
  });
  if (error) {
    console.error('auth confirm ticket verify:', error.message);
    return false;
  }
  return true;
}
