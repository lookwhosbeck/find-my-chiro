'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Flex, Button, Box, Text } from '@radix-ui/themes';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';
import styles from './Header.module.css';

export function Header() {
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

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

  return (
    <header
      style={{
        position: 'absolute',
        top: '32px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '748px',
        zIndex: 1000,
      }}
    >
      <Box
        style={{
          backdropFilter: 'blur(2px)',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.8) 100%)',
          borderRadius: '26px',
          boxShadow: '0px 12px 12px 2px rgba(0,0,0,0.1), 0px 2px 4px -1px rgba(0,0,0,0.06)',
          padding: '8px 16px 8px 8px',
        }}
      >
        <Flex
          align="center"
          justify="between"
          style={{ height: '52px' }}
        >
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Text
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#030302',
                letterSpacing: '-0.32px',
                fontFamily: "'Untitled Sans', sans-serif",
              }}
            >
              Find My Chiro
            </Text>
          </Link>

          {/* Desktop Navigation */}
          <Flex
            align="center"
            gap="4"
            className={styles.desktopNav}
          >
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Text
                size="3"
                style={{
                  color: '#030302',
                  fontSize: '16px',
                  letterSpacing: '-0.32px',
                  fontFamily: "'Untitled Sans', sans-serif",
                }}
              >
                Find Care
              </Text>
            </Link>
            <Link href="/about" style={{ textDecoration: 'none' }}>
              <Text
                size="3"
                style={{
                  color: '#030302',
                  fontSize: '16px',
                  letterSpacing: '-0.32px',
                  fontFamily: "'Untitled Sans', sans-serif",
                }}
              >
                About
              </Text>
            </Link>
          </Flex>

          {/* User Actions */}
          <Flex align="center" gap="3">
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
                    color: '#030302',
                    fontSize: '16px',
                    letterSpacing: '-0.32px',
                    fontFamily: "'Untitled Sans', sans-serif",
                  }}
                >
                  Log in
                </Link>
                <Button
                  size="2"
                  variant="solid"
                  asChild
                  style={{
                    background: '#030302',
                    color: 'white',
                    borderRadius: '9999px',
                    padding: '6px 14px',
                    boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)',
                  }}
                >
                  <Link href="/signup">Join Network</Link>
                </Button>
              </Flex>
            )}
          </Flex>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            onClick={toggleMobileMenu}
            className={styles.mobileMenuButton}
            aria-label="Toggle menu"
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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <Box className={styles.mobileMenu}>
            <Flex direction="column" gap="3">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                style={{ textDecoration: 'none', color: 'var(--gray-11)', padding: '8px 0' }}
              >
                <Text size="3">Find Care</Text>
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                style={{ textDecoration: 'none', color: 'var(--gray-11)', padding: '8px 0' }}
              >
                <Text size="3">About</Text>
              </Link>

              {user ? (
                // Logged in user
                <>
                  <Link
                    href="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ textDecoration: 'none', padding: '8px 0' }}
                  >
                    <Button size="2" variant="outline" style={{ width: '100%' }}>
                      My Account
                    </Button>
                  </Link>
                  <Button
                    size="2"
                    variant="ghost"
                    onClick={handleSignOut}
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                // Not logged in
                <>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ textDecoration: 'none', padding: '8px 0' }}
                  >
                    <Button size="2" variant="ghost" style={{ width: '100%' }}>
                      Join Network
                    </Button>
                  </Link>
                  <Link
                    href="/signin"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ textDecoration: 'none', padding: '8px 0' }}
                  >
                    <Button size="2" variant="outline" style={{ width: '100%' }}>
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </Flex>
          </Box>
        )}
      </Box>
    </header>
  );
}


