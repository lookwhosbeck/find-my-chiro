-- Step 1: Check for all triggers on auth.users
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users';

-- Step 2: Check for all functions that might reference user_role
SELECT 
    routine_name,
    routine_schema,
    routine_definition
FROM information_schema.routines
WHERE routine_definition LIKE '%user_role%'
   OR routine_definition LIKE '%user_role%';

-- Step 3: Create the user_role enum type (if needed for compatibility)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('chiropractor', 'patient', 'admin');
  END IF;
END $$;

-- Step 4: Drop ALL existing triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_chiropractor ON auth.users;

-- Step 5: Drop ALL functions that might be problematic
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.on_auth_user_created() CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_for_new_user() CASCADE;

-- Step 6: Add role column to profiles if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'chiropractor';

-- Step 7: Create a clean trigger function that doesn't use user_role type
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_role_value text;
BEGIN
  -- Get role from user metadata, default to 'chiropractor'
  user_role_value := COALESCE(new.raw_user_meta_data->>'role', 'chiropractor');
  
  -- Create profile with role set to chiropractor
  INSERT INTO public.profiles (id, updated_at, role)
  VALUES (new.id, NOW(), user_role_value)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$;

-- Step 8: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();
