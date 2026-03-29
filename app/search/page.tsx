'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Flex, Text, Button, Heading, Box } from '@radix-ui/themes';
import Link from 'next/link';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Container } from '../components/Container';
import { ProximitySearchBar } from '../components/ProximitySearchBar';
import { MapView } from '../components/MapView';
import { FilterDropdowns } from '../components/FilterDropdowns';
import { searchChiropractors, type PatientSearchFilters, type Chiropractor } from '../lib/queries';
import {
  appendSearchFiltersToQuery,
  getDefaultEmptySearchFilters,
  mergeProfileDefaultsWithUrlParams,
  patientRowToSearchFilters,
} from '../lib/search-filters-url';
import { createSupabaseClient } from '../lib/supabase-client';

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

const BUSINESS_LABELS: Record<string, string> = {
  any: 'Any',
  cash: 'Cash-based',
  insurance: 'Insurance-based',
  hybrid: 'Hybrid',
};

function SearchPageContent() {
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();
  const [chiropractors, setChiropractors] = useState<Chiropractor[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtersReady, setFiltersReady] = useState(false);
  const [mapFiltersVisible, setMapFiltersVisible] = useState(true);

  const [filters, setFilters] = useState<PatientSearchFilters>(() => getDefaultEmptySearchFilters());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createSupabaseClient();
        const params = new URLSearchParams(paramsKey);
        let base = getDefaultEmptySearchFilters();

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user && !cancelled) {
          const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
          if (prof?.role === 'patient' && !cancelled) {
            const { data: patient } = await supabase.from('patients').select('*').eq('id', user.id).maybeSingle();
            if (patient && !cancelled) {
              base = patientRowToSearchFilters(patient as Record<string, unknown>);
            }
          }
        }

        if (cancelled) return;
        setFilters(mergeProfileDefaultsWithUrlParams(base, params));
        setFiltersReady(true);
      } catch (e) {
        console.error('Search filter hydration failed:', e);
        if (!cancelled) {
          setFilters(mergeProfileDefaultsWithUrlParams(getDefaultEmptySearchFilters(), new URLSearchParams(paramsKey)));
          setFiltersReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [paramsKey]);

  const resultsMatchAverage = useMemo(() => {
    if (chiropractors.length === 0) return null;
    const total = chiropractors.reduce((sum, c) => sum + (c.matchScore ?? 0), 0);
    return Math.round(total / chiropractors.length);
  }, [chiropractors]);

  const modalityOptions = ['Gonstead', 'Diversified', 'Activator', 'TRT', 'SOT', 'Thompson', 'Webster', 'Cox'];
  const focusAreaOptions = ['Pediatrics', 'Sports', 'Auto Injury', 'Wellness', 'Prenatal', 'Geriatric'];
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

  const handleClearMapFilters = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      preferredModalities: [],
      focusAreas: [],
      preferredPhilosophies: [],
      preferredBusinessModel: '',
    }));
  }, []);

  const scrollToMapFilters = useCallback(() => {
    setMapFiltersVisible(true);
    requestAnimationFrame(() => {
      document.getElementById('search-map-filters')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  useEffect(() => {
    if (!filtersReady) return;
    performSearch();
  }, [performSearch, filtersReady]);

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

  const paymentOptions = ['Cash-based', 'Insurance-based', 'Hybrid'];
  const selectedPayment = filters.preferredBusinessModel
    ? [BUSINESS_LABELS[filters.preferredBusinessModel] || filters.preferredBusinessModel]
    : [];

  const handlePaymentChange = (label: string, checked: boolean) => {
    const keyFromLabel = Object.entries(BUSINESS_LABELS).find(([, v]) => v === label)?.[0] || '';
    setFilters((prev) => ({
      ...prev,
      preferredBusinessModel: checked ? keyFromLabel : '',
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
          <Flex direction="column" style={{ gap: 'var(--space-8)', width: '100%' }}>
            <Box
              id="search-map-filters"
              className={!mapFiltersVisible ? 'filter-map-panel--collapsed-mobile' : undefined}
            >
              <FilterDropdowns
                mobileFilterBar
                onMobileFilterClose={() => setMapFiltersVisible(false)}
                onMobileFilterApply={() => {
                  performSearch();
                  setMapFiltersVisible(false);
                }}
                onMobileFilterClear={handleClearMapFilters}
                modalityOptions={modalityOptions}
                focusAreaOptions={focusAreaOptions}
                philosophyOptions={philosophyOptions}
                paymentOptions={paymentOptions}
                selectedModalities={filters.preferredModalities || []}
                selectedFocusAreas={filters.focusAreas || []}
                selectedPhilosophies={filters.preferredPhilosophies || []}
                selectedPayment={selectedPayment}
                onModalityChange={handleModalityChange}
                onFocusAreaChange={handleFocusAreaChange}
                onPhilosophyChange={handlePhilosophyChange}
                onPaymentChange={handlePaymentChange}
              />
            </Box>

            {!filtersReady ? (
              <Flex justify="center" py="6">
                <Text style={{ color: 'rgba(0,0,0,0.61)' }}>Loading your search…</Text>
              </Flex>
            ) : chiropractors.length > 0 ? (
              <div className="search-results-live-region" style={{ position: 'relative' }}>
                {loading && <div className="search-loading-overlay" />}
                <MapView
                  chiropractors={chiropractors}
                  profileHrefBuilder={(chiro) => appendSearchFiltersToQuery(`/chiropractor/${chiro.id}`, filters)}
                  resultsMatchAverage={resultsMatchAverage}
                  onFilterMapClick={scrollToMapFilters}
                />
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
