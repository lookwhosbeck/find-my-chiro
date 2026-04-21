'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';
import { MovynLogo } from '@/app/components/MovynLogo';
import { AuthMarketingBackdrop } from '@/components/auth-marketing-backdrop';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Recovery links must land directly on `/reset-password` — not on the server
 * `/auth/callback` route. Supabase's verify endpoint for `type=recovery`
 * redirects back with a URL hash fragment (`#access_token=...`) that the
 * server can't read. The browser Supabase client on `/reset-password` picks
 * it up automatically and fires `PASSWORD_RECOVERY`.
 *
 * Note: this exact URL must be in the Supabase Dashboard →
 * Authentication → URL Configuration → Redirect URLs allow list
 * (e.g. `https://movynalong.com/reset-password` and any preview origins).
 */
function buildRecoveryRedirectUrl(): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/reset-password`;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const prefill = sp.get('email');
    if (prefill) setEmail(prefill);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: buildRecoveryRedirectUrl(),
      });

      if (resetError) throw resetError;
      setSent(true);
    } catch (err: unknown) {
      console.error('forgot password:', err);
      // Generic copy — never disclose whether an account exists.
      setSent(true);
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
              Reset your password
            </h1>
          </div>

          <div className="w-full space-y-6 text-left">
            {sent ? (
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  If an account exists for <strong className="text-foreground">{email}</strong>, we
                  just sent a password reset link. Check your inbox (and spam) and follow the link to
                  choose a new password.
                </p>
                <p>
                  The link is valid for a limited time. Didn&apos;t get it? Try again in a minute or
                  contact support.
                </p>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                <p className="text-sm text-muted-foreground">
                  Enter the email you used to sign up and we&apos;ll send you a link to choose a new
                  password.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="recover-email">Email</Label>
                  <Input
                    id="recover-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </div>

                {error ? (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Sending…' : 'Send reset link'}
                </Button>
              </form>
            )}

            <p className="text-center text-sm text-muted-foreground">
              Remembered it?{' '}
              <Link href="/signin" className="font-medium text-foreground underline underline-offset-4">
                Back to sign in
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
