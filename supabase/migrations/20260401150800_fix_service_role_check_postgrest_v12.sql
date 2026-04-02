-- =============================================================================
-- Fix service-role detection in BEFORE triggers for PostgREST v12+
--
-- PostgREST v12 removed the individual request.jwt.claim.<name> GUC settings.
-- All JWT claims are now in a single request.jwt.claims JSON GUC.
--
-- The old check:
--   current_setting('request.jwt.claim.role', true)           -- always NULL on v12
--
-- The new check (backward-compatible with v11 and earlier):
--   COALESCE(
--     current_setting('request.jwt.claim.role', true),        -- v9-v11
--     (current_setting('request.jwt.claims', true)::jsonb ->> 'role')  -- v12+
--   )
--
-- Affected triggers:
--   1. chiropractors_protect_license_verification_status
--   2. profiles_lock_subscription_on_insert
--   3. profiles_lock_subscription_on_update
-- =============================================================================

BEGIN;

-- 1. Chiropractor approval/rejection protection
CREATE OR REPLACE FUNCTION public.chiropractors_protect_license_verification_status()
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
  IF NEW.license_verification_status IN ('approved', 'rejected') THEN
    NEW.license_verification_status := OLD.license_verification_status;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Profile subscription fields: INSERT guard
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
  RETURN NEW;
END;
$$;

-- 3. Profile subscription fields: UPDATE guard
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
  RETURN NEW;
END;
$$;

COMMIT;
