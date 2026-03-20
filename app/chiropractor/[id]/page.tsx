'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Flex, Text, Heading, Card, Box, Button } from '@radix-ui/themes';
import { Header } from '@/app/components/Header';
import { Footer } from '@/app/components/Footer';
import { Container } from '@/app/components/Container';
import { MatchRadarChart } from '@/app/components/MatchRadarChart';
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
    [filtersKey]
  );

  const [chiro, setChiro] = useState<Chiropractor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'notfound' | 'fail' | null>(null);

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

  const axes = useMemo(() => (chiro ? computeMatchAxes(chiro, filters) : []), [chiro, filters]);
  const overlayRows = useMemo(() => (chiro ? buildMatchRadarOverlay(chiro, filters) : []), [chiro, filters]);
  const radarPoints = useMemo(
    () =>
      overlayRows.map((r) => ({
        label: r.label,
        userScore: r.userScore,
        providerScore: r.providerScore,
      })),
    [overlayRows]
  );
  const matchPct = useMemo(() => matchPercentFromAxes(axes), [axes]);
  const hasFilterContext = overlayRows.length > 0;
  const searchBackHref = appendSearchFiltersToQuery('/search', filters);

  if (!id) {
    return (
      <Container>
        <Box py="6">
          <Text>Invalid profile.</Text>
        </Box>
      </Container>
    );
  }

  if (loading) {
    return (
      <Flex align="center" justify="center" py="9" style={{ minHeight: '40vh' }}>
        <Text style={{ color: 'rgba(0,0,0,0.61)' }}>Loading profile…</Text>
      </Flex>
    );
  }

  if (error === 'notfound' || !chiro) {
    return (
      <Flex direction="column" style={{ minHeight: '100vh', background: '#ffffff' }}>
        <div className="search-hero-outer">
          <div className="search-page-hero">
            <Header embedded />
          </div>
        </div>
        <Container>
          <Flex direction="column" align="center" gap="4" py="9">
            <Heading size="6" style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}>
              Profile not found
            </Heading>
            <Text size="2" color="gray">
              This chiropractor may no longer be listed or the link is incorrect.
            </Text>
            <Button asChild variant="outline">
              <Link href="/search">Back to search</Link>
            </Button>
          </Flex>
        </Container>
        <Footer />
      </Flex>
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
    <Flex direction="column" style={{ minHeight: '100vh', background: '#ffffff' }}>
      <div className="search-hero-outer">
        <div className="search-page-hero">
          <Header embedded />

          <div className="search-hero-body" style={{ maxWidth: 720, gap: 24 }}>
            <Link href={searchBackHref} className={styles.profileBack}>
              ← Back to search
            </Link>
            <Flex direction="column" align="center" gap="4" className={styles.profileHeroMeta}>
              <Flex direction="column" align="center" gap="3">
                <div className={styles.profileAvatar}>
                  {chiro.avatarUrl ? (
                    <img src={chiro.avatarUrl} alt={displayName} />
                  ) : (
                    <Flex align="center" justify="center" style={{ width: '100%', height: '100%' }}>
                      <Text
                        weight="medium"
                        style={{
                          color: 'var(--color-chiro-card-text)',
                          fontFamily: 'var(--font-body)',
                          fontSize: 40,
                          lineHeight: 1,
                        }}
                      >
                        {initials}
                      </Text>
                    </Flex>
                  )}
                </div>
                {hasFilterContext && matchPill ? (
                  <span className="match-potential-pill" style={matchPill}>
                    {matchPct}% match to your search
                  </span>
                ) : null}
              </Flex>
              <Heading
                as="h1"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                  lineHeight: 1.12,
                  letterSpacing: '-0.03em',
                  fontWeight: 400,
                  color: '#f7f7f7',
                  margin: 0,
                }}
              >
                {displayName}
              </Heading>
              {chiro.clinicName ? (
                <Text size="3" style={{ color: 'rgba(247,247,247,0.88)', fontFamily: 'var(--font-body)' }}>
                  {chiro.clinicName}
                  {cityStateZip ? ` · ${cityStateZip}` : ''}
                </Text>
              ) : cityStateZip ? (
                <Text size="3" style={{ color: 'rgba(247,247,247,0.88)', fontFamily: 'var(--font-body)' }}>
                  {cityStateZip}
                </Text>
              ) : null}
            </Flex>
          </div>
        </div>
      </div>

      <Box className={styles.profileMain}>
        <Container>
          <div className={styles.profileGrid}>
            <Flex direction="column" gap="5">
              <Card className="search-refine-card">
                <h2 className={styles.profileSectionTitle}>Practice &amp; contact</h2>
                <ul className={styles.profileDetailList}>
                  {chiro.clinicName ? (
                    <li>
                      <Text size="2" weight="bold" style={{ color: '#202020', display: 'block', marginBottom: 4 }}>
                        Clinic
                      </Text>
                      <Text size="2" style={{ color: 'rgba(0,0,0,0.72)', lineHeight: 1.45 }}>
                        {chiro.clinicName}
                      </Text>
                    </li>
                  ) : null}
                  {addressLines.length > 0 ? (
                    <li>
                      <Text size="2" weight="bold" style={{ color: '#202020', display: 'block', marginBottom: 4 }}>
                        Address
                      </Text>
                      <Text size="2" style={{ color: 'rgba(0,0,0,0.72)', lineHeight: 1.45 }}>
                        {addressLines.map((line, i) => (
                          <span key={i}>
                            {i > 0 ? <br /> : null}
                            {line}
                          </span>
                        ))}
                      </Text>
                      {mapsHref ? (
                        <Text size="2" mt="2" as="p">
                          <a href={mapsHref} target="_blank" rel="noopener noreferrer">
                            Open in Maps
                          </a>
                        </Text>
                      ) : null}
                    </li>
                  ) : null}
                  {chiro.practicePhone ? (
                    <li>
                      <Text size="2" weight="bold" style={{ color: '#202020', display: 'block', marginBottom: 4 }}>
                        Phone
                      </Text>
                      <a href={`tel:${chiro.practicePhone.replace(/\s/g, '')}`}>{chiro.practicePhone}</a>
                    </li>
                  ) : null}
                  {chiro.practiceWebsite ? (
                    <li>
                      <Text size="2" weight="bold" style={{ color: '#202020', display: 'block', marginBottom: 4 }}>
                        Website
                      </Text>
                      <a href={chiro.practiceWebsite} target="_blank" rel="noopener noreferrer">
                        {chiro.practiceWebsite.replace(/^https?:\/\//i, '')}
                      </a>
                    </li>
                  ) : null}
                  {payments.length > 0 ? (
                    <li>
                      <Text size="2" weight="bold" style={{ color: '#202020', display: 'block', marginBottom: 4 }}>
                        Payment
                      </Text>
                      <Text size="2" style={{ color: 'rgba(0,0,0,0.72)' }}>
                        {payments.join(' · ')}
                      </Text>
                    </li>
                  ) : null}
                  {budgetLabel ? (
                    <li>
                      <Text size="2" weight="bold" style={{ color: '#202020', display: 'block', marginBottom: 4 }}>
                        Typical budget (self-reported)
                      </Text>
                      <Text size="2" style={{ color: 'rgba(0,0,0,0.72)' }}>
                        {budgetLabel}
                      </Text>
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
                    <Box mb="4">
                      <Text size="2" weight="bold" style={{ color: '#202020', display: 'block', marginBottom: 8 }}>
                        Techniques
                      </Text>
                      <div className={styles.profileTagRow}>
                        {chiro.modalities.map((m) => (
                          <span key={m} className={styles.profileTag}>
                            {m}
                          </span>
                        ))}
                      </div>
                    </Box>
                  ) : null}
                  {chiro.focusAreas?.length ? (
                    <Box mb="4">
                      <Text size="2" weight="bold" style={{ color: '#202020', display: 'block', marginBottom: 8 }}>
                        Specialties
                      </Text>
                      <div className={styles.profileTagRow}>
                        {chiro.focusAreas.map((m) => (
                          <span key={m} className={styles.profileTag}>
                            {m}
                          </span>
                        ))}
                      </div>
                    </Box>
                  ) : null}
                  {(chiro.philosophies?.length || chiro.philosophy) ? (
                    <Box>
                      <Text size="2" weight="bold" style={{ color: '#202020', display: 'block', marginBottom: 8 }}>
                        Philosophy
                      </Text>
                      <div className={styles.profileTagRow}>
                        {(chiro.philosophies?.length ? chiro.philosophies : [chiro.philosophy!]).map((m) => (
                          <span key={m} className={styles.profileTag}>
                            {m}
                          </span>
                        ))}
                      </div>
                    </Box>
                  ) : null}
                </Card>
              ) : null}
            </Flex>

            <Flex direction="column" gap="5">
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
                        <Text size="2" weight="bold" style={{ color: '#202020', display: 'block', marginBottom: 4 }}>
                          College
                        </Text>
                        <Text size="2" style={{ color: 'rgba(0,0,0,0.72)' }}>
                          {chiro.chiropracticCollege}
                          {chiro.graduationYear ? ` · Class of ${chiro.graduationYear}` : ''}
                        </Text>
                      </li>
                    ) : chiro.graduationYear ? (
                      <li>
                        <Text size="2" style={{ color: 'rgba(0,0,0,0.72)' }}>
                          Class of {chiro.graduationYear}
                        </Text>
                      </li>
                    ) : null}
                    {chiro.licenseNumber ? (
                      <li>
                        <Text size="2" weight="bold" style={{ color: '#202020', display: 'block', marginBottom: 4 }}>
                          License
                        </Text>
                        <Text size="2" style={{ color: 'rgba(0,0,0,0.72)' }}>
                          {chiro.licenseNumber}
                        </Text>
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
                  <Flex direction="column" gap="5" align="center" style={{ width: '100%' }}>
                    <MatchRadarChart points={radarPoints} />
                    <Flex
                      gap="5"
                      justify="center"
                      align="center"
                      wrap="wrap"
                      style={{ rowGap: '12px' }}
                      aria-label="Chart legend"
                    >
                      <Flex gap="2" align="center">
                        <span
                          className="match-radar-legend-swatch match-radar-legend-swatch--user"
                          aria-hidden
                        />
                        <Text size="2" style={{ color: 'rgba(0,0,0,0.55)' }}>
                          Your search (target)
                        </Text>
                      </Flex>
                      <Flex gap="2" align="center">
                        <span
                          className="match-radar-legend-swatch match-radar-legend-swatch--provider"
                          aria-hidden
                        />
                        <Text size="2" style={{ color: 'rgba(0,0,0,0.55)' }}>
                          This practice (fit)
                        </Text>
                      </Flex>
                    </Flex>
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
                    <Text size="2" style={{ color: 'rgba(0,0,0,0.55)', textAlign: 'center', maxWidth: 480 }}>
                      The dashed outline is your search on each axis (full scale). The blue shape is how closely this
                      practice matches. Compare the lists below for specifics—missing clinic data can pull a spoke
                      inward.
                    </Text>
                  </Flex>
                )}
              </Card>
            </Flex>
          </div>
        </Container>
      </Box>

      <Footer />
    </Flex>
  );
}

export default function ChiropractorProfilePage() {
  return (
    <Suspense
      fallback={
        <Flex align="center" justify="center" py="9" style={{ minHeight: '100vh' }}>
          <Text style={{ color: 'rgba(0,0,0,0.61)' }}>Loading…</Text>
        </Flex>
      }
    >
      <ChiropractorProfileContent />
    </Suspense>
  );
}
