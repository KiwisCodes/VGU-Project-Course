'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useProject } from '@/context/ProjectContext';
import { useAuth } from '@/context/AuthContext';
import { Task, TaskStatus, Priority } from '@/types';
import { LectureDial } from '@/components/LectureDial';
import { KanbanBoard } from '@/components/KanbanBoard';
import { TaskTableView } from '@/components/TaskTableView';
import { TagManagerModal } from '@/components/TagManagerModal';
import { 
  Plus, 
  Search, 
  CheckSquare, 
  X, 
  List, 
  Columns, 
  Zap, 
  UserCheck, 
  Tag as TagIcon,
  AlertCircle,
  Link as LinkIcon
} from 'lucide-react';

const STATUSES: TaskStatus[] = ['Backlog', 'In Progress', 'Review', 'Done'];
const PRIORITIES: Priority[] = ['High', 'Medium', 'Low'];
const TOTAL_LECTURES = 16;

function TasksContent() {
  const { tasks, members, tags, addTag, addTask, updateTask, deleteTask, setMemberTaskStatus } = useProject();
  const { user, profile, loading } = useAuth();

  const searchParams = useSearchParams();
  const lectureParam = searchParams.get('lecture');
  const initialLecture = lectureParam ? (lectureParam === 'all' ? 'all' : parseInt(lectureParam, 10) || 1) : 1;

  const [selectedLecture, setSelectedLecture] = useState<number | 'all'>(initialLecture);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'done'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Sync with searchParams if changed
  useEffect(() => {
    if (lectureParam) {
      if (lectureParam === 'all') {
        setSelectedLecture('all');
      } else {
        const num = parseInt(lectureParam, 10);
        if (!isNaN(num) && num >= 1 && num <= 16) {
          setSelectedLecture(num);
        }
      }
    }
  }, [lectureParam]);

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

  // Combine default tags with any custom tags stored in tasks or context
  const allAvailableTags = Array.from(
    new Set([...tags, ...tasks.map(t => t.tag || t.pillar).filter(Boolean)])
  );

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Tag creation state in modal
  const [isCreatingNewTag, setIsCreatingNewTag] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    assigneeIds: [] as string[],
    lectureId: 1,
    tag: 'Data Engineering',
    priority: 'High' as Priority,
    status: 'Backlog' as TaskStatus,
    dueDate: new Date().toISOString().split('T')[0]
  });

  const openCreateModal = (defaultStatus: TaskStatus = 'Backlog') => {
    setEditingTaskId(null);
    setIsCreatingNewTag(false);
    setCustomTagInput('');
    setFormData({
      title: '',
      description: '',
      link: '',
      assigneeIds: members.length > 0 ? [members[0].id] : [],
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
      link: task.link || '',
      assigneeIds: Array.isArray(task.assigneeIds) ? task.assigneeIds : (task.assigneeId ? [task.assigneeId] : []),
      lectureId: task.lectureId || task.week || 1,
      tag: task.tag || task.pillar || 'Data Engineering',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate
    });
    setIsModalOpen(true);
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

  const toggleAssignee = (memberId: string) => {
    setFormData(prev => {
      const exists = prev.assigneeIds.includes(memberId);
      return {
        ...prev,
        assigneeIds: exists 
          ? prev.assigneeIds.filter(id => id !== memberId) 
          : [...prev.assigneeIds, memberId]
      };
    });
  };

  const assignAllMembers = () => {
    setFormData(prev => ({
      ...prev,
      assigneeIds: members.map(m => m.id)
    }));
  };

  const clearAllAssignees = () => {
    setFormData(prev => ({
      ...prev,
      assigneeIds: []
    }));
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const trimmedLink = formData.link.trim() || undefined;

    if (editingTaskId) {
      const existing = tasks.find(t => t.id === editingTaskId);
      if (existing) {
        updateTask({
          ...existing,
          ...formData,
          link: trimmedLink,
          pillar: formData.tag // Keep backward compatibility
        });
      }
    } else {
      addTask({
        ...formData,
        link: trimmedLink,
        pillar: formData.tag
      });
    }
    setIsModalOpen(false);
  };

  // Lecture-level tasks for badge counts
  const lectureScopeTasks = tasks.filter(task => {
    const taskLecture = task.lectureId || task.week || 1;
    return selectedLecture === 'all' || taskLecture === selectedLecture;
  });

  const totalLectureAll = lectureScopeTasks.length;
  const totalLectureNew = lectureScopeTasks.filter(t => t.status !== 'Done').length;
  const totalLectureDone = lectureScopeTasks.filter(t => t.status === 'Done').length;

  // Filter tasks for the active view
  const filteredTasks = lectureScopeTasks.filter(task => {
    const taskAssignees = Array.isArray(task.assigneeIds) ? task.assigneeIds : (task.assigneeId ? [task.assigneeId] : []);
    const taskTag = task.tag || task.pillar || '';
    
    // Status Filter (All / New / Done)
    if (statusFilter === 'new' && task.status === 'Done') return false;
    if (statusFilter === 'done' && task.status !== 'Done') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = (task.description || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    // Secondary filters
    const matchesAssignee = selectedAssignee === 'all' || taskAssignees.includes(selectedAssignee);
    const matchesTag = selectedTag === 'all' || taskTag === selectedTag;
    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;
    
    return matchesAssignee && matchesTag && matchesPriority;
  });

  return (
    <div className="space-y-4">

      {/* Notice Banner */}
      {noticeMessage && (
        <div className="p-3 rounded-xl border bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
            <span>{noticeMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setNoticeMessage(null)} 
            className="font-bold px-2 hover:opacity-70 cursor-pointer"
          >
            x
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="pill-badge pill-blue">Sprint Tasks</span>
            <span className="pill-badge pill-purple">Cyclic Lecture Dial</span>
            <span className="pill-badge pill-emerald">2-State Workflow</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-main)' }}>
            Course Tasks Board
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Sprint deliverables categorized by lecture session. Track new and completed tasks across all team members.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => openCreateModal('Backlog')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all cursor-pointer"
            style={{ backgroundColor: 'var(--accent-blue)' }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* 1. Cyclic Horizontal Lecture Dial */}
      <LectureDial
        selectedLecture={selectedLecture}
        onSelectLecture={setSelectedLecture}
        tasks={tasks}
        totalLectures={TOTAL_LECTURES}
      />

      {/* 2. Controls Toolbar & Segmented Status Filter */}
      <div className="space-y-3">
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
              All ({totalLectureAll})
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
              New Tasks ({totalLectureNew})
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
              Done Tasks ({totalLectureDone})
            </button>
          </div>

          {/* Search Box & View Mode Toggle */}
          <div className="flex flex-wrap items-center gap-2 flex-1 md:justify-end">
            
            {/* Search Box */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks across titles or descriptions..."
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

            {/* Assignee Filter */}
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl text-xs border font-semibold focus:outline-none cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-main)'
              }}
            >
              <option value="all">Assignee: All</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl text-xs border font-semibold focus:outline-none cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-main)'
              }}
            >
              <option value="all">Priority: All</option>
              {PRIORITIES.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {/* View Mode Toggle (Table / Kanban) */}
            <div className="flex items-center rounded-xl p-0.5 border" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Table View (7 Columns)"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table' ? 'shadow-xs' : 'opacity-60 hover:opacity-100'
                }`}
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
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'kanban' ? 'shadow-xs' : 'opacity-60 hover:opacity-100'
                }`}
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
      </div>

      {/* 3. MAIN TASK VIEW: TABLE OR KANBAN */}
      {viewMode === 'table' ? (
        <TaskTableView
          tasks={filteredTasks}
          members={members}
          onUpdateTask={updateTask}
          onEditTask={openEditModal}
          onDeleteTask={deleteTask}
          onUpdateMemberTaskStatus={setMemberTaskStatus}
          currentMemberId={profile?.id}
          onNotice={(msg) => {
            setNoticeMessage(msg);
            setTimeout(() => setNoticeMessage(null), 4000);
          }}
        />
      ) : (
        <KanbanBoard
          tasks={filteredTasks}
          members={members}
          onUpdateTask={updateTask}
          onEditTask={openEditModal}
          onDeleteTask={deleteTask}
          onCreateTaskInStatus={openCreateModal}
          activeAssigneeFilter={selectedAssignee}
          onUpdateMemberTaskStatus={setMemberTaskStatus}
        />
      )}

      {/* ADD / EDIT TASK MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div 
            className="bento-card max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-blue-500" />
                <h3 className="font-extrabold text-base" style={{ color: 'var(--text-main)' }}>
                  {editingTaskId ? 'Edit Sprint Task' : 'Create New Sprint Task'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-muted hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Benchmark LLaVA inference on Colab T4"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1"
                  style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-strong)', color: 'var(--text-main)' }}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>
                  Description / Clinical Objective
                </label>
                <textarea
                  rows={2}
                  placeholder="Detailed goals, datasets, and verification criteria..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1 resize-none"
                  style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-strong)', color: 'var(--text-main)' }}
                />
              </div>

              {/* Link (URL) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>
                  Resource Link (URL, ArXiv, GitHub)
                </label>
                <div className="relative">
                  <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    placeholder="https://arxiv.org/abs/... or https://github.com/..."
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1"
                    style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-strong)', color: 'var(--text-main)' }}
                  />
                </div>
              </div>

              {/* Lecture & Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>
                    Lecture Session (1 to 16)
                  </label>
                  <select
                    value={formData.lectureId}
                    onChange={(e) => setFormData({ ...formData, lectureId: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 rounded-xl text-xs border font-semibold cursor-pointer"
                    style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-strong)', color: 'var(--text-main)' }}
                  >
                    {Array.from({ length: TOTAL_LECTURES }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>Lecture {num}</option>
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
                    className="w-full px-3 py-2 rounded-xl text-xs border"
                    style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-strong)', color: 'var(--text-main)' }}
                  />
                </div>
              </div>

              {/* Multi-Assignee Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                    Assignees ({formData.assigneeIds.length} Selected)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={assignAllMembers}
                      className="text-[11px] font-bold text-blue-500 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3" /> Assign All ({members.length})
                    </button>
                    <button
                      type="button"
                      onClick={clearAllAssignees}
                      className="text-[11px] text-muted hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 rounded-xl border" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-subtle)' }}>
                  {members.map(member => {
                    const isChecked = formData.assigneeIds.includes(member.id);

                    return (
                      <button
                        type="button"
                        key={member.id}
                        onClick={() => toggleAssignee(member.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all cursor-pointer ${
                          isChecked 
                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 shadow-xs' 
                            : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                          style={{ backgroundColor: member.avatarBg }}
                        >
                          {member.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-xs block truncate" style={{ color: 'var(--text-main)' }}>
                            {member.name}
                          </span>
                          <span className="text-[10px] block truncate" style={{ color: 'var(--text-muted)' }}>
                            {member.role.split('&')[0]}
                          </span>
                        </div>
                        {isChecked && (
                          <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tag, Priority, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Tag Selector with "+ Add new tag" and "Manage" */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                      Tag
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsTagManagerOpen(true)}
                        className="text-[10px] font-bold text-muted hover:text-blue-500 hover:underline cursor-pointer"
                      >
                        Manage
                      </button>
                      {!isCreatingNewTag && (
                        <button
                          type="button"
                          onClick={() => setIsCreatingNewTag(true)}
                          className="text-[10px] font-bold text-blue-500 hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                          <Plus className="w-3 h-3" /> New
                        </button>
                      )}
                    </div>
                  </div>

                  {isCreatingNewTag ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        autoFocus
                        placeholder="New tag..."
                        value={customTagInput}
                        onChange={(e) => setCustomTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleConfirmNewTag();
                          }
                        }}
                        className="flex-1 px-2.5 py-1.5 rounded-xl text-xs border font-semibold"
                        style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-strong)', color: 'var(--text-main)' }}
                      />
                      <button
                        type="button"
                        onClick={handleConfirmNewTag}
                        className="px-2 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 cursor-pointer"
                        style={{ backgroundColor: 'var(--accent-blue)' }}
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCreatingNewTag(false)}
                        className="p-1 rounded-xl border text-xs text-muted hover:opacity-80 cursor-pointer"
                        style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}
                      >
                        <X className="w-3 h-3" />
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
                      className="w-full px-3 py-2 rounded-xl text-xs border font-semibold cursor-pointer"
                      style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-strong)', color: 'var(--text-main)' }}
                    >
                      {allAvailableTags.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                      <option value="__add_new__" className="font-bold text-blue-500">
                        + Add New Tag...
                      </option>
                      <option value="__manage__" className="font-bold text-slate-500">
                        Manage / Delete Tags...
                      </option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                    className="w-full px-3 py-2 rounded-xl text-xs border font-semibold cursor-pointer"
                    style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-strong)', color: 'var(--text-main)' }}
                  >
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                    className="w-full px-3 py-2 rounded-xl text-xs border font-semibold cursor-pointer"
                    style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-strong)', color: 'var(--text-main)' }}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t flex items-center justify-end gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border hover:opacity-80 transition-all cursor-pointer"
                  style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-muted)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all cursor-pointer"
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
          if (selectedTag === deletedTag) {
            setSelectedTag('all');
          }
          if (formData.tag === deletedTag) {
            setFormData(prev => ({ ...prev, tag: tags[0] || 'Data Engineering' }));
          }
        }}
      />

    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-bold text-muted">Loading Course Tasks Board...</div>}>
      <TasksContent />
    </Suspense>
  );
}
