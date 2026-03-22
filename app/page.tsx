import Link from 'next/link';
import Image from 'next/image';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
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
    <div className={styles.page}>
      <div className={styles.heroOuter}>
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
            <Header embedded />
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>
                Find a chiropractor who
                <br />
                aligns with you.
              </h1>
              <ProximitySearchBar variant="onDark" />
              <div className={styles.signupRow}>
                <Link href="/signup-patient" className={styles.signupLink}>
                  Patient Signup
                  <ArrowUpRight />
                </Link>
                <Link href="/signup" className={styles.signupLink}>
                  Chiropractor Signup
                  <ArrowUpRight />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className={styles.featuresSection}>
        <h2 className={styles.featuresTitle}>
          Why join <span className={styles.featuresTitleItalic}>another</span> network?
        </h2>
        <div className={styles.featuresGrid}>
          <FeatureCard
            icon={<FeatureIconMatching />}
            title="The Matching Engine"
            description="We don't just list you; we match you based on Modalities (Gonstead, TRT) and Philosophies (Vitalistic, Evidence-Based)."
          />
          <FeatureCard
            icon={<FeatureIconFriction />}
            title="Reduce Friction"
            description="Patients filter by Insurance/Cash right away, so you only get calls from people who know your business model."
          />
          <FeatureCard
            icon={<FeatureIconCulture />}
            title="Show Your Culture"
            description="Showcase your clinic vibe, not just your address, because good patient fit isn’t only about proximity."
          />
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

      <Footer />
    </div>
  );
}
