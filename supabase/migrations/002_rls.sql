-- VGU CS AI Project Hub - Row Level Security Policies
-- Migration 002: RLS Policies for Profiles, Tags, Tasks, Assignees, Notes, Drive

-- Helper function: get current authenticated user's profile ID
CREATE OR REPLACE FUNCTION get_my_profile_id()
RETURNS UUID AS $$
  SELECT id FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: check if current authenticated user is team leader
CREATE OR REPLACE FUNCTION is_team_leader()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_team_leader FROM profiles WHERE auth_user_id = auth.uid()),
    FALSE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_files ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
DROP POLICY IF EXISTS "Profiles: read all" ON profiles;
CREATE POLICY "Profiles: read all" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Profiles: update own" ON profiles;
CREATE POLICY "Profiles: update own" ON profiles
  FOR UPDATE USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Profiles: leader can delete" ON profiles;
CREATE POLICY "Profiles: leader can delete" ON profiles
  FOR DELETE USING (is_team_leader() AND auth_user_id != auth.uid());

-- 2. TAGS POLICIES
DROP POLICY IF EXISTS "Tags: read all" ON tags;
CREATE POLICY "Tags: read all" ON tags
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Tags: insert" ON tags;
CREATE POLICY "Tags: insert" ON tags
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Tags: delete" ON tags;
CREATE POLICY "Tags: delete" ON tags
  FOR DELETE USING (auth.role() = 'authenticated');

-- 3. TASKS POLICIES
DROP POLICY IF EXISTS "Tasks: read all" ON tasks;
CREATE POLICY "Tasks: read all" ON tasks
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Tasks: insert" ON tasks;
CREATE POLICY "Tasks: insert" ON tasks
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Tasks: update" ON tasks;
CREATE POLICY "Tasks: update" ON tasks
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Tasks: delete" ON tasks;
CREATE POLICY "Tasks: delete" ON tasks
  FOR DELETE USING (auth.role() = 'authenticated');

-- 4. TASK ASSIGNEES POLICIES
DROP POLICY IF EXISTS "Assignees: read all" ON task_assignees;
CREATE POLICY "Assignees: read all" ON task_assignees
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Assignees: insert" ON task_assignees;
CREATE POLICY "Assignees: insert" ON task_assignees
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Assignees: update own status" ON task_assignees;
CREATE POLICY "Assignees: update own status" ON task_assignees
  FOR UPDATE USING (member_id = get_my_profile_id() OR is_team_leader());

DROP POLICY IF EXISTS "Assignees: delete" ON task_assignees;
CREATE POLICY "Assignees: delete" ON task_assignees
  FOR DELETE USING (auth.role() = 'authenticated');

-- 5. MEMBER NOTES POLICIES
DROP POLICY IF EXISTS "Notes: read all" ON member_notes;
CREATE POLICY "Notes: read all" ON member_notes
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Notes: insert own" ON member_notes;
CREATE POLICY "Notes: insert own" ON member_notes
  FOR INSERT WITH CHECK (member_id = get_my_profile_id());

DROP POLICY IF EXISTS "Notes: update own" ON member_notes;
CREATE POLICY "Notes: update own" ON member_notes
  FOR UPDATE USING (member_id = get_my_profile_id());

-- 6. DRIVE FOLDERS POLICIES
DROP POLICY IF EXISTS "Folders: read all" ON drive_folders;
CREATE POLICY "Folders: read all" ON drive_folders
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Folders: insert" ON drive_folders;
CREATE POLICY "Folders: insert" ON drive_folders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Folders: update" ON drive_folders;
CREATE POLICY "Folders: update" ON drive_folders
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Folders: delete" ON drive_folders;
CREATE POLICY "Folders: delete" ON drive_folders
  FOR DELETE USING (auth.role() = 'authenticated');

-- 7. DRIVE FILES POLICIES
DROP POLICY IF EXISTS "Files: read all" ON drive_files;
CREATE POLICY "Files: read all" ON drive_files
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Files: insert" ON drive_files;
CREATE POLICY "Files: insert" ON drive_files
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Files: update" ON drive_files;
CREATE POLICY "Files: update" ON drive_files
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Files: delete" ON drive_files;
CREATE POLICY "Files: delete" ON drive_files
  FOR DELETE USING (auth.role() = 'authenticated');
