'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { resolveBrowserSession } from '@/app/lib/auth-session-client';
import { supabase } from '@/app/lib/supabase';
import { SignInForms03, type SignInAccountTab, type SignInFormValues } from '@/components/sign-in-forms-03';

function getRedirectPath(): string {
  if (typeof window === 'undefined') return '/account';
  const raw = new URLSearchParams(window.location.search).get('redirect');
  return raw?.startsWith('/') ? raw : '/account';
}

export default function SignInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [accountTab, setAccountTab] = useState<SignInAccountTab>('chiropractor');
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

  const checkUser = async () => {
    try {
      const session = await resolveBrowserSession(supabase);
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

  const handleSignIn = async (values: SignInFormValues) => {
    setSigningIn(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
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
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-background text-muted-foreground [font-family:var(--font-body)]">
        Loading…
      </div>
    );
  }

  return (
    <SignInForms03
      accountTab={accountTab}
      onAccountTabChange={setAccountTab}
      onSubmit={handleSignIn}
      error={error}
      submitting={signingIn}
      signUpHref={signUpHref}
    />
  );
}
