import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  REVIEW_SIGNUP_COOKIE,
  reviewSignupTokenMatches,
  signReviewSignupCookie,
  type ReviewSignupPlan,
} from "@/app/lib/review-signup.server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    token?: string;
    plan?: string;
  } | null;

  if (!reviewSignupTokenMatches(typeof body?.token === "string" ? body.token : null)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let plan: ReviewSignupPlan = "monthly";
  if (body?.plan === "free" || body?.plan === "monthly" || body?.plan === "annual") {
    plan = body.plan;
  }

  const cookieStore = await cookies();
  cookieStore.set(REVIEW_SIGNUP_COOKIE, signReviewSignupCookie(plan), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true, plan });
}
