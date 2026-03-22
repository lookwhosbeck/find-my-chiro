'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Button, Text } from '@radix-ui/themes';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';
import { FindMyChiroLogo } from '@/app/components/FindMyChiroLogo';
import styles from './Header.module.css';

type HeaderProps = {
  /** When true, header sits in normal flow (e.g. inside the search hero) instead of floating absolutely. */
  embedded?: boolean;
};

export function Header({ embedded = false }: HeaderProps) {
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileMenuOpen]);

  const checkUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMobileMenuOpen(false);
    router.push('/');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const barClassName = [
    'fmc-site-header',
    styles.bar,
    embedded ? styles.barEmbedded : styles.barFloating,
  ].join(' ');

  return (
    <>
      <header className={barClassName}>
        <Link href="/" className={styles.logoLink}>
          <FindMyChiroLogo variant="standard" className={styles.headerLogo} />
        </Link>

        <div className={styles.desktopCluster}>
          <nav className={styles.navLinks} aria-label="Primary">
            <Link href="/search" className={styles.navTextLink}>
              Find Care
            </Link>
            <Link href="/about" className={styles.navTextLink}>
              About
            </Link>
          </nav>
          <div className={styles.authActions}>
            {user ? (
              <>
                <Button size="2" variant="outline" asChild>
                  <Link href="/account">My Account</Link>
                </Button>
                <Button size="2" variant="ghost" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/signin" className={styles.navTextLink}>
                  Log in
                </Link>
                <Button size="2" variant="solid" asChild className={`join-network-button ${styles.joinCta}`}>
                  <Link href="/signup">Join Network</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          onClick={toggleMobileMenu}
          className={styles.mobileMenuButton}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {mobileMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </Button>
      </header>

      {mounted &&
        mobileMenuOpen &&
        createPortal(
          <div className={styles.mobileFlyoutRoot}>
            <button
              type="button"
              className={styles.mobileFlyoutBackdrop}
              aria-label="Close menu"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className={styles.mobileFlyoutPanel} role="dialog" aria-modal="true" aria-label="Site menu">
              <div className={styles.mobileFlyoutInner}>
                <div className={styles.mobileFlyoutHeaderRow}>
                  <Text size="2" weight="bold" color="gray" style={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Menu
                  </Text>
                  <Button
                    type="button"
                    variant="ghost"
                    size="2"
                    aria-label="Close menu"
                    className={styles.mobileFlyoutClose}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </Button>
                </div>
                <div className={styles.mobileFlyoutLinks}>
                  <Link href="/search" className={styles.mobileFlyoutLink} onClick={() => setMobileMenuOpen(false)}>
                    Find Care
                  </Link>
                  <Link href="/about" className={styles.mobileFlyoutLink} onClick={() => setMobileMenuOpen(false)}>
                    About
                  </Link>
                </div>
                <div className={styles.mobileFlyoutDivider} />
                {user ? (
                  <div className={styles.mobileFlyoutActions}>
                    <Button size="2" variant="outline" asChild style={{ width: '100%' }}>
                      <Link href="/account" onClick={() => setMobileMenuOpen(false)}>
                        My Account
                      </Link>
                    </Button>
                    <Button size="2" variant="ghost" onClick={handleSignOut} style={{ width: '100%' }}>
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className={styles.mobileFlyoutActions}>
                    <Button size="2" variant="solid" asChild className={styles.mobileJoinCta}>
                      <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                        Join Network
                      </Link>
                    </Button>
                    <Button size="2" variant="outline" asChild style={{ width: '100%' }}>
                      <Link href="/signin" onClick={() => setMobileMenuOpen(false)}>
                        Log in
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
