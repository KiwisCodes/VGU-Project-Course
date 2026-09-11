'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { LECTURE_SESSIONS } from '@/data/initialData';
import { LectureTaskTracker } from '@/components/LectureTaskTracker';
import { 
  ArrowLeft, 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  Sparkles,
  ChevronRight,
  Mail,
  Phone,
  Folder,
  Download,
  AlertCircle,
  Activity
} from 'lucide-react';

const LITERATURE_PAPERS = [
  {
    topic: 'Core Clinical Dataset',
    title: 'MultiCaRe: Multimodal Clinical Case Dataset (93k cases, 130k images)',
    source: 'GitHub / arXiv',
    url: 'https://github.com/mauro-nievoff/MultiCaRe_Dataset',
    badge: 'Dataset'
  },
  {
    topic: 'Diagnostic Survey',
    title: 'Large Language Models for Disease Diagnosis: A Scoping Review (2024)',
    source: 'arXiv:2409.00097',
    url: 'https://arxiv.org/abs/2409.00097',
    badge: 'Survey'
  },
  {
    topic: 'Graph RAG Grounding',
    title: 'LightRAG: Simple and Fast Retrieval-Augmented Generation (2024)',
    source: 'arXiv:2410.05779',
    url: 'https://arxiv.org/abs/2410.05779',
    badge: 'Level 1'
  },
  {
    topic: 'Parameter-Efficient Tuning',
    title: 'QLoRA: Efficient Finetuning of Quantized LLMs (Dettmers et al.)',
    source: 'arXiv:2305.14314',
    url: 'https://arxiv.org/abs/2305.14314',
    badge: 'Level 2'
  },
  {
    topic: 'Multi-Agent Collaboration',
    title: 'MedAgents: LLMs as Collaborators for Zero-shot Medical Reasoning',
    source: 'arXiv:2311.10537',
    url: 'https://arxiv.org/abs/2311.10537',
    badge: 'Level 3'
  },
  {
    topic: 'AI Engineer Curriculum',
    title: 'AI Engineer Comprehensive Skill Tree & Practical Roadmap',
    source: 'roadmap.sh/ai-engineer',
    url: 'https://roadmap.sh/ai-engineer',
    badge: 'Career'
  }
];

export default function LectureDetailPage({ params }: { params: Promise<{ week: string }> }) {
  const unwrappedParams = use(params);
  const weekNum = parseInt(unwrappedParams.week, 10);
  const lecture = LECTURE_SESSIONS.find(l => l.week === weekNum);

  // If lecture is not week 1 (i.e. upcoming / not yet)
  if (weekNum !== 1) {
    return (
      <div className="space-y-6">
        <Link 
          href="/lectures" 
          className="inline-flex items-center gap-1.5 text-xs font-bold hover:underline"
          style={{ color: 'var(--accent-blue)' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Lectures Directory
        </Link>

        <div className="bento-card p-6 text-center max-w-2xl mx-auto space-y-3">
          <div className="w-10 h-10 rounded-2xl mx-auto flex items-center justify-center bg-amber-50 dark:bg-amber-950/40 text-amber-500">
            <Clock className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <span className="pill-badge pill-amber text-xs">Lecture {weekNum} Not Yet Conducted</span>
            <h2 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-main)' }}>
              {lecture ? lecture.title : `Lecture ${weekNum}`}
            </h2>
            <p className="text-xs font-mono text-muted">
              Folder: {lecture?.folderName || `Lecture_${String(weekNum).padStart(2, '0')}_YYYY-MM-DD`}
            </p>
          </div>

          <p className="text-xs leading-relaxed max-w-lg mx-auto" style={{ color: 'var(--text-muted)' }}>
            This lecture session has not been held yet. Full architectural digests and slide decks will be published here following the live lecture. You can prepare and track deliverables for this session below.
          </p>

          <div className="pt-3 border-t flex items-center justify-center gap-3">
            <Link
              href="/lectures"
              className="px-4 py-2 rounded-xl text-xs font-bold border hover:opacity-80 transition-all"
              style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-main)' }}
            >
              Back to Curriculum
            </Link>
            <Link
              href="/lectures/1"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all"
              style={{ backgroundColor: 'var(--accent-blue)' }}
            >
              View Active Lecture 1 Dossier
            </Link>
          </div>
        </div>

        {/* Live Kanban View for upcoming lecture and cyclic dial */}
        <LectureTaskTracker weekNum={weekNum} />
      </div>
    );
  }

  // COMPLETE LECTURE 1 DOSSIER
  return (
    <div className="space-y-8">

      {/* Top Breadcrumb & Drive Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <Link 
          href="/lectures" 
          className="inline-flex items-center gap-1.5 text-xs font-bold hover:underline"
          style={{ color: 'var(--accent-blue)' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Lectures Directory
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/materials"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border hover:opacity-80 transition-all cursor-pointer"
            style={{ 
              borderColor: 'var(--border-strong)', 
              backgroundColor: 'var(--bg-surface-elevated)', 
              color: 'var(--text-main)' 
            }}
          >
            <Folder className="w-3.5 h-3.5 text-blue-500" />
            <span>Open in Course Drive</span>
          </Link>

          <a
            href="/lectures/Lecture_01_2026-09-09/Lecture_01_Summary.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all cursor-pointer"
            style={{ backgroundColor: 'var(--accent-blue)' }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Standalone HTML View</span>
          </a>
        </div>
      </div>

      {/* Hero Section */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="pill-badge pill-blue">Project Course (10 ECTS)</span>
          <span className="pill-badge pill-emerald">4 Hours / Week</span>
          <span className="pill-badge pill-purple">Lecture 1 • 2026-09-09</span>
          <span className="pill-badge pill-amber">Semester 7 WS 2026-2027</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text-main)' }}>
          Small Multimodal Models for Clinical Diagnosis
        </h1>
        <p className="text-sm sm:text-base mt-2 max-w-3xl leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Architectural blueprint, orientation guidelines, and actionable tasks for building a local diagnostic assistant for tropical and infectious diseases.
        </p>
      </div>

      {/* Bento Grid: Parameters & Teaching Staff Contacts */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Core Mission */}
        <div className="md:col-span-8 bento-card p-6 border-l-4" style={{ borderLeftColor: 'var(--accent-blue)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent-blue)' }}>
              Project Target
            </span>
            <span className="pill-badge pill-blue">Core Mission</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold mb-2" style={{ color: 'var(--text-main)' }}>
            Local Multimodal Diagnosis Support System
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Engineered for clinical decision support in tropical and infectious pathologies (e.g. Dengue, Malaria, Ebola, Tuberculosis, Melioidosis, Abscess, Brucellosis). Operates entirely on-premise on free-form clinical notes paired with diagnostic imagery to generate ranked <strong>Top-5 differential diagnoses</strong> with structured clinical explanations.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <div>
              <span className="text-[11px] block font-semibold" style={{ color: 'var(--text-faint)' }}>Dataset Scale</span>
              <span className="text-xs sm:text-sm font-bold block" style={{ color: 'var(--text-main)' }}>93k Cases • 130k Images</span>
            </div>
            <div>
              <span className="text-[11px] block font-semibold" style={{ color: 'var(--text-faint)' }}>Target Categories</span>
              <span className="text-xs sm:text-sm font-bold block" style={{ color: 'var(--text-main)' }}>Dengue, Malaria, TB, Ebola</span>
            </div>
            <div>
              <span className="text-[11px] block font-semibold" style={{ color: 'var(--text-faint)' }}>Deployment Focus</span>
              <span className="text-xs sm:text-sm font-bold block" style={{ color: 'var(--accent-emerald)' }}>Local On-Premise (No APIs)</span>
            </div>
          </div>
        </div>

        {/* Evaluation Formula */}
        <div className="md:col-span-4 bento-card p-6 border-l-4" style={{ borderLeftColor: 'var(--accent-amber)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent-amber)' }}>
              Evaluation Weight
            </span>
            <span className="pill-badge pill-amber">10 ECTS</span>
          </div>
          <h3 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--text-main)' }}>
            30% / 70%
          </h3>
          <span className="text-xs font-bold block mb-2" style={{ color: 'var(--accent-amber)' }}>
            Continuous vs Final Defense
          </span>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Weekly live demos, agile progress milestones, active interaction (30%). Final presentation, live clinical demonstration, and comprehensive research paper (70%).
          </p>
        </div>

        {/* Course Supervisor Contact */}
        <div className="md:col-span-6 bento-card p-5 border-l-4" style={{ borderLeftColor: 'var(--accent-emerald)' }}>
          <span className="text-[10px] font-extrabold uppercase tracking-wider block mb-1" style={{ color: 'var(--accent-emerald)' }}>
            Course Lecturer &amp; Supervisor
          </span>
          <h4 className="font-extrabold text-sm" style={{ color: 'var(--text-main)' }}>
            Dr. Tran Duc Khanh
          </h4>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            Senior Lecturer, Faculty of Engineering, Vietnamese-German University (VGU)
          </p>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-emerald-500" />
              <a href="mailto:khanh.td@vgu.edu.vn" className="font-bold hover:underline" style={{ color: 'var(--accent-blue)' }}>
                khanh.td@vgu.edu.vn
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-bold" style={{ color: 'var(--text-main)' }}>0942365177</span>
              <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>(Zalo, WhatsApp, Viber)</span>
            </div>
          </div>
        </div>

        {/* Teaching Assistant Contact */}
        <div className="md:col-span-6 bento-card p-5 border-l-4" style={{ borderLeftColor: 'var(--accent-purple)' }}>
          <span className="text-[10px] font-extrabold uppercase tracking-wider block mb-1" style={{ color: 'var(--accent-purple)' }}>
            Teaching Assistant &amp; AI Researcher
          </span>
          <h4 className="font-extrabold text-sm" style={{ color: 'var(--text-main)' }}>
            Le Viet Tin (Mr. Tin)
          </h4>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            Teaching Assistant &amp; Medical AI Researcher, VGU Computer Science
          </p>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-purple-500" />
              <a href="mailto:10422078@student.vgu.edu.vn" className="font-bold hover:underline" style={{ color: 'var(--accent-blue)' }}>
                10422078@student.vgu.edu.vn
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-purple-500" />
              <span className="font-bold" style={{ color: 'var(--text-main)' }}>0907788251</span>
              <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>(Zalo)</span>
            </div>
          </div>
        </div>

      </div>

      {/* The Three Methodological Tiers */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4 text-blue-500" />
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-main)' }}>
              The Three Technical Tiers
            </h2>
          </div>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
            A progressive methodology moving from factual grounding to parameter fine-tuning and collaborative multi-agent debate.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Tier 1 */}
          <div className="bento-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="pill-badge pill-blue text-[10px]">Level 1: Grounding</span>
                <span className="text-[11px] font-bold" style={{ color: 'var(--accent-amber)' }}>Open-Book</span>
              </div>
              <h3 className="font-bold text-base mb-1" style={{ color: 'var(--text-main)' }}>
                RAG &amp; Knowledge Graphs
              </h3>
              <p className="text-xs font-semibold mb-3" style={{ color: 'var(--accent-amber)' }}>
                Analogy: Library / Open-Book Exam
              </p>
              <ul className="space-y-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <span>Retrieves external authoritative medical knowledge to eliminate hallucinations.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <span>Integrates LightRAG to connect disease, symptom, and treatment entities into clinical subgraphs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <span>Ensures diagnoses are verified against real-time clinical guidelines and CDC/WHO protocols.</span>
                </li>
              </ul>
            </div>
            <div className="mt-4 pt-3 border-t text-[11px] font-bold" style={{ borderColor: 'var(--border-subtle)', color: 'var(--accent-blue)' }}>
              Eliminates Hallucinations
            </div>
          </div>

          {/* Tier 2 */}
          <div className="bento-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="pill-badge pill-purple text-[10px]">Level 2: Specialization</span>
                <span className="text-[11px] font-bold" style={{ color: 'var(--accent-amber)' }}>Teaching</span>
              </div>
              <h3 className="font-bold text-base mb-1" style={{ color: 'var(--text-main)' }}>
                Parameter-Efficient Fine-Tuning
              </h3>
              <p className="text-xs font-semibold mb-3" style={{ color: 'var(--accent-amber)' }}>
                Analogy: Teaching &amp; Mentoring
              </p>
              <ul className="space-y-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                  <span>Adapts small multimodal models via LoRA and QLoRA in 4-bit precision for local GPUs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                  <span>Trains the network to produce structured Top-5 ranked differential diagnoses with clinical rationale.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                  <span>Supervised Fine-Tuning (SFT) and Direct Preference Optimization (DPO) on expert doctor decisions.</span>
                </li>
              </ul>
            </div>
            <div className="mt-4 pt-3 border-t text-[11px] font-bold" style={{ borderColor: 'var(--border-subtle)', color: 'var(--accent-purple)' }}>
              Structured Clinical Reasoning
            </div>
          </div>

          {/* Tier 3 */}
          <div className="bento-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="pill-badge pill-emerald text-[10px]">Level 3: Collaboration</span>
                <span className="text-[11px] font-bold" style={{ color: 'var(--accent-amber)' }}>Consultation</span>
              </div>
              <h3 className="font-bold text-base mb-1" style={{ color: 'var(--text-main)' }}>
                Multi-Agent Systems
              </h3>
              <p className="text-xs font-semibold mb-3" style={{ color: 'var(--accent-amber)' }}>
                Analogy: Clinical Board Consultation
              </p>
              <ul className="space-y-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>Implements the MedAgents framework to replace single isolated model hallucination.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>Dedicated specialist agents for radiology imagery, lab vitals, and travel/symptom history.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>Lead agent coordinates structured debate to pinpoint rare disease markers and resolve conflicts.</span>
                </li>
              </ul>
            </div>
            <div className="mt-4 pt-3 border-t text-[11px] font-bold" style={{ borderColor: 'var(--border-subtle)', color: 'var(--accent-emerald)' }}>
              Consensus &amp; Disagreement Handling
            </div>
          </div>

        </div>
      </div>

      {/* End-to-End Diagnostic Pipeline */}
      <div className="bento-card p-6">
        <div className="mb-4">
          <span className="text-[10px] font-extrabold uppercase tracking-wider block" style={{ color: 'var(--accent-blue)' }}>
            Progression Workflow
          </span>
          <h3 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-main)' }}>
            End-to-End Clinical Diagnostic Pipeline
          </h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            How patient multimodal data flows through local inference to produce ranked differential recommendations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}>
            <span className="text-[10px] font-extrabold uppercase tracking-wider block mb-1 text-blue-500">
              Step 1: Ingestion
            </span>
            <h4 className="font-bold text-sm mb-1" style={{ color: 'var(--text-main)' }}>
              Multimodal Clinical Inputs
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Unstructured clinical narratives, patient demographics, vitals, travel history, accompanied by diagnostic imaging (X-rays, CTs, MRIs, pathology scans).
            </p>
          </div>

          <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}>
            <span className="text-[10px] font-extrabold uppercase tracking-wider block mb-1 text-purple-500">
              Step 2: Processing
            </span>
            <h4 className="font-bold text-sm mb-1" style={{ color: 'var(--text-main)' }}>
              Reasoning &amp; Retrieval
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Entities extracted to query the medical Knowledge Graph. Vision-Language backbones process imagery, while specialist agents debate differential options.
            </p>
          </div>

          <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}>
            <span className="text-[10px] font-extrabold uppercase tracking-wider block mb-1 text-emerald-500">
              Step 3: Output
            </span>
            <h4 className="font-bold text-sm mb-1" style={{ color: 'var(--text-main)' }}>
              Structured Differential
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Ranked Top-5 candidate diseases with explicit clinical reasoning steps, diagnostic caveats, and recommended confirmatory laboratory tests.
            </p>
          </div>

        </div>
      </div>

      {/* Why Local Small Models (4 Grid) */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-main)' }}>
            Why Build Local Small Models?
          </h2>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
            Four core architectural and industrial reasons to prioritize local open models over commercial cloud APIs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bento-card p-4">
            <h4 className="font-bold text-xs mb-1 flex items-center gap-1.5" style={{ color: 'var(--accent-blue)' }}>
              <ShieldCheck className="w-3.5 h-3.5" /> 1. HIPAA &amp; Privacy
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Protected Health Information (PHI) cannot be dispatched to third-party cloud APIs. Local models keep data strictly inside hospital boundaries.
            </p>
          </div>

          <div className="bento-card p-4">
            <h4 className="font-bold text-xs mb-1 flex items-center gap-1.5" style={{ color: 'var(--accent-emerald)' }}>
              <Cpu className="w-3.5 h-3.5" /> 2. Deep Customization
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Direct control over tokenizer vocabularies, quantization schemes, and adapter weights tailored for rare tropical conditions.
            </p>
          </div>

          <div className="bento-card p-4">
            <h4 className="font-bold text-xs mb-1 flex items-center gap-1.5" style={{ color: 'var(--accent-amber)' }}>
              <Activity className="w-3.5 h-3.5" /> 3. Zero API Costs
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Commercial multimodal token billing scales unsustainably in clinical production. Local open-weight architectures eliminate API dependency.
            </p>
          </div>

          <div className="bento-card p-4">
            <h4 className="font-bold text-xs mb-1 flex items-center gap-1.5" style={{ color: 'var(--accent-purple)' }}>
              <Sparkles className="w-3.5 h-3.5" /> 4. Employability
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Industry recruiters (Hitachi, Katalon, etc.) prize AI engineers who can quantize, fine-tune, benchmark, and deploy local inference engines (vLLM, Ollama).
            </p>
          </div>

        </div>
      </div>

      {/* LIVE SYNCHRONIZED LECTURE ACTION DELIVERABLES TRACKER */}
      <LectureTaskTracker weekNum={weekNum} />

      {/* Curated Literature & Tooling Stack Table */}
      <div className="bento-card p-6">
        <div className="mb-4">
          <span className="text-[10px] font-extrabold uppercase tracking-wider block" style={{ color: 'var(--accent-blue)' }}>
            Foundational Reading
          </span>
          <h3 className="text-base font-extrabold" style={{ color: 'var(--text-main)' }}>
            Curated Literature &amp; Tooling Stack
          </h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Official papers and repositories cited by Dr. Tran Duc Khanh and TA Le Viet Tin.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
                <th className="py-2.5 px-3 font-bold" style={{ color: 'var(--text-faint)' }}>Topic</th>
                <th className="py-2.5 px-3 font-bold" style={{ color: 'var(--text-faint)' }}>Resource / Paper Title</th>
                <th className="py-2.5 px-3 font-bold" style={{ color: 'var(--text-faint)' }}>Source</th>
                <th className="py-2.5 px-3 font-bold text-right" style={{ color: 'var(--text-faint)' }}>Link</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {LITERATURE_PAPERS.map((paper, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="py-2.5 px-3">
                    <span className="pill-badge pill-blue text-[10px]">{paper.badge}</span>
                  </td>
                  <td className="py-2.5 px-3 font-bold" style={{ color: 'var(--text-main)' }}>
                    {paper.title}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {paper.source}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border hover:opacity-80 transition-all"
                      style={{ 
                        borderColor: 'var(--border-subtle)', 
                        backgroundColor: 'var(--bg-surface-elevated)', 
                        color: 'var(--accent-blue)' 
                      }}
                    >
                      <span>Read</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Materials & Slides Direct Downloads (New Tab) */}
      <div className="bento-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider block" style={{ color: 'var(--accent-emerald)' }}>
              Lecture 1 Folder Contents
            </span>
            <h3 className="text-base font-extrabold" style={{ color: 'var(--text-main)' }}>
              Lecture 01 Slides &amp; Artifacts
            </h3>
          </div>
          <Link 
            href="/materials" 
            className="text-xs font-bold hover:underline"
            style={{ color: 'var(--accent-blue)' }}
          >
            Open in Drive Explorer &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <a
            href="/lectures/Lecture_01_2026-09-09/M24_Project.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl border flex flex-col justify-between hover:border-blue-400 transition-all group"
            style={{ backgroundColor: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="pill-badge pill-blue text-[10px]">PDF • 204 KB</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
              </div>
              <h4 className="font-bold text-xs leading-snug mb-1" style={{ color: 'var(--text-main)' }}>
                M24_Project.pdf
              </h4>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Dr. Tran Duc Khanh official course syllabus (10 ECTS, 30/70 formula).
              </p>
            </div>
            <span className="text-[11px] font-bold mt-3 block text-blue-500">
              Open PDF in New Tab &rarr;
            </span>
          </a>

          <a
            href="/lectures/Lecture_01_2026-09-09/Project Sharing_Mr Tin.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl border flex flex-col justify-between hover:border-blue-400 transition-all group"
            style={{ backgroundColor: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="pill-badge pill-purple text-[10px]">PDF • 19.4 MB</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-500 transition-colors" />
              </div>
              <h4 className="font-bold text-xs leading-snug mb-1" style={{ color: 'var(--text-main)' }}>
                Project Sharing_Mr Tin.pdf
              </h4>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                TA Le Viet Tin orientation deck (MultiCaRe, MedAgents, HIPAA local AI).
              </p>
            </div>
            <span className="text-[11px] font-bold mt-3 block text-purple-500">
              Open PDF in New Tab &rarr;
            </span>
          </a>

          <a
            href="/lectures/Lecture_01_2026-09-09/Lecture_01_Summary.html"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl border flex flex-col justify-between hover:border-blue-400 transition-all group"
            style={{ backgroundColor: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="pill-badge pill-emerald text-[10px]">HTML • 36 KB</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
              </div>
              <h4 className="font-bold text-xs leading-snug mb-1" style={{ color: 'var(--text-main)' }}>
                Lecture_01_Summary.html
              </h4>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Standalone interactive HTML dossier with Taste aesthetic.
              </p>
            </div>
            <span className="text-[11px] font-bold mt-3 block text-emerald-500">
              Open Standalone HTML &rarr;
            </span>
          </a>

        </div>
      </div>

    </div>
  );
}
