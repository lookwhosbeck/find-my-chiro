import Link from 'next/link';
import { Flex, Text, Heading, Card, Box, Grid, Badge, Button, Section } from '@radix-ui/themes';
import { Container } from '@/app/components/Container';
import { Header } from '@/app/components/Header';
import { Footer } from '@/app/components/Footer';

export default function AboutPage() {
  return (
    <Flex direction="column" style={{ minHeight: '100vh' }} className="page-with-header">
      <Header />

      <Flex direction="column" gap="9">
        {/* Hero Section */}
        <Section size="3" style={{ background: 'var(--gray-2)' }}>
          <Container>
            <Flex direction="column" align="center" gap="6" py="9">
              <Badge size="2" color="blue">Patient-First Healthcare</Badge>
              <Heading size="9" align="center" style={{ maxWidth: '800px', fontFamily: '"Untitled Serif", Georgia, serif', fontWeight: '500' }}>
                Finding a Chiropractor You "Align" With Shouldn't Be Hard
              </Heading>
              <Text size="5" color="gray" align="center" style={{ maxWidth: '600px' }}>
                We're not just another directory. We're a patient-first platform that helps you find chiropractors based on more than just location and reviews.
              </Text>
            </Flex>
          </Container>
        </Section>

        {/* The Problem Section */}
        <Section size="3">
          <Container>
            <Flex direction="column" gap="6" py="9">
              <Heading size="8" align="center">The Problem with Traditional Chiropractor Search</Heading>

              <Grid columns={{ initial: '1', md: '3' }} gap="5">
                <Card>
                  <Flex direction="column" gap="3">
                    <Heading size="4">Generic Directories</Heading>
                    <Text as="p" color="gray">
                      Most platforms just show you names, locations, and star ratings. But finding the right chiropractor is about more than proximity and popularity.
                    </Text>
                  </Flex>
                </Card>

                <Card>
                  <Flex direction="column" gap="3">
                    <Heading size="4">Trial and Error</Heading>
                    <Text as="p" color="gray">
                      Patients often have to "hop around" trying different chiropractors until they find one whose approach, philosophy, and personality align with their needs.
                    </Text>
                  </Flex>
                </Card>

                <Card>
                  <Flex direction="column" gap="3">
                    <Heading size="4">Moving Blues</Heading>
                    <Text as="p" color="gray">
                      When you move cities or states, you have to start the search process all over again, even if you know exactly what type of chiropractor you need.
                    </Text>
                  </Flex>
                </Card>
              </Grid>
            </Flex>
          </Container>
        </Section>

        {/* Our Solution Section */}
        <Section size="3" style={{ background: 'var(--gray-2)' }}>
          <Container>
            <Flex direction="column" gap="6" py="9">
              <Heading size="8" align="center">Our Patient-First Solution</Heading>

              <Grid columns={{ initial: '1', lg: '2' }} gap="8">
                <Flex direction="column" gap="6">
                  <Card>
                    <Flex direction="column" gap="4">
                      <Flex align="center" gap="3">
                        <Box
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'var(--accent-9)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '24px',
                          }}
                        >
                          🎯
                        </Box>
                        <Heading size="5">Vibe Check Matching</Heading>
                      </Flex>
                      <Text as="p" color="gray">
                        Our proprietary matching algorithm considers not just merit and credentials, but personality, treatment philosophy, and practice style. We call it "vibe check" - finding chiropractors you actually connect with.
                      </Text>
                    </Flex>
                  </Card>

                  <Card>
                    <Flex direction="column" gap="4">
                      <Flex align="center" gap="3">
                        <Box
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'var(--accent-9)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '24px',
                          }}
                        >
                          🏠
                        </Box>
                        <Heading size="5">Nationwide Network</Heading>
                      </Flex>
                      <Text as="p" color="gray">
                        With your patient profile saved, moving to a new city or state is effortless. Simply log in and instantly find chiropractors who match your preferences anywhere in the United States.
                      </Text>
                    </Flex>
                  </Card>
                </Flex>

                <Flex direction="column" gap="6">
                  <Card>
                    <Flex direction="column" gap="4">
                      <Flex align="center" gap="3">
                        <Box
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'var(--accent-9)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '24px',
                          }}
                        >
                          ⚡
                        </Box>
                        <Heading size="5">Get It Right the First Time</Heading>
                      </Flex>
                      <Text as="p" color="gray">
                        No more trial and error. Our patient-first approach ensures you find a chiropractor whose treatment style, communication approach, and overall vibe align with your healthcare goals from day one.
                      </Text>
                    </Flex>
                  </Card>

                  <Card>
                    <Flex direction="column" gap="4">
                      <Flex align="center" gap="3">
                        <Box
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'var(--accent-9)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '24px',
                          }}
                        >
                          🎯
                        </Box>
                        <Heading size="5">Smart Matching Algorithm</Heading>
                      </Flex>
                      <Text as="p" color="gray">
                        Our algorithm considers modalities (Gonstead, TRT, Activator), philosophies (vitalistic, evidence-based), insurance preferences, and even clinic culture to find your perfect match.
                      </Text>
                    </Flex>
                  </Card>
                </Flex>
              </Grid>
            </Flex>
          </Container>
        </Section>

        {/* For Chiropractors Section */}
        <Section size="3">
          <Container>
            <Flex direction="column" gap="6" py="9">
              <Heading size="8" align="center">For Chiropractors: Get Patients Who Stick</Heading>

              <Grid columns={{ initial: '1', lg: '2' }} gap="8">
                <Flex direction="column" gap="6">
                  <Card>
                    <Flex direction="column" gap="4">
                      <Heading size="5">Pre-Qualified Patients</Heading>
                      <Text as="p" color="gray">
                        Our platform attracts patients who are specifically looking for your treatment approach and philosophy. No more explaining your methods to patients who want something different.
                      </Text>
                    </Flex>
                  </Card>

                  <Card>
                    <Flex direction="column" gap="4">
                      <Heading size="5">Better Patient Retention</Heading>
                      <Text as="p" color="gray">
                        Patients who find you through our matching system are more likely to stick with their care plan because they chose you based on alignment, not just convenience.
                      </Text>
                    </Flex>
                  </Card>
                </Flex>

                <Flex direction="column" gap="6">
                  <Card>
                    <Flex direction="column" gap="4">
                      <Heading size="5">Showcase Your Unique Approach</Heading>
                      <Text as="p" color="gray">
                        Beyond basic credentials, highlight your treatment philosophy, clinic culture, and what makes your practice special to attract patients who share your vision.
                      </Text>
                    </Flex>
                  </Card>

                  <Card>
                    <Flex direction="column" gap="4">
                      <Heading size="5">Build Long-Term Relationships</Heading>
                      <Text as="p" color="gray">
                        Patients who find their "vibe match" are more engaged, compliant, and likely to refer friends and family who share similar healthcare preferences.
                      </Text>
                    </Flex>
                  </Card>
                </Flex>
              </Grid>
            </Flex>
          </Container>
        </Section>

        {/* Mission Statement */}
        <Section size="3" style={{ background: 'var(--gray-2)' }}>
          <Container>
            <Flex direction="column" align="center" gap="6" py="9">
              <Box style={{ maxWidth: '800px', textAlign: 'center' }}>
                <Text size="5" style={{ fontStyle: 'italic', lineHeight: '1.6' }}>
                  "Healthcare should be personal. Finding the right chiropractor shouldn't feel like online dating or shopping for insurance.
                  It should be about finding someone who understands your health goals and shares your approach to wellness."
                </Text>
              </Box>
              <Text size="3" color="gray" align="center">
                — Find My Chiro Mission
              </Text>
            </Flex>
          </Container>
        </Section>

        {/* Call to Action */}
        <Section size="3">
          <Container>
            <Flex direction="column" align="center" gap="6" py="9">
              <Heading size="6" align="center">Ready to Find Your Chiropractic Match?</Heading>
              <Text size="4" color="gray" align="center" style={{ maxWidth: '600px' }}>
                Join thousands of patients who have found chiropractors they actually connect with. Or if you're a chiropractor, start attracting patients who stick.
              </Text>

              <Flex gap="4" wrap="wrap" justify="center">
                <Button size="3" asChild>
                  <Link href="/signup">Join the Network</Link>
                </Button>

                <Button size="3" variant="outline" asChild>
                  <Link href="/signin">Sign In</Link>
                </Button>
              </Flex>
            </Flex>
          </Container>
        </Section>
      </Flex>

      <Footer />
    </Flex>
  );
}