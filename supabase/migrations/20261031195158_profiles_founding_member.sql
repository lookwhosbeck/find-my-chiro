-- Founding members (first 1,000) keep Premium access for life.
-- Service role sets the flag after the $0 Stripe checkout; other roles cannot.

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS founding_member boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.founding_member IS
  'True for the first 1,000 founding chiropractors. Keeps Premium access, including referrals, even if the $0 Stripe subscription is later canceled.';

CREATE OR REPLACE FUNCTION public.profiles_lock_subscription_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role text := COALESCE(
    current_setting('request.jwt.claim.role', true),
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role')
  );
BEGIN
  IF _role = 'service_role' THEN
    RETURN NEW;
  END IF;
  NEW.stripe_customer_id := NULL;
  NEW.subscription_status := 'free';
  NEW.subscription_price_id := NULL;
  NEW.current_period_end := NULL;
  NEW.license_verification_fee_paid_at := NULL;
  NEW.founding_member := false;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.profiles_lock_subscription_on_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role text := COALESCE(
    current_setting('request.jwt.claim.role', true),
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role')
  );
BEGIN
  IF _role = 'service_role' THEN
    RETURN NEW;
  END IF;
  NEW.stripe_customer_id := OLD.stripe_customer_id;
  NEW.subscription_status := OLD.subscription_status;
  NEW.subscription_price_id := OLD.subscription_price_id;
  NEW.current_period_end := OLD.current_period_end;
  NEW.license_verification_fee_paid_at := OLD.license_verification_fee_paid_at;
  NEW.founding_member := OLD.founding_member;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE VIEW public.public_chiropractor_directory AS
SELECT
  p.id,
  p.first_name,
  p.last_name,
  p.avatar_url,
  p.founding_member
FROM public.profiles p
WHERE p.role = 'chiropractor';

COMMIT;
