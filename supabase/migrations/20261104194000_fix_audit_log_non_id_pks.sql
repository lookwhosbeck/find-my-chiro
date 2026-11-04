-- checkout_signup_claims (and any table without a column named "id") broke fn_audit_log:
-- record "new" has no field "id" → guest signup verify-return returned 500.
CREATE OR REPLACE FUNCTION public.fn_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row_id text;
  v_changed_by uuid;
  v_row record;
BEGIN
  v_changed_by := auth.uid();
  v_row := CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;

  v_row_id := COALESCE(
    to_jsonb(v_row) ->> 'id',
    to_jsonb(v_row) ->> 'stripe_checkout_session_id',
    ''
  );

  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.security_audit_log (table_name, row_id, operation, changed_by, old_data)
    VALUES (TG_TABLE_NAME, v_row_id, TG_OP, v_changed_by, to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.security_audit_log (table_name, row_id, operation, changed_by, new_data)
    VALUES (TG_TABLE_NAME, v_row_id, TG_OP, v_changed_by, to_jsonb(NEW));
    RETURN NEW;
  ELSE
    INSERT INTO public.security_audit_log (table_name, row_id, operation, changed_by, old_data, new_data)
    VALUES (TG_TABLE_NAME, v_row_id, TG_OP, v_changed_by, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  END IF;
END;
$$;
