'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProject } from '@/context/ProjectContext';
import { Task, TaskStatus, Priority, isTaskDoneForMember, getTaskMemberStatus } from '@/types';
import { LectureDial } from '@/components/LectureDial';
import { KanbanBoard } from '@/components/KanbanBoard';
import { TagManagerModal } from '@/components/TagManagerModal';
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
  Tag as TagIcon
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
    tags, 
    addTag, 
    setMemberNote, 
    setMemberLectureNote, 
    getMemberLectureNote, 
    addTask, 
    updateTask, 
    deleteTask,
    setMemberTaskStatus
  } = useProject();

  const member = members.find(m => m.id === unwrappedParams.memberId);

  // Scoped Lecture Dial state
  const [selectedLecture, setSelectedLecture] = useState<number | 'all'>(1);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

  // Notes state (1 note per lecture per member)
  const [activeNoteLecture, setActiveNoteLecture] = useState<number>(1);
  const [noteContent, setNoteContent] = useState<string>('');
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [notesViewMode, setNotesViewMode] = useState<'my' | 'team'>('my');

  // Available dynamic tags
  const allAvailableTags = Array.from(
    new Set([...tags, ...tasks.map(t => t.tag || t.pillar).filter(Boolean)])
  );

  // Modal State for Task Create/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isCreatingNewTag, setIsCreatingNewTag] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigneeIds: [] as string[],
    lectureId: 1,
    tag: 'Data Engineering',
    priority: 'High' as Priority,
    status: 'In Progress' as TaskStatus,
    dueDate: new Date().toISOString().split('T')[0]
  });

  // Keep note content in sync with member, activeNoteLecture, and memberNotes
  React.useEffect(() => {
    if (member) {
      setNoteContent(getMemberLectureNote(member.id, activeNoteLecture));
    }
  }, [member, activeNoteLecture, memberNotes]);

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

  // Filter by currently selected lecture
  const filteredMemberTasks = memberTasks.filter(task => {
    const taskLecture = task.lectureId || task.week || 1;
    return selectedLecture === 'all' || taskLecture === selectedLecture;
  });

  const handleSaveNote = () => {
    if (!member) return;
    setMemberLectureNote(member.id, activeNoteLecture, noteContent);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2500);
  };

  const handleConfirmNewTag = () => {
    const trimmed = customTagInput.trim();
    if (trimmed) {
      addTag(trimmed);
      setFormData(prev => ({ ...prev, tag: trimmed }));
      setCustomTagInput('');
      setIsCreatingNewTag(false);
    }
  };

  const openCreateModal = (defaultStatus: TaskStatus = 'In Progress') => {
    setEditingTaskId(null);
    setIsCreatingNewTag(false);
    setCustomTagInput('');
    setFormData({
      title: '',
      description: '',
      assigneeIds: [member.id],
      lectureId: selectedLecture === 'all' ? 1 : selectedLecture,
      tag: allAvailableTags[0] || 'Data Engineering',
      priority: 'High',
      status: defaultStatus,
      dueDate: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTaskId(task.id);
    setIsCreatingNewTag(false);
    setCustomTagInput('');
    setFormData({
      title: task.title,
      description: task.description,
      assigneeIds: Array.isArray(task.assigneeIds) ? task.assigneeIds : (task.assigneeId ? [task.assigneeId] : [member.id]),
      lectureId: task.lectureId || task.week || 1,
      tag: task.tag || task.pillar || 'Data Engineering',
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

    if (editingTaskId) {
      const existing = tasks.find(t => t.id === editingTaskId);
      if (existing) {
        const memberStatuses = existing.memberStatuses ? { ...existing.memberStatuses } : {};
        memberStatuses[member.id] = formData.status;
        updateTask({
          ...existing,
          ...formData,
          pillar: formData.tag,
          memberStatuses
        });
      }
    } else {
      addTask({
        ...formData,
        pillar: formData.tag
      });
    }
    setIsModalOpen(false);
  };

  const getTagBadgeClass = (tag?: string) => {
    if (!tag) return 'pill-cyan';
    switch (tag) {
      case 'RAG / KG': return 'pill-blue';
      case 'Fine-Tuning': return 'pill-purple';
      case 'Multi-Agents': return 'pill-emerald';
      case 'Data Engineering': return 'pill-amber';
      case 'DevOps / Report': return 'pill-rose';
      case 'Evaluation': return 'pill-purple';
      default: {
        const palette = ['pill-blue', 'pill-emerald', 'pill-purple', 'pill-amber', 'pill-rose', 'pill-cyan'];
        let hash = 0;
        for (let i = 0; i < tag.length; i++) {
          hash = tag.charCodeAt(i) + ((hash << 5) - hash);
        }
        return palette[Math.abs(hash) % palette.length];
      }
    }
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
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Assigned Deliverables ({filteredMemberTasks.length})</span>
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {selectedLecture === 'all' ? 'All sessions' : `Scoped to Lecture ${selectedLecture}`} • Drag cards to update status
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openCreateModal('In Progress')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: 'var(--accent-blue)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Deliverable</span>
            </button>

            {/* View Switcher */}
            <div className="flex items-center rounded-xl p-0.5 border" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
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
              <button
                type="button"
                onClick={() => setViewMode('list')}
                title="List Table View"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'list' ? 'shadow-xs' : 'opacity-60'}`}
                style={{
                  backgroundColor: viewMode === 'list' ? 'var(--bg-surface)' : 'transparent',
                  color: viewMode === 'list' ? 'var(--accent-blue)' : 'var(--text-muted)'
                }}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Full-width Kanban Board or List */}
        {viewMode === 'kanban' ? (
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
        ) : (
          <div className="bento-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
                    <th className="py-2.5 px-3 font-bold" style={{ color: 'var(--text-faint)' }}>Status</th>
                    <th className="py-2.5 px-3 font-bold" style={{ color: 'var(--text-faint)' }}>Task Title</th>
                    <th className="py-2.5 px-3 font-bold" style={{ color: 'var(--text-faint)' }}>Lecture</th>
                    <th className="py-2.5 px-3 font-bold" style={{ color: 'var(--text-faint)' }}>Tag</th>
                    <th className="py-2.5 px-3 font-bold" style={{ color: 'var(--text-faint)' }}>Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                  {filteredMemberTasks.map(task => {
                    const memberStatus = getTaskMemberStatus(task, member.id);
                    return (
                    <tr 
                      key={task.id}
                      onClick={() => openEditModal(task)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 px-3" onClick={e => e.stopPropagation()}>
                        <select
                          value={memberStatus}
                          onChange={(e) => setMemberTaskStatus(task.id, member.id, e.target.value as TaskStatus)}
                          className="text-xs font-bold py-0.5 px-1.5 rounded border cursor-pointer"
                          style={{
                            borderColor: 'var(--border-subtle)',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            color: memberStatus === 'Done' ? 'var(--accent-emerald)' : 'var(--text-main)'
                          }}
                        >
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="py-2.5 px-3 font-bold" style={{ color: 'var(--text-main)' }}>
                        {task.title}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="pill-badge pill-blue text-[10px]">
                          L{task.lectureId || task.week || 1}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`pill-badge text-[10px] ${getTagBadgeClass(task.tag || task.pillar)}`}>
                          {task.tag || task.pillar}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px]" style={{ color: 'var(--text-faint)' }}>
                        {task.dueDate}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
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
                {isSavedNotice && (
                  <span className="text-xs font-bold text-emerald-500 animate-pulse">
                    ✓ Saved!
                  </span>
                )}
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                1 note for each lecture session (1 to {TOTAL_LECTURES}) per team member. Document accomplishments, clinical findings, and questions.
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
              const hasMyNote = Boolean(getMemberLectureNote(member.id, lec).trim());
              const teamNotesCount = members.filter(m => Boolean(getMemberLectureNote(m.id, lec).trim())).length;

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

        {/* View 1: My Personal Note Editor for activeNoteLecture */}
        {notesViewMode === 'my' ? (
          <div className="space-y-3 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold" style={{ color: 'var(--text-main)' }}>
                  {member.name} - Lecture {activeNoteLecture} Progress Note
                </span>
                {member.studentId && (
                  <span className="text-[10px] font-mono text-muted">
                    (ID: {member.studentId})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isSavedNotice && (
                  <span className="text-xs font-bold text-emerald-500 animate-pulse">
                    ✓ Saved to Project Storage!
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all cursor-pointer"
                  style={{ backgroundColor: 'var(--accent-purple)' }}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Lecture {activeNoteLecture} Notes</span>
                </button>
              </div>
            </div>

            <textarea
              rows={7}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder={`Log your accomplishments, technical progress, and blockers for Lecture ${activeNoteLecture}:
- MultiCaRe dataset extraction and clinical notes normalization
- Vision-language inference benchmarking (LLaVA / Gemma-2-Vision)
- RAG vector retrieval experiments and Knowledge Graph construction
- Multi-agent debate workflow verification

Blockers / Questions for Dr. Tran Duc Khanh & TA Le Viet Tin:`}
              className="w-full p-3.5 rounded-xl text-xs border focus:outline-none focus:ring-1 leading-relaxed font-sans"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text-main)'
              }}
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-muted">
              <span>Automatically indexed under Lecture {activeNoteLecture} for continuous assessment evaluation</span>
              <button
                type="button"
                onClick={() => setNotesViewMode('team')}
                className="font-bold hover:underline cursor-pointer flex items-center gap-1"
                style={{ color: 'var(--accent-blue)' }}
              >
                <span>View What Teammates Wrote for Lecture {activeNoteLecture} &rarr;</span>
              </button>
            </div>
          </div>
        ) : (
          /* View 2: All 5 Team Members' Notes for activeNoteLecture */
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold" style={{ color: 'var(--text-main)' }}>
                All 5 Specialists' Progress Notes for Lecture {activeNoteLecture}
              </span>
              <span className="text-[11px] text-muted">
                Read what each team member logged for this lecture
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map(m => {
                const note = getMemberLectureNote(m.id, activeNoteLecture);
                const isMe = m.id === member.id;

                return (
                  <div
                    key={m.id}
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
                    <div>
                      {/* Member Header */}
                      <div className="flex items-center justify-between gap-2 pb-2.5 border-b mb-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-xs"
                            style={{ backgroundColor: m.avatarBg }}
                          >
                            {m.initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs truncate" style={{ color: 'var(--text-main)' }}>
                                {m.name}
                              </span>
                              {isMe && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-600">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono block text-muted">
                              {m.studentId} • {m.role.split('&')[0].trim()}
                            </span>
                          </div>
                        </div>

                        {isMe && (
                          <button
                            type="button"
                            onClick={() => setNotesViewMode('my')}
                            className="text-[11px] font-bold text-purple-600 hover:underline cursor-pointer shrink-0"
                          >
                            Edit
                          </button>
                        )}
                      </div>

                      {/* Note Content */}
                      {note.trim() ? (
                        <p className="text-xs leading-relaxed whitespace-pre-wrap font-normal" style={{ color: 'var(--text-main)' }}>
                          {note}
                        </p>
                      ) : (
                        <p className="text-xs italic py-4 text-center" style={{ color: 'var(--text-faint)' }}>
                          No notes recorded for Lecture {activeNoteLecture} yet.
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t mt-3 flex items-center justify-between text-[10px] text-muted" style={{ borderColor: 'var(--border-subtle)' }}>
                      <span>Lecture {activeNoteLecture} Log</span>
                      <Link
                        href={`/members/${m.id}`}
                        className="hover:underline font-bold"
                        style={{ color: 'var(--accent-blue)' }}
                      >
                        Profile &rarr;
                      </Link>
                    </div>
                  </div>
                );
              })}
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

              {/* Tag, Priority, Status */}
              <div className="grid grid-cols-3 gap-3">
                {/* Tag */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                      Tag
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsTagManagerOpen(true)}
                        className="text-[9px] font-bold text-muted hover:text-blue-500 hover:underline cursor-pointer"
                      >
                        Manage
                      </button>
                      {!isCreatingNewTag && (
                        <button
                          type="button"
                          onClick={() => setIsCreatingNewTag(true)}
                          className="text-[9px] font-bold text-blue-500 hover:underline cursor-pointer"
                        >
                          + New
                        </button>
                      )}
                    </div>
                  </div>

                  {isCreatingNewTag ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Tag..."
                        value={customTagInput}
                        onChange={(e) => setCustomTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleConfirmNewTag();
                          }
                        }}
                        className="w-full px-1.5 py-1 rounded-lg text-xs border font-semibold"
                        style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-strong)', color: 'var(--text-main)' }}
                      />
                      <button
                        type="button"
                        onClick={handleConfirmNewTag}
                        className="px-1.5 py-1 rounded-lg text-[10px] font-bold text-white bg-blue-600 cursor-pointer"
                      >
                        ✓
                      </button>
                    </div>
                  ) : (
                    <select
                      value={formData.tag}
                      onChange={(e) => {
                        if (e.target.value === '__add_new__') {
                          setIsCreatingNewTag(true);
                        } else if (e.target.value === '__manage__') {
                          setIsTagManagerOpen(true);
                        } else {
                          setFormData({ ...formData, tag: e.target.value });
                        }
                      }}
                      className="w-full px-2 py-1.5 rounded-xl text-xs border font-semibold cursor-pointer"
                      style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-strong)', color: 'var(--text-main)' }}
                    >
                      {allAvailableTags.map(t => <option key={t} value={t}>{t}</option>)}
                      <option value="__add_new__" className="font-bold text-blue-500">+ Add New...</option>
                      <option value="__manage__" className="font-bold text-slate-500">⚙ Manage / Delete Tags...</option>
                    </select>
                  )}
                </div>

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
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                    className="w-full px-2 py-1.5 rounded-xl text-xs border font-semibold"
                    style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-strong)', color: 'var(--text-main)' }}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
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

      {/* Tag Manager Modal */}
      <TagManagerModal
        isOpen={isTagManagerOpen}
        onClose={() => setIsTagManagerOpen(false)}
        onTagDeleted={(deletedTag) => {
          if (formData.tag === deletedTag) {
            setFormData(prev => ({ ...prev, tag: tags[0] || 'Data Engineering' }));
          }
        }}
      />

    </div>
  );
}
