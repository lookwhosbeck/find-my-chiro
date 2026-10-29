import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import {
  REVIEW_COMP_FREE_PRICE_ID,
  REVIEW_COMP_PRICE_ID,
} from "./review-signup";

export const REVIEW_SIGNUP_COOKIE = "fmc_review_signup";

export type ReviewSignupPlan = "free" | "monthly" | "annual";

type ReviewSignupCookiePayload = {
  plan: ReviewSignupPlan;
  exp: number;
};

export function reviewSignupTokenMatches(token: string | undefined | null): boolean {
  const expected = process.env.REVIEW_SIGNUP_SECRET?.trim();
  if (!expected || !token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function reviewSignupSecret(): string {
  const secret = process.env.REVIEW_SIGNUP_SECRET?.trim();
  if (!secret) {
    throw new Error("REVIEW_SIGNUP_SECRET is not configured");
  }
  return secret;
}

export function signReviewSignupCookie(
  plan: ReviewSignupPlan,
  ttlSeconds = 60 * 60 * 24 * 7,
): string {
  const payload: ReviewSignupCookiePayload = {
    plan,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const json = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = createHmac("sha256", reviewSignupSecret()).update(json).digest("base64url");
  return `${json}.${sig}`;
}

export function verifyReviewSignupCookie(token: string): ReviewSignupCookiePayload | null {
  const secret = process.env.REVIEW_SIGNUP_SECRET?.trim();
  if (!secret) return null;
  try {
    const dot = token.indexOf(".");
    if (dot < 1) return null;
    const json = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = createHmac("sha256", secret).update(json).digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(
      Buffer.from(json, "base64url").toString("utf8"),
    ) as ReviewSignupCookiePayload;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    if (payload.plan !== "free" && payload.plan !== "monthly" && payload.plan !== "annual") {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/** Service-role profile patch. Billing columns are locked for any other role. */
export function reviewCompProfilePatch(plan: ReviewSignupPlan): Record<string, string | null> {
  const now = new Date().toISOString();
  if (plan === "free") {
    return {
      subscription_status: "free",
      subscription_price_id: REVIEW_COMP_FREE_PRICE_ID,
      current_period_end: null,
      license_verification_fee_paid_at: now,
      updated_at: now,
    };
  }
  const end = new Date();
  end.setFullYear(end.getFullYear() + 1);
  return {
    subscription_status: "active",
    subscription_price_id: REVIEW_COMP_PRICE_ID,
    current_period_end: end.toISOString(),
    license_verification_fee_paid_at: now,
    updated_at: now,
  };
}
