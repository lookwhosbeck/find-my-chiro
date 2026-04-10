import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'standardwebhooks';

import {
  sendBrevoPasswordResetEmail,
  sendBrevoSignupVerificationEmail,
  sendBrevoSimpleTransactional,
} from '@/app/lib/brevo-transactional.server';
import { defaultAuthCallbackUrl } from '@/app/lib/app-origin.server';
import {
  buildSupabaseAuthVerifyUrl,
  type SupabaseEmailActionType,
} from '@/app/lib/supabase-auth-verify-url';

export const runtime = 'nodejs';

const NOTIFICATION_TYPES = new Set<SupabaseEmailActionType>([
  'password_changed_notification',
  'email_changed_notification',
  'phone_changed_notification',
  'identity_linked_notification',
  'identity_unlinked_notification',
  'mfa_factor_enrolled_notification',
  'mfa_factor_unenrolled_notification',
]);

function hookSecretBytes(): string {
  const raw = process.env.SUPABASE_SEND_EMAIL_HOOK_SECRET?.trim();
  if (!raw) {
    throw new Error('SUPABASE_SEND_EMAIL_HOOK_SECRET is not set');
  }
  return raw.startsWith('v1,') ? raw.slice('v1,'.length) : raw;
}

function defaultRedirectTo(): string {
  return defaultAuthCallbackUrl();
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const secret = hookSecretBytes();
  const wh = new Webhook(secret);

  let user: Record<string, unknown>;
  let email_data: Record<string, unknown>;
  try {
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });
    const verified = wh.verify(rawBody, headers) as { user: Record<string, unknown>; email_data: Record<string, unknown> };
    user = verified.user;
    email_data = verified.email_data;
  } catch (e) {
    console.error('supabase-auth-email webhook verify failed:', e);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) {
    console.error('NEXT_PUBLIC_SUPABASE_URL missing');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const action = str(email_data.email_action_type) as SupabaseEmailActionType;
  if (NOTIFICATION_TYPES.has(action)) {
    return NextResponse.json({});
  }

  const userEmail = str(user.email);
  if (!userEmail) {
    return NextResponse.json({ error: 'Missing user email' }, { status: 400 });
  }

  const meta = (user.user_metadata && typeof user.user_metadata === 'object'
    ? user.user_metadata
    : {}) as Record<string, unknown>;
  const firstName = str(meta.first_name);
  const lastName = str(meta.last_name);
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || userEmail;

  const redirectToRaw = str(email_data.redirect_to) || defaultRedirectTo();
  const tokenHash = str(email_data.token_hash);

  const signupTpl = Number(process.env.BREVO_SIGNUP_VERIFICATION_TEMPLATE_ID ?? '11');
  const recoveryTpl = Number(process.env.BREVO_PASSWORD_RESET_TEMPLATE_ID ?? '13');

  try {
    if (action === 'signup' || action === 'invite' || action === 'magiclink' || action === 'email') {
      if (!tokenHash) {
        return NextResponse.json({ error: 'Missing token_hash' }, { status: 400 });
      }
      const verificationUrl = buildSupabaseAuthVerifyUrl(supabaseUrl, tokenHash, action, redirectToRaw);
      await sendBrevoSignupVerificationEmail({
        to: { email: userEmail, name: displayName },
        verificationUrl,
        templateId: signupTpl,
      });
      return NextResponse.json({});
    }

    if (action === 'recovery') {
      if (!tokenHash) {
        return NextResponse.json({ error: 'Missing token_hash' }, { status: 400 });
      }
      const resetUrl = buildSupabaseAuthVerifyUrl(supabaseUrl, tokenHash, 'recovery', redirectToRaw);
      await sendBrevoPasswordResetEmail({
        to: { email: userEmail, name: displayName },
        resetUrl,
        templateId: recoveryTpl,
      });
      return NextResponse.json({});
    }

    if (action === 'reauthentication') {
      if (!tokenHash) {
        return NextResponse.json({ error: 'Missing token_hash' }, { status: 400 });
      }
      const link = buildSupabaseAuthVerifyUrl(supabaseUrl, tokenHash, 'reauthentication', redirectToRaw);
      const otp = str(email_data.token);
      await sendBrevoSimpleTransactional({
        to: { email: userEmail, name: displayName },
        subject: 'Confirm it is you — Movyn',
        html: `<p>We need to confirm it’s you. Use the link or code below.</p><p><a href="${link}">Continue</a></p>${otp ? `<p>Code: <strong>${otp}</strong></p>` : ''}`,
        sender: brevoFallbackSender(),
      });
      return NextResponse.json({});
    }

    if (action === 'email_change') {
      const token = str(email_data.token);
      const tokenNew = str(email_data.token_new);
      const tokenHashNew = str(email_data.token_hash_new);
      const newEmail = str((user as { new_email?: string }).new_email);

      // Supabase secure email change: current address uses token + token_hash_new; new address uses token_new + token_hash.
      if (token && tokenHashNew) {
        const urlCurrent = buildSupabaseAuthVerifyUrl(supabaseUrl, tokenHashNew, 'email_change', redirectToRaw);
        await sendBrevoSimpleTransactional({
          to: { email: userEmail, name: displayName },
          subject: 'Confirm your email change',
          html: `<p>Confirm the email change for your Movyn account.</p><p><a href="${urlCurrent}">Confirm from your current address</a></p><p>Your code: <strong>${token}</strong></p>`,
          sender: brevoFallbackSender(),
        });
      }
      if (newEmail && tokenNew && tokenHash) {
        const urlNew = buildSupabaseAuthVerifyUrl(supabaseUrl, tokenHash, 'email_change', redirectToRaw);
        await sendBrevoSimpleTransactional({
          to: { email: newEmail, name: displayName },
          subject: 'Confirm your new email address',
          html: `<p>Confirm your new email for Movyn.</p><p><a href="${urlNew}">Confirm new email</a></p><p>Your code: <strong>${tokenNew}</strong></p>`,
          sender: brevoFallbackSender(),
        });
      }
      return NextResponse.json({});
    }

    if (!tokenHash) {
      return NextResponse.json({ error: 'Unsupported auth email action' }, { status: 501 });
    }
    const fallbackUrl = buildSupabaseAuthVerifyUrl(supabaseUrl, tokenHash, action, redirectToRaw);
    await sendBrevoSimpleTransactional({
      to: { email: userEmail, name: displayName },
      subject: 'Movyn account',
      html: `<p><a href="${fallbackUrl}">Continue</a></p>`,
      sender: brevoFallbackSender(),
    });
    return NextResponse.json({});
  } catch (e) {
    console.error('supabase-auth-email Brevo send failed:', e);
    return NextResponse.json({ error: 'Send failed' }, { status: 502 });
  }
}

function brevoFallbackSender(): { email: string; name?: string } {
  const email = process.env.BREVO_TRANSACTIONAL_SENDER_EMAIL?.trim();
  const name = process.env.BREVO_TRANSACTIONAL_SENDER_NAME?.trim();
  if (!email) {
    throw new Error('Set BREVO_TRANSACTIONAL_SENDER_EMAIL for non-template auth emails (e.g. email change)');
  }
  return { email, name: name || undefined };
}
