'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LECTURE_SESSIONS } from '@/data/initialData';
import { useProject } from '@/context/ProjectContext';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, Calendar, ArrowRight, FileText, CheckCircle2, Folder, CheckSquare, Layers } from 'lucide-react';

export default function LecturesPage() {
  const { driveFolders, tasks } = useProject();
  const { user, loading } = useAuth();
  const [phaseFilter, setPhaseFilter] = useState<string>('all');

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
          Checking access permissions...
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const filteredLectures = phaseFilter === 'all'
    ? LECTURE_SESSIONS
    : LECTURE_SESSIONS.filter(l => l.phase === phaseFilter);

  const getPhaseBadge = (phase: string) => {
    switch (phase) {
      case 'Data': return 'pill-amber';
      case 'Modeling': return 'pill-blue';
      case 'Agents': return 'pill-purple';
      case 'Evaluation': return 'pill-rose';
      case 'Delivery': return 'pill-emerald';
      default: return 'pill-cyan';
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="pill-badge pill-emerald">16 Weeks Unlocked</span>
            <span className="pill-badge pill-blue">Active Workspaces</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-main)' }}>
            16-Week Course Curriculum &amp; Lectures
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Semester roadmap for Dr. Tran Duc Khanh&apos;s 10-ECTS Project Course. Manage lecture files, sprint tasks, and dossiers across all weeks.
          </p>
        </div>

        <Link
          href="/materials"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border hover:opacity-80 transition-all cursor-pointer shrink-0"
          style={{ 
            borderColor: 'var(--border-strong)', 
            backgroundColor: 'var(--bg-surface-elevated)', 
            color: 'var(--text-main)' 
          }}
        >
          <Folder className="w-3.5 h-3.5 text-blue-500" />
          <span>Course Materials Drive</span>
        </Link>
      </div>

      {/* Phase Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="font-bold mr-1" style={{ color: 'var(--text-faint)' }}>Filter Phase:</span>
        {['all', 'Data', 'Modeling', 'Agents', 'Evaluation', 'Delivery'].map(phase => (
          <button
            key={phase}
            onClick={() => setPhaseFilter(phase)}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
              phaseFilter === phase
                ? 'shadow-xs text-white'
                : 'border hover:opacity-80'
            }`}
            style={{
              borderColor: phaseFilter === phase ? 'transparent' : 'var(--border-subtle)',
              backgroundColor: phaseFilter === phase ? 'var(--accent-blue)' : 'var(--bg-surface-elevated)',
              color: phaseFilter === phase ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            {phase.charAt(0).toUpperCase() + phase.slice(1)}
          </button>
        ))}
      </div>

      {/* Lecture Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredLectures.map((lecture) => {
          const isWeek1 = lecture.week === 1;
          const padNum = String(lecture.week).padStart(2, '0');
          const folder = driveFolders.find(f => f.lectureNumber === lecture.week || f.name.includes(`Lecture_${padNum}`));
          const fileCount = folder ? folder.files.length : (lecture.materials?.length || 0);
          const lectureTasks = tasks.filter(t => (t.lectureId || t.week || 1) === lecture.week);
          const taskCount = lectureTasks.length;

          return (
            <div
              key={lecture.week}
              className={`bento-card p-5 flex flex-col justify-between min-w-0 transition-all ${
                isWeek1 ? 'border-2 ring-1' : 'hover:border-blue-400/60'
              }`}
              style={{
                borderColor: isWeek1 ? 'var(--accent-blue)' : 'var(--border-subtle)'
              }}
            >
              <div>
                {/* Header: Week, Phase & Status */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-extrabold text-sm" style={{ color: 'var(--text-main)' }}>
                      Lecture {lecture.week}
                    </span>
                    <span className={`pill-badge text-[10px] ${getPhaseBadge(lecture.phase)}`}>
                      {lecture.phase}
                    </span>
                  </div>

                  {fileCount > 0 || isWeek1 ? (
                    <span className="pill-badge pill-emerald text-[10px]">
                      <CheckCircle2 className="w-2.5 h-2.5" /> {fileCount} Files
                    </span>
                  ) : (
                    <span className="pill-badge pill-blue text-[10px]">
                      <Folder className="w-2.5 h-2.5" /> Workspace
                    </span>
                  )}
                </div>

                {/* Folder Reference & Date */}
                <div className="flex items-center justify-between text-[11px] mb-2" style={{ color: 'var(--text-faint)' }}>
                  <span className="font-mono truncate max-w-[170px]" title={folder?.name || lecture.folderName}>
                    📁 {folder?.name || lecture.folderName}
                  </span>
                  <span className="font-mono shrink-0">
                    {folder?.date || lecture.date}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-sm mb-2 leading-snug" style={{ color: 'var(--text-main)' }}>
                  {lecture.title}
                </h3>

                {/* Summary */}
                <p className="text-xs leading-relaxed mb-4 line-clamp-3" style={{ color: 'var(--text-muted)' }}>
                  {lecture.summary}
                </p>

                {/* Badges preview: files & tasks count */}
                <div className="flex items-center gap-2 mb-4 text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                  <span className="inline-flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    {fileCount} {fileCount === 1 ? 'file' : 'files'}
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <CheckSquare className="w-3.5 h-3.5 text-purple-500" />
                    {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                  </span>
                </div>
              </div>

              {/* Action Link Footer */}
              <div className="pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <Link
                  href={`/lectures/${lecture.week}`}
                  className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all cursor-pointer"
                  style={{ backgroundColor: isWeek1 ? 'var(--accent-blue)' : '#4f46e5' }}
                >
                  <span>Open Lecture {lecture.week} Dossier &amp; Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
