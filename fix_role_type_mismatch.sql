-- Fix: The role column is user_role enum type, so we need to cast the text to enum

-- Step 1: Check the current column type
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'role';

-- Step 2: Update the trigger function to cast text to user_role enum
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
  
  -- Create profile with role cast to user_role enum type
  INSERT INTO public.profiles (id, updated_at, role)
  VALUES (
    new.id, 
    NOW(), 
    user_role_value::user_role  -- Cast text to user_role enum
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$;
