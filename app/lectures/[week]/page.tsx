'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { LECTURE_SESSIONS } from '@/data/initialData';
import { LectureTaskTracker } from '@/components/LectureTaskTracker';
import { useProject } from '@/context/ProjectContext';
import { useAuth } from '@/context/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { DriveFile, DriveFolder } from '@/types';
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
  Activity,
  Plus,
  Trash2,
  Edit3,
  Upload,
  X,
  Copy,
  Check,
  Calendar,
  CheckSquare,
  Loader2,
  FileUp
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
  const padNum = String(weekNum).padStart(2, '0');

  const { driveFolders, addDriveFile, updateDriveFile, deleteDriveFile, addDriveFolder } = useProject();
  const { profile } = useAuth();
  const activeFolder = driveFolders.find(
    f => f.lectureNumber === weekNum || f.name.includes(`Lecture_${padNum}`)
  );

  // File management modal & form state
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<DriveFile | null>(null);
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteConfirmFile, setDeleteConfirmFile] = useState<DriveFile | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [fileForm, setFileForm] = useState({
    name: '',
    title: '',
    author: profile?.name || 'VGU Team',
    type: 'pdf' as 'pdf' | 'html' | 'slides' | 'doc',
    size: '1.0 MB',
    sizeBytes: 1048576,
    url: '',
    description: '',
    highlights: ''
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAddFile = () => {
    setEditingFile(null);
    setSelectedUploadFile(null);
    setFileError(null);
    setFileForm({
      name: '',
      title: '',
      author: profile?.name || 'VGU Team',
      type: 'pdf',
      size: '1.0 MB',
      sizeBytes: 1048576,
      url: '',
      description: '',
      highlights: ''
    });
    setIsFileModalOpen(true);
  };

  const handleOpenEditFile = (file: DriveFile) => {
    setEditingFile(file);
    setSelectedUploadFile(null);
    setFileError(null);
    setFileForm({
      name: file.name,
      title: file.title,
      author: file.author || 'VGU Team',
      type: file.type || 'pdf',
      size: file.size || '1.0 MB',
      sizeBytes: file.sizeBytes || 1048576,
      url: file.url || '',
      description: file.description || '',
      highlights: (file.highlights || []).join('\n')
    });
    setIsFileModalOpen(true);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Supabase Free Tier: Strict 50 MB upload limit
    const MAX_FREE_TIER_BYTES = 50 * 1024 * 1024;
    if (file.size > MAX_FREE_TIER_BYTES) {
      const selectedMb = (file.size / (1024 * 1024)).toFixed(1);
      setFileError(`File exceeds the 50 MB Free Tier upload limit (selected: ${selectedMb} MB). Please compress or split the file.`);
      e.target.value = '';
      setSelectedUploadFile(null);
      return;
    }

    setSelectedUploadFile(file);

    let detectedType: 'pdf' | 'html' | 'slides' | 'doc' = 'pdf';
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.pdf')) detectedType = 'pdf';
    else if (lowerName.endsWith('.html') || lowerName.endsWith('.htm')) detectedType = 'html';
    else if (lowerName.endsWith('.ppt') || lowerName.endsWith('.pptx')) detectedType = 'slides';
    else if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx') || lowerName.endsWith('.md') || lowerName.endsWith('.txt')) detectedType = 'doc';

    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    const sizeStr = file.size >= 1024 * 1024 ? `${sizeMb} MB` : `${Math.round(file.size / 1024)} KB`;

    const folderPrefix = activeFolder ? `/lectures/${activeFolder.name}/` : `/lectures/Lecture_${padNum}/`;

    setFileForm(prev => ({
      ...prev,
      name: file.name,
      title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      type: detectedType,
      size: sizeStr,
      sizeBytes: file.size,
      url: `${folderPrefix}${file.name}`
    }));
  };

  const handleSaveFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileForm.name.trim()) return;

    let targetFolderId = activeFolder?.id;

    // If activeFolder doesn't exist yet, create one
    if (!targetFolderId) {
      const folderName = lecture?.folderName || `Lecture_${padNum}_${new Date().toISOString().split('T')[0]}`;
      const newFolderId = folderName;
      addDriveFolder({
        name: folderName,
        lectureNumber: weekNum,
        date: lecture?.date || new Date().toISOString().split('T')[0],
        status: weekNum === 1 ? 'active' : 'upcoming',
        description: lecture?.summary || `Lecture ${weekNum} materials folder`
      });
      targetFolderId = newFolderId;
    }

    let targetUrl = fileForm.url.trim();

    // Upload to Supabase storage if physical file is chosen
    if (selectedUploadFile && isSupabaseConfigured) {
      try {
        setIsUploading(true);
        const folderSlug = (activeFolder?.name || `Lecture_${padNum}`).replace(/[^a-zA-Z0-9_-]/g, '_');
        const cleanFileName = `${Date.now()}_${selectedUploadFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const storagePath = `${folderSlug}/${cleanFileName}`;

        const { error: uploadErr } = await supabase.storage
          .from('lecture-materials')
          .upload(storagePath, selectedUploadFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadErr) throw uploadErr;

        const { data: publicData } = supabase.storage
          .from('lecture-materials')
          .getPublicUrl(storagePath);

        if (publicData?.publicUrl) {
          targetUrl = publicData.publicUrl;
        }
      } catch (err: any) {
        console.error('Storage upload error:', err);
        setFileError(`Upload failed: ${err.message || 'Could not upload file to Supabase storage.'}`);
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    const highlightsList = fileForm.highlights
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    if (editingFile) {
      updateDriveFile(targetFolderId, editingFile.id, {
        name: fileForm.name.trim(),
        title: fileForm.title.trim(),
        author: fileForm.author.trim(),
        type: fileForm.type,
        size: fileForm.size.trim(),
        sizeBytes: fileForm.sizeBytes,
        url: targetUrl,
        description: fileForm.description.trim(),
        highlights: highlightsList
      });
      showToast(`File "${fileForm.title || fileForm.name}" updated successfully`);
    } else {
      addDriveFile(targetFolderId, {
        name: fileForm.name.trim(),
        title: fileForm.title.trim(),
        author: fileForm.author.trim(),
        type: fileForm.type,
        size: fileForm.size.trim(),
        sizeBytes: fileForm.sizeBytes,
        url: targetUrl,
        description: fileForm.description.trim(),
        highlights: highlightsList
      });
      showToast(`File "${fileForm.title || fileForm.name}" uploaded to Lecture ${weekNum}`);
    }

    setIsFileModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmFile || !activeFolder) return;
    deleteDriveFile(activeFolder.id, deleteConfirmFile.id);
    showToast(`Deleted file "${deleteConfirmFile.name}"`);
    setDeleteConfirmFile(null);
  };

  const handleCopyLink = (file: DriveFile) => {
    const fullUrl = file.url.startsWith('http') ? file.url : `${window.location.origin}${file.url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(file.id);
    showToast(`Link copied for ${file.name}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

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

          {weekNum === 1 && (
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
          )}
        </div>
      </div>

      {/* Hero Section */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="pill-badge pill-blue">Project Course (10 ECTS)</span>
          <span className="pill-badge pill-emerald">4 Hours / Week</span>
          <span className="pill-badge pill-purple">Lecture {weekNum} • {lecture?.date || 'Upcoming'}</span>
          <span className="pill-badge pill-amber">{lecture?.phase || 'Semester 7 WS 2026-2027'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text-main)' }}>
          {lecture?.title || `Lecture ${weekNum}`}
        </h1>
        <p className="text-sm sm:text-base mt-2 max-w-3xl leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {lecture?.summary || 'Session briefing, materials, and deliverables.'}
        </p>
      </div>

      {/* Template Session Briefing for Weeks 2 - 16 */}
      {weekNum !== 1 && (
        <div className="space-y-6">
          <div className="bento-card p-6 border-l-4" style={{ borderLeftColor: 'var(--accent-blue)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent-blue)' }}>
                Session Agenda &amp; Objectives
              </span>
              <span className="pill-badge pill-blue">Lecture {weekNum} Template</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold mb-2" style={{ color: 'var(--text-main)' }}>
              {lecture?.title || `Lecture ${weekNum}`}
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {lecture?.summary || 'Session briefing, deliverables, and course materials.'}
            </p>

            {lecture?.keyActionItems && lecture.keyActionItems.length > 0 && (
              <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-main)' }}>
                  <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                  <span>Key Action Items &amp; Objectives</span>
                </h3>
                <ul className="space-y-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {lecture.keyActionItems.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Week 1 Specific Orientation Blueprint */}
      {weekNum === 1 && (
        <>
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
        </>
      )}

      {/* LIVE SYNCHRONIZED LECTURE ACTION DELIVERABLES TRACKER */}
      <LectureTaskTracker weekNum={weekNum} />

      {/* Curated Literature & Tooling Stack Table */}
      {weekNum === 1 && (
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
      )}

      {/* Materials & Files Interactive Section */}
      <div className="bento-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--accent-emerald)' }}>
                Lecture {padNum} Resources
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-faint)' }}>
                {activeFolder?.name || `Lecture_${padNum}`}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold" style={{ color: 'var(--text-main)' }}>
              Lecture {padNum} Slides, Notes &amp; Artifacts
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Manage and collaborate on lecture files, slides, and datasets. Max 50 MB per file.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleOpenAddFile}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all cursor-pointer"
              style={{ backgroundColor: 'var(--accent-blue)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add / Upload File</span>
            </button>

            <Link 
              href="/materials" 
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border hover:opacity-80 transition-all"
              style={{ 
                borderColor: 'var(--border-subtle)', 
                backgroundColor: 'var(--bg-surface-elevated)', 
                color: 'var(--text-main)' 
              }}
            >
              <Folder className="w-3.5 h-3.5 text-blue-500" />
              <span>Drive View</span>
            </Link>
          </div>
        </div>

        {activeFolder && activeFolder.files && activeFolder.files.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeFolder.files.map((file) => {
              const typeColor = 
                file.type === 'pdf' ? 'pill-blue' :
                file.type === 'html' ? 'pill-emerald' :
                file.type === 'slides' ? 'pill-purple' : 'pill-amber';

              return (
                <div
                  key={file.id}
                  className="p-4 rounded-xl border flex flex-col justify-between hover:border-blue-400 transition-all group relative"
                  style={{ backgroundColor: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}
                >
                  <div>
                    {/* Top Row: Badge, Size, Actions */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`pill-badge ${typeColor} text-[10px] uppercase font-bold`}>
                          {file.type}
                        </span>
                        {file.size && (
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                            {file.size}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopyLink(file)}
                          title="Copy Link"
                          className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        >
                          {copiedId === file.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleOpenEditFile(file)}
                          title="Edit File"
                          className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmFile(file)}
                          title="Delete File"
                          className="p-1.5 rounded-md hover:bg-rose-100 dark:hover:bg-rose-900/40 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* File Title & Filename */}
                    <h4 className="font-bold text-xs sm:text-sm leading-snug mb-1" style={{ color: 'var(--text-main)' }}>
                      {file.title || file.name}
                    </h4>
                    <p className="text-[11px] font-mono mb-2 truncate" style={{ color: 'var(--accent-blue)' }}>
                      {file.name}
                    </p>

                    {file.author && (
                      <p className="text-[10px] font-medium mb-2" style={{ color: 'var(--text-faint)' }}>
                        Uploaded by: <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>{file.author}</span>
                      </p>
                    )}

                    {file.description && (
                      <p className="text-[11px] leading-relaxed line-clamp-2 mb-3" style={{ color: 'var(--text-muted)' }}>
                        {file.description}
                      </p>
                    )}

                    {file.highlights && file.highlights.length > 0 && (
                      <div className="space-y-1 mb-3 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                        {file.highlights.slice(0, 3).map((h, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            <span className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                            <span className="truncate">{h}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Open / Download CTA */}
                  <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:underline cursor-pointer"
                    >
                      <span>Open in New Tab</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    {file.updatedAt && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {file.updatedAt}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 px-4 rounded-xl border border-dashed text-center flex flex-col items-center justify-center" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-subtle)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: 'var(--bg-surface-elevated)' }}>
              <Folder className="w-6 h-6 text-blue-500 opacity-60" />
            </div>
            <h4 className="text-sm font-bold mb-1" style={{ color: 'var(--text-main)' }}>
              No files uploaded yet for Lecture {weekNum}
            </h4>
            <p className="text-xs max-w-md mx-auto mb-4" style={{ color: 'var(--text-muted)' }}>
              This lecture template is ready. Team members can upload syllabus documents, lecture slides, meeting notes, code artifacts, or datasets (max 50 MB).
            </p>
            <button
              onClick={handleOpenAddFile}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all cursor-pointer"
              style={{ backgroundColor: 'var(--accent-blue)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload First File</span>
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit File Modal */}
      {isFileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div 
            className="w-full max-w-lg rounded-2xl border shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto"
            style={{ 
              backgroundColor: 'var(--bg-surface)', 
              borderColor: 'var(--border-strong)',
              color: 'var(--text-main)'
            }}
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <FileUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {editingFile ? 'Edit File Details' : `Add File to Lecture ${weekNum}`}
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Folder: {activeFolder?.name || `Lecture_${padNum}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFileModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {fileError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{fileError}</span>
              </div>
            )}

            <form onSubmit={handleSaveFile} className="space-y-4">
              {/* File Upload / Selector */}
              <div>
                <label className="block text-xs font-bold mb-1.5">
                  Upload Physical File <span className="text-[10px] font-normal text-slate-400">(Max 50 MB Free Tier limit)</span>
                </label>
                <div className="relative border-2 border-dashed rounded-xl p-4 text-center hover:border-blue-400 transition-colors cursor-pointer" style={{ borderColor: 'var(--border-strong)' }}>
                  <input
                    type="file"
                    onChange={handleFileInputChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center">
                    <Upload className="w-6 h-6 text-blue-500 mb-1" />
                    {selectedUploadFile ? (
                      <div className="text-xs font-semibold text-emerald-500">
                        Selected: {selectedUploadFile.name} ({(selectedUploadFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-semibold">Click or drag file to upload</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">PDF, HTML, Slides, Word, Markdown (up to 50 MB)</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* File Name */}
              <div>
                <label className="block text-xs font-bold mb-1">
                  File Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lecture_02_Slides.pdf"
                  value={fileForm.name}
                  onChange={e => setFileForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  style={{ 
                    backgroundColor: 'var(--bg-surface-elevated)', 
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-main)'
                  }}
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold mb-1">
                  Display Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Clinical Data Preprocessing &amp; EDA Walkthrough"
                  value={fileForm.title}
                  onChange={e => setFileForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  style={{ 
                    backgroundColor: 'var(--bg-surface-elevated)', 
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-main)'
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Author */}
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Author / Instructor
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Khanh or Team Member"
                    value={fileForm.author}
                    onChange={e => setFileForm(prev => ({ ...prev, author: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    style={{ 
                      backgroundColor: 'var(--bg-surface-elevated)', 
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-main)'
                    }}
                  />
                </div>

                {/* File Type */}
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Format
                  </label>
                  <select
                    value={fileForm.type}
                    onChange={e => setFileForm(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    style={{ 
                      backgroundColor: 'var(--bg-surface-elevated)', 
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-main)'
                    }}
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="slides">Slides / Presentation</option>
                    <option value="html">Interactive HTML</option>
                    <option value="doc">Text / Markdown / Word</option>
                  </select>
                </div>
              </div>

              {/* URL or Relative Path */}
              <div>
                <label className="block text-xs font-bold mb-1">
                  File URL or Path
                </label>
                <input
                  type="text"
                  placeholder="/lectures/... or https://..."
                  value={fileForm.url}
                  onChange={e => setFileForm(prev => ({ ...prev, url: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-xs border font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  style={{ 
                    backgroundColor: 'var(--bg-surface-elevated)', 
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-main)'
                  }}
                />
                <p className="text-[10px] mt-1 text-slate-400">
                  Auto-populated when a physical file is chosen or uploaded to Supabase Storage.
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold mb-1">
                  Description / Abstract
                </label>
                <textarea
                  rows={2}
                  placeholder="Summary of lecture concepts covered in this file..."
                  value={fileForm.description}
                  onChange={e => setFileForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  style={{ 
                    backgroundColor: 'var(--bg-surface-elevated)', 
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-main)'
                  }}
                />
              </div>

              {/* Highlights */}
              <div>
                <label className="block text-xs font-bold mb-1">
                  Key Takeaways (one per line)
                </label>
                <textarea
                  rows={2}
                  placeholder="Multimodal tokenization&#10;Zero-shot evaluation results&#10;HIPAA compliance standards"
                  value={fileForm.highlights}
                  onChange={e => setFileForm(prev => ({ ...prev, highlights: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  style={{ 
                    backgroundColor: 'var(--bg-surface-elevated)', 
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-main)'
                  }}
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setIsFileModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border hover:opacity-80 transition-opacity cursor-pointer"
                  style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !fileForm.name.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
                  style={{ backgroundColor: 'var(--accent-blue)' }}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading to Storage...</span>
                    </>
                  ) : (
                    <span>{editingFile ? 'Save Changes' : 'Add File'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div 
            className="w-full max-w-md rounded-2xl border shadow-2xl p-6 relative"
            style={{ 
              backgroundColor: 'var(--bg-surface)', 
              borderColor: 'var(--border-strong)',
              color: 'var(--text-main)'
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-full bg-rose-500/10 text-rose-500">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Delete File</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs leading-relaxed mb-5" style={{ color: 'var(--text-muted)' }}>
              Are you sure you want to remove <strong className="text-slate-800 dark:text-slate-100">{deleteConfirmFile.name}</strong> from Lecture {weekNum}?
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmFile(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border hover:opacity-80 transition-opacity cursor-pointer"
                style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs transition-opacity cursor-pointer"
              >
                Delete File
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
