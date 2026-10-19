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

  return (
    <section id="pricing" className={styles.section}>
      <div className="app-container">
        <header className={`${styles.centerHeader} ${styles.centerHeaderTight}`}>
          <div className={styles.eyebrow}>Pricing for chiropractors</div>
          <h2 className={styles.h2}>Free to be listed. Affordable to be found.</h2>
          <p className={styles.lead}>
            Patients always search Movyn for free. Chiropractors choose between a free verified
            profile or a Premium membership that unlocks every match-making feature—no contracts,
            cancel anytime.
          </p>
        </header>

        <div className={styles.toggleWrap}>
          <div className={styles.toggle} role="group" aria-label="Billing period">
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
              <p className={styles.caption}>&nbsp;</p>
              <p className={styles.planDesc}>
                Get a verified profile on Movyn at no monthly cost. Patients can find you, see your
                credentials, and reach out directly.
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
              Sign up — Free
            </Link>
          </article>

          <article className={`${styles.plan} ${styles.planPopular}`}>
            <span className={styles.popularBadge}>Most popular</span>
            <div className={styles.planHead}>
              <h3 className={styles.planName}>Premium</h3>
              <div className={styles.priceRow}>
                <span className={styles.price}>${annual ? premiumAnnualTotal : premiumMonthly}</span>
                <span className={styles.priceUnit}>{per}</span>
              </div>
              <p className={styles.caption}>
                {annual ? `Just $${premiumAnnualMonthly}/month, billed annually` : "\u00a0"}
              </p>
              <p className={styles.planDesc}>
                Unlock everything Movyn offers—built for chiropractors who want to be matched on
                what they actually do and stand out in their area.
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
              Sign up — Premium
            </Link>
          </article>
        </div>

        <FoundingCouponCallout />
      </div>
    </section>
  );
}
