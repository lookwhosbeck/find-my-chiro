/** Marker stored on profiles.subscription_price_id for comped review accounts. Not a Stripe price. */
export const REVIEW_COMP_PRICE_ID = "comp_review";

/** Free review accounts: verification fee waived, membership stays free. */
export const REVIEW_COMP_FREE_PRICE_ID = "comp_review_free";

export function isReviewCompPriceId(priceId: string | null | undefined): boolean {
  return priceId === REVIEW_COMP_PRICE_ID || priceId === REVIEW_COMP_FREE_PRICE_ID;
}
