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

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { createSupabaseClient } from '@/app/lib/supabase-client';
import styles from './page.module.css';

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

function verificationBadgeClass(status: string): string {
  switch (status) {
    case 'draft':
      return styles.badgeDraft;
    case 'pending_review':
      return styles.badgePending;
    case 'approved':
      return styles.badgeApproved;
    case 'rejected':
      return styles.badgeRejected;
    default:
      return styles.badge;
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
        router.replace('/account');
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

  const handleSignOut = async () => {
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push('/');
  };

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
      <div className={styles.shell}>
        <div className={styles.loadingBox}>Checking access…</div>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <div className={styles.layout}>
        <div className={styles.sidebarWrap}>
          <aside className={styles.sidebar}>
            <p className={styles.sidebarTitle}>Admin</p>
            <nav className={styles.nav}>
              <span className={styles.navItem}>Chiropractors</span>
            </nav>
            <div className={styles.sidebarFooter}>
              <Link href="/" className={styles.sidebarLink}>
                Back to home
              </Link>
              <button type="button" className={styles.signOutBtn} onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          </aside>
        </div>

        <div className={styles.mainWrap}>
          <div className={styles.mainCard}>
            <div className={styles.mainScroll}>
              <h1 className={styles.pageTitle}>Chiropractor signups</h1>
              <p className={styles.pageSubtitle}>
                Review verification status and subscription. Approve or reject to control public directory
                visibility.
              </p>

              {loadError ? <div className={styles.errorBox}>{loadError}</div> : null}

              {listLoading ? (
                <div className={styles.loadingBox}>Loading…</div>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.th}>Name</th>
                        <th className={styles.th}>Email</th>
                        <th className={styles.th}>Practice</th>
                        <th className={styles.th}>Subscription</th>
                        <th className={styles.th}>Verification</th>
                        <th className={styles.th}>Signed up</th>
                        <th className={styles.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.id} className={styles.tr}>
                          <td className={styles.td}>
                            {[r.firstName, r.lastName].filter(Boolean).join(' ') || '—'}
                          </td>
                          <td className={styles.td}>{r.email || '—'}</td>
                          <td className={styles.td}>{r.practiceName || '—'}</td>
                          <td className={styles.td}>
                            <span className={styles.badgeSub}>{r.subscriptionStatus || '—'}</span>
                          </td>
                          <td className={styles.td}>
                            <span className={verificationBadgeClass(r.verificationStatus)}>
                              {r.verificationStatus || '—'}
                            </span>
                          </td>
                          <td className={styles.td}>{formatDate(r.signedUpAt)}</td>
                          <td className={styles.td}>
                            <div className={styles.actionsCell}>
                              {r.verificationStatus !== 'approved' ? (
                                <button
                                  type="button"
                                  className={styles.approveBtn}
                                  disabled={actionId === r.id}
                                  onClick={() => void patchStatus(r.id, 'approved')}
                                >
                                  Approve
                                </button>
                              ) : null}
                              {r.verificationStatus !== 'rejected' ? (
                                <button
                                  type="button"
                                  className={styles.rejectBtn}
                                  disabled={actionId === r.id}
                                  onClick={() => void patchStatus(r.id, 'rejected')}
                                >
                                  Reject
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!listLoading && rows.length === 0 && !loadError ? (
                    <p className={styles.loadingBox}>No chiropractor profiles found.</p>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
