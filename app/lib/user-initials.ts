/** Two-letter initials for avatar fallbacks (first + last, else email). */
export function userInitials(
  firstName?: string | null,
  lastName?: string | null,
  email?: string | null
): string {
  const a = (firstName?.[0] ?? '').trim();
  const b = (lastName?.[0] ?? '').trim();
  const pair = `${a}${b}`.toUpperCase();
  if (pair) return pair;
  const e = (email?.[0] ?? '').trim();
  return (e || '?').toUpperCase();
}
