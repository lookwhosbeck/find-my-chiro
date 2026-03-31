-- Guest checkout → signup linking (Stripe webhook + link API use service role).
CREATE TABLE IF NOT EXISTS public.checkout_signup_claims (
  stripe_checkout_session_id text PRIMARY KEY,
  stripe_customer_id text NOT NULL,
  stripe_subscription_id text NOT NULL,
  email text NOT NULL,
  price_id text,
  linked_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz
);

COMMENT ON TABLE public.checkout_signup_claims IS 'Paid signup before Supabase user exists; webhook upserts; consumed when POST /api/signup/link-stripe-checkout runs.';

ALTER TABLE public.checkout_signup_claims ENABLE ROW LEVEL SECURITY;

-- Chiropractor onboarding / license review (team approves via service_role or admin).
ALTER TABLE public.chiropractors
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS submitted_for_review_at timestamptz,
  ADD COLUMN IF NOT EXISTS license_verification_status text NOT NULL DEFAULT 'draft';

ALTER TABLE public.chiropractors
  DROP CONSTRAINT IF EXISTS chiropractors_license_verification_status_check;

ALTER TABLE public.chiropractors
  ADD CONSTRAINT chiropractors_license_verification_status_check
  CHECK (license_verification_status IN ('draft', 'pending_review', 'approved', 'rejected'));

COMMENT ON COLUMN public.chiropractors.license_verification_status IS 'draft: editing; pending_review: submitted; approved/rejected: staff only (enforce in app + trigger).';
COMMENT ON COLUMN public.chiropractors.submitted_for_review_at IS 'When provider submitted profile for license verification.';

-- Chiropractors cannot self-set approved/rejected (only service_role bypasses or explicit admin).
CREATE OR REPLACE FUNCTION public.chiropractors_protect_license_verification_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(current_setting('request.jwt.claim.role', true), '') = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF NEW.license_verification_status IN ('approved', 'rejected') THEN
    NEW.license_verification_status := OLD.license_verification_status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS chiropractors_protect_license_verification_status ON public.chiropractors;
CREATE TRIGGER chiropractors_protect_license_verification_status
  BEFORE UPDATE ON public.chiropractors
  FOR EACH ROW
  EXECUTE PROCEDURE public.chiropractors_protect_license_verification_status();
