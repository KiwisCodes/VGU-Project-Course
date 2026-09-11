-- VGU CS AI Project Hub - Database Schema
-- Migration 001: Schema, Enums, Tables, Triggers

-- 1. Custom enum types
DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('High', 'Medium', 'Low');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('Backlog', 'In Progress', 'Review', 'Done');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE file_type AS ENUM ('pdf', 'html', 'slides', 'doc');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE folder_status AS ENUM ('active', 'upcoming');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Profiles (decoupled from auth.users for seeding, linked via auth_user_id)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  student_id TEXT,
  role TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  avatar_bg TEXT NOT NULL DEFAULT '#2563eb',
  initials TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  skills TEXT[] NOT NULL DEFAULT '{}',
  is_team_leader BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tags
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  lecture_id INT NOT NULL DEFAULT 1 CHECK (lecture_id >= 1 AND lecture_id <= 16),
  tag TEXT NOT NULL DEFAULT 'Data Engineering',
  priority task_priority NOT NULL DEFAULT 'High',
  status task_status NOT NULL DEFAULT 'Backlog',
  due_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Task Assignees (join table with per-member status tracking)
CREATE TABLE IF NOT EXISTS task_assignees (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status task_status NOT NULL DEFAULT 'Backlog',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (task_id, member_id)
);

-- 6. Member Notes (per-member continuous assessment notes per lecture)
CREATE TABLE IF NOT EXISTS member_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lecture_id INT NOT NULL CHECK (lecture_id >= 1 AND lecture_id <= 16),
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (member_id, lecture_id)
);

-- 7. Drive Folders (16 semester lecture sessions)
CREATE TABLE IF NOT EXISTS drive_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  lecture_number INT NOT NULL CHECK (lecture_number >= 1 AND lecture_number <= 16),
  date TEXT NOT NULL DEFAULT 'Upcoming',
  status folder_status NOT NULL DEFAULT 'upcoming',
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Drive Files (files uploaded to Supabase Storage)
CREATE TABLE IF NOT EXISTS drive_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES drive_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  type file_type NOT NULL DEFAULT 'pdf',
  size TEXT NOT NULL DEFAULT '0 KB',
  size_bytes BIGINT NOT NULL DEFAULT 0,
  url TEXT NOT NULL DEFAULT '',
  storage_path TEXT,
  description TEXT,
  highlights TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user ON profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_tasks_lecture ON tasks(lecture_id);
CREATE INDEX IF NOT EXISTS idx_tasks_tag ON tasks(tag);
CREATE INDEX IF NOT EXISTS idx_task_assignees_member ON task_assignees(member_id);
CREATE INDEX IF NOT EXISTS idx_member_notes_member ON member_notes(member_id);
CREATE INDEX IF NOT EXISTS idx_member_notes_lookup ON member_notes(member_id, lecture_id);
CREATE INDEX IF NOT EXISTS idx_drive_files_folder ON drive_files(folder_id);
CREATE INDEX IF NOT EXISTS idx_drive_folders_lecture ON drive_folders(lecture_number);

-- Trigger: auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated ON profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_tasks_updated ON tasks;
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_task_assignees_updated ON task_assignees;
CREATE TRIGGER trg_task_assignees_updated BEFORE UPDATE ON task_assignees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_member_notes_updated ON member_notes;
CREATE TRIGGER trg_member_notes_updated BEFORE UPDATE ON member_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_drive_folders_updated ON drive_folders;
CREATE TRIGGER trg_drive_folders_updated BEFORE UPDATE ON drive_folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_drive_files_updated ON drive_files;
CREATE TRIGGER trg_drive_files_updated BEFORE UPDATE ON drive_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: auto-recompute parent task status from individual assignee statuses
CREATE OR REPLACE FUNCTION recompute_task_status()
RETURNS TRIGGER AS $$
DECLARE
  v_task_id UUID;
  all_done BOOLEAN;
  all_backlog BOOLEAN;
  any_review BOOLEAN;
  none_in_progress_or_backlog BOOLEAN;
  new_status task_status;
  assignee_count INT;
BEGIN
  v_task_id := COALESCE(NEW.task_id, OLD.task_id);

  SELECT COUNT(*) INTO assignee_count
  FROM task_assignees WHERE task_id = v_task_id;

  IF assignee_count = 0 THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT
    BOOL_AND(status = 'Done'),
    BOOL_AND(status = 'Backlog'),
    BOOL_OR(status = 'Review'),
    NOT BOOL_OR(status IN ('Backlog', 'In Progress'))
  INTO all_done, all_backlog, any_review, none_in_progress_or_backlog
  FROM task_assignees WHERE task_id = v_task_id;

  IF all_done THEN
    new_status := 'Done';
  ELSIF all_backlog THEN
    new_status := 'Backlog';
  ELSIF any_review AND none_in_progress_or_backlog THEN
    new_status := 'Review';
  ELSE
    new_status := 'In Progress';
  END IF;

  UPDATE tasks SET status = new_status WHERE id = v_task_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recompute_task_status ON task_assignees;
CREATE TRIGGER trg_recompute_task_status
  AFTER INSERT OR UPDATE OR DELETE ON task_assignees
  FOR EACH ROW EXECUTE FUNCTION recompute_task_status();

-- Trigger: auto-link profile on Google OAuth login
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
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

  -- 1. Try to link to an existing seeded profile by matching email
  UPDATE profiles
  SET auth_user_id = NEW.id,
      updated_at = NOW()
  WHERE email = NEW.email
    AND auth_user_id IS NULL;

  -- 2. If no seeded profile exists with this email, create a new profile row
  IF NOT FOUND AND NOT EXISTS (SELECT 1 FROM profiles WHERE auth_user_id = NEW.id) THEN
    INSERT INTO profiles (auth_user_id, name, email, initials)
    VALUES (NEW.id, v_name, NEW.email, v_initials);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
