-- =============================================================================
-- 2.3  Rate-limit organization creation (cap: 1 per user)
-- =============================================================================
-- Depends on 1.1 (created_by column on organizations).
-- A chiropractor should only own one organization. If they leave and join
-- another practice, they exit the current one first.
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.organizations_limit_per_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NOT NULL AND (
    SELECT count(*)
    FROM public.organizations
    WHERE created_by = NEW.created_by
  ) >= 1 THEN
    RAISE EXCEPTION 'Organization limit reached — each user may own at most 1 organization.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS organizations_limit_per_user ON public.organizations;
CREATE TRIGGER organizations_limit_per_user
  BEFORE INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE PROCEDURE public.organizations_limit_per_user();

COMMIT;
