import type { SupabaseClient } from '@supabase/supabase-js';

const SIGN_OUT_TIMEOUT_MS = 8000;

/**
 * Expire browser auth cookies written by `@supabase/ssr` createBrowserClient.
 * Used when `signOut` returns an error before `_removeSession()` runs, or when
 * the Auth `/logout` call hangs past the timeout.
 */
function clearSupabaseAuthCookies(): void {
  if (typeof document === 'undefined') return;

  const names = document.cookie
    .split(';')
    .map((part) => part.split('=')[0]?.trim())
    .filter((name): name is string => Boolean(name));

  for (const name of names) {
    if (!name.startsWith('sb-') || !name.includes('auth-token')) continue;
    // Match host-only cookies with and without Secure (production HTTPS).
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax; Secure`;
  }
}

/**
 * Sign out of the current browser session and guarantee local cookies are gone
 * before the caller navigates. Prefer `scope: 'local'` so other devices stay signed in.
 */
export async function signOutBrowser(client: SupabaseClient): Promise<void> {
  if (typeof window === 'undefined') return;

  let clearedByLibrary = false;

  try {
    const result = await Promise.race([
      client.auth.signOut({ scope: 'local' }),
      new Promise<{ error: Error }>((resolve) => {
        window.setTimeout(
          () => resolve({ error: new Error('signOut timed out') }),
          SIGN_OUT_TIMEOUT_MS,
        );
      }),
    ]);

    clearedByLibrary = !result?.error;
  } catch {
    clearedByLibrary = false;
  }

  if (!clearedByLibrary) {
    clearSupabaseAuthCookies();
    return;
  }

  // Rare: library reported success but cookies still readable — force clear.
  const {
    data: { session },
  } = await client.auth.getSession();
  if (session) clearSupabaseAuthCookies();
}
