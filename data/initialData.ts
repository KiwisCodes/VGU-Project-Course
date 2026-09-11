import { Member, Task, LectureSession } from '@/types';

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'member-1',
    name: 'Lê Quang Minh Khoa',
    studentId: '10423057',
    role: 'Team Leader & ML Architect',
    email: '10423057@student.vgu.edu.vn',
    avatarBg: '#2563eb',
    initials: 'LK',
    bio: 'Oversees overall system architecture, agile sprint coordination, and integration of the 3 technical tiers.',
    skills: ['PyTorch', 'Vision-Language', 'System Design', 'Agile']
  },
  {
    id: 'member-2',
    name: 'Nguyễn Võ Minh Khôi',
    studentId: '10423063',
    role: 'Clinical Data & Pipeline Engineer',
    email: '10423063@student.vgu.edu.vn',
    avatarBg: '#059669',
    initials: 'NK',
    bio: 'Responsible for PubMed MultiCaRe dataset extraction, clinical text normalization, and multimodal image preprocessing.',
    skills: ['PubMed MultiCaRe', 'Pandas', 'OpenCV', 'Data Curation']
  },
  {
    id: 'member-3',
    name: 'Nguyễn Đức Khang',
    studentId: '10423054',
    role: 'Vision-Language & PEFT Engineer',
    email: '10423054@student.vgu.edu.vn',
    avatarBg: '#7c3aed',
    initials: 'DK',
    bio: 'Focuses on Small Multimodal backbones (LLaVA, Gemma-2-Vision), 4-bit quantization, and QLoRA instruction tuning.',
    skills: ['Hugging Face', 'QLoRA', 'bitsandbytes', 'SFT/DPO']
  },
  {
    id: 'member-4',
    name: 'Phan Thành Hưng',
    studentId: '10423051',
    role: 'RAG & Medical Knowledge Graph Specialist',
    email: '10423051@student.vgu.edu.vn',
    avatarBg: '#0891b2',
    initials: 'TH',
    bio: 'Builds vector retrieval and LightRAG graph pipelines grounded in authoritative infectious disease textbooks.',
    skills: ['LightRAG', 'ChromaDB', 'Neo4j', 'Vector Embeddings']
  },
  {
    id: 'member-5',
    name: 'Dương Quý Trang',
    studentId: '10423110',
    role: 'Multi-Agent & Clinical Evaluation Engineer',
    email: '10423110@student.vgu.edu.vn',
    avatarBg: '#d97706',
    initials: 'QT',
    bio: 'Implements the MedAgents collaborative debate protocol and evaluates clinical diagnostic metrics (Ragas, DeepEval).',
    skills: ['MedAgents', 'Ragas', 'DeepEval', 'Prompt Optimization']
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-w1-1',
    title: 'Large Language Models for Disease Diagnosis: A Scoping Review',
    description: 'Read arXiv:2409.00097 scoping review to analyze diagnostic prompting paradigms, clinical reasoning capabilities, and evaluation benchmarks across the team.',
    assigneeIds: ['member-1', 'member-2', 'member-3', 'member-4', 'member-5'],
    lectureId: 1,
    tag: 'Evaluation',
    pillar: 'Evaluation',
    priority: 'High',
    status: 'In Progress',
    dueDate: '2026-09-16',
    createdAt: '2026-09-09'
  },
  {
    id: 'task-w1-2',
    title: 'LightRAG: Simple and Fast Retrieval-Augmented Generation',
    description: 'Read arXiv:2410.05779 to study dual-level graph retrieval-augmented generation and entity-relationship indexing for medical knowledge grounding.',
    assigneeIds: ['member-1', 'member-2', 'member-3', 'member-4', 'member-5'],
    lectureId: 1,
    tag: 'RAG / KG',
    pillar: 'RAG / KG',
    priority: 'High',
    status: 'In Progress',
    dueDate: '2026-09-16',
    createdAt: '2026-09-09'
  },
  {
    id: 'task-w1-3',
    title: 'QLoRA: Efficient Finetuning of Quantized LLMs',
    description: 'Read arXiv:2305.14314 to study parameter-efficient fine-tuning, 4-bit NormalFloat quantization, double quantization, and paged optimizers.',
    assigneeIds: ['member-1', 'member-2', 'member-3', 'member-4', 'member-5'],
    lectureId: 1,
    tag: 'Fine-Tuning',
    pillar: 'Fine-Tuning',
    priority: 'High',
    status: 'In Progress',
    dueDate: '2026-09-16',
    createdAt: '2026-09-09'
  },
  {
    id: 'task-w1-4',
    title: 'MedAgents: Large Language Models as Collaborators for Zero-Shot Medical Imaging',
    description: 'Read arXiv:2311.10537 to examine multi-agent collaborative medical reasoning, multidisciplinary clinical consultation, and zero-shot consensus mechanisms.',
    assigneeIds: ['member-1', 'member-2', 'member-3', 'member-4', 'member-5'],
    lectureId: 1,
    tag: 'Multi-Agents',
    pillar: 'Multi-Agents',
    priority: 'High',
    status: 'In Progress',
    dueDate: '2026-09-16',
    createdAt: '2026-09-09'
  },
  {
    id: 'task-w1-5',
    title: 'MultiCare - A Multimodal Clinical Case Dataset',
    description: 'Read and analyze the MultiCaRe dataset paper/structure (93k cases, 130k images) covering clinical categories, multimodal metadata, and class distribution.',
    assigneeIds: ['member-1', 'member-2', 'member-3', 'member-4', 'member-5'],
    lectureId: 1,
    tag: 'Data Engineering',
    pillar: 'Data Engineering',
    priority: 'High',
    status: 'In Progress',
    dueDate: '2026-09-16',
    createdAt: '2026-09-09'
  },
  {
    id: 'task-w1-6',
    title: 'Explore Datasets: MultiCaRe Dataset Repository',
    description: 'Clone and explore the official dataset repository at https://github.com/mauro-nievoff/MultiCaRe_Dataset. Review Jupyter extraction notebooks, sample indexing, and image formats.',
    assigneeIds: ['member-1', 'member-2', 'member-3', 'member-4', 'member-5'],
    lectureId: 1,
    tag: 'Data Engineering',
    pillar: 'Data Engineering',
    priority: 'High',
    status: 'In Progress',
    dueDate: '2026-09-16',
    createdAt: '2026-09-09'
  }
];

export const LECTURE_SESSIONS: LectureSession[] = [
  {
    week: 1,
    date: '2026-09-09',
    title: 'Course Kickoff & Clinical Orientation',
    folderName: 'Lecture_01_2026-09-09',
    status: 'active',
    phase: 'Data',
    summary: 'Course introduction by Dr. Tran Duc Khanh and practical orientation by TA Le Viet Tin. Comprehensive overview of the MultiCaRe dataset (93k cases, 130k images), the 3-tier architecture (RAG, PEFT, MedAgents), and HIPAA local inference requirements.',
    materials: [
      {
        title: 'M24_Project.pdf (Dr. Tran Duc Khanh Course Syllabus)',
        type: 'pdf',
        url: '/lectures/Lecture_01_2026-09-09/M24_Project.pdf',
        filename: 'M24_Project.pdf',
        size: '204 KB'
      },
      {
        title: 'Project Sharing_Mr Tin.pdf (TA Le Viet Tin Practical Orientation)',
        type: 'pdf',
        url: '/lectures/Lecture_01_2026-09-09/Project Sharing_Mr Tin.pdf',
        filename: 'Project Sharing_Mr Tin.pdf',
        size: '19.4 MB'
      },
      {
        title: 'Lecture_01_Summary.html (Interactive Standalone Dossier)',
        type: 'html',
        url: '/lectures/Lecture_01_2026-09-09/Lecture_01_Summary.html',
        filename: 'Lecture_01_Summary.html',
        size: '36.4 KB'
      }
    ],
    keyActionItems: [
      'Read paper: Large language models for disease diagnosis: a scoping review',
      'Read paper: LightRAG: Simple and Fast Retrieval-Augmented Generation',
      'Read paper: QLoRA: Efficient finetuning of quantized LLMs',
      'Read paper: MedAgents: Large language models as collaborators for zero-shot medical imaging',
      'Read paper: MultiCare - a multimodal clinical case dataset',
      'Explore datasets: https://github.com/mauro-nievoff/MultiCaRe_Dataset'
    ]
  },
  {
    week: 2,
    date: 'Upcoming',
    title: 'Data Curation, Cleaning & Balancing',
    folderName: 'Lecture_02_YYYY-MM-DD',
    status: 'upcoming',
    phase: 'Data',
    summary: 'Upcoming session: Parsing clinical notes, multimodal image normalization, and addressing rare disease class imbalance.',
    materials: [],
    keyActionItems: [
      'Session not yet conducted - content will be posted after lecture.'
    ]
  },
  {
    week: 3,
    date: 'Upcoming',
    title: 'Baseline Vision-Language Model Setup',
    folderName: 'Lecture_03_YYYY-MM-DD',
    status: 'upcoming',
    phase: 'Modeling',
    summary: 'Upcoming session: Zero-shot baseline benchmarking with small open backbones (LLaVA, Gemma-2-Vision).',
    materials: [],
    keyActionItems: [
      'Session not yet conducted - content will be posted after lecture.'
    ]
  },
  {
    week: 4,
    date: 'Upcoming',
    title: 'Context Engineering & Medical Knowledge Graphs',
    folderName: 'Lecture_04_YYYY-MM-DD',
    status: 'upcoming',
    phase: 'Modeling',
    summary: 'Upcoming session: Grounded retrieval with LightRAG and medical graphs connecting tropical disease entities.',
    materials: [],
    keyActionItems: [
      'Session not yet conducted - content will be posted after lecture.'
    ]
  },
  {
    week: 5,
    date: 'Upcoming',
    title: 'Parameter-Efficient Fine-Tuning (PEFT & QLoRA)',
    folderName: 'Lecture_05_YYYY-MM-DD',
    status: 'upcoming',
    phase: 'Modeling',
    summary: 'Upcoming session: Instruction-tuning small multimodal backbones using 4-bit QLoRA for structured Top-5 reasoning.',
    materials: [],
    keyActionItems: [
      'Session not yet conducted - content will be posted after lecture.'
    ]
  },
  {
    week: 6,
    date: 'Upcoming',
    title: 'Mid-term Sprint Progress & Demo',
    folderName: 'Lecture_06_YYYY-MM-DD',
    status: 'upcoming',
    phase: 'Modeling',
    summary: 'Upcoming session: Live demonstration of data preprocessing and baseline fine-tuned model inferences.',
    materials: [],
    keyActionItems: [
      'Session not yet conducted - content will be posted after lecture.'
    ]
  },
  {
    week: 7,
    date: 'Upcoming',
    title: 'Direct Preference Optimization (DPO) for Clinical Safety',
    folderName: 'Lecture_07_YYYY-MM-DD',
    status: 'upcoming',
    phase: 'Modeling',
    summary: 'Upcoming session: Aligning diagnostic outputs with clinical guidelines and preference pairs.',
    materials: [],
    keyActionItems: [
      'Session not yet conducted - content will be posted after lecture.'
    ]
  },
  {
    week: 8,
    date: 'Upcoming',
    title: 'Midterm Milestone Evaluation & Defense',
    folderName: 'Lecture_08_YYYY-MM-DD',
    status: 'upcoming',
    phase: 'Evaluation',
    summary: 'Upcoming session: Midterm project defense and continuous assessment evaluation.',
    materials: [],
    keyActionItems: [
      'Session not yet conducted - content will be posted after lecture.'
    ]
  },
  {
    week: 9,
    date: 'Upcoming',
    title: 'Multi-Agent Architecture (MedAgents Protocol)',
    folderName: 'Lecture_09_YYYY-MM-DD',
    status: 'upcoming',
    phase: 'Agents',
    summary: 'Upcoming session: Collaborative multi-agent debate framework between specialized clinical roles.',
    materials: [],
    keyActionItems: [
      'Session not yet conducted - content will be posted after lecture.'
    ]
  },
  {
    week: 10,
    date: 'Upcoming',
    title: 'Multi-Agent Consensus Tuning & Disagreement Handling',
    folderName: 'Lecture_10_YYYY-MM-DD',
    status: 'upcoming',
    phase: 'Agents',
    summary: 'Upcoming session: Tuning coordinator agents to resolve conflicting diagnostic hypotheses.',
    materials: [],
    keyActionItems: [
      'Session not yet conducted - content will be posted after lecture.'
    ]
  },
  {
    week: 11,
    date: 'Upcoming',
    title: 'System Integration (RAG + PEFT + Agents)',
    folderName: 'Lecture_11_YYYY-MM-DD',
    status: 'upcoming',
    phase: 'Agents',
    summary: 'Upcoming session: End-to-end unifying pipeline connecting grounding, tuned models, and agent debate.',
    materials: [],
    keyActionItems: [
      'Session not yet conducted - content will be posted after lecture.'
    ]
  },
  {
    week: 12,
    date: 'Upcoming',
    title: 'Comprehensive Diagnostic Benchmark & Ablations',
    folderName: 'Lecture_12_YYYY-MM-DD',
    status: 'upcoming',
    phase: 'Evaluation',
    summary: 'Upcoming session: Quantitative evaluation of Top-1 and Top-5 accuracy, Ragas faithfulness, and latency.',
    materials: [],
    keyActionItems: [
      'Session not yet conducted - content will be posted after lecture.'
    ]
  },
  {
    week: 13,
    date: 'Upcoming',
    title: 'Local On-Premise Deployment (vLLM & Ollama)',
    folderName: 'Lecture_13_YYYY-MM-DD',
    status: 'upcoming',
    phase: 'Delivery',
    summary: 'Upcoming session: Local inference server deployment, containerization, and offline clinical demo.',
    materials: [],
    keyActionItems: [
      'Session not yet conducted - content will be posted after lecture.'
    ]
  },
  {
    week: 14,
    date: 'Upcoming',
    title: 'Research Paper Drafting & Peer Review',
    folderName: 'Lecture_14_YYYY-MM-DD',
    status: 'upcoming',
    phase: 'Delivery',
    summary: 'Upcoming session: Academic paper write-up according to Springer / IEEE CS conference formatting.',
    materials: [],
    keyActionItems: [
      'Session not yet conducted - content will be posted after lecture.'
    ]
  },
  {
    week: 15,
    date: 'Upcoming',
    title: 'Final Rehearsals & Presentation Polish',
    folderName: 'Lecture_15_YYYY-MM-DD',
    status: 'upcoming',
    phase: 'Delivery',
    summary: 'Upcoming session: Slide refinement, live demo rehearsal, and defense preparation.',
    materials: [],
    keyActionItems: [
      'Session not yet conducted - content will be posted after lecture.'
    ]
  },
  {
    week: 16,
    date: 'Upcoming',
    title: 'Final Defense & Live Clinical Demonstration',
    folderName: 'Lecture_16_YYYY-MM-DD',
    status: 'upcoming',
    phase: 'Delivery',
    summary: 'Upcoming session: Final project presentation (70% grade weight), live diagnostic demo, and jury Q&A.',
    materials: [],
    keyActionItems: [
      'Session not yet conducted - content will be posted after lecture.'
    ]
  }
];

export const INITIAL_MEMBER_NOTES: Record<string, string> = {};


