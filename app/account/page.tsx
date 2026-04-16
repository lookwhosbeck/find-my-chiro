import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

import { accountSettingsHref } from '@/lib/movyn-account-routes';

export default async function AccountIndexPage() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    redirect(accountSettingsHref('profile'));
  }

  const supabase = createServerClient(url, anon, {
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
          /* ignore when not in a Server Action / mutable cookie context */
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/signin?redirect=/account');
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();

  if (!profile?.role) {
    redirect(accountSettingsHref('profile'));
  }

  if (profile.role === 'patient' || profile.role === 'admin') {
    redirect(accountSettingsHref('profile'));
  }

  if (profile.role === 'chiropractor') {
    const { data: chiro } = await supabase
      .from('chiropractors')
      .select('license_verification_status')
      .eq('id', user.id)
      .maybeSingle();
    const status = chiro?.license_verification_status ?? 'draft';
    if (status !== 'approved') {
      redirect(accountSettingsHref('getting-started'));
    }
  }

  redirect(accountSettingsHref('profile'));
}
