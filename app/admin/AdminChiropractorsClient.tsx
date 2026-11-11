'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { resolveBrowserSession } from '@/app/lib/auth-session-client';
import { createSupabaseClient } from '@/app/lib/supabase-client';
import { accountSettingsHref } from '@/lib/movyn-account-routes';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { AdminChiroRow } from '@/app/lib/admin-chiropractors.server';

function visibilityLabel(status: string): string {
  if (status === 'approved') return 'On website';
  if (status === 'rejected') return 'Rejected';
  return 'Hidden';
}

function verificationBadge(status: string): { variant: BadgeProps['variant']; className?: string } {
  switch (status) {
    case 'approved':
      return {
        variant: 'outline',
        className:
          'border-emerald-600/30 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-50',
      };
    case 'rejected':
      return { variant: 'destructive' };
    default:
      return {
        variant: 'outline',
        className:
          'border-amber-500/40 bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-50',
      };
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export function AdminChiropractorsClient({ initialRows }: { initialRows: AdminChiroRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<AdminChiroRow[]>(initialRows);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const patchStatus = useCallback(async (id: string, status: 'approved' | 'pending_review' | 'rejected') => {
    const supabase = createSupabaseClient();
    const session = await resolveBrowserSession(supabase);
    const token = session?.access_token;
    if (!token) return;

    setActionId(id);
    try {
      const res = await fetch('/api/admin/chiropractors', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, status }),
      });
      if (res.status === 403) {
        router.replace(accountSettingsHref('profile'));
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setLoadError(body?.error || `Update failed (${res.status})`);
        return;
      }
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, verificationStatus: status } : r)));
      setLoadError(null);
      setNotice(null);
    } finally {
      setActionId(null);
    }
  }, [router]);

  const resendVerification = useCallback(async (id: string) => {
    const supabase = createSupabaseClient();
    const session = await resolveBrowserSession(supabase);
    const token = session?.access_token;
    if (!token) return;

    setActionId(id);
    try {
      const res = await fetch('/api/admin/chiropractors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
      if (res.status === 403) {
        router.replace(accountSettingsHref('profile'));
        return;
      }
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setNotice(null);
        setLoadError(body?.error || `Could not resend (${res.status})`);
        if (res.status === 409) {
          setRows((prev) => prev.map((r) => (r.id === id ? { ...r, emailConfirmed: true } : r)));
        }
        return;
      }
      setLoadError(null);
      setNotice('Verification email sent.');
    } finally {
      setActionId(null);
    }
  }, [router]);

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
        New profiles stay hidden from the homepage carousel and the directory until you show them.
        Hide takes a profile off the website without rejecting it. Resend the verification email when
        someone has not confirmed their address.
      </p>

      {notice ? (
        <div
          className="rounded-lg border border-emerald-600/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-50"
          role="status"
        >
          {notice}
        </div>
      ) : null}

      {loadError ? (
        <div
          className="text-destructive border-destructive/30 bg-destructive/5 rounded-lg border px-4 py-3 text-sm"
          role="alert"
        >
          {loadError}
        </div>
      ) : null}

      <div className="bg-card text-card-foreground rounded-xl border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Practice</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Signed up</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const vb = verificationBadge(r.verificationStatus);
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {[r.firstName, r.lastName].filter(Boolean).join(' ') || '—'}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div>{r.email || '—'}</div>
                      {r.emailConfirmed ? (
                        <p className="text-muted-foreground text-xs">Email confirmed</p>
                      ) : r.email ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={actionId === r.id}
                          onClick={() => void resendVerification(r.id)}
                        >
                          Resend verification
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>{r.practiceName || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {r.subscriptionStatus || '—'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={vb.variant} className={cn('font-normal', vb.className)}>
                      {visibilityLabel(r.verificationStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(r.signedUpAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      {r.verificationStatus === 'approved' ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={actionId === r.id}
                          onClick={() => void patchStatus(r.id, 'pending_review')}
                        >
                          Hide from website
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="default"
                          disabled={actionId === r.id}
                          onClick={() => void patchStatus(r.id, 'approved')}
                        >
                          Show on website
                        </Button>
                      )}
                      {r.verificationStatus !== 'rejected' && r.verificationStatus !== 'approved' ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={actionId === r.id}
                          onClick={() => void patchStatus(r.id, 'rejected')}
                        >
                          Reject
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {rows.length === 0 && !loadError ? (
          <p className="text-muted-foreground border-t px-4 py-6 text-center text-sm">
            No chiropractor profiles found.
          </p>
        ) : null}
      </div>
    </div>
  );
}
