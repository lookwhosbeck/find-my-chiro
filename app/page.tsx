import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MarketingShell } from './components/MarketingShell';
import { ProximitySearchBar } from './components/ProximitySearchBar';
import { FeatureCard } from './components/FeatureCard';
import { FeatureIconMatching, FeatureIconFriction, FeatureIconCulture } from './components/FeatureIcons';
import { DualMarqueeCarousels } from './components/DualMarqueeCarousels';
import { getChiropractors } from './lib/queries';
import styles from './page.module.css';

function ArrowUpRight() {
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

export default async function Home() {
  const chiropractors = await getChiropractors(14);

  return (
    <MarketingShell>
      <Header />
      <div className={styles.page}>
        <main className="flex flex-1 flex-col">
          <section className="mx-auto w-full max-w-[min(100%,1400px)] px-4 pb-6 pt-3 sm:px-6 md:px-8 md:pb-8 md:pt-4">
            <div className={styles.heroPanel}>
              <div className={styles.heroPanelStack} aria-hidden="true">
                <div className={styles.heroPanelSolid} />
                <div className={styles.heroPanelPhoto}>
                  <Image
                    src="/hero/home-hero-bg.jpg"
                    alt=""
                    fill
                    className={styles.heroPanelPhotoImg}
                    sizes="(max-width: 1200px) 100vw, 1200px"
                    priority
                  />
                </div>
              </div>
              <div className={styles.heroPanelForeground}>
                <div className={styles.heroContent}>
                  <p className="m-0 text-center text-xs font-medium uppercase tracking-[0.2em] text-white/70 md:text-sm">
                    Find care that fits
                  </p>
                  <h1 className={styles.heroTitle}>
                    Find a chiropractor who
                    <br />
                    aligns with you.
                  </h1>
                  <p className="mx-auto max-w-xl text-center text-base text-primary-foreground/85 md:text-lg">
                    Search by location and what matters to you—modalities, philosophy, and how practices work with
                    patients.
                  </p>
                  <ProximitySearchBar variant="onDark" />
                  <div className={styles.signupRow}>
                    <Button
                      asChild
                      size="lg"
                      className="rounded-full border-0 bg-white px-8 text-[hsl(var(--marketing-hero-surface))] hover:bg-white/90"
                    >
                      <Link href="/signup-patient" className="inline-flex items-center gap-2">
                        Patient signup
                        <ArrowUpRight />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="rounded-full border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                    >
                      <Link href="/join" className="inline-flex items-center gap-2">
                        Chiropractor signup
                        <ArrowUpRight />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={`${styles.featuresSection} scroll-mt-20`}>
        <h2 className={styles.featuresTitle}>
          Why join <span className={styles.featuresTitleItalic}>another</span> network?
        </h2>
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="pt-8 pb-6">
              <FeatureCard
                icon={<FeatureIconMatching />}
                title="The Matching Engine"
                description="We don't just list you; we match you based on Modalities (Gonstead, TRT) and Philosophies (Vitalistic, Evidence-Based)."
              />
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="pt-8 pb-6">
              <FeatureCard
                icon={<FeatureIconFriction />}
                title="Reduce Friction"
                description="Patients filter by Insurance/Cash right away, so you only get calls from people who know your business model."
              />
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm sm:col-span-2 lg:col-span-1">
            <CardContent className="pt-8 pb-6">
              <FeatureCard
                icon={<FeatureIconCulture />}
                title="Show Your Culture"
                description="Showcase your clinic vibe, not just your address, because good patient fit isn’t only about proximity."
              />
            </CardContent>
          </Card>
        </div>
          </section>

          <section className={styles.carouselSection}>
        <h2 className={styles.carouselTitle}>Join top chiropractors like...</h2>
        {chiropractors.length > 0 ? (
          <DualMarqueeCarousels chiropractors={chiropractors} />
        ) : (
          <p className={styles.carouselEmpty}>No chiropractors found. Be the first to join!</p>
        )}
          </section>
        </main>

        <Footer />
      </div>
    </MarketingShell>
  );
}
