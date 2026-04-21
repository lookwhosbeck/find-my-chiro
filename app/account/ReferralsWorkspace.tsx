'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { resolveBrowserSession } from '@/app/lib/auth-session-client';
import { supabase } from '@/app/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type ReferralRow = {
  id: string;
  created_at: string;
  updated_at?: string;
  status: string;
  patient_first_name: string;
  patient_last_initial: string;
  patient_email: string;
  match_score: number;
  match_summary?: string | null;
  notes?: string | null;
  referring_chiropractor_id: string;
  receiving_chiropractor_id: string;
  viewed_at?: string | null;
  responded_at?: string | null;
};

type ReferralEventRow = {
  id: string;
  created_at: string;
  event_type: string;
  metadata?: Record<string, unknown>;
};

function awaitingChiropractorResponse(status: string): boolean {
  return status === 'sent' || status === 'viewed';
}

function sortReferralsPendingFirst(a: ReferralRow, b: ReferralRow): number {
  const pa = awaitingChiropractorResponse(a.status) ? 0 : 1;
  const pb = awaitingChiropractorResponse(b.status) ? 0 : 1;
  if (pa !== pb) return pa - pb;
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

function statusBadgeClass(status: string): string {
  if (awaitingChiropractorResponse(status)) {
    return 'border-amber-500/35 bg-amber-50 text-amber-950 dark:bg-amber-950/35 dark:text-amber-50';
  }
  if (status === 'accepted') {
    return 'border-emerald-600/30 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-50';
  }
  if (status === 'declined') {
    return 'border-border bg-muted text-muted-foreground';
  }
  return '';
}

async function authHeaders(): Promise<HeadersInit | null> {
  const session = await resolveBrowserSession(supabase);
  if (!session?.access_token) return null;
  return { Authorization: `Bearer ${session.access_token}` };
}

export function ReferralsWorkspace({ userId }: { userId: string }) {
  const [sent, setSent] = useState<ReferralRow[]>([]);
  const [received, setReceived] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    referral: ReferralRow;
    events: ReferralEventRow[];
    otherParty: { label: string; direction: string };
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const sentSorted = useMemo(() => [...sent].sort(sortReferralsPendingFirst), [sent]);
  const receivedSorted = useMemo(() => [...received].sort(sortReferralsPendingFirst), [received]);

  const loadLists = useCallback(async () => {
    setLoading(true);
    setError(null);
    const h = await authHeaders();
    if (!h) {
      setError('Session expired. Refresh and sign in again.');
      setLoading(false);
      return;
    }
    const res = await fetch('/api/referrals', { headers: h });
    if (!res.ok) {
      setError('Could not load referrals.');
      setLoading(false);
      return;
    }
    const j = (await res.json()) as { sent?: ReferralRow[]; received?: ReferralRow[] };
    setSent(j.sent ?? []);
    setReceived(j.received ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadLists();
  }, [loadLists, userId]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setActionError(null);
    const h = await authHeaders();
    if (!h) return;
    const res = await fetch(`/api/referrals/${id}`, { headers: h });
    if (!res.ok) {
      setDetail(null);
      setDetailLoading(false);
      return;
    }
    const j = (await res.json()) as {
      referral: ReferralRow;
      events: ReferralEventRow[];
      otherParty: { label: string; direction: string };
    };
    setDetail(j);
    setDetailLoading(false);
  }, []);

  useEffect(() => {
    if (selectedId) void loadDetail(selectedId);
    else setDetail(null);
  }, [selectedId, loadDetail]);

  const respond = useCallback(
    async (referralId: string, action: 'accept' | 'decline') => {
      setActionBusy(true);
      setActionError(null);
      const h = await authHeaders();
      if (!h) {
        setActionError('Not signed in.');
        setActionBusy(false);
        return;
      }
      const res = await fetch('/api/referrals/respond', {
        method: 'POST',
        headers: { ...h, 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralId, action }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setActionError(j.error || 'Could not update referral.');
        setActionBusy(false);
        return;
      }
      await loadLists();
      await loadDetail(referralId);
      setActionBusy(false);
    },
    [loadDetail, loadLists],
  );

  const patientLabel = (r: ReferralRow) => `${r.patient_first_name} ${r.patient_last_initial}.`;

  const renderList = (title: string, items: ReferralRow[], kind: 'sent' | 'received', hint: string) => (
    <Card className="min-h-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-xs leading-relaxed">{hint}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">No referrals yet.</p>
        ) : (
          <ScrollArea className="h-[min(280px,40vh)] pr-3">
            <ul className="flex flex-col gap-2">
              {items.map((r) => {
                const active = selectedId === r.id;
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      className={cn(
                        'border-border bg-card text-card-foreground flex w-full flex-col gap-1 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors hover:border-primary/40',
                        active && 'border-primary ring-primary/20 ring-2',
                      )}
                      onClick={() => setSelectedId(r.id)}
                    >
                      <span className="font-medium">
                        {patientLabel(r)} · Match {r.match_score}%
                      </span>
                      <span className="text-muted-foreground flex flex-wrap items-center gap-1 text-xs">
                        {new Date(r.created_at).toLocaleString()} ·{' '}
                        <Badge variant="outline" className={cn('text-[10px] font-semibold uppercase', statusBadgeClass(r.status))}>
                          {r.status}
                        </Badge>
                        <span className="text-muted-foreground/80">
                          {kind === 'sent' ? 'Outgoing' : 'Incoming'}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading referrals…</p>;
  }

  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }

  const canRespond =
    detail &&
    detail.referral.receiving_chiropractor_id === userId &&
    (detail.referral.status === 'sent' || detail.referral.status === 'viewed');

  return (
    <div className="flex min-h-0 flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
      <div className="flex flex-col gap-5">
        {renderList(
          'Sent',
          sentSorted,
          'sent',
          'Referrals you sent: waiting on the other doctor appears first. Status here is the live record (email is optional).',
        )}
        {renderList(
          'Received',
          receivedSorted,
          'received',
          'Referrals to your practice: those still needing accept or decline appear first.',
        )}
      </div>

      <Card className="border-border bg-muted/30 min-h-[200px] shadow-sm lg:min-h-[320px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Details</CardTitle>
          <CardDescription className="text-xs">
            Select a referral to view the timeline and actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedId ? (
            <p className="text-muted-foreground text-sm">Select a referral from the lists.</p>
          ) : detailLoading || !detail ? (
            <p className="text-muted-foreground text-sm">Loading details…</p>
          ) : (
            <div className="space-y-3 text-sm">
              <p className="text-foreground font-semibold">
                {patientLabel(detail.referral)} → {detail.otherParty.label}
              </p>
              <p className="text-muted-foreground">
                Status:{' '}
                <Badge variant="outline" className={cn('align-middle text-xs', statusBadgeClass(detail.referral.status))}>
                  {detail.referral.status}
                </Badge>{' '}
                · Patient email on file: {detail.referral.patient_email}
              </p>
              {detail.otherParty.direction === 'receiving' ? (
                <p className="text-muted-foreground text-xs leading-relaxed">
                  When the receiving doctor accepts or declines, this status updates here immediately.
                </p>
              ) : null}
              {detail.referral.match_summary ? (
                <p className="text-muted-foreground text-xs">
                  Search context: {detail.referral.match_summary}
                </p>
              ) : null}
              {detail.referral.notes ? (
                <p className="text-muted-foreground text-xs">Notes: {detail.referral.notes}</p>
              ) : null}
              <ul className="border-border mt-2 space-y-2 border-t pt-3">
                {detail.events.map((ev) => (
                  <li key={ev.id} className="text-muted-foreground text-xs">
                    <span className="text-foreground font-medium">{ev.event_type}</span> ·{' '}
                    {new Date(ev.created_at).toLocaleString()}
                  </li>
                ))}
              </ul>
              {canRespond ? (
                <div className="flex flex-wrap gap-2 pt-3">
                  <Button
                    type="button"
                    size="sm"
                    disabled={actionBusy}
                    onClick={() => void respond(detail.referral.id, 'accept')}
                  >
                    Accept
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={actionBusy}
                    onClick={() => void respond(detail.referral.id, 'decline')}
                  >
                    Decline
                  </Button>
                </div>
              ) : null}
              {actionError ? <p className="text-destructive pt-1 text-xs">{actionError}</p> : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
