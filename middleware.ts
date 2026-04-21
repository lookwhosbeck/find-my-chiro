import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const { pathname } = request.nextUrl;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      '[middleware] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — add both to Vercel Preview (and Production) environment variables.',
    );
    if (pathname.startsWith('/account') || pathname.startsWith('/admin')) {
      return new NextResponse(
        'Authentication is not configured for this deployment. Add Supabase URL and anon key to the project environment variables on Vercel.',
        { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } },
      );
    }
    return NextResponse.next({ request: { headers: request.headers } });
  }

  let response = NextResponse.next({ request: { headers: request.headers } });

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          /**
           * Do not call `request.cookies.set` here — it throws on Vercel Edge
           * (MIDDLEWARE_INVOCATION_FAILED). Only set cookies on the response.
           * @see https://github.com/supabase/supabase/issues/26400
           */
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    /**
     * Use session from cookies (no Auth server round-trip). JWT is validated when
     * the SSR client reads cookies; `/account` and `/admin` data still enforce
     * RLS / role checks on the server and in API routes.
     */
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;

    if (!user && (pathname.startsWith('/account') || pathname.startsWith('/admin'))) {
      const url = request.nextUrl.clone();
      url.pathname = '/signin';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    if (user && (pathname === '/signin' || pathname === '/signup')) {
      const url = request.nextUrl.clone();
      url.pathname = '/account';
      return NextResponse.redirect(url);
    }
  } catch (err) {
    console.error('[middleware]', err);
    return new NextResponse('Middleware error', {
      status: 500,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  return response;
}

export const config = {
  matcher: ['/account/:path*', '/admin/:path*', '/signin', '/signup'],
};
