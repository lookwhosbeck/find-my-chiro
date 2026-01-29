'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Flex, Text, Button, Heading, Card, TextField, Box } from '@radix-ui/themes';
import { supabase } from '@/app/lib/supabase';
import { Container } from '@/app/components/Container';

export default function SignInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // User is already signed in, redirect to account
        router.push('/account');
        return;
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        throw error;
      }

      // Success - redirect to account page
      router.push('/account');
    } catch (error: any) {
      console.error('Error signing in:', error);
      setError(error.message || 'Failed to sign in. Please check your credentials and try again.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Container className="page-with-header">
        <Flex justify="center" align="center" style={{ minHeight: '50vh' }}>
          <Text>Loading...</Text>
        </Flex>
      </Container>
    );
  }

  return (
    <Container className="page-with-header">
      <Flex direction="column" gap="6" py="9">
        <Flex justify="center">
          <Heading size="6">Sign In to Your Account</Heading>
        </Flex>

        <Card style={{ maxWidth: '400px', margin: '0 auto' }}>
          <form onSubmit={handleSignIn}>
            <Flex direction="column" gap="4">
              <Box>
                <Text size="2" weight="bold" mb="2">Email</Text>
                <TextField.Root
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email"
                  type="email"
                  required
                />
              </Box>

              <Box>
                <Text size="2" weight="bold" mb="2">Password</Text>
                <TextField.Root
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter your password"
                  type="password"
                  required
                />
              </Box>

              {error && (
                <Box style={{ background: 'var(--red-3)', padding: 'var(--space-3)', border: '1px solid var(--red-6)' }}>
                  <Text size="2" color="red">{error}</Text>
                </Box>
              )}

              <Button type="submit" disabled={signingIn} style={{ width: '100%' }}>
                {signingIn ? 'Signing In...' : 'Sign In'}
              </Button>

              <Flex justify="center">
                <Text size="2">
                  Don't have an account?{' '}
                  <Button variant="ghost" size="1" asChild>
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </Text>
              </Flex>
            </Flex>
          </form>
        </Card>

        <Flex justify="center">
          <Button variant="ghost" asChild>
            <Link href="/">← Back to Home</Link>
          </Button>
        </Flex>
      </Flex>
    </Container>
  );
}