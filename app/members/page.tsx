'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useProject } from '@/context/ProjectContext';
import { useAuth } from '@/context/AuthContext';
import { Member, getMemberShortName, isTaskDoneForMember } from '@/types';
import { 
  Users, 
  Plus, 
  Mail, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Edit3, 
  Trash2, 
  X,
  Code,
  Sparkles,
  FileText,
  Users2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const AVATAR_COLORS = [
  '#2563eb', // Blue
  '#059669', // Emerald
  '#7c3aed', // Purple
  '#d97706', // Amber
  '#0891b2', // Cyan
  '#be123c', // Rose
  '#4f46e5', // Indigo
  '#0f766e', // Teal
];

export default function MembersPage() {
  const { 
    members, 
    tasks, 
    addMember, 
    updateMember, 
    deleteMember, 
    getMemberLectureNote, 
    setMemberLectureNote 
  } = useProject();
  const { user, loading, canEditNote, isTeamLeader } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

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

  // Central Notes Hub state (1 note per lecture per member)
  const [selectedNoteLecture, setSelectedNoteLecture] = useState<number>(1);
  const [editingNoteMemberId, setEditingNoteMemberId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState<string>('');
  const [noteSaveNotice, setNoteSaveNotice] = useState<boolean>(false);

  // Global & Individual Member Progress Week Navigation
  const [rosterWeek, setRosterWeek] = useState<number | 'all'>(1);
  const [memberWeeks, setMemberWeeks] = useState<Record<string, number | 'all'>>({});
  const TOTAL_WEEKS = 16;

  const getMemberWeek = (memberId: string): number | 'all' => {
    return memberWeeks[memberId] !== undefined ? memberWeeks[memberId] : rosterWeek;
  };

  const handlePrevMemberWeek = (memberId: string) => {
    const current = getMemberWeek(memberId);
    let next: number | 'all';
    if (current === 'all') {
      next = TOTAL_WEEKS;
    } else if (current > 1) {
      next = current - 1;
    } else {
      next = 'all';
    }
    setMemberWeeks(prev => ({ ...prev, [memberId]: next }));
  };

  const handleNextMemberWeek = (memberId: string) => {
    const current = getMemberWeek(memberId);
    let next: number | 'all';
    if (current === 'all') {
      next = 1;
    } else if (current < TOTAL_WEEKS) {
      next = current + 1;
    } else {
      next = 'all';
    }
    setMemberWeeks(prev => ({ ...prev, [memberId]: next }));
  };

  const handleToggleMemberWeek = (memberId: string) => {
    const current = getMemberWeek(memberId);
    setMemberWeeks(prev => ({ 
      ...prev, 
      [memberId]: current === 'all' ? (rosterWeek === 'all' ? 1 : rosterWeek) : 'all' 
    }));
  };

  const handleSetGlobalWeek = (week: number | 'all') => {
    setRosterWeek(week);
    setMemberWeeks({});
  };

  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    role: '',
    email: '',
    avatarBg: AVATAR_COLORS[0],
    initials: '',
    bio: '',
    skillsString: '',
    isTeamLeader: false,
  });

  const openCreateModal = () => {
    setEditingMemberId(null);
    setFormData({
      name: '',
      studentId: '',
      role: '',
      email: '',
      avatarBg: AVATAR_COLORS[members.length % AVATAR_COLORS.length],
      initials: '',
      bio: '',
      skillsString: '',
      isTeamLeader: false,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (member: Member) => {
    setEditingMemberId(member.id);
    setFormData({
      name: member.name,
      studentId: member.studentId || '',
      role: member.role,
      email: member.email,
      avatarBg: member.avatarBg,
      initials: member.initials,
      bio: member.bio,
      skillsString: member.skills.join(', '),
      isTeamLeader: Boolean(member.isTeamLeader),
    });
    setIsModalOpen(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const initials = formData.initials.trim() || 
      formData.name.trim().split(/\s+/).map(n => n[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();

    const skills = formData.skillsString
      ? formData.skillsString.split(',').map(s => s.trim()).filter(Boolean)
      : ['AI', 'Engineering'];

    if (editingMemberId) {
      const existing = members.find(m => m.id === editingMemberId);
      if (existing) {
        updateMember({
          ...existing,
          name: formData.name,
          studentId: formData.studentId.trim() || undefined,
          role: formData.role,
          email: formData.email,
          avatarBg: formData.avatarBg,
          initials,
          bio: formData.bio,
          skills,
          isTeamLeader: formData.isTeamLeader,
        });
      }
    } else {
      addMember({
        name: formData.name,
        studentId: formData.studentId.trim() || undefined,
        role: formData.role,
        email: formData.email,
        avatarBg: formData.avatarBg,
        initials,
        bio: formData.bio,
        skills,
        isTeamLeader: formData.isTeamLeader,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-main)' }}>
            Team Roster &amp; Specialists
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Each member has their own dedicated portal to track weekly progress notes and assigned deliverables.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Global Progress Scope Navigator */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl border bg-slate-50 dark:bg-slate-900/60" style={{ borderColor: 'var(--border-subtle)' }}>
            <span className="text-xs font-semibold px-2" style={{ color: 'var(--text-faint)' }}>
              Progress Scope:
            </span>
            <button
              type="button"
              onClick={() => {
                if (rosterWeek === 'all') handleSetGlobalWeek(TOTAL_WEEKS);
                else if (rosterWeek > 1) handleSetGlobalWeek(rosterWeek - 1);
                else handleSetGlobalWeek('all');
              }}
              className="p-1 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}
              title="Previous Week"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleSetGlobalWeek(rosterWeek === 'all' ? 1 : 'all')}
              className="px-2.5 py-1 rounded-lg border text-xs font-bold cursor-pointer transition-all"
              style={{
                backgroundColor: rosterWeek === 'all' ? 'var(--accent-blue)' : 'var(--bg-surface-elevated)',
                color: rosterWeek === 'all' ? '#ffffff' : 'var(--text-main)',
                borderColor: 'var(--border-subtle)'
              }}
              title="Toggle All Weeks vs Specific Week"
            >
              {rosterWeek === 'all' ? 'All 16 Weeks' : `Week ${rosterWeek}`}
            </button>
            <button
              type="button"
              onClick={() => {
                if (rosterWeek === 'all') handleSetGlobalWeek(1);
                else if (rosterWeek < TOTAL_WEEKS) handleSetGlobalWeek(rosterWeek + 1);
                else handleSetGlobalWeek('all');
              }}
              className="p-1 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}
              title="Next Week"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Roster Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {members.map(member => {
          const mWeek = getMemberWeek(member.id);
          const memberTasks = tasks.filter(t => {
            const isAssigned = Array.isArray(t.assigneeIds) ? t.assigneeIds.includes(member.id) : t.assigneeId === member.id;
            if (!isAssigned) return false;
            if (mWeek === 'all') return true;
            return (t.lectureId || t.week || 1) === mWeek;
          });
          const doneTasks = memberTasks.filter(t => isTaskDoneForMember(t, member.id)).length;
          const pct = memberTasks.length > 0 ? Math.round((doneTasks / memberTasks.length) * 100) : 0;
          const shortName = getMemberShortName(member.name);

          return (
            <div
              key={member.id}
              className="bento-card p-5 flex flex-col justify-between group"
            >
              <div>
                {/* Top Strip */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold text-white text-sm shadow-sm shrink-0"
                      style={{ backgroundColor: member.avatarBg }}
                    >
                      {member.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-extrabold text-sm" style={{ color: 'var(--text-main)' }}>
                          {member.name}
                        </h3>
                        {member.isTeamLeader && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                            ★ Team Leader
                          </span>
                        )}
                        {member.studentId && (
                          <span 
                            className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md border" 
                            style={{ 
                              borderColor: 'var(--border-subtle)', 
                              backgroundColor: 'var(--bg-surface-elevated)', 
                              color: 'var(--text-muted)' 
                            }}
                          >
                            {member.studentId}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--accent-blue)' }}>
                        {member.role}
                      </p>
                    </div>
                  </div>

                  {/* Actions Dropdown / Buttons */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(member)}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Edit Member"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-muted" />
                    </button>
                    {isTeamLeader && members.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`Remove member "${member.name}"? Tasks assigned to them will be unassigned.`)) {
                            deleteMember(member.id);
                          }
                        }}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-500"
                        title="Remove Member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Bio */}
                <p className="text-xs leading-relaxed line-clamp-2 mb-4" style={{ color: 'var(--text-muted)' }}>
                  {member.bio}
                </p>

                {/* Skills Pills */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {member.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md border"
                      style={{ 
                        borderColor: 'var(--border-subtle)', 
                        backgroundColor: 'var(--bg-surface-elevated)', 
                        color: 'var(--text-faint)' 
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Progress & Portal Link */}
              <div className="pt-3 border-t space-y-3" style={{ borderColor: 'var(--border-subtle)' }}>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span style={{ color: 'var(--text-faint)' }}>Progress</span>

                      {/* Card Week Navigator */}
                      <div className="inline-flex items-center gap-0.5 rounded-lg p-0.5 border" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePrevMemberWeek(member.id);
                          }}
                          className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                          title="Previous Week"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleToggleMemberWeek(member.id);
                          }}
                          className="px-1.5 py-0.2 rounded text-[10px] font-bold font-mono transition-colors cursor-pointer"
                          style={{
                            backgroundColor: mWeek === 'all' ? 'var(--accent-blue)' : 'transparent',
                            color: mWeek === 'all' ? '#ffffff' : 'var(--text-main)'
                          }}
                          title="Toggle All vs Week"
                        >
                          {mWeek === 'all' ? 'All' : `W${mWeek}`}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleNextMemberWeek(member.id);
                          }}
                          className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                          title="Next Week"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <span style={{ color: 'var(--text-main)' }}>
                      {doneTasks} of {memberTasks.length} ({pct}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: member.avatarBg }}
                    />
                  </div>
                </div>

                <Link
                  href={`/members/${member.id}`}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold border hover:opacity-90 transition-all"
                  style={{ 
                    borderColor: 'var(--border-strong)', 
                    backgroundColor: 'var(--bg-surface-elevated)', 
                    color: 'var(--text-main)' 
                  }}
                >
                  <span>Open {shortName}&apos;s Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" style={{ color: 'var(--accent-blue)' }} />
                </Link>
              </div>

            </div>
          );
        })}
      </div>

      {/* Central Weekly Continuous Assessment Notes Hub (1 Note Per Lecture Per Member) */}
      <div className="bento-card p-5 sm:p-6 space-y-5">
        
        {/* Hub Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold" style={{ color: 'var(--text-main)' }}>
                  Team Weekly Continuous Assessment Notes Hub
                </h2>
                <span className="pill-badge pill-purple text-[10px]">
                  30% Assessment Weight
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                1 note per lecture session (1 to 16) for each member. Cross-inspect all teammates&apos; weekly progress logs and clinical findings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold shrink-0">
            <span style={{ color: 'var(--text-faint)' }}>Status for Lecture {selectedNoteLecture}:</span>
            <span className="pill-badge pill-blue text-[11px] font-mono">
              {members.filter(m => Boolean(getMemberLectureNote(m.id, selectedNoteLecture).trim())).length} / {members.length} Logged
            </span>
          </div>
        </div>

        {/* Minimal Lecture Session Strip (1 to 16) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold" style={{ color: 'var(--text-faint)' }}>
              SELECT LECTURE SESSION TO INSPECT ALL TEAM NOTES:
            </span>
            <span className="font-mono text-[11px] text-muted">
              Session {selectedNoteLecture} of 16
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {Array.from({ length: 16 }, (_, i) => i + 1).map(lec => {
              const isSelected = selectedNoteLecture === lec;
              const count = members.filter(m => Boolean(getMemberLectureNote(m.id, lec).trim())).length;

              return (
                <button
                  key={lec}
                  type="button"
                  onClick={() => setSelectedNoteLecture(lec)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 border ${
                    isSelected
                      ? 'shadow-xs text-white'
                      : 'hover:border-purple-400 opacity-80 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: isSelected ? 'var(--accent-purple)' : 'var(--bg-surface-elevated)',
                    borderColor: isSelected ? 'transparent' : 'var(--border-subtle)',
                    color: isSelected ? '#ffffff' : 'var(--text-main)'
                  }}
                >
                  <span>Lecture {lec}</span>
                  {count > 0 && (
                    <span 
                      className={`text-[10px] px-1 py-0.2 rounded-full font-mono ${
                        isSelected 
                          ? 'bg-white/20 text-white' 
                          : 'bg-purple-100 dark:bg-purple-950/60 text-purple-600'
                      }`}
                    >
                      {count}/5
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5 Members Notes Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(member => {
            const note = getMemberLectureNote(member.id, selectedNoteLecture);
            const hasNote = Boolean(note.trim());

            return (
              <div
                key={member.id}
                className="p-4 rounded-2xl border flex flex-col justify-between transition-all hover:border-slate-300 dark:hover:border-slate-700"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-subtle)'
                }}
              >
                <div>
                  {/* Member Meta */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b mb-3" style={{ borderColor: 'var(--border-subtle)' }}>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: member.avatarBg }}
                      >
                        {member.initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-extrabold text-xs" style={{ color: 'var(--text-main)' }}>
                            {member.name}
                          </h4>
                          {member.studentId && (
                            <span 
                              className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded border"
                              style={{ 
                                borderColor: 'var(--border-subtle)', 
                                backgroundColor: 'var(--bg-surface)', 
                                color: 'var(--text-muted)' 
                              }}
                            >
                              {member.studentId}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] block font-medium" style={{ color: 'var(--accent-blue)' }}>
                          {member.role}
                        </span>
                      </div>
                    </div>

                    {hasNote ? (
                      <span className="pill-badge pill-emerald text-[10px] shrink-0">
                        Logged
                      </span>
                    ) : (
                      <span className="pill-badge pill-amber text-[10px] shrink-0">
                        Pending
                      </span>
                    )}
                  </div>

                  {/* Note Body */}
                  {hasNote ? (
                    <div className="text-xs leading-relaxed whitespace-pre-wrap font-normal max-h-48 overflow-y-auto pr-1" style={{ color: 'var(--text-main)' }}>
                      {note}
                    </div>
                  ) : (
                    <div className="py-6 text-center space-y-1">
                      <Clock className="w-5 h-5 mx-auto text-amber-500/70" />
                      <p className="text-xs italic" style={{ color: 'var(--text-faint)' }}>
                        No notes logged for Lecture {selectedNoteLecture} yet.
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t mt-4 flex items-center justify-between gap-2 text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
                  {canEditNote(member.id) ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNoteMemberId(member.id);
                        setEditingNoteText(note);
                      }}
                      className="inline-flex items-center gap-1 font-bold text-xs hover:underline cursor-pointer"
                      style={{ color: 'var(--accent-purple)' }}
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{hasNote ? 'Edit Note' : '+ Write Note'}</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <span>🔒</span>
                      <span>Read-only</span>
                    </span>
                  )}

                  <Link
                    href={`/members/${member.id}`}
                    className="inline-flex items-center gap-1 font-bold text-xs hover:underline"
                    style={{ color: 'var(--accent-blue)' }}
                  >
                    <span>Member Portal</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Note Editor Modal */}
      {editingNoteMemberId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div
            className="bento-card w-full max-w-lg p-6 shadow-2xl space-y-4"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <h3 className="text-base font-extrabold" style={{ color: 'var(--text-main)' }}>
                  Edit Lecture {selectedNoteLecture} Note
                </h3>
                <p className="text-xs text-muted">
                  For {members.find(m => m.id === editingNoteMemberId)?.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingNoteMemberId(null)}
                className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              rows={8}
              value={editingNoteText}
              onChange={(e) => setEditingNoteText(e.target.value)}
              placeholder="Log accomplishments, findings, and blockers for this lecture..."
              className="w-full p-3.5 rounded-xl text-xs border focus:outline-none leading-relaxed font-sans"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text-main)'
              }}
            />

            <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              {noteSaveNotice ? (
                <span className="text-xs font-bold text-emerald-500 animate-pulse">
                  ✓ Saved successfully!
                </span>
              ) : (
                <span className="text-[11px] text-muted">
                  Persisted to project workspace storage
                </span>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingNoteMemberId(null)}
                  className="px-3.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer"
                  style={{ borderColor: 'var(--border-strong)', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-main)' }}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (editingNoteMemberId) {
                      setMemberLectureNote(editingNoteMemberId, selectedNoteLecture, editingNoteText);
                      setNoteSaveNotice(true);
                      setTimeout(() => {
                        setNoteSaveNotice(false);
                        setEditingNoteMemberId(null);
                      }, 800);
                    }
                  }}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all cursor-pointer"
                  style={{ backgroundColor: 'var(--accent-purple)' }}
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div 
            className="bento-card w-full max-w-md p-6 shadow-2xl space-y-4"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>
                {editingMemberId ? 'Edit Team Member' : 'Add New Team Member'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1" style={{ color: 'var(--text-main)' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Min Duc"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none"
                  style={{ 
                    borderColor: 'var(--border-strong)', 
                    backgroundColor: 'var(--bg-surface-subtle)',
                    color: 'var(--text-main)'
                  }}
                />
              </div>

              <div>
                <label className="block font-bold mb-1" style={{ color: 'var(--text-main)' }}>
                  Student ID (VGU)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10423057"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none font-mono"
                  style={{ 
                    borderColor: 'var(--border-strong)', 
                    backgroundColor: 'var(--bg-surface-subtle)',
                    color: 'var(--text-main)'
                  }}
                />
              </div>

              <div>
                <label className="block font-bold mb-1" style={{ color: 'var(--text-main)' }}>
                  Role / Specialization *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LightRAG & Knowledge Graph Specialist"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none"
                  style={{ 
                    borderColor: 'var(--border-strong)', 
                    backgroundColor: 'var(--bg-surface-subtle)',
                    color: 'var(--text-main)'
                  }}
                />
              </div>

              <div>
                <label className="block font-bold mb-1" style={{ color: 'var(--text-main)' }}>
                  VGU Email
                </label>
                <input
                  type="email"
                  placeholder="student.vgu.edu.vn"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none"
                  style={{ 
                    borderColor: 'var(--border-strong)', 
                    backgroundColor: 'var(--bg-surface-subtle)',
                    color: 'var(--text-main)'
                  }}
                />
              </div>

              <div>
                <label className="block font-bold mb-1" style={{ color: 'var(--text-main)' }}>
                  Short Bio / Responsibilities
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief description of project duties..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none"
                  style={{ 
                    borderColor: 'var(--border-strong)', 
                    backgroundColor: 'var(--bg-surface-subtle)',
                    color: 'var(--text-main)'
                  }}
                />
              </div>

              <div>
                <label className="block font-bold mb-1" style={{ color: 'var(--text-main)' }}>
                  Key Skills (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="PyTorch, Docker, LoRA, OpenCV"
                  value={formData.skillsString}
                  onChange={(e) => setFormData({ ...formData, skillsString: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none"
                  style={{ 
                    borderColor: 'var(--border-strong)', 
                    backgroundColor: 'var(--bg-surface-subtle)',
                    color: 'var(--text-main)'
                  }}
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg border bg-slate-50 dark:bg-slate-900/40" style={{ borderColor: 'var(--border-subtle)' }}>
                <input
                  type="checkbox"
                  id="modalIsTeamLeader"
                  checked={formData.isTeamLeader}
                  onChange={(e) => setFormData({ ...formData, isTeamLeader: e.target.checked })}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="modalIsTeamLeader" className="text-xs font-bold cursor-pointer" style={{ color: 'var(--text-main)' }}>
                  Designate as Team Leader
                </label>
              </div>

              <div>
                <label className="block font-bold mb-1" style={{ color: 'var(--text-main)' }}>
                  Avatar Accent Color
                </label>
                <div className="flex items-center gap-2">
                  {AVATAR_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, avatarBg: color })}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        formData.avatarBg === color ? 'scale-125 ring-2 ring-blue-500' : 'opacity-80'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border font-semibold hover:opacity-80"
                  style={{ borderColor: 'var(--border-strong)', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-main)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-white font-bold hover:opacity-90"
                  style={{ backgroundColor: 'var(--accent-blue)' }}
                >
                  {editingMemberId ? 'Update Member' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
