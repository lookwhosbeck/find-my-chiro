-- Track lifecycle emails for chiropractors (idempotency).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_nudge_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS license_approved_email_sent_at timestamptz;

COMMENT ON COLUMN public.profiles.profile_nudge_email_sent_at IS
  'When E3 (complete profile nudge) was sent.';

COMMENT ON COLUMN public.profiles.license_approved_email_sent_at IS
  'When E4 (profile verified/live) was sent.';
