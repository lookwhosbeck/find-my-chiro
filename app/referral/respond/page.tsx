'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Box, Button, Flex, Heading, Text } from '@radix-ui/themes';

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
      <Flex align="center" justify="center" py="9" style={{ minHeight: '50vh' }}>
        <Text color="gray">Loading…</Text>
      </Flex>
    );
  }

  if (error && !preview) {
    return (
      <Box p="6" style={{ maxWidth: 480, margin: '0 auto' }}>
        <Heading size="5" mb="2">
          Referral link
        </Heading>
        <Text color="red">{error}</Text>
        <Box mt="4">
          <Button asChild variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </Box>
      </Box>
    );
  }

  if (done) {
    return (
      <Box p="6" style={{ maxWidth: 480, margin: '0 auto' }}>
        <Heading size="5" mb="2">
          {done === 'accepted' ? 'Referral accepted' : 'Referral declined'}
        </Heading>
        <Text color="gray" size="2">
          Thank you. Your response is saved. The referring doctor can see the updated status under Account → Referrals.
          If referral outcome email templates are configured on the server, they may also receive a short notification.
        </Text>
        <Box mt="4">
          <Button asChild variant="solid">
            <Link href="/account">Go to account</Link>
          </Button>
        </Box>
      </Box>
    );
  }

  const closed = preview?.status === 'accepted' || preview?.status === 'declined';

  return (
    <Box p="6" style={{ maxWidth: 520, margin: '0 auto' }}>
      <Heading size="5" mb="2">
        Patient referral
      </Heading>
      {preview ? (
        <Text size="2" color="gray" mb="4">
          {preview.referringDoctorLabel} referred <strong>{preview.patientLabel}</strong> to you (
          {preview.receivingDoctorLabel}). Status: <strong>{preview.status}</strong>
        </Text>
      ) : null}
      {error ? (
        <Text color="red" size="2" mb="3">
          {error}
        </Text>
      ) : null}
      {closed ? (
        <Text size="2">This referral is already {preview?.status}.</Text>
      ) : (
        <Flex gap="3" wrap="wrap">
          <Button type="button" disabled={busy || !token} onClick={() => void submit('accept')}>
            Accept
          </Button>
          <Button type="button" variant="outline" color="gray" disabled={busy || !token} onClick={() => void submit('decline')}>
            Decline
          </Button>
        </Flex>
      )}
      <Box mt="4">
        <Text size="1" color="gray">
          Sign in to manage all referrals under Account → Referrals.
        </Text>
      </Box>
    </Box>
  );
}

export default function ReferralRespondPage() {
  return (
    <Suspense
      fallback={
        <Flex align="center" justify="center" py="9">
          <Text color="gray">Loading…</Text>
        </Flex>
      }
    >
      <ReferralRespondContent />
    </Suspense>
  );
}
