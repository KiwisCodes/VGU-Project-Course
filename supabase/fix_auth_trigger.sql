-- ==============================================================================
-- Fix Supabase Auth & RLS
-- Run this in Supabase Dashboard -> SQL Editor (">_") -> New Query -> Run
-- ==============================================================================

-- 1. Remove the trigger and function on auth.users causing the 500 error
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. Update profiles table RLS policies to allow initial linking and profile insertion
DROP POLICY IF EXISTS "Profiles: update own" ON profiles;
CREATE POLICY "Profiles: update own" ON profiles FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Profiles: insert" ON profiles;
CREATE POLICY "Profiles: insert" ON profiles FOR INSERT WITH CHECK (true);

-- 3. Verify that profiles are accessible
SELECT id, name, email, auth_user_id, role, is_team_leader FROM profiles;

