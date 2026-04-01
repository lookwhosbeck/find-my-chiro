-- =============================================================================
-- 1.1  Add `created_by` to organizations + tighten INSERT RLS policy
-- =============================================================================
-- Adds an ownership trail so we can enforce who creates organizations.
-- The DEFAULT handles all existing code paths:
--   • Account page direct INSERT   → auth.uid() from the browser session
--   • signup_attach_chiropractor_organization RPC (SECURITY DEFINER)
--     → auth.uid() still resolves because PostgREST sets the JWT context
--       before invoking the function
-- =============================================================================

BEGIN;

-- 1. Add column with default
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid();

-- 2. Backfill existing rows: set created_by to the chiropractor who owns the org
UPDATE public.organizations o
SET created_by = (
  SELECT c.id
  FROM public.chiropractors c
  WHERE c.organization_id = o.id
  LIMIT 1
)
WHERE o.created_by IS NULL;

-- 3. Replace the wide-open INSERT policy with one scoped to the creating user
DROP POLICY IF EXISTS "organizations_insert_authenticated" ON public.organizations;
CREATE POLICY "organizations_insert_authenticated"
  ON public.organizations FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- 4. Update the signup RPC to explicitly set created_by (SECURITY DEFINER
--    bypasses RLS so auth.uid() in the DEFAULT DOES resolve, but explicit is
--    safer and documents intent)
CREATE OR REPLACE FUNCTION public.signup_attach_chiropractor_organization(
  p_clinic_name text,
  p_address_line_1 text,
  p_city text,
  p_state text,
  p_zip_code text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_org_id uuid;
  v_name text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.chiropractors c WHERE c.id = v_uid) THEN
    RAISE EXCEPTION 'Chiropractor profile not found';
  END IF;

  IF EXISTS (SELECT 1 FROM public.chiropractors c WHERE c.id = v_uid AND c.organization_id IS NOT NULL) THEN
    SELECT c.organization_id INTO v_org_id FROM public.chiropractors c WHERE c.id = v_uid;
    RETURN v_org_id;
  END IF;

  IF COALESCE(trim(p_clinic_name), '') = ''
     AND COALESCE(trim(p_address_line_1), '') = ''
     AND COALESCE(trim(p_city), '') = ''
     AND COALESCE(trim(p_state), '') = ''
     AND COALESCE(trim(p_zip_code), '') = '' THEN
    RETURN NULL;
  END IF;

  v_name := COALESCE(NULLIF(trim(p_clinic_name), ''), 'My practice');

  INSERT INTO public.organizations (
    name,
    address_line_1,
    city,
    state,
    zip_code,
    created_by
  )
  VALUES (
    v_name,
    NULLIF(trim(p_address_line_1), ''),
    NULLIF(trim(p_city), ''),
    NULLIF(trim(p_state), ''),
    NULLIF(trim(p_zip_code), ''),
    v_uid
  )
  RETURNING id INTO v_org_id;

  UPDATE public.chiropractors
  SET organization_id = v_org_id, updated_at = now()
  WHERE id = v_uid;

  RETURN v_org_id;
END;
$$;

REVOKE ALL ON FUNCTION public.signup_attach_chiropractor_organization(text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.signup_attach_chiropractor_organization(text, text, text, text, text) TO authenticated;
ALTER FUNCTION public.signup_attach_chiropractor_organization(text, text, text, text, text) OWNER TO postgres;

COMMIT;
