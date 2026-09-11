-- ==============================================================================
-- Fix Auth User Registration Trigger
-- Run this in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
  v_initials TEXT;
BEGIN
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  v_initials := UPPER(LEFT(v_name, 2));

  BEGIN
    UPDATE public.profiles
    SET auth_user_id = NEW.id,
        updated_at = NOW()
    WHERE lower(email) = lower(NEW.email);
  EXCEPTION WHEN OTHERS THEN
    -- Prevent trigger failure from aborting user registration
    NULL;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
