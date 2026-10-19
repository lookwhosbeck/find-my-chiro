import {
  FOUNDING_COUPON_CODE,
  FOUNDING_MEMBERS_CAP,
  LICENSE_VERIFICATION_FEE_USD,
} from "@/lib/founding-promo";
import styles from "./home-marketing.module.css";

/** Single founding-coupon note under homepage pricing. */
export function FoundingCouponCallout() {
  return (
    <div className={styles.coupon}>
      <span className={styles.couponChip}>{FOUNDING_COUPON_CODE}</span>
      <div className={styles.couponCopy}>
        <p className={styles.couponTitle}>
          Use coupon code {FOUNDING_COUPON_CODE} at sign-up for free license verification.
        </p>
        <p className={styles.couponBody}>
          Every plan includes an annual ${LICENSE_VERIFICATION_FEE_USD} license verification fee.
          It&apos;s waived for the first {FOUNDING_MEMBERS_CAP} founding chiropractors.
        </p>
      </div>
    </div>
  );
}
