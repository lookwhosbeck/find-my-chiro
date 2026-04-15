'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

type Preview = {
  referralId: string;
  status: string;
  patientLabel: string;
  referringDoctorLabel: string;
  receivingDoctorLabel: string;
};

function ReferralRespondContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('t')?.trim() ?? '';

  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('This link is missing required parameters.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/referrals/preview?t=${encodeURIComponent(token)}`);
        const j = (await res.json()) as Preview & { error?: string };
        if (!res.ok) {
          if (!cancelled) setError(j.error || 'Could not load referral.');
        } else if (!cancelled) {
          setPreview({
            referralId: j.referralId,
            status: j.status,
            patientLabel: j.patientLabel,
            referringDoctorLabel: j.referringDoctorLabel,
            receivingDoctorLabel: j.receivingDoctorLabel,
          });
        }
      } catch {
        if (!cancelled) setError('Network error.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const submit = useCallback(
    async (action: 'accept' | 'decline') => {
      if (!token) return;
      setBusy(true);
      setError(null);
      try {
        const res = await fetch('/api/referrals/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, action }),
        });
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setError(j.error || 'Could not save your response.');
          return;
        }
        setDone(action === 'accept' ? 'accepted' : 'declined');
      } catch {
        setError('Network error.');
      } finally {
        setBusy(false);
      }
    },
    [token],
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center py-24">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (error && !preview) {
    return (
      <div className="mx-auto max-w-[480px] p-6">
        <h1 className="mb-2 text-xl font-semibold tracking-tight">Referral link</h1>
        <p className="text-destructive">{error}</p>
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-[480px] p-6">
        <h1 className="mb-2 text-xl font-semibold tracking-tight">
          {done === 'accepted' ? 'Referral accepted' : 'Referral declined'}
        </h1>
        <p className="text-sm text-muted-foreground">
          Thank you. Your response is saved. The referring doctor can see the updated status under
          Account → Referrals. If referral outcome email templates are configured on the server,
          they may also receive a short notification.
        </p>
        <div className="mt-4">
          <Button asChild>
            <Link href="/account">Go to account</Link>
          </Button>
        </div>
      </div>
    );
  }

  const closed = preview?.status === 'accepted' || preview?.status === 'declined';

  return (
    <div className="mx-auto max-w-[520px] p-6">
      <h1 className="mb-2 text-xl font-semibold tracking-tight">Patient referral</h1>
      {preview ? (
        <p className="mb-4 text-sm text-muted-foreground">
          {preview.referringDoctorLabel} referred <strong>{preview.patientLabel}</strong> to you (
          {preview.receivingDoctorLabel}). Status: <strong>{preview.status}</strong>
        </p>
      ) : null}
      {error ? (
        <p className="mb-3 text-sm text-destructive">{error}</p>
      ) : null}
      {closed ? (
        <p className="text-sm">This referral is already {preview?.status}.</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Button type="button" disabled={busy || !token} onClick={() => void submit('accept')}>
            Accept
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy || !token}
            onClick={() => void submit('decline')}
          >
            Decline
          </Button>
        </div>
      )}
      <div className="mt-4">
        <p className="text-xs text-muted-foreground">
          Sign in to manage all referrals under Account → Referrals.
        </p>
      </div>
    </div>
  );
}

export default function ReferralRespondPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <ReferralRespondContent />
    </Suspense>
  );
}
