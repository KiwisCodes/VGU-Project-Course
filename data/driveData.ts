import { DriveFolder } from '@/types';

export const DRIVE_FOLDERS: DriveFolder[] = [
  {
    id: 'Lecture_01_2026-09-09',
    name: 'Lecture_01_2026-09-09',
    lectureNumber: 1,
    date: '2026-09-09',
    status: 'active',
    description: 'Course orientation, MultiCaRe clinical dataset introduction, 3-tier architecture overview, and initial sprint setup.',
    files: [
      {
        id: 'f1-syllabus',
        name: 'M24_Project.pdf',
        title: 'Small Multimodal Models for Clinical Diagnosis (Syllabus & Requirements)',
        author: 'Dr. Tran Duc Khanh',
        type: 'pdf',
        size: '204 KB',
        sizeBytes: 203815,
        url: '/lectures/Lecture_01_2026-09-09/M24_Project.pdf',
        updatedAt: '2026-09-09',
        description: 'Official module requirements (10 ECTS, 4 weekly hours), grading policy (30% continuous / 70% final), and project milestones.',
        highlights: [
          '10 ECTS module requirements & grading policy (30/70)',
          'Top-5 differential clinical diagnosis system scope',
          'VLM backbones (CLIP, BLIP, Gemma-Vision, LLaVA)',
          'Evaluation timeline and defense format'
        ]
      },
      {
        id: 'f1-tin-slides',
        name: 'Project Sharing_Mr Tin.pdf',
        title: 'Practical AI Project Orientation & Local Inference Architecture',
        author: 'Le Viet Tin (Mr. Tin)',
        type: 'pdf',
        size: '19.4 MB',
        sizeBytes: 19405647,
        url: '/lectures/Lecture_01_2026-09-09/Project Sharing_Mr Tin.pdf',
        updatedAt: '2026-09-09',
        description: 'Deep dive into local on-premise execution (HIPAA, customization, zero API cost, employability), MultiCaRe dataset pipeline, and MedAgents multi-agent reasoning.',
        highlights: [
          'MultiCaRe dataset details: 93k cases, 130k medical images',
          '75% project focus on rigorous clinical data engineering',
          'Provisional admission notes vs confirmed discharge diagnoses',
          'Hands-on local inference with vLLM, Ollama, and QLoRA'
        ]
      },
      {
        id: 'f1-summary-html',
        name: 'Lecture_01_Summary.html',
        title: 'Lecture 01 Full HTML Dossier & Design System Briefing',
        author: 'VGU CS AI Hub',
        type: 'html',
        size: '36.4 KB',
        sizeBytes: 36380,
        url: '/lectures/Lecture_01_2026-09-09/Lecture_01_Summary.html',
        updatedAt: '2026-09-09',
        description: 'Interactive standalone briefing featuring complete lecture digest, 10-task checklist, supervisor contacts, and reference papers.',
        highlights: [
          'Standalone Taste-style interactive web dossier',
          'Full supervisor & TA contact directory with Zalo',
          'Interactive 10-task Week 1 action tracker',
          'Direct curated arXiv links for RAG and MedAgents'
        ]
      }
    ]
  },
  {
    id: 'Lecture_02_YYYY-MM-DD',
    name: 'Lecture_02_YYYY-MM-DD',
    lectureNumber: 2,
    date: 'Upcoming',
    status: 'upcoming',
    description: 'Upcoming session: MultiCaRe Dataset Ingestion, EDA, Class Balance & Cleaning.',
    files: []
  },
  {
    id: 'Lecture_03_YYYY-MM-DD',
    name: 'Lecture_03_YYYY-MM-DD',
    lectureNumber: 3,
    date: 'Upcoming',
    status: 'upcoming',
    description: 'Upcoming session: Multimodal Preprocessing & Patient-Level Split Partitions.',
    files: []
  },
  {
    id: 'Lecture_04_YYYY-MM-DD',
    name: 'Lecture_04_YYYY-MM-DD',
    lectureNumber: 4,
    date: 'Upcoming',
    status: 'upcoming',
    description: 'Upcoming session: Baseline Zero-Shot Evaluation on Clinical Benchmarks.',
    files: []
  },
  {
    id: 'Lecture_05_YYYY-MM-DD',
    name: 'Lecture_05_YYYY-MM-DD',
    lectureNumber: 5,
    date: 'Upcoming',
    status: 'upcoming',
    description: 'Upcoming session: Tier 1 Knowledge Graph Construction & Clinical Guidelines.',
    files: []
  },
  {
    id: 'Lecture_06_YYYY-MM-DD',
    name: 'Lecture_06_YYYY-MM-DD',
    lectureNumber: 6,
    date: 'Upcoming',
    status: 'upcoming',
    description: 'Upcoming session: LightRAG Medical Retrieval Pipeline & Entity Indexing.',
    files: []
  },
  {
    id: 'Lecture_07_YYYY-MM-DD',
    name: 'Lecture_07_YYYY-MM-DD',
    lectureNumber: 7,
    date: 'Upcoming',
    status: 'upcoming',
    description: 'Upcoming session: Grounded Generation vs Hallucination Benchmarks.',
    files: []
  },
  {
    id: 'Lecture_08_YYYY-MM-DD',
    name: 'Lecture_08_YYYY-MM-DD',
    lectureNumber: 8,
    date: 'Upcoming',
    status: 'upcoming',
    description: 'Upcoming session: Sprint Review, Weekly Demo & Continuous Assessment.',
    files: []
  },
  {
    id: 'Lecture_09_YYYY-MM-DD',
    name: 'Lecture_09_YYYY-MM-DD',
    lectureNumber: 9,
    date: 'Upcoming',
    status: 'upcoming',
    description: 'Upcoming session: Tier 2 Instruction-Tuning (SFT) & Prompt Engineering.',
    files: []
  },
  {
    id: 'Lecture_10_YYYY-MM-DD',
    name: 'Lecture_10_YYYY-MM-DD',
    lectureNumber: 10,
    date: 'Upcoming',
    status: 'upcoming',
    description: 'Upcoming session: 4-bit QLoRA Quantization & GPU Memory Optimization.',
    files: []
  },
  {
    id: 'Lecture_11_YYYY-MM-DD',
    name: 'Lecture_11_YYYY-MM-DD',
    lectureNumber: 11,
    date: 'Upcoming',
    status: 'upcoming',
    description: 'Upcoming session: Tier 3 MedAgents Framework & Collaborative Debate Roles.',
    files: []
  },
  {
    id: 'Lecture_12_YYYY-MM-DD',
    name: 'Lecture_12_YYYY-MM-DD',
    lectureNumber: 12,
    date: 'Upcoming',
    status: 'upcoming',
    description: 'Upcoming session: Multi-Agent Consensus Tuning & Disagreement Resolution.',
    files: []
  },
  {
    id: 'Lecture_13_YYYY-MM-DD',
    name: 'Lecture_13_YYYY-MM-DD',
    lectureNumber: 13,
    date: 'Upcoming',
    status: 'upcoming',
    description: 'Upcoming session: Clinical Decision Top-5 Evaluation & Metrics (F1, Accuracy, Latency).',
    files: []
  },
  {
    id: 'Lecture_14_YYYY-MM-DD',
    name: 'Lecture_14_YYYY-MM-DD',
    lectureNumber: 14,
    date: 'Upcoming',
    status: 'upcoming',
    description: 'Upcoming session: Local Host Deployment (vLLM, Ollama, On-Premise Docker).',
    files: []
  },
  {
    id: 'Lecture_15_YYYY-MM-DD',
    name: 'Lecture_15_YYYY-MM-DD',
    lectureNumber: 15,
    date: 'Upcoming',
    status: 'upcoming',
    description: 'Upcoming session: Final Research Paper Drafting & Scientific Review.',
    files: []
  },
  {
    id: 'Lecture_16_YYYY-MM-DD',
    name: 'Lecture_16_YYYY-MM-DD',
    lectureNumber: 16,
    date: 'Upcoming',
    status: 'upcoming',
    description: 'Upcoming session: Final Presentation, Live System Demonstration & Project Defense.',
    files: []
  }
];
