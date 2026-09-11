import { Member, Task, LectureSession } from '@/types';

export const INITIAL_MEMBERS: Member[] = [
  {
    id: '11111111-0000-0000-0000-000000000004',
    name: 'Phan Thành Hưng',
    studentId: '10423051',
    role: '',
    email: '10423051@student.vgu.edu.vn',
    avatarBg: '#0891b2',
    initials: 'TH',
    bio: '',
    skills: [],
    isTeamLeader: true,
  },
  {
    id: 'bd5941a6-c419-43fe-a550-eb2de5cf9336',
    name: 'Tester',
    studentId: '0001',
    role: 'Tester',
    email: '0001@student.vgu.edu.vn',
    avatarBg: '#6366f1',
    initials: 'TS',
    bio: '',
    skills: [],
    isTeamLeader: false,
  }
];

export const INITIAL_TASKS: Task[] = [];

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


