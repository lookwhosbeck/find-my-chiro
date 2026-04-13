'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/app/lib/supabase';

import rs from './ReferralsWorkspace.module.css';

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

/** Pending (sent/viewed) first, then newest first. */
function sortReferralsPendingFirst(a: ReferralRow, b: ReferralRow): number {
  const pa = awaitingChiropractorResponse(a.status) ? 0 : 1;
  const pb = awaitingChiropractorResponse(b.status) ? 0 : 1;
  if (pa !== pb) return pa - pb;
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

function statusAccentClass(status: string): string {
  if (awaitingChiropractorResponse(status)) return rs.statusAwaiting;
  if (status === 'accepted') return rs.statusAccepted;
  if (status === 'declined') return rs.statusDeclined;
  return '';
}

async function authHeaders(): Promise<HeadersInit | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
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

  const renderList = (
    title: string,
    items: ReferralRow[],
    kind: 'sent' | 'received',
    hint: string,
  ) => (
    <div>
      <h3 className={rs.sectionTitle}>{title}</h3>
      <p className={rs.sectionHint}>{hint}</p>
      {items.length === 0 ? (
        <p className={rs.meta}>No referrals yet.</p>
      ) : (
        <ul className={rs.list}>
          {items.map((r) => {
            const accent = statusAccentClass(r.status);
            return (
              <li key={r.id}>
                <button
                  type="button"
                  className={`${rs.item} ${selectedId === r.id ? rs.itemActive : ''}`}
                  onClick={() => setSelectedId(r.id)}
                >
                  <span>
                    <strong>{patientLabel(r)}</strong> · Match {r.match_score}%
                  </span>
                  <span className={rs.meta}>
                    {new Date(r.created_at).toLocaleString()} ·{' '}
                    <span className={[rs.status, accent].filter(Boolean).join(' ')}>{r.status}</span>
                    {kind === 'sent' ? ' · Outgoing' : ' · Incoming'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  if (loading) {
    return <p className={rs.meta}>Loading referrals…</p>;
  }

  if (error) {
    return <p className={rs.error}>{error}</p>;
  }

  const canRespond =
    detail &&
    detail.referral.receiving_chiropractor_id === userId &&
    (detail.referral.status === 'sent' || detail.referral.status === 'viewed');

  return (
    <div className={rs.workspace}>
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

      {selectedId ? (
        <div className={rs.detail}>
          {detailLoading || !detail ? (
            <p className={rs.meta}>Loading details…</p>
          ) : (
            <>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
                {patientLabel(detail.referral)} → {detail.otherParty.label}
              </p>
              <p className={rs.meta} style={{ marginTop: 8 }}>
                Status:{' '}
                <span
                  className={[rs.status, statusAccentClass(detail.referral.status)].filter(Boolean).join(' ')}
                >
                  {detail.referral.status}
                </span>{' '}
                · Patient email on file (for care coordination): {detail.referral.patient_email}
              </p>
              {detail.otherParty.direction === 'receiving' ? (
                <p className={rs.sectionHint} style={{ marginTop: 6 }}>
                  When the receiving doctor accepts or declines, this status updates here immediately.
                </p>
              ) : null}
              {detail.referral.match_summary ? (
                <p className={rs.meta} style={{ marginTop: 8 }}>
                  Search context: {detail.referral.match_summary}
                </p>
              ) : null}
              {detail.referral.notes ? (
                <p className={rs.meta} style={{ marginTop: 8 }}>
                  Notes: {detail.referral.notes}
                </p>
              ) : null}
              <ul className={rs.timeline}>
                {detail.events.map((ev) => (
                  <li key={ev.id}>
                    <strong>{ev.event_type}</strong> · {new Date(ev.created_at).toLocaleString()}
                  </li>
                ))}
              </ul>
              {canRespond ? (
                <div className={rs.actions}>
                  <button
                    type="button"
                    className={`${rs.actionBtn} ${rs.accept}`}
                    disabled={actionBusy}
                    onClick={() => void respond(detail.referral.id, 'accept')}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className={`${rs.actionBtn} ${rs.decline}`}
                    disabled={actionBusy}
                    onClick={() => void respond(detail.referral.id, 'decline')}
                  >
                    Decline
                  </button>
                </div>
              ) : null}
              {actionError ? <p className={rs.error}>{actionError}</p> : null}
            </>
          )}
        </div>
      ) : (
        <p className={rs.meta}>Select a referral to view the timeline and actions.</p>
      )}
    </div>
  );
}
