'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Flex, Button, Box, Text } from '@radix-ui/themes';
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
      const { data: { user } } = await supabase.auth.getUser();
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

  const positionStyles = embedded
    ? {
        position: 'relative' as const,
        top: undefined,
        left: undefined,
        transform: undefined,
        width: '100%',
        maxWidth: '748px',
        marginLeft: 'auto',
        marginRight: 'auto',
      }
    : {
        position: 'absolute' as const,
        top: 'var(--space-6)',
        left: '50%',
        transform: 'translateX(-50%)',
        /* Viewport inset so the pill’s rounded ends stay visible (not clipped at screen edges) */
        width: 'min(748px, calc(100vw - 32px))',
        maxWidth: '748px',
      };

  return (
    <header
      className={styles.headerShell}
      style={{
        ...positionStyles,
        zIndex: 1000,
        borderRadius: '999px',
        overflow: 'hidden',
      }}
    >
      <Box className={`header-container ${styles.headerBar}`}>
        <Flex
          align="center"
          justify="between"
          gap="3"
          className={styles.headerRow}
        >
          {/* Logo */}
          <Link
            href="/"
            className={styles.logoLink}
            style={{ textDecoration: 'none' }}
          >
            <FindMyChiroLogo variant="standard" className={styles.headerLogo} />
          </Link>

          {/* Desktop: nav + auth (hidden on small screens) */}
          <Flex align="center" gap="6" className={styles.desktopCluster}>
            <Flex
              align="center"
              gap="4"
              className={styles.desktopNav}
            >
              <Link href="/search" style={{ textDecoration: 'none' }}>
                <Text
                  size="3"
                  style={{
                    color: 'var(--color-hero-ink)',
                    fontSize: '16px',
                    letterSpacing: '-0.32px',
                    fontFamily: 'var(--font-body)',
                    lineHeight: '22.4px',
                  }}
                >
                  Find Care
                </Text>
              </Link>
              <Link href="/about" style={{ textDecoration: 'none' }}>
                <Text
                  size="3"
                  style={{
                    color: 'var(--color-hero-ink)',
                    fontSize: '16px',
                    letterSpacing: '-0.32px',
                    fontFamily: 'var(--font-body)',
                    lineHeight: '22.4px',
                  }}
                >
                  About
                </Text>
              </Link>
            </Flex>

            <Flex align="center" gap="3" className={styles.desktopUserActions}>
            {user ? (
              // Logged in user
              <Flex align="center" gap="2">
                <Button size="2" variant="outline" asChild>
                  <Link href="/account">My Account</Link>
                </Button>
                <Button size="2" variant="ghost" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </Flex>
            ) : (
              // Not logged in
              <Flex align="center" gap="3">
                <Link
                  href="/signin"
                  style={{
                    textDecoration: 'none',
                    color: 'var(--color-hero-ink)',
                    fontSize: '16px',
                    letterSpacing: '-0.32px',
                    fontFamily: 'var(--font-body)',
                    lineHeight: '22.4px',
                  }}
                >
                  Log in
                </Link>
                <Button
                  size="2"
                  variant="solid"
                  asChild
                  className="join-network-button"
                  style={{
                    background: 'var(--color-hero-ink)',
                    color: '#ffffff',
                    padding: '6px 14px',
                    borderRadius: '999px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
                    minHeight: 'auto',
                    fontSize: '16px',
                    fontWeight: 500,
                    lineHeight: '24px',
                  }}
                >
                  <Link href="/signup">Join Network</Link>
                </Button>
              </Flex>
            )}
            </Flex>
          </Flex>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            onClick={toggleMobileMenu}
            className={styles.mobileMenuButton}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </>
              )}
            </svg>
          </Button>
        </Flex>
      </Box>

      {/* Mobile flyout: portaled so it isn’t clipped by header overflow / transform */}
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
              <Flex direction="column" gap="4" className={styles.mobileFlyoutInner}>
                <Flex justify="between" align="center">
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
                </Flex>
                <Flex direction="column" gap="1">
                  <Link
                    href="/search"
                    className={styles.mobileFlyoutLink}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Find Care
                  </Link>
                  <Link href="/about" className={styles.mobileFlyoutLink} onClick={() => setMobileMenuOpen(false)}>
                    About
                  </Link>
                </Flex>

                <div className={styles.mobileFlyoutDivider} />

                {user ? (
                  <Flex direction="column" gap="3">
                    <Button size="2" variant="outline" asChild style={{ width: '100%' }}>
                      <Link href="/account" onClick={() => setMobileMenuOpen(false)}>
                        My Account
                      </Link>
                    </Button>
                    <Button size="2" variant="ghost" onClick={handleSignOut} style={{ width: '100%' }}>
                      Sign Out
                    </Button>
                  </Flex>
                ) : (
                  <Flex direction="column" gap="3">
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
                  </Flex>
                )}
              </Flex>
            </div>
          </div>,
          document.body,
        )}
    </header>
  );
}


