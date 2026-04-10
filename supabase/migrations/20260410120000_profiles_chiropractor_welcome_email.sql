-- Track E2 (Brevo) chiropractor welcome email; updated only via service_role API.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS chiropractor_welcome_email_sent_at timestamptz;

COMMENT ON COLUMN public.profiles.chiropractor_welcome_email_sent_at IS
  'When the post-verification chiropractor welcome (Brevo E2) was sent; server writes only.';
