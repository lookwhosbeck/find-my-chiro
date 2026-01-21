import { Flex, Text, Button, Heading, Section, Grid, Card, Box, ScrollArea } from '@radix-ui/themes';
import Link from 'next/link';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Container } from './components/Container';
import { ChiropractorCard } from './components/ChiropractorCard';
import { SearchSection } from './components/SearchSection';
import { getChiropractors } from './lib/queries';

export default async function Home() {
  // Fetch chiropractors from database
  const chiropractors = await getChiropractors(4);
  return (
    <Flex direction="column" style={{ minHeight: '100vh' }}>
      <Header />
      <Flex direction="column" gap="9">
      {/* Section A: The Hero */}
      <Section size="3" style={{ background: 'var(--gray-2)' }}>
        <Container>
          <Flex direction="column" align="center" gap="6" py="9">
            <Heading size="9" align="center">
              Find a Chiropractor Who Aligns With You.
            </Heading>
            <Text size="5" color="gray" align="center">
              Search by location, insurance, and treatment philosophy—not just a name on a map.
            </Text>
            
            {/* Search Section */}
            <SearchSection />
            
            <Flex direction="column" gap="2" align="center">
              <Button size="2" variant="solid" asChild>
                <Link href="/signup-patient">I'm a Patient - Find Care</Link>
              </Button>
              <Button size="2" variant="ghost" asChild>
                <Link href="/signup">Are you a Chiropractor? Join the Network.</Link>
              </Button>
            </Flex>
          </Flex>
        </Container>
      </Section>

      {/* Section B: The "Why Join?" Benefits */}
      <Section size="3">
        <Container>
          <Flex direction="column" gap="6" py="9">
            <Heading size="8" align="center">Why Join?</Heading>
            <Grid columns={{ initial: '1', sm: '3' }} gap="5">
              {/* Benefit 1: The Matching Engine */}
              <Card>
                <Flex direction="column" gap="3">
                  <Heading size="4">The Matching Engine</Heading>
                  <Text as="p" color="gray">
                    We don't just list you; we match you based on Modalities (Gonstead, TRT) and Philosophies (Vitalistic, Evidence-Based).
                  </Text>
                </Flex>
              </Card>

              {/* Benefit 2: Reduce Friction */}
              <Card>
                <Flex direction="column" gap="3">
                  <Heading size="4">Reduce Friction</Heading>
                  <Text as="p" color="gray">
                    Patients filter by Insurance/Cash right away, so you only get calls from people who know your business model.
                  </Text>
                </Flex>
              </Card>

              {/* Benefit 3: Show Your Culture */}
              <Card>
                <Flex direction="column" gap="3">
                  <Heading size="4">Show Your Culture</Heading>
                  <Text as="p" color="gray">
                    Showcase your clinic vibe, not just your address.
                  </Text>
                </Flex>
              </Card>
            </Grid>
          </Flex>
        </Container>
      </Section>

      {/* Section C: Live Directory Preview */}
      <Section size="3" style={{ background: 'var(--gray-2)' }}>
        <Container>
          <Flex direction="column" gap="6" py="9">
            <Heading size="8" align="center">Join top chiropractors like...</Heading>
            
            <Box>
              <ScrollArea>
                {chiropractors.length > 0 ? (
                  <Grid columns={{ initial: '1', sm: '2', md: '4' }} gap="4">
                    {chiropractors.map((chiropractor) => (
                      <ChiropractorCard key={chiropractor.id} chiropractor={chiropractor} />
                    ))}
                  </Grid>
                ) : (
                  <Flex direction="column" align="center" gap="3" py="6">
                    <Text size="3" color="gray" align="center">
                      No chiropractors found. Be the first to join!
                    </Text>
                    <Button size="2" variant="solid" asChild>
                      <Link href="/signup">Join the Network</Link>
                    </Button>
                  </Flex>
                )}
              </ScrollArea>
            </Box>
          </Flex>
        </Container>
      </Section>
      </Flex>
      <Footer />
    </Flex>
  );
}
