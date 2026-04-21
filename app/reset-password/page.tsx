'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';
import { MovynLogo } from '@/app/components/MovynLogo';
import styles from './page.module.css';

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
    <div className={styles.resetPage}>
      <div className={styles.resetSplit}>
        <div className={styles.resetMain}>
          <h1 className={styles.resetTitle}>Choose a new password</h1>

          <div className={styles.resetCard}>
            {checking ? (
              <p className={styles.resetIntro}>Verifying your reset link…</p>
            ) : linkError ? (
              <>
                <div className={styles.resetError}>{linkError.message}</div>
                <Link href="/forgot-password" className={styles.resetSubmit}>
                  Request a new reset link
                </Link>
              </>
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
