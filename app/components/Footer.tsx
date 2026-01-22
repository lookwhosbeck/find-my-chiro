import { Flex, Text, Container } from '@radix-ui/themes';
import Link from 'next/link';

export function Footer() {
  return (
    <footer
      style={{
        background: '#030302',
        borderRadius: '24px',
        margin: '16px',
        padding: '24px',
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
            padding: '24px 0',
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
                  fontSize: '14px',
                  letterSpacing: '0.14px',
                  textTransform: 'uppercase',
                  color: 'white',
                  marginBottom: '8px',
                }}
              >
                Product
              </Text>
              <div style={{ height: '0.5px', background: 'rgba(255, 255, 255, 0.2)', marginBottom: '8px' }} />
              <Flex direction="column" gap="1">
                <Link href="/features" style={{ textDecoration: 'none', opacity: 0.8 }}>
                  <Text size="2" style={{ color: 'white', fontSize: '14px' }}>
                    Features
                  </Text>
                </Link>
                <Link href="/pricing" style={{ textDecoration: 'none', opacity: 0.8 }}>
                  <Text size="2" style={{ color: 'white', fontSize: '14px' }}>
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
                  fontSize: '14px',
                  letterSpacing: '0.14px',
                  textTransform: 'uppercase',
                  color: 'white',
                  marginBottom: '8px',
                }}
              >
                Community
              </Text>
              <div style={{ height: '0.5px', background: 'rgba(255, 255, 255, 0.2)', marginBottom: '8px' }} />
              <Flex direction="column" gap="1">
                <Link href="/about" style={{ textDecoration: 'none', opacity: 0.8 }}>
                  <Text size="2" style={{ color: 'white', fontSize: '14px' }}>
                    About
                  </Text>
                </Link>
                <Link href="/blog" style={{ textDecoration: 'none', opacity: 0.8 }}>
                  <Text size="2" style={{ color: 'white', fontSize: '14px' }}>
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
                  fontSize: '14px',
                  letterSpacing: '0.14px',
                  textTransform: 'uppercase',
                  color: 'white',
                  marginBottom: '8px',
                }}
              >
                Support
              </Text>
              <div style={{ height: '0.5px', background: 'rgba(255, 255, 255, 0.2)', marginBottom: '8px' }} />
              <Flex direction="column" gap="1">
                <Link href="/help" style={{ textDecoration: 'none', opacity: 0.8 }}>
                  <Text size="2" style={{ color: 'white', fontSize: '14px' }}>
                    Help Center
                  </Text>
                </Link>
                <Link href="/contact" style={{ textDecoration: 'none', opacity: 0.8 }}>
                  <Text size="2" style={{ color: 'white', fontSize: '14px' }}>
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
                  fontSize: '14px',
                  letterSpacing: '0.14px',
                  textTransform: 'uppercase',
                  color: 'white',
                  marginBottom: '8px',
                }}
              >
                Company
              </Text>
              <div style={{ height: '0.5px', background: 'rgba(255, 255, 255, 0.2)', marginBottom: '8px' }} />
              <Flex direction="column" gap="1">
                <Link href="/legal" style={{ textDecoration: 'none', opacity: 0.8 }}>
                  <Text size="2" style={{ color: 'white', fontSize: '14px' }}>
                    Legal
                  </Text>
                </Link>
                <Link href="/privacy" style={{ textDecoration: 'none', opacity: 0.8 }}>
                  <Text size="2" style={{ color: 'white', fontSize: '14px' }}>
                    Privacy Policy
                  </Text>
                </Link>
              </Flex>
            </Flex>
          </Flex>

          {/* Bottom Bar */}
          <div style={{ height: '0.5px', background: 'rgba(255, 255, 255, 0.2)', marginTop: '16px' }} />
          <Flex
            direction={{ initial: 'column', md: 'row' }}
            align="center"
            justify="between"
            gap="4"
            style={{ marginTop: '16px' }}
          >
            <Text
              size="2"
              style={{
                color: 'white',
                opacity: 0.8,
                fontSize: '16px',
                letterSpacing: '-0.32px',
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




