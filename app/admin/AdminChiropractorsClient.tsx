'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
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

function verificationBadge(status: string): { variant: BadgeProps['variant']; className?: string } {
  switch (status) {
    case 'draft':
      return { variant: 'secondary' };
    case 'pending_review':
      return {
        variant: 'outline',
        className:
          'border-amber-500/40 bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-50',
      };
    case 'approved':
      return {
        variant: 'outline',
        className:
          'border-emerald-600/30 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-50',
      };
    case 'rejected':
      return { variant: 'destructive' };
    default:
      return { variant: 'outline' };
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
  const [actionId, setActionId] = useState<string | null>(null);

  const patchStatus = useCallback(async (id: string, status: 'approved' | 'rejected') => {
    const supabase = createSupabaseClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
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
    } finally {
      setActionId(null);
    }
  }, [router]);

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
        Review verification status and subscription. Approve or reject to control public directory visibility.
      </p>

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
              <TableHead>Verification</TableHead>
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
                  <TableCell>{r.email || '—'}</TableCell>
                  <TableCell>{r.practiceName || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {r.subscriptionStatus || '—'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={vb.variant} className={cn('font-normal', vb.className)}>
                      {r.verificationStatus || '—'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(r.signedUpAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      {r.verificationStatus !== 'approved' ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="default"
                          disabled={actionId === r.id}
                          onClick={() => void patchStatus(r.id, 'approved')}
                        >
                          Approve
                        </Button>
                      ) : null}
                      {r.verificationStatus !== 'rejected' ? (
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
