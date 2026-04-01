-- =============================================================================
-- 2.2  Create public_chiropractor_directory view
-- =============================================================================
-- Provides a safe, column-restricted view of chiropractor profile data.
-- Prevents direct PostgREST queries from exposing sensitive columns on profiles
-- (stripe_customer_id, subscription_status, subscription_price_id, etc.).
--
-- The existing anon SELECT RLS policy on profiles is intentionally preserved
-- for now because the search queries use PostgREST `profiles!inner(...)` joins
-- that depend on it. Those can be migrated to the view in a future pass.
-- =============================================================================

BEGIN;

CREATE OR REPLACE VIEW public.public_chiropractor_directory AS
SELECT
  p.id,
  p.first_name,
  p.last_name,
  p.avatar_url
FROM public.profiles p
WHERE p.role = 'chiropractor';

GRANT SELECT ON public.public_chiropractor_directory TO anon, authenticated;

-- FUTURE: once search queries are refactored to use the view, drop anon access
-- to profiles entirely:
--   DROP POLICY IF EXISTS "profiles_anon_select_chiropractors" ON public.profiles;

COMMIT;
