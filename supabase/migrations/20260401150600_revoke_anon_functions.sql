-- =============================================================================
-- 3.2  Revoke unnecessary function permissions from anon
-- =============================================================================
-- The schema currently grants ALL ON FUNCTION for hundreds of PostGIS, pgcrypto,
-- and vector functions to anon. Most are never called by anonymous users.
--
-- Strategy: revoke blanket anon access, then re-grant only what's needed.
-- Authenticated users keep EXECUTE on public functions (PostGIS distance calcs
-- are used implicitly in queries).
--
-- RISK: If public search uses PostGIS functions via PostgREST RPC as anon,
-- those will break. Test anon search after applying.
-- =============================================================================

BEGIN;

-- Revoke all function EXECUTE from anon in public schema
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Re-grant specific functions anon needs:

-- The signup RPC is for authenticated users only (already handled, but explicit)
GRANT EXECUTE ON FUNCTION public.signup_attach_chiropractor_organization(text, text, text, text, text)
  TO authenticated;

-- PostGIS functions used implicitly in anon search queries (if any).
-- Supabase PostgREST calls typically use the `authenticated` or `service_role`
-- roles for geo queries, but if anon search relies on them, uncomment:
--
-- GRANT EXECUTE ON FUNCTION public.st_distance(geography, geography) TO anon;
-- GRANT EXECUTE ON FUNCTION public.st_dwithin(geography, geography, double precision) TO anon;
-- GRANT EXECUTE ON FUNCTION public.st_makepoint(double precision, double precision) TO anon;
-- GRANT EXECUTE ON FUNCTION public.st_setsrid(geometry, integer) TO anon;

COMMIT;
