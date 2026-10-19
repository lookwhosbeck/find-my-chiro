import 'server-only';

const BREVO_ROOT = 'https://api.brevo.com/v3';
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

/** Names for Brevo `params.*`. Auth and referral templates must not use `contact.*`. */
function recipientNameParams(display: string): { FIRSTNAME: string; LASTNAME: string } {
  const nameParts = display.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] ?? display;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  return {
    FIRSTNAME: firstName,
    LASTNAME: lastName,
  };
}

/** Authenticated Brevo request. Caller checks `response.ok`. */
export async function brevoApi(
  path: string,
  init: { method?: string; body?: Record<string, unknown> } = {},
): Promise<Response> {
  const timeoutRaw = Number(process.env.BREVO_REQUEST_TIMEOUT_MS);
  const configured =
    Number.isFinite(timeoutRaw) && timeoutRaw >= 1000 ? Math.round(timeoutRaw) : DEFAULT_BREVO_TIMEOUT_MS;
  const timeoutMs = Math.min(configured, MAX_BREVO_TIMEOUT_MS);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${BREVO_ROOT}${path}`, {
      method: init.method ?? 'GET',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': getApiKey(),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
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
}

async function postBrevo(body: Record<string, unknown>): Promise<void> {
  const res = await brevoApi('/smtp/email', { method: 'POST', body });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Brevo API error ${res.status}: ${text.slice(0, 500)}`);
  }
}

/**
 * E1 — Email Verification (Chiropractor). Template reads params.verificationUrl
 * and params.FIRSTNAME / params.LASTNAME (not Brevo contact attributes).
 */
export async function sendBrevoSignupVerificationEmail(args: {
  to: BrevoRecipient;
  verificationUrl: string;
  templateId: number;
}): Promise<void> {
  const { to, verificationUrl, templateId } = args;
  const display = to.name?.trim() || to.email;

  await postBrevo({
    to: [{ email: to.email, name: display }],
    templateId,
    params: {
      verificationUrl,
      ...recipientNameParams(display),
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

  await postBrevo({
    to: [{ email: to.email, name: display }],
    templateId,
    params: {
      profileUrl,
      loomUrl,
      ...recipientNameParams(display),
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

  await postBrevo({
    to: [{ email: to.email, name: display }],
    templateId,
    params: {
      profileUrl,
      ...recipientNameParams(display),
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

  await postBrevo({
    to: [{ email: to.email, name: display }],
    templateId,
    params: {
      profileUrl,
      ...recipientNameParams(display),
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

  await postBrevo({
    to: [{ email: to.email, name: display }],
    templateId,
    params: {
      reset_url: resetUrl,
      ...recipientNameParams(display),
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
