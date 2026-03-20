'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';
import { FindMyChiroLogo } from '@/app/components/FindMyChiroLogo';
import styles from './page.module.css';

type AccountTab = 'chiropractor' | 'patient';

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
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        router.push('/account');
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

      router.push('/account');
    } catch (err: unknown) {
      console.error('Error signing in:', err);
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to sign in. Please check your credentials and try again.';
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
            <FindMyChiroLogo variant="onDark" className={styles.signinLogoSvg} />
          </div>
        </div>
      </div>
    </div>
  );
}
