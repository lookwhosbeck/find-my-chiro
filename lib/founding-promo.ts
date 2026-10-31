/**
 * Founding-member launch offer.
 *
 * The first 1,000 chiropractors claim Premium for life through a Stripe
 * promotion code (FOUNDING1000) that is 100% off forever. Signup pre-applies
 * that code, so nobody types it and Checkout does not collect a card.
 * The promotion code id lives in STRIPE_FOUNDING_PROMOTION_CODE_ID.
 *
 * After 1,000 redemptions, signup returns to paid Premium or the $50
 * license verification fee.
 */
export const FOUNDING_PROMOTION_CODE = "FOUNDING1000" as const;
export const FOUNDING_MEMBERS_CAP = 1000;
export const LICENSE_VERIFICATION_FEE_USD = 50;
