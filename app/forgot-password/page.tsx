'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';
import { MovynLogo } from '@/app/components/MovynLogo';
import styles from './page.module.css';

/**
 * Builds the redirect target Supabase appends `?code=...` to after the user
 * clicks the recovery link. We bounce through `/auth/callback` so the code
 * gets exchanged for a recovery session, then land on `/reset-password`.
 */
function buildRecoveryRedirectUrl(): string {
  if (typeof window === 'undefined') return '';
  const next = encodeURIComponent('/reset-password');
  return `${window.location.origin}/auth/callback?next=${next}`;
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
    <div className={styles.recoverPage}>
      <div className={styles.recoverSplit}>
        <div className={styles.recoverMain}>
          <h1 className={styles.recoverTitle}>Reset your password</h1>

          <div className={styles.recoverCard}>
            {sent ? (
              <>
                <p className={styles.recoverNotice}>
                  If an account exists for <strong>{email}</strong>, we just sent a password reset
                  link. Check your inbox (and spam) and follow the link to choose a new password.
                </p>
                <p className={styles.recoverIntro}>
                  The link is valid for a limited time. Didn&apos;t get it? Try again in a minute or
                  contact support.
                </p>
              </>
            ) : (
              <>
                <p className={styles.recoverIntro}>
                  Enter the email you used to sign up and we&apos;ll send you a link to choose a new
                  password.
                </p>

                <form className={styles.recoverForm} onSubmit={handleSubmit} noValidate>
                  <div className={styles.recoverField}>
                    <label className={styles.recoverLabel} htmlFor="recover-email">
                      Email
                    </label>
                    <input
                      id="recover-email"
                      className={styles.recoverInput}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@email.com"
                      type="email"
                      autoComplete="email"
                      required
                    />
                  </div>

                  {error ? <div className={styles.recoverError}>{error}</div> : null}

                  <button type="submit" className={styles.recoverSubmit} disabled={submitting}>
                    {submitting ? 'Sending…' : 'Send reset link'}
                  </button>
                </form>
              </>
            )}

            <p className={styles.recoverCardFooter}>
              Remembered it?{' '}
              <Link href="/signin" className={styles.recoverInlineLink}>
                Back to sign in
              </Link>
            </p>
          </div>

          <Link href="/" className={styles.recoverBack}>
            Back to home
          </Link>
        </div>

        <div className={styles.recoverAsideWrap}>
          <div className={styles.recoverAside}>
            <MovynLogo variant="onDark" className={styles.recoverLogoSvg} />
          </div>
        </div>
      </div>
    </div>
  );
}
