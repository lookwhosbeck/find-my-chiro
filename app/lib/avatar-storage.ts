/**
 * Supabase Storage bucket id — must match the bucket in the Supabase dashboard (e.g. `avatar`).
 * Set NEXT_PUBLIC_SUPABASE_AVATAR_BUCKET if you use a different name.
 */
export const SUPABASE_AVATAR_BUCKET =
  (process.env.NEXT_PUBLIC_SUPABASE_AVATAR_BUCKET ?? '').trim() || 'avatar';
