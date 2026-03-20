'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Flex, Text, Button, Heading, Card, Box, Tabs, Checkbox, Select, TextField } from '@radix-ui/themes';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Container } from '../components/Container';
import { ChiropractorCard } from '../components/ChiropractorCard';
import { searchChiropractors, type PatientSearchFilters, type Chiropractor } from '../lib/queries';

function ArrowUpRightIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M1 11L11 1M11 1H1M11 1V11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type RefineSearchPanelProps = {
  filters: PatientSearchFilters;
  setFilters: Dispatch<SetStateAction<PatientSearchFilters>>;
  modalityOptions: string[];
  focusAreaOptions: string[];
  insuranceOptions: string[];
  philosophyOptions: string[];
  onModalityChange: (modality: string, checked: boolean) => void;
  onFocusAreaChange: (area: string, checked: boolean) => void;
  onPhilosophyChange: (philosophy: string, checked: boolean) => void;
};

function RefineSearchPanel({
  filters,
  setFilters,
  modalityOptions,
  focusAreaOptions,
  insuranceOptions,
  philosophyOptions,
  onModalityChange,
  onFocusAreaChange,
  onPhilosophyChange,
}: RefineSearchPanelProps) {
  return (
    <Card className="search-refine-card">
      <Tabs.Root defaultValue="techniques" className="search-refine-tabs">
        <Tabs.List>
          <Tabs.Trigger value="techniques">Techniques</Tabs.Trigger>
          <Tabs.Trigger value="specialties">Specialties</Tabs.Trigger>
          <Tabs.Trigger value="philosophy">Philosophy</Tabs.Trigger>
          <Tabs.Trigger value="payment">Payment</Tabs.Trigger>
        </Tabs.List>

        <Box pt="4">
          <Tabs.Content value="techniques">
            <Flex direction="column" gap="3">
              <Text size="2" weight="bold" style={{ color: '#202020' }}>
                Preferred Techniques
              </Text>
              <Flex direction="column" gap="2">
                {modalityOptions.map((modality) => (
                  <Flex key={modality} gap="2" align="center">
                    <Checkbox
                      checked={filters.preferredModalities?.includes(modality) || false}
                      onCheckedChange={(checked) => onModalityChange(modality, checked as boolean)}
                    />
                    <Text size="2" style={{ color: '#202020' }}>
                      {modality}
                    </Text>
                  </Flex>
                ))}
              </Flex>
            </Flex>
          </Tabs.Content>

          <Tabs.Content value="specialties">
            <Flex direction="column" gap="3">
              <Text size="2" weight="bold" style={{ color: '#202020' }}>
                Specialties
              </Text>
              <Flex direction="column" gap="2">
                {focusAreaOptions.map((area) => (
                  <Flex key={area} gap="2" align="center">
                    <Checkbox
                      checked={filters.focusAreas?.includes(area) || false}
                      onCheckedChange={(checked) => onFocusAreaChange(area, checked as boolean)}
                    />
                    <Text size="2" style={{ color: '#202020' }}>
                      {area}
                    </Text>
                  </Flex>
                ))}
              </Flex>
            </Flex>
          </Tabs.Content>

          <Tabs.Content value="philosophy">
            <Flex direction="column" gap="3">
              <Text size="2" weight="bold" style={{ color: '#202020' }}>
                Philosophy & Approach
              </Text>
              <Flex direction="column" gap="2">
                {philosophyOptions.map((philosophy) => (
                  <Flex key={philosophy} gap="2" align="center">
                    <Checkbox
                      checked={filters.preferredPhilosophies?.includes(philosophy) || false}
                      onCheckedChange={(checked) => onPhilosophyChange(philosophy, checked as boolean)}
                    />
                    <Text size="2" style={{ color: '#202020' }}>
                      {philosophy}
                    </Text>
                  </Flex>
                ))}
              </Flex>
            </Flex>
          </Tabs.Content>

          <Tabs.Content value="payment">
            <Flex direction="column" gap="4">
              <Box>
                <Text size="2" weight="bold" mb="2" style={{ color: '#202020' }}>
                  Business Model
                </Text>
                <Select.Root
                  value={filters.preferredBusinessModel || ''}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, preferredBusinessModel: value }))}
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
                <Text size="2" weight="bold" mb="2" style={{ color: '#202020' }}>
                  Insurance
                </Text>
                <Select.Root
                  value={filters.insuranceType || ''}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, insuranceType: value }))}
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
                <Text size="2" weight="bold" mb="2" style={{ color: '#202020' }}>
                  Budget Range
                </Text>
                <Select.Root
                  value={filters.budgetRange || ''}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, budgetRange: value }))}
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
    </Card>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const [chiropractors, setChiropractors] = useState<Chiropractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);

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

  useEffect(() => {
    const zip = searchParams.get('zip');
    if (zip != null && zip !== '') {
      setFilters((prev) => (prev.zipCode === zip ? prev : { ...prev, zipCode: zip }));
    }
  }, [searchParams]);

  const resultsMatchAverage = useMemo(() => {
    if (chiropractors.length === 0) return null;
    const total = chiropractors.reduce((sum, c) => sum + (c.matchScore ?? 0), 0);
    return Math.round(total / chiropractors.length);
  }, [chiropractors]);

  const modalityOptions = ['Gonstead', 'Diversified', 'Activator', 'TRT', 'SOT', 'Thompson', 'Webster', 'Cox'];
  const focusAreaOptions = ['Pediatrics', 'Sports', 'Auto Injury', 'Wellness', 'Prenatal', 'Geriatric'];
  const insuranceOptions = ['BCBS', 'Aetna', 'Cigna', 'UnitedHealthcare', 'Medicare', 'Medicaid'];
  const philosophyOptions = ['Evidence-Based', 'Holistic', 'Traditional', 'Functional', 'Sports Medicine', 'Neurological'];

  const performSearch = useCallback(async () => {
    setLoading(true);
    try {
      const results = await searchChiropractors(filters);
      setChiropractors(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const handleModalityChange = (modality: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      preferredModalities: checked
        ? [...(prev.preferredModalities || []), modality]
        : (prev.preferredModalities || []).filter((m) => m !== modality),
    }));
  };

  const handleFocusAreaChange = (area: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      focusAreas: checked
        ? [...(prev.focusAreas || []), area]
        : (prev.focusAreas || []).filter((a) => a !== area),
    }));
  };

  const handlePhilosophyChange = (philosophy: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      preferredPhilosophies: checked
        ? [...(prev.preferredPhilosophies || []), philosophy]
        : (prev.preferredPhilosophies || []).filter((p) => p !== philosophy),
    }));
  };

  const handleZipSearch = () => {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (filters.zipCode && !zipRegex.test(filters.zipCode.trim())) {
      console.warn('Invalid zip code format. Please enter a 5-digit zip code.');
    }
    performSearch();
  };

  const linkSignupStyle = {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 'var(--space-2)',
    color: 'var(--color-hero-ink)',
    textDecoration: 'none' as const,
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-body)',
  };

  const refinePanel = (
    <RefineSearchPanel
      filters={filters}
      setFilters={setFilters}
      modalityOptions={modalityOptions}
      focusAreaOptions={focusAreaOptions}
      insuranceOptions={insuranceOptions}
      philosophyOptions={philosophyOptions}
      onModalityChange={handleModalityChange}
      onFocusAreaChange={handleFocusAreaChange}
      onPhilosophyChange={handlePhilosophyChange}
    />
  );

  return (
    <Flex direction="column" style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
      <Box style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)' }}>
        <Container>
          <Flex direction="column" style={{ gap: 'var(--space-8)' }}>
            <Box className="search-page-hero">
              <Flex direction="column" align="center" style={{ gap: 'var(--space-8)', width: '100%' }}>
                <Header embedded />

                <Flex direction="column" align="center" style={{ gap: '40px', width: '100%', maxWidth: 666 }}>
                  <Heading
                    as="h1"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(2.25rem, 5.5vw, 4.125rem)',
                      lineHeight: 1,
                      letterSpacing: '-0.03em',
                      fontWeight: 400,
                      color: 'var(--color-hero-ink)',
                      textAlign: 'center',
                      margin: 0,
                    }}
                  >
                    Find a chiropractor
                  </Heading>

                  <Flex align="stretch" justify="center" wrap="wrap" style={{ width: '100%' }}>
                    <div className="search-pill-bar">
                      <div className="search-pill-input-shell">
                        <TextField.Root
                          size="3"
                          placeholder="Enter zipcode"
                          value={filters.zipCode}
                          onChange={(e) => setFilters((prev) => ({ ...prev, zipCode: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleZipSearch();
                          }}
                          className="search-pill-field"
                          style={{ flex: 1, minWidth: 0 }}
                        >
                          <TextField.Slot>
                            <MagnifyingGlassIcon width={15} height={15} color="var(--color-text-secondary)" />
                          </TextField.Slot>
                        </TextField.Root>
                        <Box className="search-pill-radius-select" style={{ flexShrink: 0 }}>
                          <Select.Root
                            value={filters.searchRadius.toString()}
                            onValueChange={(value) =>
                              setFilters((prev) => ({ ...prev, searchRadius: parseInt(value, 10) }))
                            }
                          >
                            <Select.Trigger style={{ minWidth: '88px' }} />
                            <Select.Content>
                              <Select.Item value="5">5 miles</Select.Item>
                              <Select.Item value="10">10 miles</Select.Item>
                              <Select.Item value="15">15 miles</Select.Item>
                              <Select.Item value="25">25 miles</Select.Item>
                              <Select.Item value="50">50 miles</Select.Item>
                              <Select.Item value="100">100 miles</Select.Item>
                            </Select.Content>
                          </Select.Root>
                        </Box>
                      </div>
                      <Button
                        size="3"
                        className="search-find-care-pill"
                        onClick={handleZipSearch}
                      >
                        Find Care
                      </Button>
                    </div>
                  </Flex>

                  <Flex gap="6" align="center" wrap="wrap" justify="center">
                    <Link href="/signup-patient" style={linkSignupStyle}>
                      Patient Signup
                      <ArrowUpRightIcon />
                    </Link>
                    <Link href="/signup" style={linkSignupStyle}>
                      Chiropractor Signup
                      <ArrowUpRightIcon />
                    </Link>
                  </Flex>
                </Flex>
              </Flex>
            </Box>

            <Flex
              direction={{ initial: 'column', lg: 'row' }}
              gap="6"
              align="start"
              style={{ width: '100%' }}
            >
              <Box style={{ width: '100%', flexShrink: 0, maxWidth: 437 }}>
                <Box display={{ initial: 'none', lg: 'block' }} mb={{ initial: '0', lg: '4' }}>
                  <Heading size="5" style={{ fontFamily: 'var(--font-body)', fontWeight: 700, color: '#1d1d1f' }}>
                    Refine Your Search
                  </Heading>
                </Box>

                <Flex
                  display={{ initial: 'flex', lg: 'none' }}
                  justify="between"
                  align="center"
                  mb="4"
                >
                  <Heading size="5" style={{ fontFamily: 'var(--font-body)', fontWeight: 700, color: '#1d1d1f' }}>
                    Refine Your Search
                  </Heading>
                  <Button variant="ghost" size="2" onClick={() => setShowFilters(!showFilters)}>
                    {showFilters ? 'Hide' : 'Show'}
                  </Button>
                </Flex>

                <Box display={{ initial: showFilters ? 'block' : 'none', lg: 'block' }}>{refinePanel}</Box>
              </Box>

              <Box style={{ flex: '1 1 0', minWidth: 0, width: '100%' }}>
                <Flex direction="column" gap="5" pb="3" px={{ initial: '0', lg: '2' }}>
                  <div className="search-results-heading-row">
                    <Heading
                      size="5"
                      style={{ fontFamily: 'var(--font-body)', fontWeight: 700, color: '#1d1d1f', margin: 0 }}
                    >
                      {loading ? 'Searching…' : `${chiropractors.length} Results`}
                    </Heading>
                    {!loading && chiropractors.length > 0 && (
                      <Flex align="center" gap="3" wrap="wrap">
                        <Text size="2" style={{ color: 'rgba(0,0,0,0.61)' }}>
                          Sorted by match score
                        </Text>
                        {resultsMatchAverage != null && (
                          <span className="match-potential-pill">
                            Your filters: {resultsMatchAverage}% match potential
                          </span>
                        )}
                      </Flex>
                    )}
                  </div>

                  {loading ? (
                    <Flex justify="center" py="6">
                      <Text style={{ color: 'rgba(0,0,0,0.61)' }}>Loading results…</Text>
                    </Flex>
                  ) : chiropractors.length > 0 ? (
                    <div className="search-results-grid">
                      {chiropractors.map((chiropractor) => (
                        <ChiropractorCard key={chiropractor.id} chiropractor={chiropractor} />
                      ))}
                    </div>
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
              </Box>
            </Flex>
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
