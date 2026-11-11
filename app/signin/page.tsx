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
  const [canResendVerification, setCanResendVerification] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const qErr = sp.get('error');
      if (qErr === 'auth_callback') {
        setError('Sign-in was interrupted. Try again or use a fresh link from your email.');
      } else if (qErr === 'auth_exchange') {
        setError(
          'That verification link could not be completed. Try signing in with your password — your email may already be confirmed.',
        );
      } else if (qErr === 'verify_expired') {
        setCanResendVerification(true);
        setError(
          'That confirmation link expired, so this email is not verified yet. Send a new link and open it within 1 hour.',
        );
      } else if (qErr === 'email_not_confirmed' || sp.get('notice') === 'verify_email') {
        setCanResendVerification(true);
        setError(
          'Confirm your email before signing in. Verification links expire after 1 hour — send a new one if yours has.',
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

  const handleResendVerification = async (email: string) => {
    setResendStatus('sending');
    setResendMessage(null);
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo:
          typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
      },
    });
    if (resendError) {
      setResendStatus('idle');
      setResendMessage(resendError.message || 'Could not send a new verification email.');
      return;
    }
    setResendStatus('sent');
  };

  const handleSignIn = async (values: SignInFormValues) => {
    setSigningIn(true);
    setError(null);
    setCanResendVerification(false);
    setResendMessage(null);

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
        setCanResendVerification(true);
        message =
          'Confirm your email before signing in. Verification links expire after 1 hour — send a new one if yours has.';
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
      canResendVerification={canResendVerification}
      resendStatus={resendStatus}
      resendMessage={resendMessage}
      onResendVerification={handleResendVerification}
    />
  );
}
