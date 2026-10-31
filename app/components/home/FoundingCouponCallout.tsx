import Link from "next/link";
import { FOUNDING_MEMBERS_CAP } from "@/lib/founding-promo";
import styles from "./home-marketing.module.css";

/** Founding-member offer above homepage pricing. There is no code to type. */
export function FoundingCouponCallout() {
  return (
    <div className={styles.offer}>
      <div className={styles.offerCopy}>
        <p className={styles.offerEyebrow}>Founding member offer</p>
        <p className={styles.offerTitle}>
          The first {FOUNDING_MEMBERS_CAP.toLocaleString()} chiropractors get Premium free for life.
        </p>
        <p className={styles.offerBody}>
          Referrals, priority placement, and license verification are included. Nothing to type
          at sign-up, and no credit card. After these spots are claimed, Premium is a paid membership.
        </p>
      </div>
      <Link href="/signup" className={`fmc-pill ${styles.pill} ${styles.pillWhite}`}>
        Claim a founding spot
      </Link>
    </div>
  );
}
