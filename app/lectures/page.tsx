'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LECTURE_SESSIONS } from '@/data/initialData';
import { BookOpen, Calendar, ArrowRight, FileText, CheckCircle2, Lock, Clock, Folder } from 'lucide-react';

export default function LecturesPage() {
  const [phaseFilter, setPhaseFilter] = useState<string>('all');

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
            <span className="pill-badge pill-emerald">Lecture 1 Active</span>
            <span className="pill-badge pill-amber">Lectures 2-16 Not Yet</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-main)' }}>
            16-Week Course Curriculum &amp; Lectures
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Semester roadmap for Dr. Tran Duc Khanh&apos;s 10-ECTS Project Course. Only completed lectures feature active dossiers and materials.
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

          return (
            <div
              key={lecture.week}
              className={`bento-card p-5 flex flex-col justify-between min-w-0 transition-all ${
                isWeek1 ? 'border-2 ring-1' : 'opacity-85'
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

                  {isWeek1 ? (
                    <span className="pill-badge pill-emerald text-[10px]">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Active
                    </span>
                  ) : (
                    <span className="pill-badge pill-amber text-[10px]">
                      <Clock className="w-2.5 h-2.5" /> Not yet
                    </span>
                  )}
                </div>

                {/* Folder Reference & Date */}
                <div className="flex items-center justify-between text-[11px] mb-2" style={{ color: 'var(--text-faint)' }}>
                  <span className="font-mono truncate max-w-[170px]" title={lecture.folderName}>
                    📁 {lecture.folderName}
                  </span>
                  <span className="font-mono shrink-0">
                    {lecture.date}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-sm mb-2 leading-snug" style={{ color: 'var(--text-main)' }}>
                  {lecture.title}
                </h3>

                {/* Summary / Status Description */}
                {isWeek1 ? (
                  <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
                    {lecture.summary}
                  </p>
                ) : (
                  <div className="p-3 rounded-xl mb-4 text-xs space-y-1 border border-dashed" style={{ backgroundColor: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}>
                    <span className="font-bold block" style={{ color: 'var(--accent-amber)' }}>
                      ⚠️ Session Not Yet Conducted
                    </span>
                    <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      This lecture is part of the upcoming curriculum. Briefings, slide decks, and tasks will be activated immediately following the session.
                    </p>
                  </div>
                )}

                {/* Lecture 1 Materials Shortcut */}
                {isWeek1 && lecture.materials && lecture.materials.length > 0 && (
                  <div className="space-y-1.5 mb-4">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider block" style={{ color: 'var(--text-faint)' }}>
                      Included Files ({lecture.materials.length}):
                    </span>
                    {lecture.materials.map((mat, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        <span className="truncate font-semibold">{mat.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Link Footer */}
              <div className="pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                {isWeek1 ? (
                  <Link
                    href="/lectures/1"
                    className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all cursor-pointer"
                    style={{ backgroundColor: 'var(--accent-blue)' }}
                  >
                    <span>Open Full Lecture 1 Dossier</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <div className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold opacity-60 border" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-faint)' }}>
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Content Not Yet Available
                    </span>
                    <span className="font-mono text-[10px]">Session {lecture.week}</span>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
