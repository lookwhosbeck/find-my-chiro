'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Flex, Button, Box } from '@radix-ui/themes';
import Link from 'next/link';
import { Container } from './Container';
import { supabase } from '@/app/lib/supabase';

export function Header() {
  const [user, setUser] = useState<any>(null);
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
    router.push('/');
  };
  return (
    <header
      style={{
        borderBottom: '1px solid var(--gray-4)',
        background: 'var(--gray-1)',
      }}
    >
      <Container>
        <Flex
          align="center"
          justify="between"
          py="4"
        >
          {/* Logo */}
          <Flex align="center" gap="2">
            <Box
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--accent-9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '18px',
              }}
            >
            </Box>
            <span
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: 'var(--gray-12)',
              }}
            >
              Find My Chiro
            </span>
          </Flex>

          {/* Navigation */}
          <Flex align="center" gap="4">
            <Link href="/" style={{ textDecoration: 'none', color: 'var(--gray-11)' }}>
              Find Care
            </Link>
            <Link href="/about" style={{ textDecoration: 'none', color: 'var(--gray-11)' }}>
              About
            </Link>

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
              <Flex align="center" gap="2">
                <Button size="2" variant="ghost" asChild>
                  <Link href="/signup">Join Network</Link>
                </Button>
                <Button size="2" variant="outline" asChild>
                  <Link href="/account">Sign In</Link>
                </Button>
              </Flex>
            )}
          </Flex>
        </Flex>
      </Container>
    </header>
  );
}


