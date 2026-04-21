'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { resolveBrowserSession } from '@/app/lib/auth-session-client';
import { supabase } from '@/app/lib/supabase';
import { MovynLogo } from '@/app/components/MovynLogo';
import styles from './page.module.css';

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
    <div className={styles.resetPage}>
      <div className={styles.resetSplit}>
        <div className={styles.resetMain}>
          <h1 className={styles.resetTitle}>Choose a new password</h1>

          <div className={styles.resetCard}>
            {checking ? (
              <p className={styles.resetIntro}>Verifying your reset link…</p>
            ) : !hasRecoverySession ? (
              <>
                <p className={styles.resetIntro}>
                  This reset link is invalid or has expired. Request a new one to set a new
                  password.
                </p>
                <Link href="/forgot-password" className={styles.resetSubmit}>
                  Request a new reset link
                </Link>
              </>
            ) : done ? (
              <p className={styles.resetNotice}>
                Password updated. Redirecting you to your account…
              </p>
            ) : (
              <>
                <p className={styles.resetIntro}>
                  Pick a strong password you don&apos;t use anywhere else. We&apos;ll sign you in
                  right after.
                </p>

                <form className={styles.resetForm} onSubmit={handleSubmit} noValidate>
                  <div className={styles.resetFields}>
                    <div className={styles.resetField}>
                      <label className={styles.resetLabel} htmlFor="reset-password">
                        New password
                      </label>
                      <input
                        id="reset-password"
                        className={styles.resetInput}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        type="password"
                        autoComplete="new-password"
                        minLength={MIN_PASSWORD_LENGTH}
                        required
                      />
                      <span className={styles.resetHint}>Minimum {MIN_PASSWORD_LENGTH} characters.</span>
                    </div>

                    <div className={styles.resetField}>
                      <label className={styles.resetLabel} htmlFor="reset-password-confirm">
                        Confirm new password
                      </label>
                      <input
                        id="reset-password-confirm"
                        className={styles.resetInput}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your new password"
                        type="password"
                        autoComplete="new-password"
                        minLength={MIN_PASSWORD_LENGTH}
                        required
                      />
                    </div>
                  </div>

                  {error ? <div className={styles.resetError}>{error}</div> : null}

                  <button type="submit" className={styles.resetSubmit} disabled={submitting}>
                    {submitting ? 'Updating…' : 'Update password'}
                  </button>
                </form>
              </>
            )}

            <p className={styles.resetCardFooter}>
              Back to{' '}
              <Link href="/signin" className={styles.resetInlineLink}>
                Sign in
              </Link>
            </p>
          </div>

          <Link href="/" className={styles.resetBack}>
            Back to home
          </Link>
        </div>

        <div className={styles.resetAsideWrap}>
          <div className={styles.resetAside}>
            <MovynLogo variant="onDark" className={styles.resetLogoSvg} />
          </div>
        </div>
      </div>
    </div>
  );
}
