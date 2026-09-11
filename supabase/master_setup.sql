-- ==============================================================================
-- VGU CS AI Project Hub - Complete Master Setup Script
-- Run this ONCE in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ENUMS & EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- ------------------------------------------------------------------------------
-- 2. TABLES
-- ------------------------------------------------------------------------------

-- Profiles (decoupled from auth.users for seeding, auto-linked via auth_user_id)
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

-- Tags
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks
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

-- Task Assignees (join table tracking per-member status)
CREATE TABLE IF NOT EXISTS task_assignees (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status task_status NOT NULL DEFAULT 'Backlog',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (task_id, member_id)
);

-- Member Notes (continuous assessment notes per member per lecture)
CREATE TABLE IF NOT EXISTS member_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lecture_id INT NOT NULL CHECK (lecture_id >= 1 AND lecture_id <= 16),
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (member_id, lecture_id)
);

-- Drive Folders (16 semester lecture sessions)
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

-- Drive Files
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user ON profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_tasks_lecture ON tasks(lecture_id);
CREATE INDEX IF NOT EXISTS idx_tasks_tag ON tasks(tag);
CREATE INDEX IF NOT EXISTS idx_task_assignees_member ON task_assignees(member_id);
CREATE INDEX IF NOT EXISTS idx_member_notes_member ON member_notes(member_id);
CREATE INDEX IF NOT EXISTS idx_member_notes_lookup ON member_notes(member_id, lecture_id);
CREATE INDEX IF NOT EXISTS idx_drive_files_folder ON drive_files(folder_id);
CREATE INDEX IF NOT EXISTS idx_drive_folders_lecture ON drive_folders(lecture_number);

-- ------------------------------------------------------------------------------
-- 3. TRIGGERS & FUNCTIONS
-- ------------------------------------------------------------------------------

-- Auto-update updated_at timestamp
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

-- Auto-recompute parent task status from individual assignee statuses
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

-- Auto-link seeded profile on Google OAuth login
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

-- ------------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------

-- Helper functions
CREATE OR REPLACE FUNCTION get_my_profile_id()
RETURNS UUID AS $$
  SELECT id FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_team_leader()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_team_leader FROM profiles WHERE auth_user_id = auth.uid()),
    FALSE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_files ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Profiles: read all" ON profiles;
CREATE POLICY "Profiles: read all" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Profiles: update own" ON profiles;
CREATE POLICY "Profiles: update own" ON profiles FOR UPDATE USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Profiles: leader can delete" ON profiles;
CREATE POLICY "Profiles: leader can delete" ON profiles FOR DELETE USING (is_team_leader() AND auth_user_id != auth.uid());

-- Tags Policies
DROP POLICY IF EXISTS "Tags: read all" ON tags;
CREATE POLICY "Tags: read all" ON tags FOR SELECT USING (true);

DROP POLICY IF EXISTS "Tags: insert" ON tags;
CREATE POLICY "Tags: insert" ON tags FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Tags: delete" ON tags;
CREATE POLICY "Tags: delete" ON tags FOR DELETE USING (true);

-- Tasks Policies
DROP POLICY IF EXISTS "Tasks: read all" ON tasks;
CREATE POLICY "Tasks: read all" ON tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Tasks: insert" ON tasks;
CREATE POLICY "Tasks: insert" ON tasks FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Tasks: update" ON tasks;
CREATE POLICY "Tasks: update" ON tasks FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Tasks: delete" ON tasks;
CREATE POLICY "Tasks: delete" ON tasks FOR DELETE USING (true);

-- Task Assignees Policies
DROP POLICY IF EXISTS "Assignees: read all" ON task_assignees;
CREATE POLICY "Assignees: read all" ON task_assignees FOR SELECT USING (true);

DROP POLICY IF EXISTS "Assignees: insert" ON task_assignees;
CREATE POLICY "Assignees: insert" ON task_assignees FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Assignees: update own status" ON task_assignees;
CREATE POLICY "Assignees: update own status" ON task_assignees FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Assignees: delete" ON task_assignees;
CREATE POLICY "Assignees: delete" ON task_assignees FOR DELETE USING (true);

-- Member Notes Policies
DROP POLICY IF EXISTS "Notes: read all" ON member_notes;
CREATE POLICY "Notes: read all" ON member_notes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Notes: insert own" ON member_notes;
CREATE POLICY "Notes: insert own" ON member_notes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Notes: update own" ON member_notes;
CREATE POLICY "Notes: update own" ON member_notes FOR UPDATE USING (true);

-- Drive Folders Policies
DROP POLICY IF EXISTS "Folders: read all" ON drive_folders;
CREATE POLICY "Folders: read all" ON drive_folders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Folders: insert" ON drive_folders;
CREATE POLICY "Folders: insert" ON drive_folders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Folders: update" ON drive_folders;
CREATE POLICY "Folders: update" ON drive_folders FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Folders: delete" ON drive_folders;
CREATE POLICY "Folders: delete" ON drive_folders FOR DELETE USING (true);

-- Drive Files Policies
DROP POLICY IF EXISTS "Files: read all" ON drive_files;
CREATE POLICY "Files: read all" ON drive_files FOR SELECT USING (true);

DROP POLICY IF EXISTS "Files: insert" ON drive_files;
CREATE POLICY "Files: insert" ON drive_files FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Files: update" ON drive_files;
CREATE POLICY "Files: update" ON drive_files FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Files: delete" ON drive_files;
CREATE POLICY "Files: delete" ON drive_files FOR DELETE USING (true);

-- Enable Realtime publication for tables
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE task_assignees;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE member_notes;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE drive_folders;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE drive_files;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE tags;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 5. STORAGE BUCKET (50 MB Free Tier Limit)
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('lecture-materials', 'lecture-materials', true, 52428800)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 52428800;

DROP POLICY IF EXISTS "Storage: public read" ON storage.objects;
CREATE POLICY "Storage: public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'lecture-materials');

DROP POLICY IF EXISTS "Storage: public upload" ON storage.objects;
CREATE POLICY "Storage: public upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'lecture-materials');

DROP POLICY IF EXISTS "Storage: public update" ON storage.objects;
CREATE POLICY "Storage: public update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'lecture-materials');

DROP POLICY IF EXISTS "Storage: public delete" ON storage.objects;
CREATE POLICY "Storage: public delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'lecture-materials');

-- ------------------------------------------------------------------------------
-- 6. SEED DATA (5 Members, 6 Tags, 6 Tasks, 30 Assignees, 16 Folders, 3 Files)
-- ------------------------------------------------------------------------------

-- 5 Team Members
INSERT INTO profiles (id, name, student_id, role, email, avatar_bg, initials, bio, skills, is_team_leader)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'Le Quang Minh Khoa', '10423057',
   'Team Leader & ML Architect', '10423057@student.vgu.edu.vn',
   '#2563eb', 'LK',
   'Responsible for overall system architecture, model selection, and sprint planning.',
   ARRAY['PyTorch', 'Vision-Language', 'System Design', 'Agile'], FALSE),

  ('11111111-0000-0000-0000-000000000002', 'Nguyen Vo Minh Khoi', '10423063',
   'Clinical Data & Pipeline Engineer', '10423063@student.vgu.edu.vn',
   '#059669', 'NK',
   'Handles PubMed/MultiCaRe data curation, preprocessing pipelines, and quality assurance.',
   ARRAY['PubMed MultiCaRe', 'Pandas', 'OpenCV', 'Data Curation'], FALSE),

  ('11111111-0000-0000-0000-000000000003', 'Nguyen Duc Khang', '10423054',
   'Vision-Language & PEFT Engineer', '10423054@student.vgu.edu.vn',
   '#7c3aed', 'DK',
   'Leads model fine-tuning with QLoRA, LoRA adapters, and SFT/DPO alignment techniques.',
   ARRAY['Hugging Face', 'QLoRA', 'bitsandbytes', 'SFT/DPO'], FALSE),

  ('11111111-0000-0000-0000-000000000004', 'Phan Thanh Hung', '10423051',
   'RAG & Medical Knowledge Graph Specialist', '10423051@student.vgu.edu.vn',
   '#0891b2', 'TH',
   'Builds retrieval-augmented generation pipelines with LightRAG, ChromaDB, and Neo4j.',
   ARRAY['LightRAG', 'ChromaDB', 'Neo4j', 'Vector Embeddings'], FALSE),

  ('11111111-0000-0000-0000-000000000005', 'Duong Quy Trang', '10423110',
   'Multi-Agent & Clinical Evaluation Engineer', '10423110@student.vgu.edu.vn',
   '#d97706', 'QT',
   'Designs multi-agent collaboration systems and clinical evaluation benchmarks.',
   ARRAY['MedAgents', 'Ragas', 'DeepEval', 'Prompt Optimization'], FALSE)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  student_id = EXCLUDED.student_id,
  role = EXCLUDED.role,
  avatar_bg = EXCLUDED.avatar_bg,
  initials = EXCLUDED.initials,
  bio = EXCLUDED.bio,
  skills = EXCLUDED.skills;

-- 6 Default Tags
INSERT INTO tags (name) VALUES
  ('Data Engineering'),
  ('Fine-Tuning'),
  ('RAG / KG'),
  ('Multi-Agents'),
  ('DevOps / Report'),
  ('Evaluation')
ON CONFLICT (name) DO NOTHING;

-- 6 Week 1 Tasks
INSERT INTO tasks (id, title, description, lecture_id, tag, priority, status, due_date, created_at)
VALUES
  ('22222222-0000-0000-0000-000000000001',
   'Large Language Models for Disease Diagnosis: A Scoping Review',
   'Read and summarize the scoping review on LLM applications in clinical diagnostics.',
   1, 'Evaluation', 'High', 'In Progress', '2026-09-16', NOW()),

  ('22222222-0000-0000-0000-000000000002',
   'LightRAG: Simple and Fast Retrieval-Augmented Generation',
   'Study the LightRAG framework for efficient retrieval-augmented generation.',
   1, 'RAG / KG', 'High', 'In Progress', '2026-09-16', NOW()),

  ('22222222-0000-0000-0000-000000000003',
   'QLoRA: Efficient Finetuning of Quantized LLMs',
   'Understand QLoRA for parameter-efficient fine-tuning of large language models.',
   1, 'Fine-Tuning', 'High', 'In Progress', '2026-09-16', NOW()),

  ('22222222-0000-0000-0000-000000000004',
   'MedAgents: Large Language Models as Collaborators for Zero-Shot Medical Imaging',
   'Explore the MedAgents framework for multi-agent medical image analysis.',
   1, 'Multi-Agents', 'High', 'In Progress', '2026-09-16', NOW()),

  ('22222222-0000-0000-0000-000000000005',
   'MultiCare - A Multimodal Clinical Case Dataset',
   'Review the MultiCaRe dataset structure, annotations, and clinical imaging domains.',
   1, 'Data Engineering', 'High', 'In Progress', '2026-09-16', NOW()),

  ('22222222-0000-0000-0000-000000000006',
   'Explore Datasets: MultiCaRe Dataset Repository',
   'Hands-on exploration of the MultiCaRe GitHub repository and data loading scripts.',
   1, 'Data Engineering', 'High', 'In Progress', '2026-09-16', NOW())
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  lecture_id = EXCLUDED.lecture_id,
  tag = EXCLUDED.tag,
  priority = EXCLUDED.priority,
  status = EXCLUDED.status,
  due_date = EXCLUDED.due_date;

-- 30 Task Assignees (5 members x 6 tasks)
INSERT INTO task_assignees (task_id, member_id, status)
SELECT t.id, p.id, 'In Progress'::task_status
FROM tasks t
CROSS JOIN profiles p
WHERE t.lecture_id = 1
ON CONFLICT (task_id, member_id) DO NOTHING;

-- 16 Drive Folders
INSERT INTO drive_folders (id, name, lecture_number, date, status, description) VALUES
  ('33333333-0000-0000-0000-000000000001', 'Lecture_01_2026-09-09', 1, '2026-09-09', 'active',
   'Course Kickoff & Clinical Orientation - Project overview, team formation, and initial paper assignments.'),
  ('33333333-0000-0000-0000-000000000002', 'Lecture_02_YYYY-MM-DD', 2, 'Upcoming', 'upcoming',
   'Clinical Data Curation & MultiCaRe Deep-Dive'),
  ('33333333-0000-0000-0000-000000000003', 'Lecture_03_YYYY-MM-DD', 3, 'Upcoming', 'upcoming',
   'Baseline VLM Inference & Prompt Engineering'),
  ('33333333-0000-0000-0000-000000000004', 'Lecture_04_YYYY-MM-DD', 4, 'Upcoming', 'upcoming',
   'Medical Knowledge Graphs & LightRAG Integration'),
  ('33333333-0000-0000-0000-000000000005', 'Lecture_05_YYYY-MM-DD', 5, 'Upcoming', 'upcoming',
   'PEFT Workshop: QLoRA Fine-Tuning Sprint'),
  ('33333333-0000-0000-0000-000000000006', 'Lecture_06_YYYY-MM-DD', 6, 'Upcoming', 'upcoming',
   'Midterm Sprint Demo & Progress Review'),
  ('33333333-0000-0000-0000-000000000007', 'Lecture_07_YYYY-MM-DD', 7, 'Upcoming', 'upcoming',
   'DPO for Clinical Safety Alignment'),
  ('33333333-0000-0000-0000-000000000008', 'Lecture_08_YYYY-MM-DD', 8, 'Upcoming', 'upcoming',
   'Midterm Defense & Peer Evaluation'),
  ('33333333-0000-0000-0000-000000000009', 'Lecture_09_YYYY-MM-DD', 9, 'Upcoming', 'upcoming',
   'MedAgents Multi-Specialist Orchestration'),
  ('33333333-0000-0000-0000-000000000010', 'Lecture_10_YYYY-MM-DD', 10, 'Upcoming', 'upcoming',
   'Multi-Agent Consensus & Self-Consistency Tuning'),
  ('33333333-0000-0000-0000-000000000011', 'Lecture_11_YYYY-MM-DD', 11, 'Upcoming', 'upcoming',
   'System Integration & End-to-End Pipeline'),
  ('33333333-0000-0000-0000-000000000012', 'Lecture_12_YYYY-MM-DD', 12, 'Upcoming', 'upcoming',
   'Diagnostic Accuracy Benchmark & Clinical Validation'),
  ('33333333-0000-0000-0000-000000000013', 'Lecture_13_YYYY-MM-DD', 13, 'Upcoming', 'upcoming',
   'On-Premise Deployment & Resource Optimization'),
  ('33333333-0000-0000-0000-000000000014', 'Lecture_14_YYYY-MM-DD', 14, 'Upcoming', 'upcoming',
   'Paper Drafting & Technical Writing Workshop'),
  ('33333333-0000-0000-0000-000000000015', 'Lecture_15_YYYY-MM-DD', 15, 'Upcoming', 'upcoming',
   'Final Rehearsals & Demo Polishing'),
  ('33333333-0000-0000-0000-000000000016', 'Lecture_16_YYYY-MM-DD', 16, 'Upcoming', 'upcoming',
   'Final Defense & Project Submission')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  lecture_number = EXCLUDED.lecture_number,
  date = EXCLUDED.date,
  status = EXCLUDED.status,
  description = EXCLUDED.description;

-- 3 Lecture 1 Files
INSERT INTO drive_files (id, folder_id, name, title, author, type, size, size_bytes, url, description, highlights)
VALUES
  ('44444444-0000-0000-0000-000000000001',
   '33333333-0000-0000-0000-000000000001',
   'M24_Project.pdf', 'Project Course Syllabus', 'Dr. Tran Duc Khanh',
   'pdf', '204 KB', 203815,
   '/lectures/Lecture_01_2026-09-09/M24_Project.pdf',
   'Official course syllabus covering grading, milestones, and deliverable expectations.',
   ARRAY['10 ECTS, 4 weekly hours', '30% Continuous Assessment + 70% Final Defense',
         'Weekly progress reports required', 'Final deliverable: working diagnostic system']),

  ('44444444-0000-0000-0000-000000000002',
   '33333333-0000-0000-0000-000000000001',
   'Project Sharing_Mr Tin.pdf', 'TA Project Sharing Slides', 'Le Viet Tin',
   'pdf', '19.4 MB', 19405647,
   '/lectures/Lecture_01_2026-09-09/Project Sharing_Mr Tin.pdf',
   'Teaching assistant presentation on past project experiences and best practices.',
   ARRAY['Real-world project workflow examples', 'Git collaboration best practices',
         'Weekly standup meeting format', 'Common pitfalls and how to avoid them']),

  ('44444444-0000-0000-0000-000000000003',
   '33333333-0000-0000-0000-000000000001',
   'Lecture_01_Summary.html', 'Lecture 1 Interactive Summary', 'VGU CS AI Hub',
   'html', '36.4 KB', 36380,
   '/lectures/Lecture_01_2026-09-09/Lecture_01_Summary.html',
   'Comprehensive HTML dossier summarizing all Lecture 1 content.',
   ARRAY['Complete mission briefing', 'Technical tier breakdown (RAG, PEFT, Multi-Agent)',
         'Diagnostic pipeline architecture', 'Curated paper reading list'])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  type = EXCLUDED.type,
  size = EXCLUDED.size,
  size_bytes = EXCLUDED.size_bytes,
  url = EXCLUDED.url,
  description = EXCLUDED.description,
  highlights = EXCLUDED.highlights;
