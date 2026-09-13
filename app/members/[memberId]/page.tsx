'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProject } from '@/context/ProjectContext';
import { useAuth } from '@/context/AuthContext';
import { Task, TaskStatus, Priority, isTaskDoneForMember, getTaskMemberStatus, stripHtml, hasNoteContent, Member } from '@/types';
import { LectureDial } from '@/components/LectureDial';
import { KanbanBoard } from '@/components/KanbanBoard';
import { TaskTableView } from '@/components/TaskTableView';
import { NoteTabEditor } from '@/components/NoteTabEditor';
import { renderAllMermaidDiagrams } from '@/lib/mermaid';
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search, 
  List, 
  Columns, 
  Edit3, 
  Trash2, 
  Save, 
  Sparkles, 
  Mail, 
  Phone, 
  X,
  Zap,
  Users2,
  BookOpen,
  FileText,
  Link as LinkIcon
} from 'lucide-react';

const STATUSES: TaskStatus[] = ['Backlog', 'In Progress', 'Review', 'Done'];
const PRIORITIES: Priority[] = ['High', 'Medium', 'Low'];
const TOTAL_LECTURES = 16;

export default function MemberDetailPage({ params }: { params: Promise<{ memberId: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const { 
    members, 
    tasks, 
    memberNotes, 
    setMemberNote, 
    setMemberLectureNote, 
    getMemberLectureNote, 
    getMemberLectureNoteDoc,
    addTask, 
    updateTask, 
    deleteTask,
    setMemberTaskStatus
  } = useProject();
  const { canEditNote, user, loading } = useAuth();

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

  const decodedParam = decodeURIComponent(unwrappedParams.memberId).toLowerCase();
  const member = members.find(m => 
    m.id === unwrappedParams.memberId ||
    m.studentId === unwrappedParams.memberId ||
    (m.name && m.name.toLowerCase().includes(decodedParam)) ||
    (m.email && m.email.toLowerCase().includes(decodedParam))
  );

  const [selectedLecture, setSelectedLecture] = useState<number | 'all'>(1);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'done'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Notes state
  const [activeNoteLecture, setActiveNoteLecture] = useState<number>(1);
  const [notesViewMode, setNotesViewMode] = useState<'my' | 'team'>('my');

  // Modal State for Task Create/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    assigneeIds: [] as string[],
    lectureId: 1,
    priority: 'High' as Priority,
    status: 'In Progress' as TaskStatus,
    dueDate: new Date().toISOString().split('T')[0]
  });

  // Sync activeNoteLecture when selectedLecture changes (if numeric)
  React.useEffect(() => {
    if (typeof selectedLecture === 'number') {
      setActiveNoteLecture(selectedLecture);
    }
  }, [selectedLecture]);

  if (!member) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-main)' }}>Member Not Found</h2>
        <p className="text-sm text-muted">This member profile does not exist or has been removed.</p>
        <Link href="/members" className="inline-flex items-center gap-1 text-xs font-bold hover:underline" style={{ color: 'var(--accent-blue)' }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Team Roster
        </Link>
      </div>
    );
  }

  // Filter tasks assigned to this member (individual or team)
  const memberTasks = tasks.filter(t => 
    Array.isArray(t.assigneeIds) ? t.assigneeIds.includes(member.id) : t.assigneeId === member.id
  );

  const doneTasks = memberTasks.filter(t => isTaskDoneForMember(t, member.id));
  const activeTasks = memberTasks.filter(t => getTaskMemberStatus(t, member.id) === 'In Progress');
  const pct = memberTasks.length > 0 ? Math.round((doneTasks.length / memberTasks.length) * 100) : 0;

  // Tasks scoped to current lecture selection
  const memberLectureScopeTasks = memberTasks.filter(task => {
    const taskLecture = task.lectureId || task.week || 1;
    return selectedLecture === 'all' || taskLecture === selectedLecture;
  });

  const totalMemberLectureAll = memberLectureScopeTasks.length;
  const totalMemberLectureNew = memberLectureScopeTasks.filter(t => !isTaskDoneForMember(t, member.id)).length;
  const totalMemberLectureDone = memberLectureScopeTasks.filter(t => isTaskDoneForMember(t, member.id)).length;

  // Filtered tasks for the active view
  const filteredMemberTasks = memberLectureScopeTasks.filter(task => {
    const isDone = isTaskDoneForMember(task, member.id);
    if (statusFilter === 'new' && isDone) return false;
    if (statusFilter === 'done' && !isDone) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = (task.description || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  const openCreateModal = (defaultStatus: TaskStatus = 'In Progress') => {
    setEditingTaskId(null);
    setFormData({
      title: '',
      description: '',
      link: '',
      assigneeIds: [member.id],
      lectureId: selectedLecture === 'all' ? 1 : selectedLecture,
      priority: 'High',
      status: defaultStatus,
      dueDate: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTaskId(task.id);
    setFormData({
      title: task.title,
      description: task.description,
      link: task.link || '',
      assigneeIds: Array.isArray(task.assigneeIds) ? task.assigneeIds : (task.assigneeId ? [task.assigneeId] : [member.id]),
      lectureId: task.lectureId || task.week || 1,
      priority: task.priority,
      status: getTaskMemberStatus(task, member.id),
      dueDate: task.dueDate
    });
    setIsModalOpen(true);
  };

  const toggleAssignee = (mId: string) => {
    setFormData(prev => {
      const exists = prev.assigneeIds.includes(mId);
      return {
        ...prev,
        assigneeIds: exists 
          ? prev.assigneeIds.filter(id => id !== mId) 
          : [...prev.assigneeIds, mId]
      };
    });
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const trimmedLink = formData.link.trim() || undefined;

    if (editingTaskId) {
      const existing = tasks.find(t => t.id === editingTaskId);
      if (existing) {
        const memberStatuses = existing.memberStatuses ? { ...existing.memberStatuses } : {};
        memberStatuses[member.id] = formData.status;
        updateTask({
          ...existing,
          ...formData,
          link: trimmedLink,
          memberStatuses
        });
      }
    } else {
      addTask({
        ...formData,
        link: trimmedLink
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">

      {/* Navigation Breadcrumb & Member Switcher */}
      <div className="flex items-center justify-between">
        <Link 
          href="/members" 
          className="inline-flex items-center gap-1.5 text-xs font-bold hover:underline"
          style={{ color: 'var(--accent-blue)' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Team Roster
        </Link>

        {/* Quick Member Switcher */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-semibold" style={{ color: 'var(--text-faint)' }}>Switch Portal:</span>
          <select
            value={member.id}
            onChange={(e) => router.push(`/members/${e.target.value}`)}
            className="px-2 py-1 rounded-lg border text-xs font-bold focus:outline-none cursor-pointer"
            style={{ 
              borderColor: 'var(--border-strong)', 
              backgroundColor: 'var(--bg-surface-elevated)',
              color: 'var(--text-main)'
            }}
          >
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Member Header Bento */}
      <div className="bento-card p-6 border-l-4" style={{ borderLeftColor: member.avatarBg }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center font-extrabold text-white text-xl shadow-md shrink-0"
              style={{ backgroundColor: member.avatarBg }}
            >
              {member.initials}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold" style={{ color: 'var(--text-main)' }}>
                  {member.name}
                </h1>
                {member.studentId && (
                  <span 
                    className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg border" 
                    style={{ 
                      borderColor: 'var(--border-subtle)', 
                      backgroundColor: 'var(--bg-surface-elevated)', 
                      color: 'var(--text-main)' 
                    }}
                  >
                    ID: {member.studentId}
                  </span>
                )}
                {member.isTeamLeader && (
                  <span className="pill-badge pill-amber text-[11px] font-bold">
                    ★ Team Leader
                  </span>
                )}
                <span className="pill-badge pill-blue text-[11px]">{member.role}</span>
              </div>
              <p className="text-xs mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
                {member.email}
              </p>
              <p className="text-xs mt-1.5 max-w-xl leading-relaxed" style={{ color: 'var(--text-faint)' }}>
                {member.bio}
              </p>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border shrink-0 text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
            <div>
              <span className="block font-bold text-lg" style={{ color: 'var(--accent-emerald)' }}>
                {doneTasks.length} / {memberTasks.length}
              </span>
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Tasks Done</span>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
            <div>
              <span className="block font-bold text-lg" style={{ color: 'var(--accent-blue)' }}>
                {pct}%
              </span>
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Progress</span>
            </div>
          </div>

        </div>
      </div>

      {/* Cyclic Horizontal Lecture Dial for Member Tasks */}
      <LectureDial
        selectedLecture={selectedLecture}
        onSelectLecture={setSelectedLecture}
        tasks={memberTasks}
        totalLectures={TOTAL_LECTURES}
      />

      {/* Assigned Tasks Board (Full Width 100%) */}
      <div className="space-y-3">
        
        {/* Header & Controls Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Segmented Status Tabs: All | New Tasks | Done Tasks */}
          <div className="inline-flex p-1 rounded-xl border self-start" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all' 
                  ? 'shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              style={{
                backgroundColor: statusFilter === 'all' ? 'var(--bg-surface-elevated)' : 'transparent',
                color: statusFilter === 'all' ? 'var(--text-main)' : undefined
              }}
            >
              All ({totalMemberLectureAll})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('new')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'new' 
                  ? 'shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              style={{
                backgroundColor: statusFilter === 'new' ? 'var(--bg-surface-elevated)' : 'transparent',
                color: statusFilter === 'new' ? 'var(--accent-blue)' : undefined
              }}
            >
              New Tasks ({totalMemberLectureNew})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('done')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'done' 
                  ? 'shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              style={{
                backgroundColor: statusFilter === 'done' ? 'var(--bg-surface-elevated)' : 'transparent',
                color: statusFilter === 'done' ? 'var(--accent-emerald)' : undefined
              }}
            >
              Done Tasks ({totalMemberLectureDone})
            </button>
          </div>

          {/* Search, Add Deliverable, & View Switcher */}
          <div className="flex flex-wrap items-center gap-2 flex-1 md:justify-end">
            {/* Search Box */}
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search deliverables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border focus:outline-none focus:ring-1"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-main)'
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => openCreateModal('In Progress')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 cursor-pointer shrink-0"
              style={{ backgroundColor: 'var(--accent-blue)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Deliverable</span>
            </button>

            {/* View Switcher */}
            <div className="flex items-center rounded-xl p-0.5 border shrink-0" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Table View (7 Columns)"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'table' ? 'shadow-xs' : 'opacity-60'}`}
                style={{
                  backgroundColor: viewMode === 'table' ? 'var(--bg-surface)' : 'transparent',
                  color: viewMode === 'table' ? 'var(--accent-blue)' : 'var(--text-muted)'
                }}
              >
                <List className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                title="Kanban Board View"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'kanban' ? 'shadow-xs' : 'opacity-60'}`}
                style={{
                  backgroundColor: viewMode === 'kanban' ? 'var(--bg-surface)' : 'transparent',
                  color: viewMode === 'kanban' ? 'var(--accent-blue)' : 'var(--text-muted)'
                }}
              >
                <Columns className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Full-width Table or Kanban Board */}
        {viewMode === 'table' ? (
          <TaskTableView
            tasks={filteredMemberTasks}
            members={members}
            onUpdateTask={updateTask}
            onEditTask={openEditModal}
            onDeleteTask={deleteTask}
            onUpdateMemberTaskStatus={setMemberTaskStatus}
            currentMemberId={member.id}
          />
        ) : (
          <KanbanBoard
            tasks={filteredMemberTasks}
            members={members}
            onUpdateTask={updateTask}
            onEditTask={openEditModal}
            onDeleteTask={deleteTask}
            onCreateTaskInStatus={openCreateModal}
            currentMemberId={member.id}
            onUpdateMemberTaskStatus={setMemberTaskStatus}
          />
        )}
      </div>

      {/* FULL-WIDTH TEAM & MEMBER LECTURE NOTES (MOVED DOWN) */}
      <div className="bento-card p-5 sm:p-6 space-y-5">
        
        {/* Header & Mode Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold" style={{ color: 'var(--text-main)' }}>
                  Continuous Assessment Demo Logs &amp; Progress Notes
                </h3>
                <span className="pill-badge pill-purple text-[10px]">
                  30% Grade Weight
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Multi-tab research notes and Google Docs editor for each lecture session (1 to {TOTAL_LECTURES}). Document technical benchmarks, clinical pipelines, and blockers.
              </p>
            </div>
          </div>

          {/* View Switcher: My Notes vs All Team Members' Notes */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl border shrink-0" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
            <button
              type="button"
              onClick={() => setNotesViewMode('my')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                notesViewMode === 'my' ? 'shadow-xs text-white' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: notesViewMode === 'my' ? 'var(--accent-purple)' : 'transparent',
                color: notesViewMode === 'my' ? '#ffffff' : 'var(--text-main)'
              }}
            >
              My Notes ({member.initials})
            </button>

            <button
              type="button"
              onClick={() => setNotesViewMode('team')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                notesViewMode === 'team' ? 'shadow-xs text-white' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: notesViewMode === 'team' ? 'var(--accent-blue)' : 'transparent',
                color: notesViewMode === 'team' ? '#ffffff' : 'var(--text-main)'
              }}
            >
              <Users2 className="w-3.5 h-3.5" />
              <span>All Team Notes ({members.length})</span>
            </button>
          </div>
        </div>

        {/* Minimal Lecture Session Strip (1 to 16) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold" style={{ color: 'var(--text-faint)' }}>
              SELECT LECTURE SESSION TO VIEW OR LOG:
            </span>
            <span className="font-mono text-[11px] text-muted">
              Lecture {activeNoteLecture} of {TOTAL_LECTURES}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {Array.from({ length: TOTAL_LECTURES }, (_, i) => i + 1).map(lec => {
              const isCurrent = activeNoteLecture === lec;
              const hasMyNote = hasNoteContent(getMemberLectureNoteDoc(member.id, lec));
              const teamNotesCount = members.filter(m => hasNoteContent(getMemberLectureNoteDoc(m.id, lec))).length;

              return (
                <button
                  key={lec}
                  type="button"
                  onClick={() => setActiveNoteLecture(lec)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 border ${
                    isCurrent
                      ? 'shadow-xs text-white'
                      : 'hover:border-purple-400 opacity-80 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: isCurrent 
                      ? (notesViewMode === 'my' ? 'var(--accent-purple)' : 'var(--accent-blue)')
                      : 'var(--bg-surface-elevated)',
                    borderColor: isCurrent ? 'transparent' : 'var(--border-subtle)',
                    color: isCurrent ? '#ffffff' : 'var(--text-main)'
                  }}
                >
                  <span>Lecture {lec}</span>
                  {notesViewMode === 'my' ? (
                    hasMyNote && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-white' : 'bg-emerald-500'}`} />
                    )
                  ) : (
                    teamNotesCount > 0 && (
                      <span className={`text-[10px] px-1 py-0.2 rounded-full font-mono ${isCurrent ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600'}`}>
                        {teamNotesCount}/5
                      </span>
                    )
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* View 1: My Personal Note Editor with Multi-Tabs & Google Docs toolbar */}
        {notesViewMode === 'my' ? (
          <div className="space-y-3 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold" style={{ color: 'var(--text-main)' }}>
                  {member.name} - Lecture {activeNoteLecture} Progress Notes
                </span>
                {member.studentId && (
                  <span className="text-[10px] font-mono text-muted">
                    (ID: {member.studentId})
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setNotesViewMode('team')}
                className="text-xs font-bold hover:underline cursor-pointer flex items-center gap-1"
                style={{ color: 'var(--accent-blue)' }}
              >
                <span>View Team Notes ({members.length}) &rarr;</span>
              </button>
            </div>

            <NoteTabEditor
              memberId={member.id}
              memberName={member.name}
              lectureId={activeNoteLecture}
              readOnly={!canEditNote(member.id)}
            />

            <div className="flex items-center justify-end pt-1">
              <button
                type="button"
                onClick={() => setNotesViewMode('team')}
                className="text-[11px] font-bold hover:underline cursor-pointer flex items-center gap-1"
                style={{ color: 'var(--accent-blue)' }}
              >
                <span>View What Teammates Wrote for Lecture {activeNoteLecture} &rarr;</span>
              </button>
            </div>
          </div>
        ) : (
          /* View 2: All Team Members' Multi-Tab Notes for activeNoteLecture */
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold block" style={{ color: 'var(--text-main)' }}>
                  All {members.length} Specialists' Progress Notes for Lecture {activeNoteLecture}
                </span>
                <span className="text-[11px] text-muted">
                  Browse tabs published by team members for continuous assessment review
                </span>
              </div>
              <button
                type="button"
                onClick={() => setNotesViewMode('my')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-elevated)] cursor-pointer"
                style={{ color: 'var(--text-main)' }}
              >
                Back to My Notes
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map(m => (
                <TeammateNoteCard
                  key={m.id}
                  member={m}
                  activeLecture={activeNoteLecture}
                  isMe={m.id === member.id}
                  onEdit={() => setNotesViewMode('my')}
                />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Task Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bento-card max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <h3 className="font-extrabold text-base" style={{ color: 'var(--text-main)' }}>
                {editingTaskId ? 'Edit Deliverable' : `New Deliverable for ${member.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-muted cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-strong)', color: 'var(--text-main)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-strong)', color: 'var(--text-main)' }}
                />
              </div>

              {/* Link */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>
                  Resource Link (URL, ArXiv, GitHub)
                </label>
                <div className="relative">
                  <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 rounded-xl text-xs border focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-strong)', color: 'var(--text-main)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>
                    Lecture
                  </label>
                  <select
                    value={formData.lectureId}
                    onChange={(e) => setFormData({ ...formData, lectureId: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 rounded-xl text-xs border font-semibold"
                    style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-strong)', color: 'var(--text-main)' }}
                  >
                    {Array.from({ length: TOTAL_LECTURES }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>Lecture {i + 1}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs border font-semibold"
                    style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-strong)', color: 'var(--text-main)' }}
                  />
                </div>
              </div>

              {/* Teammates Assignees */}
              <div className="p-3 rounded-xl border space-y-2" style={{ backgroundColor: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}>
                <span className="text-xs font-bold block" style={{ color: 'var(--text-main)' }}>
                  Collaborating Teammates ({formData.assigneeIds.length})
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {members.map(m => {
                    const isChecked = formData.assigneeIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleAssignee(m.id)}
                        className={`flex items-center gap-2 p-1.5 rounded-lg border text-left text-xs cursor-pointer ${isChecked ? 'ring-1 ring-blue-500' : 'opacity-70'}`}
                        style={{ backgroundColor: isChecked ? 'var(--accent-blue-soft)' : 'var(--bg-surface)', borderColor: isChecked ? 'var(--accent-blue)' : 'var(--border-subtle)' }}
                      >
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ backgroundColor: m.avatarBg }}>
                          {m.initials}
                        </div>
                        <span className="truncate font-bold" style={{ color: 'var(--text-main)' }}>{m.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                    className="w-full px-2 py-1.5 rounded-xl text-xs border font-semibold"
                    style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-strong)', color: 'var(--text-main)' }}
                  >
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>
                    Status
                  </label>
                  <select
                    value={formData.status === 'Done' ? 'Done' : 'In Progress'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                    className="w-full px-2 py-1.5 rounded-xl text-xs border font-semibold"
                    style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-strong)', color: 'var(--text-main)' }}
                  >
                    <option value="In Progress">New</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold border"
                  style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90"
                  style={{ backgroundColor: 'var(--accent-blue)' }}
                >
                  {editingTaskId ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function TeammateNoteCard({
  member,
  activeLecture,
  isMe,
  onEdit
}: {
  member: Member;
  activeLecture: number;
  isMe: boolean;
  onEdit: () => void;
}) {
  const { getMemberLectureNoteDoc } = useProject();
  const doc = getMemberLectureNoteDoc(member.id, activeLecture);
  const [selectedTabId, setSelectedTabId] = useState<string>(doc.activeTabId || (doc.tabs[0]?.id ?? 'tab-1'));

  React.useEffect(() => {
    if (doc.tabs.length > 0) {
      setSelectedTabId(doc.activeTabId || doc.tabs[0].id);
    }
  }, [doc.activeTabId, activeLecture]);

  const currentTab = doc.tabs.find(t => t.id === selectedTabId) || doc.tabs[0];
  const hasContent = currentTab && currentTab.content && stripHtml(currentTab.content).trim().length > 0;
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (contentRef.current) {
      renderAllMermaidDiagrams(contentRef.current);
    }
  }, [currentTab?.content, selectedTabId, activeLecture]);

  return (
    <div
      className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
        isMe 
          ? 'ring-2 ring-purple-500/40 shadow-xs' 
          : 'hover:border-slate-300 dark:hover:border-slate-700'
      }`}
      style={{
        backgroundColor: 'var(--bg-surface-elevated)',
        borderColor: 'var(--border-subtle)'
      }}
    >
      <div className="space-y-3">
        {/* Member Header */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-xs"
              style={{ backgroundColor: member.avatarBg }}
            >
              {member.initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-xs truncate" style={{ color: 'var(--text-main)' }}>
                  {member.name}
                </span>
                {isMe && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-600">
                    You
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono block text-muted">
                {member.studentId} • {member.role.split('&')[0].trim()}
              </span>
            </div>
          </div>

          {isMe && (
            <button
              type="button"
              onClick={onEdit}
              className="text-[11px] font-bold text-purple-600 hover:underline cursor-pointer shrink-0"
            >
              Edit
            </button>
          )}
        </div>

        {/* Tab Pills for this member */}
        {doc.tabs.length > 0 && (
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
            {doc.tabs.map((tab) => {
              const isTabActive = tab.id === currentTab?.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedTabId(tab.id)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 transition cursor-pointer ${
                    isTabActive
                      ? 'bg-[var(--accent-purple)] text-white shadow-xs'
                      : 'border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {tab.title}
                </button>
              );
            })}
          </div>
        )}

        {/* Tab Content Preview */}
        {hasContent ? (
          <div 
            ref={contentRef}
            className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] leading-relaxed max-h-60 overflow-y-auto editor-content font-normal"
            dangerouslySetInnerHTML={{ __html: currentTab.content }}
          />
        ) : (
          <div className="p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center text-xs italic text-[var(--text-faint)]">
            No notes recorded for Lecture {activeLecture} yet.
          </div>
        )}
      </div>

      <div className="pt-2 border-t mt-3 flex items-center justify-between text-[10px] text-muted" style={{ borderColor: 'var(--border-subtle)' }}>
        <span>{doc.tabs.length} Tabs active</span>
        <Link
          href={`/members/${member.id}`}
          className="hover:underline font-bold"
          style={{ color: 'var(--accent-blue)' }}
        >
          View Portal &rarr;
        </Link>
      </div>
    </div>
  );
}
