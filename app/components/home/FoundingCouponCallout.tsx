import {
  FOUNDING_MEMBERS_CAP,
  LICENSE_VERIFICATION_FEE_USD,
} from "@/lib/founding-promo";
import styles from "./home-marketing.module.css";

/** Founding-member note under homepage pricing. */
export function FoundingCouponCallout() {
  return (
    <div className={styles.coupon}>
      <span className={styles.couponChip}>First {FOUNDING_MEMBERS_CAP.toLocaleString()}</span>
      <div className={styles.couponCopy}>
        <p className={styles.couponTitle}>
          Founding chiropractors get Premium free for life.
        </p>
        <p className={styles.couponBody}>
          The first {FOUNDING_MEMBERS_CAP.toLocaleString()} practices skip the $
          {LICENSE_VERIFICATION_FEE_USD} license verification fee and the monthly
          membership. No coupon to type, and no credit card at sign-up.
        </p>
      </div>
    </div>
  );
}
