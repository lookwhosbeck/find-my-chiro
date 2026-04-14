'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';
import { MovynLogo } from '@/app/components/MovynLogo';
import styles from './page.module.css';

type AccountTab = 'chiropractor' | 'patient';

function getRedirectPath(): string {
  if (typeof window === 'undefined') return '/account';
  const raw = new URLSearchParams(window.location.search).get('redirect');
  return raw?.startsWith('/') ? raw : '/account';
}

export default function SignInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [accountTab, setAccountTab] = useState<AccountTab>('chiropractor');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const qErr = sp.get('error');
      if (qErr === 'auth_callback') {
        setError('Sign-in was interrupted. Try again or use a fresh link from your email.');
      } else if (qErr === 'auth_exchange') {
        setError('We could not complete sign-in. Try again or contact support.');
      } else if (qErr === 'email_not_confirmed' || sp.get('notice') === 'verify_email') {
        setError(
          'Confirm your email before signing in. Check your inbox for the Movyn verification message.',
        );
      }
    }
    void checkUser();
  }, []);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        router.replace(getRedirectPath());
      }
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, [router]);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const withTimeout = async <T,>(promise: Promise<T>, ms: number): Promise<T | null> => {
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), ms));
    return (await Promise.race([promise, timeout])) as T | null;
  };

  const resolveSessionFast = async () => {
    const first = await withTimeout(
      supabase.auth.getSession().then((r) => r.data.session),
      2500,
    );
    if (first?.user) return first;

    await withTimeout(supabase.auth.getUser(), 2500);
    const second = await withTimeout(
      supabase.auth.getSession().then((r) => r.data.session),
      2500,
    );
    if (second?.user) return second;

    for (let i = 0; i < 2; i += 1) {
      await sleep(180);
      const retry = await withTimeout(
        supabase.auth.getSession().then((r) => r.data.session),
        1200,
      );
      if (retry?.user) return retry;
    }
    return null;
  };

  const checkUser = async () => {
    try {
      const session = await resolveSessionFast();
      if (session?.user) {
        router.replace(getRedirectPath());
        return;
      }
    } catch (err) {
      console.error('Error checking user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        throw signInError;
      }

      router.push(getRedirectPath());
    } catch (err: unknown) {
      console.error('Error signing in:', err);
      let message =
        err instanceof Error
          ? err.message
          : 'Failed to sign in. Please check your credentials and try again.';
      const low = message.toLowerCase();
      if (low.includes('email not confirmed') || low.includes('not confirmed')) {
        message =
          'Confirm your email before signing in. Check your inbox for the Movyn verification message.';
      }
      setError(message);
    } finally {
      setSigningIn(false);
    }
  };

  const signUpHref = accountTab === 'patient' ? '/signup-patient' : '/signup';

  if (loading) {
    return (
      <div className={styles.signinPage}>
        <div className={styles.signinLoading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.signinPage}>
      <div className={styles.signinSplit}>
        <div className={styles.signinMain}>
          <h1 className={styles.signinTitle}>Sign in to your account</h1>

          <div className={styles.signinCard}>
            <div className={styles.signinTabs} role="tablist" aria-label="Account type">
              <button
                type="button"
                role="tab"
                aria-selected={accountTab === 'chiropractor'}
                className={`${styles.signinTab} ${accountTab === 'chiropractor' ? styles.signinTabActive : ''}`}
                onClick={() => setAccountTab('chiropractor')}
              >
                Chiropractor
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={accountTab === 'patient'}
                className={`${styles.signinTab} ${accountTab === 'patient' ? styles.signinTabActive : ''}`}
                onClick={() => setAccountTab('patient')}
              >
                Patient
              </button>
            </div>

            <form className={styles.signinForm} onSubmit={handleSignIn} noValidate>
              <div className={styles.signinFields}>
                <div className={styles.signinField}>
                  <label className={styles.signinLabel} htmlFor="signin-email">
                    Email
                  </label>
                  <input
                    id="signin-email"
                    className={styles.signinInput}
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="email@email.com"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className={styles.signinField}>
                  <label className={styles.signinLabel} htmlFor="signin-password">
                    Password
                  </label>
                  <input
                    id="signin-password"
                    className={styles.signinInput}
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="Password"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              {error ? <div className={styles.signinError}>{error}</div> : null}

              <button type="submit" className={styles.signinSubmit} disabled={signingIn}>
                {signingIn ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <p className={styles.signinCardFooter}>
              Don&apos;t have an account yet?{' '}
              <Link href={signUpHref} className={styles.signinInlineLink}>
                Sign up
              </Link>
            </p>
          </div>

          <Link href="/" className={styles.signinBack}>
            Back to home
          </Link>
        </div>

        <div className={styles.signinAsideWrap}>
          <div className={styles.signinAside}>
            <MovynLogo variant="onDark" className={styles.signinLogoSvg} />
          </div>
        </div>
      </div>
    </div>
  );
}
