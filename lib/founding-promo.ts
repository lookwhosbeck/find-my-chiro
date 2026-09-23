/**
 * Founding-member license verification promo (hero, pricing, signup marketing).
 *
 * FNDR250 waives the one-time $50 verification fee for the first 250 chiropractors.
 * It is a Stripe promotion code backed by a $50-off-once coupon (FNDR250_LAUNCH).
 * The code is entered by the user at Stripe Checkout; `allow_promotion_codes: true`
 * on the checkout session enables this. No server-side enforcement is needed beyond
 * Stripe's own max_redemptions cap.
 *
 * For founder/test accounts that should be entirely free (subscription + verification),
 * use the MVNTST26 promotion code (100% off forever).
 */
export const FOUNDING_COUPON_CODE = "FNDR250" as const;
export const FOUNDING_MEMBERS_CAP = 250;
export const LICENSE_VERIFICATION_FEE_USD = 50;
