import { NextRequest, NextResponse } from "next/server";
import { sendBrevoSimpleTransactional } from "@/app/lib/brevo-transactional.server";
import { CONTACT_INBOX } from "@/app/lib/contact-inbox";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

/** Newsletter signups from the marketing footer land in the Movyn inbox. */
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

  const senderEmail =
    process.env.BREVO_TRANSACTIONAL_SENDER_EMAIL?.trim() || "hello@movynalong.com";
  const senderName = process.env.BREVO_TRANSACTIONAL_SENDER_NAME?.trim() || "Movyn";
  if (!process.env.BREVO_API_KEY?.trim()) {
    return NextResponse.json({ error: "Email is not configured" }, { status: 503 });
  }

  const safe = escapeHtml(email);
  try {
    await sendBrevoSimpleTransactional({
      to: { email: CONTACT_INBOX, name: "Movyn" },
      subject: "Movyn newsletter signup",
      html: `<p>New newsletter signup from the Movyn homepage.</p><p>Email: ${safe}</p>`,
      sender: { email: senderEmail, name: senderName },
    });
  } catch (error) {
    console.error("newsletter signup", error);
    return NextResponse.json({ error: "Could not send" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
