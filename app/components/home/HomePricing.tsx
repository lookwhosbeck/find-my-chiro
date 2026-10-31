"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { FoundingCouponCallout } from "@/app/components/home/FoundingCouponCallout";
import styles from "./home-marketing.module.css";

type Period = "monthly" | "annually";

const discountRatio = 0.2;
const premiumMonthly = 30;
const premiumAnnualTotal = Math.round(premiumMonthly * 12 * (1 - discountRatio));
const premiumAnnualMonthly = Math.round(premiumMonthly * (1 - discountRatio));

const freeFeatures = [
  "Verified license badge on your profile",
  "Searchable basic profile (location, contact, credentials)",
  "Up to 3 modalities and 3 focus areas",
] as const;

const premiumFeatures = [
  "Everything in Free",
  "Unlimited modalities, philosophies, and focus areas",
  "Priority placement in fit-matched search results",
  "Full bio, photos, room and team highlights",
  "Direct messaging from interested patients",
  "Provider-to-provider referrals",
] as const;

export function HomePricing() {
  const [period, setPeriod] = useState<Period>("monthly");
  const annual = period === "annually";
  const per = annual ? "/year" : "/month";
  const laterPrice = annual
    ? `$${premiumAnnualTotal}/year ($${premiumAnnualMonthly}/month)`
    : `$${premiumMonthly}/month`;

  return (
    <section id="pricing" className={styles.section}>
      <div className="app-container">
        <header className={`${styles.centerHeader} ${styles.centerHeaderTight}`}>
          <div className={styles.eyebrow}>Founding member offer</div>
          <h2 className={styles.h2}>Premium is free for life for the first 1,000 chiropractors.</h2>
          <p className={styles.lead}>
            Patients always search Movyn for free. Founding chiropractors claim the full Premium
            membership with referrals included, the license verification fee waived, and no credit
            card. After those spots are claimed, a basic listing stays free and Premium is a paid
            membership.
          </p>
        </header>

        <FoundingCouponCallout />

        <div className={styles.toggleWrap}>
          <div className={styles.toggle} role="group" aria-label="Price after founding spots are claimed">
            <button
              type="button"
              className={`fmc-pill ${styles.toggleBtn} ${!annual ? styles.toggleBtnActive : ""}`}
              onClick={() => setPeriod("monthly")}
              aria-pressed={!annual}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`fmc-pill ${styles.toggleBtn} ${annual ? styles.toggleBtnActive : ""}`}
              onClick={() => setPeriod("annually")}
              aria-pressed={annual}
            >
              Annually
              <span className={annual ? styles.saveActive : styles.saveIdle}>Save 20%</span>
            </button>
          </div>
        </div>

        <div className={styles.planGrid}>
          <article className={styles.plan}>
            <div className={styles.planHead}>
              <h3 className={styles.planName}>Free</h3>
              <div className={styles.priceRow}>
                <span className={styles.price}>$0</span>
                <span className={styles.priceUnit}>{per}</span>
              </div>
              <p className={styles.caption}>Basic listing, after founding spots are claimed</p>
              <p className={styles.planDesc}>
                A verified profile patients can find. Credentials and contact details, with a short
                list of modalities and focus areas.
              </p>
            </div>
            <ul className={styles.planFeatures}>
              {freeFeatures.map((feature) => (
                <li key={feature} className={styles.planFeature}>
                  <Check className={styles.planCheck} size={14} aria-hidden />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Link href="/signup" className={`fmc-pill ${styles.pill} ${styles.pillBlock} ${styles.pillOutline}`}>
              Claim a founding spot
            </Link>
          </article>

          <article className={`${styles.plan} ${styles.planPopular}`}>
            <span className={styles.popularBadge}>First 1,000</span>
            <div className={styles.planHead}>
              <h3 className={styles.planName}>Premium</h3>
              <div className={styles.priceRow}>
                <span className={styles.price}>$0</span>
                <span className={styles.priceUnit}>for life</span>
              </div>
              <p className={styles.caption}>Then {laterPrice} after founding spots are claimed</p>
              <p className={styles.planDesc}>
                Founding members keep referrals, placement, and the rest of Premium at no charge.
                Nothing to type at sign-up, and no credit card.
              </p>
            </div>
            <ul className={styles.planFeatures}>
              {premiumFeatures.map((feature) => (
                <li key={feature} className={styles.planFeature}>
                  <Check className={styles.planCheck} size={14} aria-hidden />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Link href="/signup" className={`fmc-pill ${styles.pill} ${styles.pillBlock} ${styles.pillPrimary}`}>
              Claim a founding spot
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
