import { Flex, Text, Heading, Box } from '@radix-ui/themes';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Container } from './components/Container';
import { SearchSection } from './components/SearchSection';
import { FeatureCard } from './components/FeatureCard';
import { AutoScrollingCarousel } from './components/AutoScrollingCarousel';
import { getChiropractors } from './lib/queries';

// Icons for feature cards (simplified SVG icons)



export default async function Home() {
  // Fetch 10 most recently added chiropractors from database
  const chiropractors = await getChiropractors(10);
  return (
    <Flex direction="column" style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
      <Header />
      <Flex direction="column" gap="0">
      {/* Hero Section with Gradient */}
      <Box
        className="hero-gradient hero-section"
        style={{
          minHeight: '720px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '164px var(--space-4) var(--space-9)',
          position: 'relative',
          margin: 'var(--space-4)',
          boxShadow: 'var(--shadow-float)',
        }}
      >
        <Container>
          <Flex direction="column" align="center" gap="5" style={{ maxWidth: '666px', margin: '0 auto', gap: 'var(--space-8)' }}>
            <Heading
              size="9"
              align="center"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-5xl)',
                lineHeight: 'var(--leading-tight)',
                letterSpacing: 'var(--tracking-tight)',
                color: 'var(--color-text-primary)',
                fontWeight: '400',
                maxWidth: '800px',
              }}
            >
              Find a Chiropractor Who Aligns with You.
            </Heading>
            
            {/* Search Section */}
            <SearchSection />
          </Flex>
        </Container>
      </Box>

      {/* Main Content Container */}
      <Container>
        <Flex
          direction="column"
          gap="0"
          style={{
            paddingTop: 'var(--space-9)',
            paddingBottom: 'var(--space-7)',
            paddingLeft: 'var(--space-5)',
            paddingRight: 'var(--space-5)',
          }}
          className="main-content"
        >

          {/* Features Section */}
          <Flex direction="column" gap="0" style={{ paddingTop: 'var(--space-9)', paddingBottom: 'var(--space-7)', paddingLeft: '0', paddingRight: '0' }}>
            <Heading
              size="8"
              align="center"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-4xl)',
                lineHeight: 'var(--leading-snug)',
                letterSpacing: 'var(--tracking-tight)',
                color: 'var(--color-text-primary)',
                fontWeight: '400',
                marginBottom: 'var(--space-8)',
              }}
            >
              Why join <span style={{ fontStyle: 'italic' }}>another</span> network?
            </Heading>
            <Flex
              direction={{ initial: 'column', md: 'row' }}
              gap="8"
              style={{ maxWidth: '1160px', margin: '0 auto' }}
            >
              <FeatureCard
                title="The Matching Engine"
                description="We don't just list you; we match you based on Modalities (Gonstead, TRT) and Philosophies (Vitalistic, Evidence-Based)."
              />
              <FeatureCard
                title="Reduce Friction"
                description="Patients filter by Insurance/Cash right away, so you only get calls from people who know your business model."
              />
              <FeatureCard
                title="Show Your Culture"
                description="Showcase your clinic vibe, not just your address."
              />
            </Flex>
          </Flex>
        </Flex>
      </Container>

      {/* Chiropractors Carousel Section - Full Width */}
      <Flex direction="column" gap="6" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-10)', width: '100%' }}>
        <Container>
          <Heading
            size="8"
            align="center"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-4xl)',
              lineHeight: 'var(--leading-snug)',
              letterSpacing: 'var(--tracking-tight)',
              color: 'var(--color-text-primary)',
              fontWeight: '400',
              marginBottom: 'var(--space-8)',
            }}
          >
            Join top chiropractors like...
          </Heading>
        </Container>
        
        {chiropractors.length > 0 ? (
          <AutoScrollingCarousel chiropractors={chiropractors} />
        ) : (
          <Container>
            <Flex direction="column" align="center" gap="3" py="6" style={{ gap: 'var(--space-10)', alignItems: 'center' }}>
              <Text size="3" style={{ color: 'var(--color-text-secondary)' }} align="center">
                No chiropractors found. Be the first to join!
              </Text>
            </Flex>
          </Container>
        )}
      </Flex>
      <Footer />
      </Flex>
    </Flex>
  );
}
