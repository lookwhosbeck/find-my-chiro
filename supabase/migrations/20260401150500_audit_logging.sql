-- =============================================================================
-- 3.1  Audit logging for sensitive operations
-- =============================================================================
-- Immutable append-only log. Zero client policies — only service_role and
-- triggers (running as SECURITY DEFINER) can write.
-- =============================================================================

BEGIN;

-- ─── Audit log table ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  table_name text NOT NULL,
  row_id text NOT NULL,
  operation text NOT NULL,
  changed_by uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.security_audit_log FROM anon, authenticated;
GRANT ALL ON TABLE public.security_audit_log TO service_role;

-- ─── Generic audit trigger function ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row_id text;
  v_changed_by uuid;
BEGIN
  v_changed_by := auth.uid();

  IF TG_OP = 'DELETE' THEN
    v_row_id := COALESCE(OLD.id::text, '');
    INSERT INTO public.security_audit_log (table_name, row_id, operation, changed_by, old_data)
    VALUES (TG_TABLE_NAME, v_row_id, TG_OP, v_changed_by, to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    v_row_id := COALESCE(NEW.id::text, '');
    INSERT INTO public.security_audit_log (table_name, row_id, operation, changed_by, new_data)
    VALUES (TG_TABLE_NAME, v_row_id, TG_OP, v_changed_by, to_jsonb(NEW));
    RETURN NEW;
  ELSE
    v_row_id := COALESCE(NEW.id::text, '');
    INSERT INTO public.security_audit_log (table_name, row_id, operation, changed_by, old_data, new_data)
    VALUES (TG_TABLE_NAME, v_row_id, TG_OP, v_changed_by, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  END IF;
END;
$$;

-- ─── Attach triggers to sensitive tables ───────────────────────────────────

-- profiles: audit subscription field changes and role changes
DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.fn_audit_log();

-- chiropractors: audit verification status changes
DROP TRIGGER IF EXISTS audit_chiropractors ON public.chiropractors;
CREATE TRIGGER audit_chiropractors
  AFTER INSERT OR UPDATE OR DELETE ON public.chiropractors
  FOR EACH ROW
  EXECUTE PROCEDURE public.fn_audit_log();

-- checkout_signup_claims: audit claim lifecycle
DROP TRIGGER IF EXISTS audit_checkout_signup_claims ON public.checkout_signup_claims;
CREATE TRIGGER audit_checkout_signup_claims
  AFTER INSERT OR UPDATE OR DELETE ON public.checkout_signup_claims
  FOR EACH ROW
  EXECUTE PROCEDURE public.fn_audit_log();

-- organizations: audit creation and changes
DROP TRIGGER IF EXISTS audit_organizations ON public.organizations;
CREATE TRIGGER audit_organizations
  AFTER INSERT OR UPDATE OR DELETE ON public.organizations
  FOR EACH ROW
  EXECUTE PROCEDURE public.fn_audit_log();

COMMIT;
