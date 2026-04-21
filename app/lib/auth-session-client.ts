import type { Session, SupabaseClient } from '@supabase/supabase-js';

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), ms));
  return (await Promise.race([promise, timeout])) as T | null;
}

/**
 * Resolves the browser auth session with bounded waits so UI never hangs on
 * `getSession()` alone. Uses the same strategy as the sign-in page: race with a
 * timeout, `getUser()` nudge, then short retries.
 */
export async function resolveBrowserSession(client: SupabaseClient): Promise<Session | null> {
  if (typeof window === 'undefined') return null;

  const readSession = () => client.auth.getSession().then((r) => r.data.session);

  const first = await withTimeout(readSession(), 2500);
  if (first?.user) return first;

  await withTimeout(client.auth.getUser(), 2500);
  const second = await withTimeout(readSession(), 2500);
  if (second?.user) return second;

  for (let i = 0; i < 2; i += 1) {
    await sleep(180);
    const retry = await withTimeout(readSession(), 1200);
    if (retry?.user) return retry;
  }
  return null;
}
