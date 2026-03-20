'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Flex, Text, Button, Heading, Card, Box, Tabs, Checkbox, Select } from '@radix-ui/themes';
import Link from 'next/link';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Container } from '../components/Container';
import { ChiropractorCard } from '../components/ChiropractorCard';
import { ProximitySearchBar } from '../components/ProximitySearchBar';
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

function coalesceFilterValue(value: string | undefined): string {
  return value && value !== '' ? value : 'any';
}

const BUSINESS_LABELS: Record<string, string> = {
  any: 'Any',
  cash: 'Cash-based',
  insurance: 'Insurance-based',
  hybrid: 'Hybrid',
};

const BUDGET_LABELS: Record<string, string> = {
  any: 'Any',
  'under-50': 'Under $50/month',
  '50-100': '$50 – $100/month',
  '100-150': '$100 – $150/month',
  'over-150': 'Over $150/month',
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
  const businessValue = coalesceFilterValue(filters.preferredBusinessModel);
  const insuranceValue = coalesceFilterValue(filters.insuranceType);
  const budgetValue = coalesceFilterValue(filters.budgetRange);

  return (
    <Card className="search-refine-card">
      <Tabs.Root defaultValue="techniques" className="search-refine-tabs">
        <Flex direction="column" gap="6">
          <Tabs.List>
            <Tabs.Trigger value="techniques">Techniques</Tabs.Trigger>
            <Tabs.Trigger value="specialties">Specialties</Tabs.Trigger>
            <Tabs.Trigger value="philosophy">Philosophy</Tabs.Trigger>
            <Tabs.Trigger value="payment">Payment</Tabs.Trigger>
          </Tabs.List>

          <Box>
            <Tabs.Content value="techniques">
              <Flex direction="column" gap="3">
                <Text size="2" weight="bold" style={{ color: '#202020', lineHeight: '20px' }}>
                  Preferred Techniques
                </Text>
                <Flex direction="column" gap="2">
                  {modalityOptions.map((modality) => (
                    <Flex key={modality} gap="2" align="center">
                      <Checkbox
                        size="1"
                        variant="surface"
                        checked={filters.preferredModalities?.includes(modality) || false}
                        onCheckedChange={(checked) => onModalityChange(modality, checked as boolean)}
                      />
                      <Text size="2" style={{ color: '#202020', lineHeight: '20px' }}>
                        {modality}
                      </Text>
                    </Flex>
                  ))}
                </Flex>
              </Flex>
            </Tabs.Content>

            <Tabs.Content value="specialties">
              <Flex direction="column" gap="3">
                <Text size="2" weight="bold" style={{ color: '#202020', lineHeight: '20px' }}>
                  Specialties
                </Text>
                <Flex direction="column" gap="2">
                  {focusAreaOptions.map((area) => (
                    <Flex key={area} gap="2" align="center">
                      <Checkbox
                        size="1"
                        variant="surface"
                        checked={filters.focusAreas?.includes(area) || false}
                        onCheckedChange={(checked) => onFocusAreaChange(area, checked as boolean)}
                      />
                      <Text size="2" style={{ color: '#202020', lineHeight: '20px' }}>
                        {area}
                      </Text>
                    </Flex>
                  ))}
                </Flex>
              </Flex>
            </Tabs.Content>

            <Tabs.Content value="philosophy">
              <Flex direction="column" gap="3">
                <Text size="2" weight="bold" style={{ color: '#202020', lineHeight: '20px' }}>
                  Philosophy & Approach
                </Text>
                <Flex direction="column" gap="2">
                  {philosophyOptions.map((philosophy) => (
                    <Flex key={philosophy} gap="2" align="center">
                      <Checkbox
                        size="1"
                        variant="surface"
                        checked={filters.preferredPhilosophies?.includes(philosophy) || false}
                        onCheckedChange={(checked) => onPhilosophyChange(philosophy, checked as boolean)}
                      />
                      <Text size="2" style={{ color: '#202020', lineHeight: '20px' }}>
                        {philosophy}
                      </Text>
                    </Flex>
                  ))}
                </Flex>
              </Flex>
            </Tabs.Content>

            <Tabs.Content value="payment">
              <Flex direction="column" gap="4">
                <Text size="2" weight="bold" style={{ color: '#202020', lineHeight: '20px' }}>
                  Payment
                </Text>
                <Flex direction="column" gap="4">
                  <Flex direction="column" gap="1">
                    <Text size="2" style={{ color: '#202020', lineHeight: '20px', fontWeight: 400 }}>
                      Business Model
                    </Text>
                    <Select.Root
                      value={businessValue}
                      onValueChange={(value) =>
                        setFilters((prev) => ({
                          ...prev,
                          preferredBusinessModel: value === 'any' ? '' : value,
                        }))
                      }
                    >
                      <Select.Trigger className="search-refine-select-trigger" variant="surface" />
                      <Select.Content>
                        <Select.Item value="any">Any</Select.Item>
                        <Select.Item value="cash">{BUSINESS_LABELS.cash}</Select.Item>
                        <Select.Item value="insurance">{BUSINESS_LABELS.insurance}</Select.Item>
                        <Select.Item value="hybrid">{BUSINESS_LABELS.hybrid}</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  </Flex>

                  <Flex direction="column" gap="1">
                    <Text size="2" style={{ color: '#202020', lineHeight: '20px', fontWeight: 400 }}>
                      Insurance
                    </Text>
                    <Select.Root
                      value={insuranceValue}
                      onValueChange={(value) =>
                        setFilters((prev) => ({
                          ...prev,
                          insuranceType: value === 'any' ? '' : value,
                        }))
                      }
                    >
                      <Select.Trigger className="search-refine-select-trigger" variant="surface" />
                      <Select.Content>
                        <Select.Item value="any">Any</Select.Item>
                        {insuranceOptions.map((insurance) => (
                          <Select.Item key={insurance} value={insurance}>
                            {insurance}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  </Flex>

                  <Flex direction="column" gap="1">
                    <Text size="2" style={{ color: '#202020', lineHeight: '20px', fontWeight: 400 }}>
                      Budget Range
                    </Text>
                    <Select.Root
                      value={budgetValue}
                      onValueChange={(value) =>
                        setFilters((prev) => ({
                          ...prev,
                          budgetRange: value === 'any' ? '' : value,
                        }))
                      }
                    >
                      <Select.Trigger className="search-refine-select-trigger" variant="surface" />
                      <Select.Content>
                        <Select.Item value="any">Any</Select.Item>
                        <Select.Item value="under-50">{BUDGET_LABELS['under-50']}</Select.Item>
                        <Select.Item value="50-100">{BUDGET_LABELS['50-100']}</Select.Item>
                        <Select.Item value="100-150">{BUDGET_LABELS['100-150']}</Select.Item>
                        <Select.Item value="over-150">{BUDGET_LABELS['over-150']}</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  </Flex>
                </Flex>
              </Flex>
            </Tabs.Content>
          </Box>
        </Flex>
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
    const radiusParam = searchParams.get('radius');
    setFilters((prev) => {
      let next = prev;
      if (zip != null && zip !== '' && prev.zipCode !== zip) {
        next = { ...next, zipCode: zip };
      }
      if (radiusParam != null && radiusParam !== '') {
        const n = parseInt(radiusParam, 10);
        if (!Number.isNaN(n) && next.searchRadius !== n) {
          next = { ...next, searchRadius: n };
        }
      }
      return next;
    });
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
    gap: '8px',
    color: '#ffffff',
    textDecoration: 'none' as const,
    fontSize: '16px',
    lineHeight: '24px',
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
    <Flex direction="column" style={{ minHeight: '100vh', background: '#ffffff' }}>
      <div className="search-hero-outer">
        <div className="search-page-hero">
          <Header embedded />

          <div className="search-hero-body">
            <Heading
              as="h1"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.5rem, 6vw, 4.125rem)',
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                fontWeight: 400,
                color: '#f7f7f7',
                textAlign: 'center',
                margin: 0,
                width: '100%',
              }}
            >
              Find a chiropractor
            </Heading>

            <div className="search-hero-bar-wrap">
              <ProximitySearchBar
                variant="onDark"
                navigate={false}
                zipCode={filters.zipCode}
                searchRadius={filters.searchRadius}
                onZipChange={(z) => setFilters((prev) => ({ ...prev, zipCode: z }))}
                onRadiusChange={(r) => setFilters((prev) => ({ ...prev, searchRadius: r }))}
                onSubmit={handleZipSearch}
              />
            </div>

            <Flex align="center" wrap="wrap" justify="center" style={{ gap: '40px', width: '100%' }}>
              <Link href="/signup-patient" className="search-hero-signup-link" style={linkSignupStyle}>
                Patient Signup
                <ArrowUpRightIcon />
              </Link>
              <Link href="/signup" className="search-hero-signup-link" style={linkSignupStyle}>
                Chiropractor Signup
                <ArrowUpRightIcon />
              </Link>
            </Flex>
          </div>
        </div>
      </div>

      <Box style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-8)' }}>
        <Container>
          <Flex direction="column" style={{ gap: 'var(--space-8)' }}>
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
