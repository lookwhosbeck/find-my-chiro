'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Flex, Text, Button, Heading, Card, Grid, Box, Badge, Tabs, Checkbox, Select, TextField } from '@radix-ui/themes';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Container } from '../components/Container';
import { ChiropractorCard } from '../components/ChiropractorCard';
import { searchChiropractors, type PatientSearchFilters, type Chiropractor } from '../lib/queries';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const [chiropractors, setChiropractors] = useState<Chiropractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);

  // Search filters state
  const [filters, setFilters] = useState<PatientSearchFilters>({
    zipCode: searchParams.get('zip') || '',
    preferredModalities: [],
    focusAreas: [],
    preferredBusinessModel: '',
    insuranceType: '',
    budgetRange: '',
    searchRadius: 25,
    preferredPhilosophies: [],
  });

  // Live match score calculation
  const [currentMatchScore, setCurrentMatchScore] = useState(0);

  // Available options
  const modalityOptions = ['Gonstead', 'Diversified', 'Activator', 'TRT', 'SOT', 'Thompson', 'Webster', 'Cox'];
  const focusAreaOptions = ['Pediatrics', 'Sports', 'Auto Injury', 'Wellness', 'Prenatal', 'Geriatric'];
  const insuranceOptions = ['BCBS', 'Aetna', 'Cigna', 'UnitedHealthcare', 'Medicare', 'Medicaid'];
  const philosophyOptions = ['Evidence-Based', 'Holistic', 'Traditional', 'Functional', 'Sports Medicine', 'Neurological'];

  useEffect(() => {
    performSearch();
    calculateLiveMatchScore();
  }, [filters]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const results = await searchChiropractors(filters);
      setChiropractors(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModalityChange = (modality: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      preferredModalities: checked
        ? [...(prev.preferredModalities || []), modality]
        : (prev.preferredModalities || []).filter(m => m !== modality)
    }));
  };

  const handleFocusAreaChange = (area: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      focusAreas: checked
        ? [...(prev.focusAreas || []), area]
        : (prev.focusAreas || []).filter(a => a !== area)
    }));
  };

  const handlePhilosophyChange = (philosophy: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      preferredPhilosophies: checked
        ? [...(prev.preferredPhilosophies || []), philosophy]
        : (prev.preferredPhilosophies || []).filter(p => p !== philosophy)
    }));
  };

  const handleZipSearch = () => {
    // In a real app, you'd geocode the zip code to get city/state
    // For now, we'll just trigger a search
    performSearch();
  };

  const calculateLiveMatchScore = () => {
    // Calculate a theoretical match score based on filled parameters
    let score = 0;
    const maxScore = 100;

    // Location (10 points if ZIP is provided)
    if (filters.zipCode && filters.zipCode.trim()) {
      score += 10;
    }

    // Modalities (20 points if any selected)
    if (filters.preferredModalities && filters.preferredModalities.length > 0) {
      score += 20;
    }

    // Focus areas (20 points if any selected)
    if (filters.focusAreas && filters.focusAreas.length > 0) {
      score += 20;
    }

    // Philosophies (15 points if any selected)
    if (filters.preferredPhilosophies && filters.preferredPhilosophies.length > 0) {
      score += 15;
    }

    // Business model (15 points if specified)
    if (filters.preferredBusinessModel && filters.preferredBusinessModel !== 'any') {
      score += 15;
    }

    // Insurance (10 points if specified)
    if (filters.insuranceType && filters.insuranceType !== 'any') {
      score += 10;
    }

    // Budget range (10 points if specified)
    if (filters.budgetRange && filters.budgetRange !== 'any') {
      score += 10;
    }

    setCurrentMatchScore(Math.min(score, maxScore));
  };

  return (
    <Flex direction="column" style={{ minHeight: '100vh' }}>
      <Header />

      <Box py="6" style={{ flex: 1 }}>
        <Container>
          <Flex direction="column" gap="6">
            {/* Header */}
            <Flex justify="between" align="center">
              <Heading size="6">Find Your Chiropractor</Heading>
              <Flex gap="2" align="center">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
              </Flex>
            </Flex>

            {/* Quick Search */}
            <Card>
              <Flex direction="column" gap="3">
                <Flex gap="3" align="center">
                  <TextField.Root
                    size="3"
                    placeholder="Enter zip code"
                    value={filters.zipCode}
                    onChange={(e) => setFilters(prev => ({ ...prev, zipCode: e.target.value }))}
                    style={{ flex: 1 }}
                  >
                    <TextField.Slot>
                      <MagnifyingGlassIcon />
                    </TextField.Slot>
                  </TextField.Root>
                  <Select.Root
                    value={filters.searchRadius.toString()}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, searchRadius: parseInt(value) }))}
                  >
                    <Select.Trigger style={{ width: '120px' }} />
                    <Select.Content>
                      <Select.Item value="5">5 miles</Select.Item>
                      <Select.Item value="10">10 miles</Select.Item>
                      <Select.Item value="15">15 miles</Select.Item>
                      <Select.Item value="25">25 miles</Select.Item>
                      <Select.Item value="50">50 miles</Select.Item>
                      <Select.Item value="100">100 miles</Select.Item>
                    </Select.Content>
                  </Select.Root>
                  <Button size="3" variant="solid" onClick={handleZipSearch}>
                    Search
                  </Button>
                </Flex>
                {currentMatchScore > 20 && (
                  <Flex justify="center" align="center" gap="2">
                    <Text size="2" color="gray">Estimated match quality:</Text>
                    <Badge color={currentMatchScore >= 70 ? 'green' : currentMatchScore >= 40 ? 'yellow' : 'red'} size="2">
                      {currentMatchScore}%
                    </Badge>
                  </Flex>
                )}
              </Flex>
            </Card>

            <Grid columns={{ initial: '1', lg: showFilters ? '3' : '1' }} gap="6">
              {/* Filters Sidebar */}
              {showFilters && (
                <Box>
                  <Card>
                    <Flex direction="column" gap="4">
                      <Heading size="4">Refine Your Search</Heading>

                      <Tabs.Root defaultValue="techniques">
                        <Tabs.List>
                          <Tabs.Trigger value="techniques">Techniques</Tabs.Trigger>
                          <Tabs.Trigger value="specialties">Specialties</Tabs.Trigger>
                          <Tabs.Trigger value="philosophy">Philosophy</Tabs.Trigger>
                          <Tabs.Trigger value="payment">Payment</Tabs.Trigger>
                        </Tabs.List>

                        <Box pt="4">
                          <Tabs.Content value="techniques">
                            <Flex direction="column" gap="3">
                              <Text size="2" weight="bold">Preferred Techniques</Text>
                              <Flex direction="column" gap="2">
                                {modalityOptions.map((modality) => (
                                  <Flex key={modality} gap="2" align="center">
                                    <Checkbox
                                      checked={filters.preferredModalities?.includes(modality) || false}
                                      onCheckedChange={(checked) =>
                                        handleModalityChange(modality, checked as boolean)
                                      }
                                    />
                                    <Text size="2">{modality}</Text>
                                  </Flex>
                                ))}
                              </Flex>
                            </Flex>
                          </Tabs.Content>

                          <Tabs.Content value="specialties">
                            <Flex direction="column" gap="3">
                              <Text size="2" weight="bold">Specialties</Text>
                              <Flex direction="column" gap="2">
                                {focusAreaOptions.map((area) => (
                                  <Flex key={area} gap="2" align="center">
                                    <Checkbox
                                      checked={filters.focusAreas?.includes(area) || false}
                                      onCheckedChange={(checked) =>
                                        handleFocusAreaChange(area, checked as boolean)
                                      }
                                    />
                                    <Text size="2">{area}</Text>
                                  </Flex>
                                ))}
                              </Flex>
                            </Flex>
                          </Tabs.Content>

                          <Tabs.Content value="philosophy">
                            <Flex direction="column" gap="3">
                              <Text size="2" weight="bold">Philosophy & Approach</Text>
                              <Flex direction="column" gap="2">
                                {philosophyOptions.map((philosophy) => (
                                  <Flex key={philosophy} gap="2" align="center">
                                    <Checkbox
                                      checked={filters.preferredPhilosophies?.includes(philosophy) || false}
                                      onCheckedChange={(checked) =>
                                        handlePhilosophyChange(philosophy, checked as boolean)
                                      }
                                    />
                                    <Text size="2">{philosophy}</Text>
                                  </Flex>
                                ))}
                              </Flex>
                            </Flex>
                          </Tabs.Content>

                          <Tabs.Content value="payment">
                            <Flex direction="column" gap="3">
                              <Box>
                                <Text size="2" weight="bold" mb="2">Business Model</Text>
                                <Select.Root
                                  value={filters.preferredBusinessModel || ''}
                                  onValueChange={(value) => setFilters(prev => ({ ...prev, preferredBusinessModel: value }))}
                                >
                                  <Select.Trigger />
                                  <Select.Content>
                                    <Select.Item value="any">Any</Select.Item>
                                    <Select.Item value="cash">Cash-Based</Select.Item>
                                    <Select.Item value="insurance">Insurance-Based</Select.Item>
                                    <Select.Item value="hybrid">Hybrid</Select.Item>
                                  </Select.Content>
                                </Select.Root>
                              </Box>

                              <Box>
                                <Text size="2" weight="bold" mb="2">Insurance</Text>
                                <Select.Root
                                  value={filters.insuranceType || ''}
                                  onValueChange={(value) => setFilters(prev => ({ ...prev, insuranceType: value }))}
                                >
                                  <Select.Trigger />
                                  <Select.Content>
                                    <Select.Item value="any">Any</Select.Item>
                                    {insuranceOptions.map((insurance) => (
                                      <Select.Item key={insurance} value={insurance}>
                                        {insurance}
                                      </Select.Item>
                                    ))}
                                  </Select.Content>
                                </Select.Root>
                              </Box>

                              <Box>
                                <Text size="2" weight="bold" mb="2">Budget Range</Text>
                                <Select.Root
                                  value={filters.budgetRange || ''}
                                  onValueChange={(value) => setFilters(prev => ({ ...prev, budgetRange: value }))}
                                >
                                  <Select.Trigger />
                                  <Select.Content>
                                    <Select.Item value="any">Any</Select.Item>
                                    <Select.Item value="under-50">Under $50/month</Select.Item>
                                    <Select.Item value="50-100">$50 - $100/month</Select.Item>
                                    <Select.Item value="100-150">$100 - $150/month</Select.Item>
                                    <Select.Item value="over-150">Over $150/month</Select.Item>
                                  </Select.Content>
                                </Select.Root>
                              </Box>
                            </Flex>
                          </Tabs.Content>
                        </Box>
                      </Tabs.Root>
                    </Flex>
                  </Card>
                </Box>
              )}

              {/* Results */}
              <Box style={{ gridColumn: showFilters ? 'span 2' : 'span 1' }}>
                <Card>
                  <Flex direction="column" gap="4">
                    <Flex justify="between" align="center">
                      <Heading size="4">
                        {loading ? 'Searching...' : `${chiropractors.length} Results`}
                      </Heading>
                      {!loading && chiropractors.length > 0 && (
                        <Flex align="center" gap="3">
                          <Text size="2" color="gray">
                            Sorted by match score
                          </Text>
                          {currentMatchScore > 0 && (
                            <Badge color={currentMatchScore >= 70 ? 'green' : currentMatchScore >= 40 ? 'yellow' : 'red'} size="1">
                              Your filters: {currentMatchScore}% match potential
                            </Badge>
                          )}
                        </Flex>
                      )}
                    </Flex>

                    {loading ? (
                      <Flex justify="center" py="6">
                        <Text>Loading results...</Text>
                      </Flex>
                    ) : chiropractors.length > 0 ? (
                      <Grid columns={{ initial: '1', md: '2', lg: showFilters ? '2' : '3' }} gap="4">
                        {chiropractors.map((chiropractor) => (
                          <Card key={chiropractor.id}>
                            <Flex direction="column" gap="3">
                              <ChiropractorCard chiropractor={chiropractor} />
                              {chiropractor.matchScore !== undefined && chiropractor.matchScore > 0 && (
                                <Flex justify="end">
                                  <Badge
                                    color={
                                      chiropractor.matchScore >= 70 ? 'green' :
                                      chiropractor.matchScore >= 40 ? 'yellow' : 'red'
                                    }
                                    size="1"
                                  >
                                    {Math.round(chiropractor.matchScore)}% match
                                  </Badge>
                                </Flex>
                              )}
                            </Flex>
                          </Card>
                        ))}
                      </Grid>
                    ) : (
                      <Flex direction="column" align="center" gap="3" py="6">
                        <Text size="3" color="gray" align="center">
                          No chiropractors found matching your criteria.
                        </Text>
                        <Text size="2" color="gray" align="center">
                          Try adjusting your filters or expanding your search area.
                        </Text>
                        <Button variant="outline" asChild>
                          <Link href="/signup-patient">Create a Patient Profile</Link>
                        </Button>
                      </Flex>
                    )}
                  </Flex>
                </Card>
              </Box>
            </Grid>
          </Flex>
        </Container>
      </Box>

      <Footer />
    </Flex>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}