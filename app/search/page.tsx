'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Flex } from '@radix-ui/themes';
import { Header } from '../components/Header';
import { MapView } from '../components/MapView';
import { searchChiropractors, type PatientSearchFilters, type Chiropractor } from '../lib/queries';
import {
  appendSearchFiltersToQuery,
  filtersMatchCurrentUrl,
  filtersToSearchParams,
  getDefaultEmptySearchFilters,
  mergeProfileDefaultsWithUrlParams,
  parseSearchFiltersFromParams,
  patientRowToSearchFilters,
} from '../lib/search-filters-url';
import { createSupabaseClient } from '../lib/supabase-client';

const BUSINESS_LABELS: Record<string, string> = {
  any: 'Any',
  cash: 'Cash-based',
  insurance: 'Insurance-based',
  hybrid: 'Hybrid',
};

const URL_SYNC_DEBOUNCE_MS = 400;

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();
  const [chiropractors, setChiropractors] = useState<Chiropractor[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtersReady, setFiltersReady] = useState(false);

  const [filters, setFilters] = useState<PatientSearchFilters>(() =>
    parseSearchFiltersFromParams(new URLSearchParams(searchParams.toString())),
  );

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
    return () => { cancelled = true; };
  }, [paramsKey]);

  /** Keep the address bar in sync so back/forward and reload preserve zip + filters. */
  useEffect(() => {
    if (!filtersReady) return;
    const t = window.setTimeout(() => {
      if (filtersMatchCurrentUrl(filters, searchParams)) return;
      const nextQs = filtersToSearchParams(filters).toString();
      router.replace(nextQs ? `/search?${nextQs}` : '/search', { scroll: false });
    }, URL_SYNC_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [filters, filtersReady, router, searchParams]);

  const modalityOptions = ['Gonstead', 'Diversified', 'Activator', 'TRT', 'SOT', 'Thompson', 'Webster', 'Cox'];
  const focusAreaOptions = ['Pediatrics', 'Sports', 'Auto Injury', 'Wellness', 'Prenatal', 'Geriatric'];
  const philosophyOptions = ['Evidence-Based', 'Holistic', 'Traditional', 'Functional', 'Sports Medicine', 'Neurological'];
  const paymentOptions = ['Cash-based', 'Insurance-based', 'Hybrid'];

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

  const handleClearFilters = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      preferredModalities: [],
      focusAreas: [],
      preferredPhilosophies: [],
      preferredBusinessModel: '',
    }));
  }, []);

  const handleZipSearch = useCallback(() => {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (filters.zipCode && !zipRegex.test(filters.zipCode.trim())) {
      console.warn('Invalid zip code format.');
    }
    performSearch();
  }, [filters.zipCode, performSearch]);

  return (
    <Flex direction="column" className="search-page-root">
      <Header embedded />
      <div className="search-page-map-area">
        <MapView
          chiropractors={chiropractors}
          profileHrefBuilder={(chiro) => appendSearchFiltersToQuery(`/chiropractor/${chiro.id}`, filters)}
          loading={loading}
          zipCode={filters.zipCode}
          searchRadius={filters.searchRadius}
          onZipChange={(z) => setFilters((prev) => ({ ...prev, zipCode: z }))}
          onRadiusChange={(r) => setFilters((prev) => ({ ...prev, searchRadius: r }))}
          onSearchSubmit={handleZipSearch}
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
          onClearFilters={handleClearFilters}
          onApplyFilters={performSearch}
        />
      </div>
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
