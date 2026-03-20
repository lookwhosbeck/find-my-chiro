-- Run in Supabase SQL Editor once.
-- Fixes signup clinic not linking when RLS allows INSERT on organizations but blocks RETURNING / SELECT on the new row.
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
    updated_at
  )
  VALUES (
    v_name,
    NULLIF(trim(p_address_line_1), ''),
    NULLIF(trim(p_city), ''),
    NULLIF(trim(p_state), ''),
    NULLIF(trim(p_zip_code), ''),
    now()
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
