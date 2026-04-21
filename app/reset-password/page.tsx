'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';
import { MovynLogo } from '@/app/components/MovynLogo';
import { AuthMarketingBackdrop } from '@/components/auth-marketing-backdrop';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const MIN_PASSWORD_LENGTH = 8;

type LinkError = { message: string; expired: boolean };

/**
 * Parse recovery error info out of both the query string and the hash fragment.
 * Supabase returns errors in `#error=...&error_code=otp_expired&error_description=...`
 * for implicit-style redirects and sometimes in `?error=...` for PKCE-style redirects.
 */
function readRecoveryError(): LinkError | null {
  if (typeof window === 'undefined') return null;

  const fromQuery = new URLSearchParams(window.location.search);
  const fromHash = new URLSearchParams(
    window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash,
  );

  const err = fromHash.get('error') || fromQuery.get('error');
  const code = fromHash.get('error_code') || fromQuery.get('error_code');
  const description =
    fromHash.get('error_description') || fromQuery.get('error_description') || '';

  if (!err && !code) return null;

  const expired = code === 'otp_expired' || /expired/i.test(description);
  const pretty = description.replace(/\+/g, ' ');
  return {
    expired,
    message: expired
      ? 'This reset link has expired. Request a new one to set a new password.'
      : pretty || 'This reset link is invalid. Request a new one to continue.',
  };
}

/** Strip tokens/codes from the URL bar once we've consumed them. */
function cleanUrl() {
  if (typeof window === 'undefined') return;
  const { origin, pathname } = window.location;
  window.history.replaceState({}, document.title, `${origin}${pathname}`);
}

/**
 * Establishes a recovery session from whatever the email link produced:
 * - `#access_token=...&refresh_token=...&type=recovery` (implicit)
 * - `?code=...` (PKCE)
 * - `?token_hash=...&type=recovery` (OTP hash)
 * supabase-js handles the first two automatically when `detectSessionInUrl`
 * is on (the default), but we also try `verifyOtp` for the third form.
 */
async function establishRecoverySession(): Promise<boolean> {
  const url = new URL(window.location.href);
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');

  if (tokenHash && type === 'recovery') {
    try {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
      if (error) {
        console.error('reset-password: verifyOtp', error);
        return false;
      }
      cleanUrl();
      return true;
    } catch (err) {
      console.error('reset-password: verifyOtp threw', err);
      return false;
    }
  }

  const { data } = await supabase.auth.getSession();
  if (data.session?.user) {
    cleanUrl();
    return true;
  }

  return false;
}

/**
 * After the user clicks the recovery link in the password reset email,
 * Supabase redirects them here. This page reads the URL, creates a
 * recovery session (via `detectSessionInUrl` or `verifyOtp`), then lets
 * the user pick a new password via `supabase.auth.updateUser({ password })`.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [linkError, setLinkError] = useState<LinkError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const existing = readRecoveryError();
      if (existing) {
        if (!cancelled) {
          setLinkError(existing);
          setChecking(false);
        }
        return;
      }

      try {
        const ok = await establishRecoverySession();
        if (cancelled) return;
        if (ok) {
          setHasRecoverySession(true);
        }
      } catch (err) {
        if (cancelled) return;
        console.error('reset-password: session check failed', err);
      } finally {
        if (!cancelled) setChecking(false);
      }
    };

    void init();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session?.user)) {
        setHasRecoverySession(true);
        setLinkError(null);
        setChecking(false);
        cleanUrl();
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
      setTimeout(() => {
        router.replace('/account');
      }, 1500);
    } catch (err: unknown) {
      console.error('reset-password update failed:', err);
      const message =
        err instanceof Error
          ? err.message
          : 'We could not update your password. Try requesting a fresh reset link.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthMarketingBackdrop>
      <Card className="mx-auto flex w-full max-w-sm flex-col items-center gap-8 border-0 bg-card shadow-lg">
        <CardContent className="w-full space-y-8 pt-8 text-center">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <MovynLogo variant="standard" className="h-9 w-auto max-w-[200px]" />
            <h1 className="text-center text-2xl font-semibold tracking-tight text-foreground [font-family:var(--font-display)] sm:text-3xl">
              Choose a new password
            </h1>
          </div>

          <div className="w-full space-y-6 text-left">
            {checking ? (
              <p className="text-sm text-muted-foreground">Verifying your reset link…</p>
            ) : linkError ? (
              <div className="space-y-4">
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {linkError.message}
                </div>
                <Button asChild className="w-full">
                  <Link href="/forgot-password">Request a new reset link</Link>
                </Button>
              </div>
            ) : !hasRecoverySession ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This reset link is invalid or has expired. Request a new one to set a new
                  password.
                </p>
                <Button asChild className="w-full">
                  <Link href="/forgot-password">Request a new reset link</Link>
                </Button>
              </div>
            ) : done ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200">
                Password updated. Redirecting you to your account…
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                <p className="text-sm text-muted-foreground">
                  Pick a strong password you don&apos;t use anywhere else. We&apos;ll sign you in
                  right after.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="reset-password">New password</Label>
                  <Input
                    id="reset-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    type="password"
                    autoComplete="new-password"
                    minLength={MIN_PASSWORD_LENGTH}
                    required
                  />
                  <span className="text-xs text-muted-foreground">
                    Minimum {MIN_PASSWORD_LENGTH} characters.
                  </span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reset-password-confirm">Confirm new password</Label>
                  <Input
                    id="reset-password-confirm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    type="password"
                    autoComplete="new-password"
                    minLength={MIN_PASSWORD_LENGTH}
                    required
                  />
                </div>

                {error ? (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Updating…' : 'Update password'}
                </Button>
              </form>
            )}

            <p className="text-center text-sm text-muted-foreground">
              Back to{' '}
              <Link
                href="/signin"
                className="font-medium text-foreground underline underline-offset-4"
              >
                Sign in
              </Link>
            </p>
          </div>

          <Link
            href="/"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Back to home
          </Link>
        </CardContent>
      </Card>
    </AuthMarketingBackdrop>
  );
}
