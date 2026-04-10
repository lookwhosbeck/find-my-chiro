-- Bootstrap public.profiles (+ chiropractor/patient child row) when auth.users is inserted.
-- Required when email confirmation is ON: signUp returns no session, so the browser cannot
-- INSERT under RLS until the user verifies. SECURITY DEFINER runs as postgres.

CREATE OR REPLACE FUNCTION public.bootstrap_profiles_from_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r text;
  role_val public.user_role;
BEGIN
  r := NEW.raw_user_meta_data->>'role';
  IF r IS NULL OR r = '' OR r NOT IN ('patient', 'chiropractor', 'admin') THEN
    r := 'patient';
  END IF;
  role_val := r::public.user_role;

  INSERT INTO public.profiles (id, email, first_name, last_name, role, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'first_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'last_name'), ''),
    role_val,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    first_name = COALESCE(EXCLUDED.first_name, public.profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, public.profiles.last_name),
    updated_at = NOW();

  IF role_val = 'chiropractor'::public.user_role THEN
    INSERT INTO public.chiropractors (id, accepting_new_patients, updated_at)
    VALUES (NEW.id, true, NOW())
    ON CONFLICT (id) DO NOTHING;
  ELSIF role_val = 'patient'::public.user_role THEN
    INSERT INTO public.patients (id, updated_at)
    VALUES (NEW.id, NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.bootstrap_profiles_from_auth_user() OWNER TO postgres;

DROP TRIGGER IF EXISTS on_auth_user_created_bootstrap_profiles ON auth.users;

CREATE TRIGGER on_auth_user_created_bootstrap_profiles
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.bootstrap_profiles_from_auth_user();
