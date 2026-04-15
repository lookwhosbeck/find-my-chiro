'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Header } from '@/app/components/Header';
import { Footer } from '@/app/components/Footer';
import { Container } from '@/app/components/Container';
import { MatchRadarChart } from '@/app/components/MatchRadarChart';
import { ReferPatientModal } from '@/app/components/ReferPatientModal';
import { fetchReferralCanRefer } from '@/app/lib/referral-client';
import { createSupabaseClient } from '@/app/lib/supabase-client';
import type { Chiropractor } from '@/app/lib/queries';
import { parseSearchFiltersFromParams, appendSearchFiltersToQuery } from '@/app/lib/search-filters-url';
import { buildMatchRadarOverlay, computeMatchAxes, matchPercentFromAxes } from '@/app/lib/patient-match';
import { matchScorePillColors } from '@/app/lib/match-score-pill-colors';
import styles from './page.module.css';

const BUDGET_LABELS: Record<string, string> = {
  any: 'Any',
  'under-50': 'Under $50/month',
  '50-100': '$50 – $100/month',
  '100-150': '$100 – $150/month',
  'over-150': 'Over $150/month',
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash-based',
  insurance: 'Insurance-based',
  hybrid: 'Hybrid',
};

function formatBudget(code: string | null | undefined): string | null {
  if (!code || code === 'any') return null;
  return BUDGET_LABELS[code] ?? code;
}

function paymentModelsDisplay(chiro: Chiropractor): string[] {
  const raw = chiro.paymentModels?.length ? chiro.paymentModels : chiro.businessModel ? [chiro.businessModel] : [];
  return raw.map((k) => PAYMENT_LABELS[k] ?? k);
}

function ChiropractorProfileContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const idParam = params.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  const filtersKey = searchParams.toString();
  const filters = useMemo(
    () => parseSearchFiltersFromParams(new URLSearchParams(filtersKey || undefined)),
    [filtersKey],
  );

  const [chiro, setChiro] = useState<Chiropractor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'notfound' | 'fail' | null>(null);
  const [canReferPatient, setCanReferPatient] = useState(false);
  const [referOpen, setReferOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/chiropractors/${id}`);
        if (res.status === 404) {
          if (!cancelled) {
            setError('notfound');
            setChiro(null);
          }
          return;
        }
        if (!res.ok) {
          if (!cancelled) {
            setError('fail');
            setChiro(null);
          }
          return;
        }
        const data = (await res.json()) as Chiropractor;
        if (!cancelled) setChiro(data);
      } catch {
        if (!cancelled) {
          setError('fail');
          setChiro(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseClient();

    const syncReferEligibility = () => {
      void (async () => {
        const ok = await fetchReferralCanRefer();
        if (!cancelled) setCanReferPatient(ok);
      })();
    };

    syncReferEligibility();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) syncReferEligibility();
      else if (!cancelled) setCanReferPatient(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [id]);

  const axes = useMemo(() => (chiro ? computeMatchAxes(chiro, filters) : []), [chiro, filters]);
  const overlayRows = useMemo(() => (chiro ? buildMatchRadarOverlay(chiro, filters) : []), [chiro, filters]);
  const radarPoints = useMemo(
    () =>
      overlayRows.map((r) => ({
        label: r.label,
        userScore: r.userScore,
        providerScore: r.providerScore,
      })),
    [overlayRows],
  );
  const matchPct = useMemo(() => matchPercentFromAxes(axes), [axes]);
  const hasFilterContext = overlayRows.length > 0;
  const searchBackHref = appendSearchFiltersToQuery('/search', filters);

  if (!id) {
    return (
      <Container>
        <div className="py-6">
          <p className="text-sm text-muted-foreground">Invalid profile.</p>
        </div>
      </Container>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center py-24">
        <p className="text-sm" style={{ color: 'rgba(0,0,0,0.61)' }}>
          Loading profile…
        </p>
      </div>
    );
  }

  if (error === 'notfound' || !chiro) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <div className="search-hero-outer">
          <div className="search-page-hero">
            <Header embedded />
          </div>
        </div>
        <Container>
          <div className="flex flex-col items-center gap-4 py-24">
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Profile not found
            </h1>
            <p className="text-sm text-muted-foreground">
              This chiropractor may no longer be listed or the link is incorrect.
            </p>
            <Button asChild variant="outline">
              <Link href="/search">Back to search</Link>
            </Button>
          </div>
        </Container>
        <Footer />
      </div>
    );
  }

  const displayName = `Dr. ${chiro.firstName} ${chiro.lastName}`.trim();
  const initials = `${chiro.firstName?.[0] || ''}${chiro.lastName?.[0] || ''}`.toUpperCase();
  const cityStateZip = [chiro.city, chiro.state, chiro.zipCode].filter(Boolean).join(', ');
  const addressLines = [chiro.addressLine1, cityStateZip].filter((x) => x && String(x).trim());
  const mapsQuery = [chiro.clinicName, ...addressLines].filter(Boolean).join(', ');
  const mapsHref = mapsQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`
    : null;
  const matchPill = hasFilterContext ? matchScorePillColors(matchPct) : null;
  const payments = paymentModelsDisplay(chiro);
  const budgetLabel = formatBudget(chiro.budgetRange);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="search-hero-outer">
        <div className="search-page-hero">
          <Header embedded />

          <div className="search-hero-body" style={{ maxWidth: 720, gap: 24 }}>
            <Link href={searchBackHref} className={styles.profileBack}>
              ← Back to search
            </Link>
            <div className={`flex flex-col items-center gap-4 ${styles.profileHeroMeta}`}>
              <div className={styles.profileAvatar}>
                {chiro.avatarUrl ? (
                  <img src={chiro.avatarUrl} alt={displayName} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span
                      className="font-medium"
                      style={{
                        color: 'var(--color-chiro-card-text)',
                        fontFamily: 'var(--font-body)',
                        fontSize: 40,
                        lineHeight: 1,
                      }}
                    >
                      {initials}
                    </span>
                  </div>
                )}
              </div>
              <h1
                className="m-0"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                  lineHeight: 1.12,
                  letterSpacing: '-0.03em',
                  fontWeight: 400,
                  color: '#f7f7f7',
                }}
              >
                {displayName}
              </h1>
              {chiro.clinicName ? (
                <p
                  className="text-base"
                  style={{ color: 'rgba(247,247,247,0.88)', fontFamily: 'var(--font-body)' }}
                >
                  {chiro.clinicName}
                  {cityStateZip ? ` · ${cityStateZip}` : ''}
                </p>
              ) : cityStateZip ? (
                <p
                  className="text-base"
                  style={{ color: 'rgba(247,247,247,0.88)', fontFamily: 'var(--font-body)' }}
                >
                  {cityStateZip}
                </p>
              ) : null}
              {hasFilterContext && matchPill ? (
                <span className="match-potential-pill" style={matchPill}>
                  {matchPct}% match to your search
                </span>
              ) : null}
              {canReferPatient && chiro.id ? (
                <Button type="button" size="lg" className="mt-2" onClick={() => setReferOpen(true)}>
                  Refer a patient
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.profileMain}>
        <Container>
          <div className={styles.profileGrid}>
            <div className="flex flex-col gap-5">
              <Card className="search-refine-card">
                <h2 className={styles.profileSectionTitle}>Practice &amp; contact</h2>
                <ul className={styles.profileDetailList}>
                  {chiro.clinicName ? (
                    <li>
                      <span
                        className="mb-1 block text-sm font-bold"
                        style={{ color: '#202020' }}
                      >
                        Clinic
                      </span>
                      <span className="text-sm" style={{ color: 'rgba(0,0,0,0.72)', lineHeight: 1.45 }}>
                        {chiro.clinicName}
                      </span>
                    </li>
                  ) : null}
                  {addressLines.length > 0 ? (
                    <li>
                      <span
                        className="mb-1 block text-sm font-bold"
                        style={{ color: '#202020' }}
                      >
                        Address
                      </span>
                      <span className="text-sm" style={{ color: 'rgba(0,0,0,0.72)', lineHeight: 1.45 }}>
                        {addressLines.map((line, i) => (
                          <span key={i}>
                            {i > 0 ? <br /> : null}
                            {line}
                          </span>
                        ))}
                      </span>
                      {mapsHref ? (
                        <p className="mt-2 text-sm">
                          <a href={mapsHref} target="_blank" rel="noopener noreferrer">
                            Open in Maps
                          </a>
                        </p>
                      ) : null}
                    </li>
                  ) : null}
                  {chiro.practicePhone ? (
                    <li>
                      <span
                        className="mb-1 block text-sm font-bold"
                        style={{ color: '#202020' }}
                      >
                        Phone
                      </span>
                      <a href={`tel:${chiro.practicePhone.replace(/\s/g, '')}`}>{chiro.practicePhone}</a>
                    </li>
                  ) : null}
                  {chiro.practiceWebsite ? (
                    <li>
                      <span
                        className="mb-1 block text-sm font-bold"
                        style={{ color: '#202020' }}
                      >
                        Website
                      </span>
                      <a href={chiro.practiceWebsite} target="_blank" rel="noopener noreferrer">
                        {chiro.practiceWebsite.replace(/^https?:\/\//i, '')}
                      </a>
                    </li>
                  ) : null}
                  {payments.length > 0 ? (
                    <li>
                      <span
                        className="mb-1 block text-sm font-bold"
                        style={{ color: '#202020' }}
                      >
                        Payment
                      </span>
                      <span className="text-sm" style={{ color: 'rgba(0,0,0,0.72)' }}>
                        {payments.join(' · ')}
                      </span>
                    </li>
                  ) : null}
                  {budgetLabel ? (
                    <li>
                      <span
                        className="mb-1 block text-sm font-bold"
                        style={{ color: '#202020' }}
                      >
                        Typical budget (self-reported)
                      </span>
                      <span className="text-sm" style={{ color: 'rgba(0,0,0,0.72)' }}>
                        {budgetLabel}
                      </span>
                    </li>
                  ) : null}
                </ul>
              </Card>

              {(chiro.modalities?.length ||
                chiro.focusAreas?.length ||
                chiro.philosophies?.length ||
                chiro.philosophy) ? (
                <Card className="search-refine-card">
                  <h2 className={styles.profileSectionTitle}>Focus &amp; approach</h2>
                  {chiro.modalities?.length ? (
                    <div className="mb-4">
                      <span
                        className="mb-2 block text-sm font-bold"
                        style={{ color: '#202020' }}
                      >
                        Techniques
                      </span>
                      <div className={styles.profileTagRow}>
                        {chiro.modalities.map((m) => (
                          <span key={m} className={styles.profileTag}>
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {chiro.focusAreas?.length ? (
                    <div className="mb-4">
                      <span
                        className="mb-2 block text-sm font-bold"
                        style={{ color: '#202020' }}
                      >
                        Specialties
                      </span>
                      <div className={styles.profileTagRow}>
                        {chiro.focusAreas.map((m) => (
                          <span key={m} className={styles.profileTag}>
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {chiro.philosophies?.length || chiro.philosophy ? (
                    <div>
                      <span
                        className="mb-2 block text-sm font-bold"
                        style={{ color: '#202020' }}
                      >
                        Philosophy
                      </span>
                      <div className={styles.profileTagRow}>
                        {(chiro.philosophies?.length ? chiro.philosophies : [chiro.philosophy!]).map((m) => (
                          <span key={m} className={styles.profileTag}>
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </Card>
              ) : null}
            </div>

            <div className="flex flex-col gap-5">
              {chiro.bio ? (
                <Card className="search-refine-card">
                  <h2 className={styles.profileSectionTitle}>About</h2>
                  <p className={styles.profileBio}>{chiro.bio}</p>
                </Card>
              ) : null}

              {(chiro.chiropracticCollege || chiro.graduationYear || chiro.licenseNumber) ? (
                <Card className="search-refine-card">
                  <h2 className={styles.profileSectionTitle}>Credentials</h2>
                  <ul className={styles.profileDetailList}>
                    {chiro.chiropracticCollege ? (
                      <li>
                        <span
                          className="mb-1 block text-sm font-bold"
                          style={{ color: '#202020' }}
                        >
                          College
                        </span>
                        <span className="text-sm" style={{ color: 'rgba(0,0,0,0.72)' }}>
                          {chiro.chiropracticCollege}
                          {chiro.graduationYear ? ` · Class of ${chiro.graduationYear}` : ''}
                        </span>
                      </li>
                    ) : chiro.graduationYear ? (
                      <li>
                        <span className="text-sm" style={{ color: 'rgba(0,0,0,0.72)' }}>
                          Class of {chiro.graduationYear}
                        </span>
                      </li>
                    ) : null}
                    {chiro.licenseNumber ? (
                      <li>
                        <span
                          className="mb-1 block text-sm font-bold"
                          style={{ color: '#202020' }}
                        >
                          License
                        </span>
                        <span className="text-sm" style={{ color: 'rgba(0,0,0,0.72)' }}>
                          {chiro.licenseNumber}
                        </span>
                      </li>
                    ) : null}
                  </ul>
                </Card>
              ) : null}

              <Card className="search-refine-card">
                <h2 className={styles.profileSectionTitle}>Match to your search</h2>
                {overlayRows.length === 0 ? (
                  <p className={styles.matchEmpty}>
                    No search filters were passed in the link. Go back to{' '}
                    <Link href="/search">Find a chiropractor</Link>, set your ZIP and preferences, then open a profile
                    from the results to see how each provider lines up on techniques, specialties, location, and more.
                    Saved patient profiles will use the same chart automatically in a future update.
                  </p>
                ) : (
                  <div className="flex w-full flex-col items-center gap-5">
                    <MatchRadarChart points={radarPoints} />
                    <div
                      className="flex flex-wrap items-center justify-center gap-5 gap-y-3"
                      aria-label="Chart legend"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="match-radar-legend-swatch match-radar-legend-swatch--user"
                          aria-hidden
                        />
                        <span className="text-sm" style={{ color: 'rgba(0,0,0,0.55)' }}>
                          Your search (target)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="match-radar-legend-swatch match-radar-legend-swatch--provider"
                          aria-hidden
                        />
                        <span className="text-sm" style={{ color: 'rgba(0,0,0,0.55)' }}>
                          This practice (fit)
                        </span>
                      </div>
                    </div>
                    <div className={styles.radarOverlayDetails}>
                      {overlayRows.map((row) => (
                        <div key={row.id} className={styles.radarOverlayAxis}>
                          <h3 className={styles.radarOverlayAxisTitle}>{row.label}</h3>
                          <div className={styles.radarOverlayLines}>
                            <p className={styles.radarOverlayLine}>
                              <strong>Your search</strong>
                              {row.you}
                            </p>
                            <p className={styles.radarOverlayLine}>
                              <strong>This practice</strong>
                              {row.practice}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p
                      className="max-w-[480px] text-center text-sm"
                      style={{ color: 'rgba(0,0,0,0.55)' }}
                    >
                      The dashed outline is your search on each axis (full scale). The blue shape is how closely this
                      practice matches. Compare the lists below for specifics—missing clinic data can pull a spoke
                      inward.
                    </p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </Container>
      </div>

      <Footer />

      {chiro && canReferPatient ? (
        <ReferPatientModal
          open={referOpen}
          onOpenChange={setReferOpen}
          receivingChiropractorId={chiro.id}
          receivingDoctorLabel={displayName}
          searchFilters={filters}
          clientMatchScore={hasFilterContext ? matchPct : chiro.matchScore ?? null}
        />
      ) : null}
    </div>
  );
}

export default function ChiropractorProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center py-24">
          <p className="text-sm" style={{ color: 'rgba(0,0,0,0.61)' }}>
            Loading…
          </p>
        </div>
      }
    >
      <ChiropractorProfileContent />
    </Suspense>
  );
}
