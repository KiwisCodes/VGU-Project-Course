'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useProject } from '@/context/ProjectContext';
import { getMemberShortName } from '@/types';
import { 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Plus, 
  Layers, 
  Cpu, 
  Users2, 
  FileText, 
  BookOpen, 
  Activity,
  Sparkles,
  Folder,
  ExternalLink,
  ShieldCheck,
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function DashboardPage() {
  const { members, tasks, driveFolders } = useProject();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
  const reviewTasks = tasks.filter(t => t.status === 'Review').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Dynamically calculate active lecture session
  // Default to 1 (current active), or the highest lecture with active tasks
  const activeLecturesWithTasks = Array.from(new Set(tasks.map(t => t.lectureId || t.week || 1)));
  const currentActiveLecture = activeLecturesWithTasks.length > 0 
    ? Math.min(...activeLecturesWithTasks) 
    : 1;

  // Dynamic files count
  const totalFiles = driveFolders.reduce((acc, f) => acc + f.files.length, 0);
  const activeFolder = driveFolders.find(f => f.lectureNumber === currentActiveLecture) || driveFolders[0];

  // Week-by-week Progress Navigation (Defaults to currentActiveLecture)
  const [progressWeek, setProgressWeek] = useState<number | 'all'>(currentActiveLecture);
  const TOTAL_WEEKS = 16;

  const currentWeekTasks = progressWeek === 'all'
    ? tasks
    : tasks.filter(t => (t.lectureId || t.week || 1) === progressWeek);

  const currentWeekDone = currentWeekTasks.filter(t => t.status === 'Done').length;
  const currentWeekPct = currentWeekTasks.length > 0 
    ? Math.round((currentWeekDone / currentWeekTasks.length) * 100) 
    : 0;

  const handlePrevWeek = (e: React.MouseEvent) => {
    e.preventDefault();
    if (progressWeek === 'all') {
      setProgressWeek(TOTAL_WEEKS);
    } else if (progressWeek > 1) {
      setProgressWeek(progressWeek - 1);
    } else {
      setProgressWeek('all');
    }
  };

  const handleNextWeek = (e: React.MouseEvent) => {
    e.preventDefault();
    if (progressWeek === 'all') {
      setProgressWeek(1);
    } else if (progressWeek < TOTAL_WEEKS) {
      setProgressWeek(progressWeek + 1);
    } else {
      setProgressWeek('all');
    }
  };

  return (
    <div className="space-y-8">

      {/* Top Banner / Course Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="pill-badge pill-blue">Project Course</span>
            <span className="pill-badge pill-emerald">10 ECTS Credits</span>
            <span className="pill-badge pill-purple">4 Weekly Hours</span>
            <span className="pill-badge pill-amber">Lecture {currentActiveLecture} Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-main)' }}>
            Small Multimodal Models for Clinical Diagnosis
          </h1>
          <p className="text-sm mt-1 max-w-3xl leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Collaborative research portal for Dr. Tran Duc Khanh&apos;s project course. Track team deliverables, individual sprint logs, and lecture digests for our local medical AI diagnosis system.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/tasks"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all"
            style={{ backgroundColor: 'var(--accent-blue)' }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </Link>
          <Link
            href="/materials"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border hover:opacity-80 transition-all"
            style={{ 
              borderColor: 'var(--border-strong)', 
              backgroundColor: 'var(--bg-surface-elevated)', 
              color: 'var(--text-main)' 
            }}
          >
            <Folder className="w-3.5 h-3.5 text-blue-500" />
            <span>Materials Drive ({totalFiles} Files)</span>
          </Link>
        </div>
      </div>

      {/* Metric Counters Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Overall Completion */}
        <div className="bento-card p-5 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Overall Completion</span>
            <span className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--accent-emerald-soft)', color: 'var(--accent-emerald)' }}>
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight">{completionRate}%</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>({completedTasks} of {totalTasks} tasks)</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${completionRate}%`, backgroundColor: 'var(--accent-emerald)' }} />
          </div>
        </div>

        {/* Metric 2: In Progress */}
        <div className="bento-card p-5 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Active Sprint</span>
            <span className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--accent-blue-soft)', color: 'var(--accent-blue)' }}>
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight">{inProgressTasks + reviewTasks}</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>active deliverables</span>
          </div>
          <span className="text-[11px] font-semibold block mt-3 truncate" style={{ color: 'var(--accent-blue)' }}>
            Lecture {currentActiveLecture} deliverables in motion
          </span>
        </div>

        {/* Metric 3: Team Specialists */}
        <div className="bento-card p-5 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Team Roster</span>
            <span className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--accent-purple-soft)', color: 'var(--accent-purple)' }}>
              <Users2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight">{members.length}</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>assigned specialists</span>
          </div>
          <Link href="/members" className="text-[11px] font-semibold block mt-3 hover:underline" style={{ color: 'var(--accent-purple)' }}>
            View team directory &rarr;
          </Link>
        </div>

        {/* Metric 4: Grading Formula */}
        <div className="bento-card p-5 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Grading Formula</span>
            <span className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--accent-amber-soft)', color: 'var(--accent-amber)' }}>
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight">30 / 70</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Continuous vs Final</span>
          </div>
          <span className="text-[11px] font-semibold block mt-3" style={{ color: 'var(--accent-amber)' }}>
            Weekly demos &amp; final defense
          </span>
        </div>

      </div>

      {/* Bento Main Grid: 3 Pillars + Mission Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left 8 Cols: Mission & Three Pillars */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Mission Card */}
          <div className="bento-card p-6 border-l-4" style={{ borderLeftColor: 'var(--accent-blue)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent-blue)' }}>
                Core Clinical Problem
              </span>
              <span className="pill-badge pill-blue">MultiCaRe Dataset</span>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-main)' }}>
              Local Multimodal Decision Support for Tropical &amp; Infectious Diseases
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Our system ingests free-form clinical notes (patient background, signs, vitals, epidemiological risks) alongside multimodal diagnostic imagery (X-rays, CTs, pathology scans) to generate ranked <strong>Top-5 differential diagnoses</strong> with structured clinical explanations.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <span className="text-xs text-muted block font-semibold" style={{ color: 'var(--text-faint)' }}>Dataset Scale</span>
                <span className="text-sm font-bold block" style={{ color: 'var(--text-main)' }}>93k Cases • 130k Images</span>
              </div>
              <div>
                <span className="text-xs text-muted block font-semibold" style={{ color: 'var(--text-faint)' }}>Target Categories</span>
                <span className="text-sm font-bold block" style={{ color: 'var(--text-main)' }}>Dengue, Malaria, Ebola, TB</span>
              </div>
              <div>
                <span className="text-xs text-muted block font-semibold" style={{ color: 'var(--text-faint)' }}>Deployment Focus</span>
                <span className="text-sm font-bold block" style={{ color: 'var(--accent-emerald)' }}>Local On-Premise / No APIs</span>
              </div>
            </div>
          </div>

          {/* The 3 Methodological Tiers */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-extrabold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
                <Layers className="w-4 h-4 text-blue-500" />
                <span>The Three Methodological Tiers</span>
              </h3>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Progression Architecture</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Level 1 */}
              <div className="bento-card p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="pill-badge pill-blue text-[10px]">Level 1</span>
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--accent-amber)' }}>Open-Book</span>
                  </div>
                  <h4 className="text-sm font-bold mb-1" style={{ color: 'var(--text-main)' }}>
                    RAG &amp; Knowledge Graphs
                  </h4>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    LightRAG and medical graphs connecting disease entities to eliminate hallucinations.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t text-[11px] font-semibold" style={{ borderColor: 'var(--border-subtle)', color: 'var(--accent-blue)' }}>
                  Grounded retrieval
                </div>
              </div>

              {/* Level 2 */}
              <div className="bento-card p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="pill-badge pill-purple text-[10px]">Level 2</span>
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--accent-amber)' }}>Teaching</span>
                  </div>
                  <h4 className="text-sm font-bold mb-1" style={{ color: 'var(--text-main)' }}>
                    PEFT &amp; Fine-Tuning
                  </h4>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    Instruction-tuning small vision-language backbones using 4-bit QLoRA and SFT.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t text-[11px] font-semibold" style={{ borderColor: 'var(--border-subtle)', color: 'var(--accent-purple)' }}>
                  Structured reasoning
                </div>
              </div>

              {/* Level 3 */}
              <div className="bento-card p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="pill-badge pill-emerald text-[10px]">Level 3</span>
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--accent-amber)' }}>Consultation</span>
                  </div>
                  <h4 className="text-sm font-bold mb-1" style={{ color: 'var(--text-main)' }}>
                    Multi-Agent Systems
                  </h4>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    MedAgents collaborative debate between Imaging, Lab, and Clinician specialist agents.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t text-[11px] font-semibold" style={{ borderColor: 'var(--border-subtle)', color: 'var(--accent-emerald)' }}>
                  Debate &amp; Consensus
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Right 4 Cols: Progress & Dynamic Course Resources */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Dynamic Progress Box */}
          <div className="bento-card p-5 space-y-3.5">
            
            {/* Header with Title and Week Navigation */}
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-extrabold" style={{ color: 'var(--text-main)' }}>
                    Progress
                  </h3>
                  <span className="pill-badge pill-blue text-[10px] font-mono">
                    {progressWeek === 'all' ? 'All Weeks' : `Week ${progressWeek}`}
                  </span>
                </div>
                <p className="text-[10px] text-muted">
                  {progressWeek === 'all' 
                    ? `Overall: ${completedTasks}/${totalTasks} (${completionRate}%)`
                    : `Lecture ${progressWeek}: ${currentWeekDone}/${currentWeekTasks.length} (${currentWeekPct}%)`}
                </p>
              </div>

              {/* Prev / Next Week Controls */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevWeek}
                  title="Previous Week"
                  className="p-1 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}
                >
                  <ChevronLeft className="w-3.5 h-3.5" style={{ color: 'var(--text-main)' }} />
                </button>

                <button
                  type="button"
                  onClick={() => setProgressWeek(prev => (prev === 'all' ? currentActiveLecture : 'all'))}
                  title="Toggle All Weeks vs Specific Week"
                  className="px-2 py-0.5 rounded-lg border text-[10px] font-bold transition-colors cursor-pointer"
                  style={{ 
                    borderColor: 'var(--border-subtle)', 
                    backgroundColor: progressWeek === 'all' ? 'var(--accent-blue)' : 'var(--bg-surface-elevated)',
                    color: progressWeek === 'all' ? '#ffffff' : 'var(--text-main)'
                  }}
                >
                  {progressWeek === 'all' ? 'All' : `W${progressWeek}`}
                </button>

                <button
                  type="button"
                  onClick={handleNextWeek}
                  title="Next Week"
                  className="p-1 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}
                >
                  <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--text-main)' }} />
                </button>
              </div>
            </div>

            {/* Overall Week Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{ 
                    width: `${progressWeek === 'all' ? completionRate : currentWeekPct}%`, 
                    backgroundColor: 'var(--accent-emerald)' 
                  }}
                />
              </div>
            </div>

            {/* Member Rows */}
            <div className="space-y-2">
              {members.map((member) => {
                const memberWeekTasks = currentWeekTasks.filter(t => 
                  Array.isArray(t.assigneeIds) ? t.assigneeIds.includes(member.id) : t.assigneeId === member.id
                );
                const memberDone = memberWeekTasks.filter(t => t.status === 'Done').length;
                const memberPct = memberWeekTasks.length > 0 ? Math.round((memberDone / memberWeekTasks.length) * 100) : 0;
                const shortName = getMemberShortName(member.name);

                return (
                  <Link
                    key={member.id}
                    href={`/members/${member.id}`}
                    className="block p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div 
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                          style={{ backgroundColor: member.avatarBg }}
                        >
                          {member.initials}
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-extrabold" style={{ color: 'var(--text-main)' }}>
                            {shortName}
                          </span>
                          <span className="text-[10px] text-muted truncate hidden sm:inline">
                            ({member.name})
                          </span>
                        </div>
                      </div>
                      <span className="font-semibold text-xs shrink-0 ml-2" style={{ color: 'var(--text-muted)' }}>
                        {memberDone}/{memberWeekTasks.length} ({memberPct}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${memberPct}%`, backgroundColor: member.avatarBg }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Bottom Footer */}
            <div className="pt-2 border-t flex items-center justify-between text-[11px]" style={{ borderColor: 'var(--border-subtle)' }}>
              <span className="text-muted">
                {progressWeek === 'all' ? 'All 16 Course Sessions' : `Lecture ${progressWeek} Deliverables`}
              </span>
              <Link href="/members" className="font-bold hover:underline" style={{ color: 'var(--accent-blue)' }}>
                Directory &rarr;
              </Link>
            </div>
          </div>

          {/* DYNAMIC Course Resources Box */}
          <div className="bento-card p-5">
            <h3 className="text-sm font-extrabold mb-1" style={{ color: 'var(--text-main)' }}>
              Dynamic Course Hub
            </h3>
            <p className="text-[11px] mb-3" style={{ color: 'var(--text-faint)' }}>
              Real-time shortcuts synced with active semester sessions.
            </p>

            <div className="space-y-2">
              
              {/* Dynamic Link 1: Active Lecture Dossier */}
              <Link
                href={`/lectures/${currentActiveLecture}`}
                className="flex items-center justify-between p-2.5 rounded-xl border hover:opacity-80 transition-all text-xs font-bold"
                style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
                  <div className="truncate">
                    <span className="block truncate">Lecture {currentActiveLecture} Active Dossier</span>
                    <span className="text-[10px] font-normal block text-muted">Tasks &amp; Clinical Briefing</span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted shrink-0" />
              </Link>

              {/* Dynamic Link 2: Materials Drive with file count */}
              <Link
                href="/materials"
                className="flex items-center justify-between p-2.5 rounded-xl border hover:opacity-80 transition-all text-xs font-bold"
                style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Folder className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="truncate">
                    <span className="block truncate">Course Materials Drive</span>
                    <span className="text-[10px] font-normal block text-muted">{driveFolders.length} Folders • {totalFiles} Documents</span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted shrink-0" />
              </Link>

              {/* Dynamic Link 3: 16-Week Curriculum */}
              <Link
                href="/lectures"
                className="flex items-center justify-between p-2.5 rounded-xl border hover:opacity-80 transition-all text-xs font-bold"
                style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Clock className="w-4 h-4 text-purple-500 shrink-0" />
                  <div className="truncate">
                    <span className="block truncate">16-Week Semester Roadmap</span>
                    <span className="text-[10px] font-normal block text-muted">Syllabus &amp; Milestones</span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted shrink-0" />
              </Link>

              {/* Dynamic Link 4: Tasks Board by Lecture */}
              <Link
                href="/tasks"
                className="flex items-center justify-between p-2.5 rounded-xl border hover:opacity-80 transition-all text-xs font-bold"
                style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Activity className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="truncate">
                    <span className="block truncate">Kanban Deliverables Board</span>
                    <span className="text-[10px] font-normal block text-muted">{tasks.length} tasks • Drag &amp; Drop</span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted shrink-0" />
              </Link>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
