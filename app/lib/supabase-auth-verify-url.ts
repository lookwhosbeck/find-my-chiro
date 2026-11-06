/**
 * Auth email link builders for the Supabase Send Email hook → Brevo templates.
 * @see https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook
 * @see https://supabase.com/docs/guides/auth/passwords?flow=pkce
 */

export type SupabaseEmailActionType =
  | 'signup'
  | 'invite'
  | 'magiclink'
  | 'recovery'
  | 'email_change'
  | 'email'
  | 'reauthentication'
  | 'password_changed_notification'
  | 'email_changed_notification'
  | 'phone_changed_notification'
  | 'identity_linked_notification'
  | 'identity_unlinked_notification'
  | 'mfa_factor_enrolled_notification'
  | 'mfa_factor_unenrolled_notification';

function verifyQueryType(action: SupabaseEmailActionType): string {
  switch (action) {
    case 'signup':
      return 'signup';
    case 'invite':
      return 'invite';
    case 'magiclink':
      return 'magiclink';
    case 'recovery':
      return 'recovery';
    case 'email_change':
      return 'email_change';
    case 'email':
      return 'email';
    case 'reauthentication':
      return 'reauthentication';
    default:
      return 'signup';
  }
}

/**
 * Map Send Email hook action → verifyOtp /auth/confirm `type` query value.
 * Signup confirmations use `email` per Supabase PKCE password docs.
 */
export function confirmOtpType(action: SupabaseEmailActionType): string {
  switch (action) {
    case 'signup':
    case 'email':
    case 'reauthentication':
      return 'email';
    case 'invite':
      return 'invite';
    case 'magiclink':
      return 'magiclink';
    case 'recovery':
      return 'recovery';
    case 'email_change':
      return 'email_change';
    default:
      return 'email';
  }
}

/**
 * App-hosted confirmation URL using token_hash + verifyOtp.
 * Prefer this for signup/magic-link so the link works on any device
 * (PKCE `code` exchange requires the original browser's code verifier).
 */
export function buildAppAuthConfirmUrl(
  appOrigin: string,
  tokenHash: string,
  emailActionType: SupabaseEmailActionType,
  nextPath = '/account',
): string {
  const base = appOrigin.replace(/\/$/, '');
  const next = nextPath.startsWith('/') ? nextPath : '/account';
  const q = new URLSearchParams({
    token_hash: tokenHash,
    type: confirmOtpType(emailActionType),
    next,
  });
  return `${base}/auth/confirm?${q.toString()}`;
}

/**
 * Legacy Supabase `/auth/v1/verify` URL (PKCE redirect with `?code=`).
 * Still used for recovery when the client page expects a hash session.
 */
export function buildSupabaseAuthVerifyUrl(
  supabaseProjectUrl: string,
  tokenHash: string,
  emailActionType: SupabaseEmailActionType,
  redirectTo: string,
): string {
  const base = supabaseProjectUrl.replace(/\/$/, '');
  const q = new URLSearchParams({
    token: tokenHash,
    type: verifyQueryType(emailActionType),
    redirect_to: redirectTo,
  });
  return `${base}/auth/v1/verify?${q.toString()}`;
}
