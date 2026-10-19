import { NextRequest, NextResponse } from "next/server";
import { subscribeToMovynNewsletter } from "@/app/lib/newsletter-signup.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Add a homepage newsletter signup to the Brevo list and send the confirmation. */
export async function POST(req: NextRequest) {
  let email = "";
  try {
    const body = (await req.json()) as { email?: unknown };
    email = typeof body.email === "string" ? body.email.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!EMAIL_RE.test(email) || email.length > 320) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }

  if (!process.env.BREVO_API_KEY?.trim()) {
    return NextResponse.json({ error: "Email is not configured" }, { status: 503 });
  }

  try {
    await subscribeToMovynNewsletter(email);
  } catch (error) {
    console.error("newsletter signup", error);
    return NextResponse.json({ error: "Could not add you to the newsletter" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
