import { Flex, Text, Container } from '@radix-ui/themes';
import Link from 'next/link';

export function Footer() {
  return (
    <footer
      className="footer-container"
      style={{
        background: 'var(--color-text-primary)',
        margin: 'var(--space-4)',
        padding: 'var(--space-5)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Container>
        <Flex
          direction="column"
          gap="6"
          style={{
            maxWidth: '1160px',
            margin: '0 auto',
            padding: 'var(--space-5) 0',
          }}
        >
          {/* Footer Links */}
          <Flex
            direction={{ initial: 'column', md: 'row' }}
            gap="10"
            justify="between"
            wrap="wrap"
          >
            {/* Product Column */}
            <Flex direction="column" gap="1" style={{ flex: 1, minWidth: '200px' }}>
              <Text
                size="2"
                weight="medium"
                style={{
                  fontSize: 'var(--text-sm)',
                  letterSpacing: 'var(--tracking-wide)',
                  textTransform: 'uppercase',
                  color: 'var(--color-surface)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                Product
              </Text>
              <div style={{ height: '0.5px', background: 'var(--color-border)', marginBottom: 'var(--space-2)' }} />
              <Flex direction="column" gap="1">
                <Link href="/features" style={{ textDecoration: 'none', opacity: 0.8 }}>
                  <Text size="2" style={{ color: 'var(--color-surface)', fontSize: 'var(--text-sm)' }}>
                    Features
                  </Text>
                </Link>
                <Link href="/pricing" style={{ textDecoration: 'none', opacity: 0.8 }}>
                  <Text size="2" style={{ color: 'var(--color-surface)', fontSize: 'var(--text-sm)' }}>
                    Pricing
                  </Text>
                </Link>
              </Flex>
            </Flex>

            {/* Community Column */}
            <Flex direction="column" gap="1" style={{ flex: 1, minWidth: '200px' }}>
              <Text
                size="2"
                weight="medium"
                style={{
                  fontSize: 'var(--text-sm)',
                  letterSpacing: 'var(--tracking-wide)',
                  textTransform: 'uppercase',
                  color: 'var(--color-surface)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                Community
              </Text>
              <div style={{ height: '0.5px', background: 'var(--color-border)', marginBottom: 'var(--space-2)' }} />
              <Flex direction="column" gap="1">
                <Link href="/about" style={{ textDecoration: 'none', opacity: 0.8 }}>
                  <Text size="2" style={{ color: 'var(--color-surface)', fontSize: 'var(--text-sm)' }}>
                    About
                  </Text>
                </Link>
                <Link href="/blog" style={{ textDecoration: 'none', opacity: 0.8 }}>
                  <Text size="2" style={{ color: 'var(--color-surface)', fontSize: 'var(--text-sm)' }}>
                    Blog
                  </Text>
                </Link>
              </Flex>
            </Flex>

            {/* Support Column */}
            <Flex direction="column" gap="1" style={{ flex: 1, minWidth: '200px' }}>
              <Text
                size="2"
                weight="medium"
                style={{
                  fontSize: 'var(--text-sm)',
                  letterSpacing: 'var(--tracking-wide)',
                  textTransform: 'uppercase',
                  color: 'var(--color-surface)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                Support
              </Text>
              <div style={{ height: '0.5px', background: 'var(--color-border)', marginBottom: 'var(--space-2)' }} />
              <Flex direction="column" gap="1">
                <Link href="/help" style={{ textDecoration: 'none', opacity: 0.8 }}>
                  <Text size="2" style={{ color: 'var(--color-surface)', fontSize: 'var(--text-sm)' }}>
                    Help Center
                  </Text>
                </Link>
                <Link href="/contact" style={{ textDecoration: 'none', opacity: 0.8 }}>
                  <Text size="2" style={{ color: 'var(--color-surface)', fontSize: 'var(--text-sm)' }}>
                    Contact Support
                  </Text>
                </Link>
              </Flex>
            </Flex>

            {/* Company Column */}
            <Flex direction="column" gap="1" style={{ flex: 1, minWidth: '200px' }}>
              <Text
                size="2"
                weight="medium"
                style={{
                  fontSize: 'var(--text-sm)',
                  letterSpacing: 'var(--tracking-wide)',
                  textTransform: 'uppercase',
                  color: 'var(--color-surface)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                Company
              </Text>
              <div style={{ height: '0.5px', background: 'var(--color-border)', marginBottom: 'var(--space-2)' }} />
              <Flex direction="column" gap="1">
                <Link href="/legal" style={{ textDecoration: 'none', opacity: 0.8 }}>
                  <Text size="2" style={{ color: 'var(--color-surface)', fontSize: 'var(--text-sm)' }}>
                    Legal
                  </Text>
                </Link>
                <Link href="/privacy" style={{ textDecoration: 'none', opacity: 0.8 }}>
                  <Text size="2" style={{ color: 'var(--color-surface)', fontSize: 'var(--text-sm)' }}>
                    Privacy Policy
                  </Text>
                </Link>
              </Flex>
            </Flex>
          </Flex>

          {/* Bottom Bar */}
          <div style={{ height: '0.5px', background: 'var(--color-border)', marginTop: 'var(--space-4)' }} />
          <Flex
            direction={{ initial: 'column', md: 'row' }}
            align="center"
            justify="between"
            gap="4"
            style={{ marginTop: 'var(--space-4)' }}
          >
            <Text
              size="2"
              style={{
                color: 'var(--color-surface)',
                opacity: 0.8,
                fontSize: 'var(--text-base)',
                letterSpacing: 'var(--tracking-normal)',
              }}
            >
              © 2026 Find My Chiro Directory. All rights reserved.
            </Text>
            <Flex gap="2" align="center">
              {/* Social icons placeholder */}
            </Flex>
          </Flex>
        </Flex>
      </Container>
    </footer>
  );
}




