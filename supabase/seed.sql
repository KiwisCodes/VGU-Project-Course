-- VGU CS AI Project Hub - Comprehensive Seed Data
-- Seed: 5 Team Members, 6 Default Tags, 6 Week 1 Tasks (assigned to all 5), 16 Drive Folders, 3 Lecture 1 Files

-- 1. TEAM MEMBERS
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

-- 2. TAGS
INSERT INTO tags (name) VALUES
  ('Data Engineering'),
  ('Fine-Tuning'),
  ('RAG / KG'),
  ('Multi-Agents'),
  ('DevOps / Report'),
  ('Evaluation')
ON CONFLICT (name) DO NOTHING;

-- 3. TASKS
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

-- 4. 30 TASK ASSIGNEES (5 members x 6 tasks)
INSERT INTO task_assignees (task_id, member_id, status)
SELECT t.id, p.id, 'In Progress'::task_status
FROM tasks t
CROSS JOIN profiles p
WHERE t.lecture_id = 1
ON CONFLICT (task_id, member_id) DO NOTHING;

-- 5. 16 DRIVE FOLDERS
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
   'Sprint Review & Weekly Progress Demo'),
  ('33333333-0000-0000-0000-000000000007', 'Lecture_07_YYYY-MM-DD', 7, 'Upcoming', 'upcoming',
   'DPO for Clinical Safety Alignment'),
  ('33333333-0000-0000-0000-000000000008', 'Lecture_08_YYYY-MM-DD', 8, 'Upcoming', 'upcoming',
   'Sprint Review & Continuous Assessment Demo'),
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

-- 6. 3 LECTURE 1 FILES
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
