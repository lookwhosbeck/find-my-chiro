import { Flex, Text, Heading, Box } from '@radix-ui/themes';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Container } from './components/Container';
import { ChiropractorCard } from './components/ChiropractorCard';
import { SearchSection } from './components/SearchSection';
import { Testimonial } from './components/Testimonial';
import { FeatureCard } from './components/FeatureCard';
import { getChiropractors } from './lib/queries';

// Icons for feature cards (simplified SVG icons)



export default async function Home() {
  // Fetch chiropractors from database
  const chiropractors = await getChiropractors(5);
  return (
    <Flex direction="column" style={{ minHeight: '100vh', background: '#fcf9f7' }}>
      <Header />
      <Flex direction="column" gap="0">
      {/* Hero Section with Gradient */}
      <Box
        className="hero-gradient"
        style={{
          minHeight: '720px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '164px 16px 96px',
          position: 'relative',
          borderRadius: '24px',
          margin: '16px',
          boxShadow: '0px 50px 40px 0px rgba(0,0,0,0.01), 0px 50px 40px 0px rgba(0,0,0,0.02), 0px 20px 40px 0px rgba(0,0,0,0.05), 0px 3px 10px 0px rgba(0,0,0,0.08)',
        }}
      >
        <Container>
          <Flex direction="column" align="center" gap="5" style={{ maxWidth: '666px', margin: '0 auto', gap: '64px' }}>
            <Heading
              size="9"
              align="center"
              style={{
                fontFamily: "'Untitled Serif', Georgia, serif",
                fontSize: '66px',
                lineHeight: '66px',
                letterSpacing: '-1.98px',
                color: '#030302',
                fontWeight: 'normal',
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
            padding: '0px 24px',
          }}
          className="main-content"
        >

          {/* Features Section */}
          <Flex direction="column" gap="0" style={{ padding: '0px 0' }}>
            <Heading
              size="8"
              align="center"
              style={{
                fontFamily: "'Untitled Serif', Georgia, serif",
                fontSize: '46px',
                lineHeight: '56.12px',
                letterSpacing: '-1.38px',
                color: '#030302',
                fontWeight: 'normal',
                marginBottom: '60px',
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

          {/* Testimonial 2 */}
          <Testimonial
            quote="I can make my notes not only functional but visually pleasing — which really motivates me to stay organized."
            author="Amity Sensei"
            avatarInitial="A"
            reverse
          />

          {/* Chiropractors Section */}
          <Flex direction="column" gap="6" style={{ padding: '60px 0' }}>
            <Heading
              size="8"
              align="center"
              style={{
                fontFamily: "'Untitled Serif', Georgia, serif",
                fontSize: '54px',
                lineHeight: '59.4px',
                letterSpacing: '-1.08px',
                color: '#030302',
                fontWeight: 'normal',
                marginBottom: '60px',
              }}
            >
              Join top chiropractors like...
            </Heading>
            
            {chiropractors.length > 0 ? (
              <Flex
                gap="4"
                wrap="wrap"
                justify="center"
                style={{
                  maxWidth: '1160px',
                  margin: '0 auto',
                }}
              >
                {chiropractors.map((chiropractor) => (
                  <Box key={chiropractor.id} style={{ width: '240px' }}>
                    <ChiropractorCard chiropractor={chiropractor} />
                  </Box>
                ))}
              </Flex>
            ) : (
              <Flex direction="column" align="center" gap="3" py="6" style={{ gap: '240px', alignItems: 'center' }}>
                <Text size="3" color="gray" align="center">
                  No chiropractors found. Be the first to join!
                </Text>
              </Flex>
            )}
          </Flex>

          {/* Testimonial 3 */}
          <Testimonial
            quote="Craft is way more functional than Apple or Google Notes while being much easier to use than Notion."
            author="Leo"
            avatarInitial="L"
          />
        </Flex>
      </Container>
      </Flex>
      <Footer />
    </Flex>
  );
}
