'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { resolveBrowserSession } from '@/app/lib/auth-session-client';
import { supabase } from '@/app/lib/supabase';
import { MovynLogo } from '@/app/components/MovynLogo';
import { AuthMarketingBackdrop } from '@/components/auth-marketing-backdrop';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const MIN_PASSWORD_LENGTH = 8;

/**
 * After a user clicks the recovery link in the password reset email,
 * Supabase redirects through `/auth/callback` which exchanges the code
 * for a recovery session and then forwards the user here. This page lets
 * the authenticated (recovery-session) user set a new password via
 * `supabase.auth.updateUser({ password })`.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    let cancelled = false;

    const verifySession = async () => {
      try {
        const session = await resolveBrowserSession(supabase);
        if (cancelled) return;
        if (session?.user) {
          setHasRecoverySession(true);
        }
      } catch (err) {
        if (cancelled) return;
        console.error('reset-password: session check failed', err);
      } finally {
        if (!cancelled) setChecking(false);
      }
    };

    void verifySession();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === 'PASSWORD_RECOVERY' || session?.user) {
        setHasRecoverySession(true);
        setChecking(false);
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
      <Card className="mx-auto flex w-full max-w-sm flex-col items-center gap-8 border-0 bg-card/95 shadow-lg backdrop-blur-sm supports-[backdrop-filter]:bg-card/80">
        <CardContent className="w-full space-y-8 pt-8 text-center">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <MovynLogo variant="standard" className="h-9 w-auto max-w-[200px]" />
            <h1 className="text-center text-2xl font-semibold tracking-tight text-foreground [font-family:var(--font-display)] sm:text-3xl">
              Choose a new password
            </h1>
          </div>

          <div className="w-full space-y-6 text-left">
            {checking ? (
              <p className="text-center text-sm text-muted-foreground">Verifying your reset link…</p>
            ) : !hasRecoverySession ? (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  This reset link is invalid or has expired. Request a new one to set a new password.
                </p>
                <Button className="w-full" asChild>
                  <Link href="/forgot-password">Request a new reset link</Link>
                </Button>
              </div>
            ) : done ? (
              <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-center text-sm text-emerald-900 dark:text-emerald-100">
                Password updated. Redirecting you to your account…
              </p>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                <p className="text-sm text-muted-foreground">
                  Pick a strong password you don&apos;t use anywhere else. We&apos;ll sign you in right after.
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
                  <p className="text-xs text-muted-foreground">Minimum {MIN_PASSWORD_LENGTH} characters.</p>
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
              <Link href="/signin" className="font-medium text-foreground underline underline-offset-4">
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
