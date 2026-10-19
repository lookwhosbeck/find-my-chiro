import "server-only";

import { brevoApi, sendBrevoSimpleTransactional } from "@/app/lib/brevo-transactional.server";
import { CONTACT_INBOX } from "@/app/lib/contact-inbox";

/** Brevo list "Movyn newsletter". */
const DEFAULT_NEWSLETTER_LIST_ID = 3;
/** Brevo template "Movyn newsletter — signup confirmation". */
const DEFAULT_CONFIRM_TEMPLATE_ID = 28;

function positiveId(raw: string | undefined, fallback: number, name: string): number {
  const value = raw?.trim() ? Number(raw) : fallback;
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} is invalid`);
  }
  return value;
}

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

function sender(): { email: string; name: string } {
  return {
    email: process.env.BREVO_TRANSACTIONAL_SENDER_EMAIL?.trim() || "info@movynalong.com",
    name: process.env.BREVO_TRANSACTIONAL_SENDER_NAME?.trim() || "Movyn",
  };
}

async function assertOk(res: Response, label: string): Promise<void> {
  if (res.ok) return;
  const text = await res.text().catch(() => "");
  throw new Error(`${label} ${res.status}: ${text.slice(0, 500)}`);
}

/**
 * Save the address on the Movyn newsletter list and send the Brevo confirmation.
 * A copy also goes to the team inbox. That copy failing does not undo the signup.
 */
export async function subscribeToMovynNewsletter(email: string): Promise<void> {
  const listId = positiveId(
    process.env.BREVO_NEWSLETTER_LIST_ID,
    DEFAULT_NEWSLETTER_LIST_ID,
    "BREVO_NEWSLETTER_LIST_ID",
  );
  const templateId = positiveId(
    process.env.BREVO_NEWSLETTER_CONFIRM_TEMPLATE_ID,
    DEFAULT_CONFIRM_TEMPLATE_ID,
    "BREVO_NEWSLETTER_CONFIRM_TEMPLATE_ID",
  );

  const contact = await brevoApi("/contacts", {
    method: "POST",
    body: {
      email,
      listIds: [listId],
      updateEnabled: true,
    },
  });
  await assertOk(contact, "Brevo contact");

  const confirmation = await brevoApi("/smtp/email", {
    method: "POST",
    body: {
      to: [{ email }],
      templateId,
    },
  });
  await assertOk(confirmation, "Brevo confirmation");

  const safe = escapeHtml(email);
  try {
    await sendBrevoSimpleTransactional({
      to: { email: CONTACT_INBOX, name: "Movyn" },
      subject: "Movyn newsletter signup",
      html: `<p>New newsletter signup from the Movyn homepage.</p><p>Email: ${safe}</p><p>Added to the Movyn newsletter list in Brevo, and a confirmation was sent.</p>`,
      sender: sender(),
    });
  } catch (error) {
    console.error("newsletter inbox notify", error);
  }
}
