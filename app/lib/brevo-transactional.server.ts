import 'server-only';

const BREVO_API = 'https://api.brevo.com/v3/smtp/email';
const DEFAULT_BREVO_TIMEOUT_MS = 8000;
/** Avoid hanging the whole referral request if BREVO_REQUEST_TIMEOUT_MS is mis-set very high. */
const MAX_BREVO_TIMEOUT_MS = 30_000;

function getApiKey(): string {
  const key = process.env.BREVO_API_KEY?.trim();
  if (!key) {
    throw new Error('BREVO_API_KEY is not configured');
  }
  return key;
}

export type BrevoRecipient = { email: string; name?: string };

async function postBrevo(body: Record<string, unknown>): Promise<void> {
  const timeoutRaw = Number(process.env.BREVO_REQUEST_TIMEOUT_MS);
  const configured =
    Number.isFinite(timeoutRaw) && timeoutRaw >= 1000 ? Math.round(timeoutRaw) : DEFAULT_BREVO_TIMEOUT_MS;
  const timeoutMs = Math.min(configured, MAX_BREVO_TIMEOUT_MS);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(BREVO_API, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': getApiKey(),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error(`Brevo API timeout after ${timeoutMs}ms`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Brevo API error ${res.status}: ${text.slice(0, 500)}`);
  }
}

/**
 * E1 — Email Verification (Chiropractor); template uses params.verificationUrl
 * and contact merge tags (filled via params for New Template Language).
 */
export async function sendBrevoSignupVerificationEmail(args: {
  to: BrevoRecipient;
  verificationUrl: string;
  templateId: number;
}): Promise<void> {
  const { to, verificationUrl, templateId } = args;
  const display = to.name?.trim() || to.email;
  const nameParts = display.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] ?? display;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  await postBrevo({
    to: [{ email: to.email, name: display }],
    templateId,
    params: {
      verificationUrl,
      FIRSTNAME: firstName,
      LASTNAME: lastName,
    },
  });
}

/**
 * E2 — Welcome + Loom (Chiropractor). Params: profileUrl, loomUrl (+ FIRSTNAME / LASTNAME for merge tags).
 */
export async function sendBrevoChiropractorWelcomeEmail(args: {
  to: BrevoRecipient;
  profileUrl: string;
  loomUrl: string;
  templateId: number;
}): Promise<void> {
  const { to, profileUrl, loomUrl, templateId } = args;
  const display = to.name?.trim() || to.email;
  const nameParts = display.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] ?? display;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  await postBrevo({
    to: [{ email: to.email, name: display }],
    templateId,
    params: {
      profileUrl,
      loomUrl,
      FIRSTNAME: firstName,
      LASTNAME: lastName,
    },
  });
}

/** E3 — Complete your profile nudge. Params: profileUrl (+ FIRSTNAME / LASTNAME). */
export async function sendBrevoChiropractorProfileNudgeEmail(args: {
  to: BrevoRecipient;
  profileUrl: string;
  templateId: number;
}): Promise<void> {
  const { to, profileUrl, templateId } = args;
  const display = to.name?.trim() || to.email;
  const nameParts = display.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] ?? display;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  await postBrevo({
    to: [{ email: to.email, name: display }],
    templateId,
    params: {
      profileUrl,
      FIRSTNAME: firstName,
      LASTNAME: lastName,
    },
  });
}

/** E4 — Profile is live. Params: profileUrl (+ FIRSTNAME / LASTNAME). */
export async function sendBrevoChiropractorProfileLiveEmail(args: {
  to: BrevoRecipient;
  profileUrl: string;
  templateId: number;
}): Promise<void> {
  const { to, profileUrl, templateId } = args;
  const display = to.name?.trim() || to.email;
  const nameParts = display.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] ?? display;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  await postBrevo({
    to: [{ email: to.email, name: display }],
    templateId,
    params: {
      profileUrl,
      FIRSTNAME: firstName,
      LASTNAME: lastName,
    },
  });
}

/** Movyn — Account Recovery; template uses params.reset_url */
export async function sendBrevoPasswordResetEmail(args: {
  to: BrevoRecipient;
  resetUrl: string;
  templateId: number;
}): Promise<void> {
  const { to, resetUrl, templateId } = args;
  const display = to.name?.trim() || to.email;
  const nameParts = display.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] ?? display;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  await postBrevo({
    to: [{ email: to.email, name: display }],
    templateId,
    params: {
      reset_url: resetUrl,
      FIRSTNAME: firstName,
      LASTNAME: lastName,
    },
  });
}

/** Minimal fallback when no Brevo template is configured for an auth action. */
export async function sendBrevoSimpleTransactional(args: {
  to: BrevoRecipient;
  subject: string;
  html: string;
  sender: { email: string; name?: string };
}): Promise<void> {
  const { to, subject, html, sender } = args;
  await postBrevo({
    sender: { email: sender.email, name: sender.name ?? sender.email },
    to: [{ email: to.email, name: to.name }],
    subject,
    htmlContent: html,
  });
}

/**
 * Referral intro + optional outcome pings. Params must match your Brevo template merge fields
 * (e.g. FIRSTNAME / LASTNAME plus custom keys like matchScore, searchSummary, respondUrl).
 */
export async function sendBrevoReferralTemplateEmail(args: {
  to: BrevoRecipient;
  templateId: number;
  params: Record<string, string>;
}): Promise<void> {
  const display = args.to.name?.trim() || args.to.email;
  await postBrevo({
    to: [{ email: args.to.email, name: display }],
    templateId: args.templateId,
    params: args.params,
  });
}
