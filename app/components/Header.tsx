import { Flex, Button, Box } from '@radix-ui/themes';
import Link from 'next/link';
import { Container } from './Container';

export function Header() {
  return (
    <Box
      as="header"
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
            <Box
              as="span"
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: 'var(--gray-12)',
              }}
            >
              Find My Chiro
            </Box>
          </Flex>

          {/* Navigation */}
          <Flex align="center" gap="4">
            <Link href="/" style={{ textDecoration: 'none', color: 'var(--gray-11)' }}>
              Find Care
            </Link>
            <Link href="/about" style={{ textDecoration: 'none', color: 'var(--gray-11)' }}>
              About
            </Link>
            <Button size="2" variant="solid" asChild>
              <Link href="/signup">Join Network</Link>
            </Button>
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
}


