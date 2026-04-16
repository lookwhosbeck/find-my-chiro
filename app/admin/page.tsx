'use client';

/**
 * Platform admin: chiropractor verification and subscription overview.
 *
 * One-time: promote your user to admin (run in Supabase SQL Editor as postgres):
 *
 *   ALTER TABLE profiles DISABLE TRIGGER profiles_protect_role_on_update;
 *   UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
 *   ALTER TABLE profiles ENABLE TRIGGER profiles_protect_role_on_update;
 */

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
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

type ChiroRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  practiceName: string | null;
  subscriptionStatus: string | null;
  verificationStatus: string;
  signedUpAt: string | null;
  submittedForReviewAt: string | null;
};

function verificationBadge(status: string): { variant: BadgeProps['variant']; className?: string } {
  switch (status) {
    case 'draft':
      return { variant: 'secondary' };
    case 'pending_review':
      return { variant: 'outline', className: 'border-amber-500/40 bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-50' };
    case 'approved':
      return { variant: 'outline', className: 'border-emerald-600/30 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-50' };
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

export default function AdminPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [rows, setRows] = useState<ChiroRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadList = useCallback(async (accessToken: string) => {
    setListLoading(true);
    setLoadError(null);
    const res = await fetch('/api/admin/chiropractors', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setLoadError(body?.error || `Request failed (${res.status})`);
      setRows([]);
      setListLoading(false);
      return;
    }
    const data = (await res.json()) as ChiroRow[];
    setRows(Array.isArray(data) ? data : []);
    setListLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const supabase = createSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        router.replace('/signin?redirect=/admin');
        return;
      }

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (cancelled) return;
      if (profileErr || profile?.role !== 'admin') {
        router.replace(accountSettingsHref('profile'));
        return;
      }

      setReady(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setLoadError('No session');
        setListLoading(false);
        return;
      }
      await loadList(token);
    })();

    return () => {
      cancelled = true;
    };
  }, [router, loadList]);

  const patchStatus = async (id: string, status: 'approved' | 'rejected') => {
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
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setLoadError(body?.error || `Update failed (${res.status})`);
        return;
      }
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, verificationStatus: status } : r)),
      );
      setLoadError(null);
    } finally {
      setActionId(null);
    }
  };

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <p className="text-muted-foreground text-sm">Checking access…</p>
      </div>
    );
  }

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

        {listLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : (
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
            {!listLoading && rows.length === 0 && !loadError ? (
              <p className="text-muted-foreground border-t px-4 py-6 text-center text-sm">
                No chiropractor profiles found.
              </p>
            ) : null}
          </div>
        )}
    </div>
  );
}
