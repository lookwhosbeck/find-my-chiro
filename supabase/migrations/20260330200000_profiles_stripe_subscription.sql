-- Chiropractor billing: Stripe subscription fields on profiles (webhook/service_role writes only).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_price_id text,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz;

COMMENT ON COLUMN public.profiles.stripe_customer_id IS 'Stripe customer id (cus_...); updated by Stripe webhook via service role.';
COMMENT ON COLUMN public.profiles.subscription_status IS 'Billing state: free, or Stripe subscription status (active, past_due, canceled, etc.).';
COMMENT ON COLUMN public.profiles.subscription_price_id IS 'Active Stripe Price id (price_...) for the current subscription.';
COMMENT ON COLUMN public.profiles.current_period_end IS 'Stripe current_period_end for the subscription; for display and grace logic.';

-- Prevent authenticated users from setting billing fields on INSERT (only service_role may set real values).
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
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_lock_subscription_on_insert ON public.profiles;
CREATE TRIGGER profiles_lock_subscription_on_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.profiles_lock_subscription_on_insert();

-- Preserve billing columns on UPDATE unless request uses service_role JWT (webhook/admin client).
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
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_lock_subscription_on_update ON public.profiles;
CREATE TRIGGER profiles_lock_subscription_on_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.profiles_lock_subscription_on_update();
