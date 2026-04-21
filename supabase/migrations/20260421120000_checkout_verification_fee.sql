-- Guest checkout may be verification-only (payment mode) with no subscription.
ALTER TABLE public.checkout_signup_claims
  ALTER COLUMN stripe_subscription_id DROP NOT NULL;

COMMENT ON COLUMN public.checkout_signup_claims.stripe_subscription_id IS
  'Stripe subscription id (sub_...); NULL when checkout was verification fee only (free plan).';

-- Track one-time license verification fee collection (service_role / webhooks only).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS license_verification_fee_paid_at timestamptz;

COMMENT ON COLUMN public.profiles.license_verification_fee_paid_at IS
  'Set when the one-time Stripe license verification fee is collected.';

-- Lock new billing-related column from client JWT updates (same pattern as subscription fields).
CREATE OR REPLACE FUNCTION public.profiles_lock_subscription_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(current_setting('request.jwt.claim.role', true), '') = 'service_role' THEN
    RETURN NEW;
  END IF;
  NEW.stripe_customer_id := NULL;
  NEW.subscription_status := 'free';
  NEW.subscription_price_id := NULL;
  NEW.current_period_end := NULL;
  NEW.license_verification_fee_paid_at := NULL;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.profiles_lock_subscription_on_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(current_setting('request.jwt.claim.role', true), '') = 'service_role' THEN
    RETURN NEW;
  END IF;
  NEW.stripe_customer_id := OLD.stripe_customer_id;
  NEW.subscription_status := OLD.subscription_status;
  NEW.subscription_price_id := OLD.subscription_price_id;
  NEW.current_period_end := OLD.current_period_end;
  NEW.license_verification_fee_paid_at := OLD.license_verification_fee_paid_at;
  RETURN NEW;
END;
$$;
