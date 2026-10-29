import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  REVIEW_SIGNUP_COOKIE,
  reviewCompProfilePatch,
  verifyReviewSignupCookie,
} from "@/app/lib/review-signup.server";

export const dynamic = "force-dynamic";

/**
 * Applies a comped membership after the private review signup.
 * No-ops when the review cookie is absent so normal account loads can call it safely.
 */
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(REVIEW_SIGNUP_COOKIE)?.value;
  if (!raw) {
    return new NextResponse(null, { status: 204 });
  }

  const claim = verifyReviewSignupCookie(raw);
  if (!claim) {
    cookieStore.delete(REVIEW_SIGNUP_COOKIE);
    return NextResponse.json({ error: "Invalid review signup" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service || url === "https://placeholder.supabase.co") {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 501 });
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAuth = createClient(url, anon);
  const {
    data: { user },
    error: userErr,
  } = await supabaseAuth.auth.getUser(authHeader.slice(7));
  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createClient(url, service);
  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profileErr || !profile || profile.role !== "chiropractor") {
    return NextResponse.json({ error: "Chiropractor account required" }, { status: 403 });
  }

  const { error: updateErr } = await admin
    .from("profiles")
    .update(reviewCompProfilePatch(claim.plan))
    .eq("id", user.id);
  if (updateErr) {
    console.error("review-signup grant:", updateErr);
    return NextResponse.json({ error: "Could not apply review access" }, { status: 500 });
  }

  cookieStore.delete(REVIEW_SIGNUP_COOKIE);
  return NextResponse.json({ applied: true, plan: claim.plan });
}
