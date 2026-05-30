-- Restore PostgREST v12 service-role detection on profile billing triggers.
-- Migration 20260421120000 reverted the v12 fix from 20260401150800 when adding
-- license_verification_fee_paid_at, causing webhook/confirm-session updates to be
-- silently discarded (subscription_status stayed 'free').

BEGIN;

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
  RETURN NEW;
END;
$$;

COMMIT;
