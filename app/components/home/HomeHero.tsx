import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { ProximitySearchBar } from "@/app/components/ProximitySearchBar";
import { FOUNDING_COUPON_CODE } from "@/lib/founding-promo";
import styles from "./home-marketing.module.css";

interface HomeHeroProps {
  /** Map preview (typically a Suspense-wrapped async server subtree + dynamic map client). */
  mapPreview: ReactNode;
}

const trustItems = [
  "Free for patients to search",
  "Filter by technique & philosophy",
  "No insurance hoops to start",
] as const;

export function HomeHero({ mapPreview }: HomeHeroProps) {
  return (
    <section className={`app-container w-full ${styles.hero}`}>
      <div className={styles.heroCol}>
        <Link href="#pricing" className={styles.foundingPill}>
          <span className={styles.foundingChip}>{FOUNDING_COUPON_CODE}</span>
          <span>Founding chiropractors get free license verification</span>
          <ArrowRight size={14} aria-hidden />
        </Link>
        <h1 className={styles.h1}>Find a chiropractor that fits.</h1>
        <p className={styles.heroLead}>
          Most directories show you whoever is closest. Movyn matches you on the things that
          actually shape your experience: treatment style, payment model, and more, because a good
          fit is more than just proximity.
        </p>
        <div className={styles.searchBlock}>
          <ProximitySearchBar variant="onLight" size="lg" />
          <div className={styles.trustRow}>
            {trustItems.map((item) => (
              <div key={item} className={styles.trustItem}>
                <Check className={styles.trustIcon} size={14} strokeWidth={2.5} aria-hidden />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="relative mx-auto w-full min-w-0">{mapPreview}</div>
    </section>
  );
}
