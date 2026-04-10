/**
 * Build the same confirmation / recovery URLs Supabase uses in its built-in templates.
 * @see https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook
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
