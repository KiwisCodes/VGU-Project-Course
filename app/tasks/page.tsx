'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useProject } from '@/context/ProjectContext';
import { Task, TaskStatus, Priority, getTaskMemberStatus, isTaskDoneForMember } from '@/types';
import { LectureDial } from '@/components/LectureDial';
import { KanbanBoard } from '@/components/KanbanBoard';
import { TagManagerModal } from '@/components/TagManagerModal';
import { 
  Plus, 
  Search, 
  CheckSquare, 
  Trash2, 
  Edit3, 
  X, 
  List, 
  Columns, 
  Users2, 
  Zap, 
  UserCheck, 
  Tag as TagIcon 
} from 'lucide-react';

const STATUSES: TaskStatus[] = ['Backlog', 'In Progress', 'Review', 'Done'];
const PRIORITIES: Priority[] = ['High', 'Medium', 'Low'];
const TOTAL_LECTURES = 16;

function TasksContent() {
  const { tasks, members, tags, addTag, addTask, updateTask, deleteTask, setMemberTaskStatus } = useProject();

  const searchParams = useSearchParams();
  const lectureParam = searchParams.get('lecture');
  const initialLecture = lectureParam ? (lectureParam === 'all' ? 'all' : parseInt(lectureParam, 10) || 1) : 1;

  const [selectedLecture, setSelectedLecture] = useState<number | 'all'>(initialLecture);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

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

    if (editingTaskId) {
      const existing = tasks.find(t => t.id === editingTaskId);
      if (existing) {
        updateTask({
          ...existing,
          ...formData,
          pillar: formData.tag // Keep backward compatibility
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

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const taskLecture = task.lectureId || task.week || 1;
    const taskAssignees = Array.isArray(task.assigneeIds) ? task.assigneeIds : (task.assigneeId ? [task.assigneeId] : []);
    const taskTag = task.tag || task.pillar || '';
    
    const matchesLecture = selectedLecture === 'all' || taskLecture === selectedLecture;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAssignee = selectedAssignee === 'all' || taskAssignees.includes(selectedAssignee);
    const matchesTag = selectedTag === 'all' || taskTag === selectedTag;
    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;
    
    return matchesLecture && matchesSearch && matchesAssignee && matchesTag && matchesPriority;
  });

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

  const getPriorityBadgeClass = (priority: Priority) => {
    switch (priority) {
      case 'High': return 'text-red-500 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900';
      case 'Medium': return 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900';
      case 'Low': return 'text-slate-500 bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800';
    }
  };

  const currentLectureTasks = tasks.filter(t => (t.lectureId || t.week || 1) === selectedLecture);

  return (
    <div className="space-y-6">

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="pill-badge pill-blue">Drag &amp; Drop Enabled</span>
            <span className="pill-badge pill-purple">Cyclic Lecture Dial</span>
            <span className="pill-badge pill-emerald">Custom Tags</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-main)' }}>
            Course Tasks Board
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Sprint deliverables categorized by lecture session. Drag cards across columns to update task progress.
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

      {/* Cyclic Horizontal Lecture Dial */}
      <LectureDial
        selectedLecture={selectedLecture}
        onSelectLecture={setSelectedLecture}
        tasks={tasks}
        totalLectures={TOTAL_LECTURES}
      />

      {/* Search and Filters Bar */}
      <div className="bento-card p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks across titles or descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border focus:outline-none focus:ring-1"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-main)'
              }}
            />
          </div>

          {/* Filters & View Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            
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

            {/* Tag Filter & Manager */}
            <div className="flex items-center gap-1">
              <select
                value={selectedTag}
                onChange={(e) => {
                  if (e.target.value === '__manage__') {
                    setIsTagManagerOpen(true);
                  } else {
                    setSelectedTag(e.target.value);
                  }
                }}
                className="px-2.5 py-1.5 rounded-xl text-xs border font-semibold focus:outline-none cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-main)'
                }}
              >
                <option value="all">Tag: All</option>
                {allAvailableTags.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
                <option value="__manage__" className="font-bold text-blue-500">⚙ Manage Tags...</option>
              </select>

              <button
                type="button"
                onClick={() => setIsTagManagerOpen(true)}
                title="Manage & Delete Project Tags"
                className="p-1.5 rounded-xl border hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-muted hover:text-blue-500 cursor-pointer"
                style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}
              >
                <TagIcon className="w-3.5 h-3.5" />
              </button>
            </div>

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

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl p-0.5 border" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
              <button
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

              <button
                onClick={() => setViewMode('list')}
                title="List View"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'list' ? 'shadow-xs' : 'opacity-60 hover:opacity-100'
                }`}
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
      </div>

      {/* MAIN TASK VIEW (KANBAN OR TABLE) */}
      {viewMode === 'kanban' ? (
        filteredTasks.length === 0 && selectedLecture !== 'all' && currentLectureTasks.length === 0 ? (
          /* Empty lecture state */
          <div className="bento-card p-12 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-blue-50 dark:bg-blue-950/40 text-blue-500">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-sm" style={{ color: 'var(--text-main)' }}>
              No Tasks for Lecture {selectedLecture}
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              This lecture does not have any sprint deliverables yet. Create the first task to begin tracking action items.
            </p>
            <div className="pt-2">
              <button
                onClick={() => openCreateModal('Backlog')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all cursor-pointer"
                style={{ backgroundColor: 'var(--accent-blue)' }}
              >
                + Create First Task for Lecture {selectedLecture}
              </button>
            </div>
          </div>
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
        )
      ) : (
        /* Table View */
        <div className="bento-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
                  <th className="py-3 px-4 font-bold" style={{ color: 'var(--text-faint)' }}>Status</th>
                  <th className="py-3 px-4 font-bold" style={{ color: 'var(--text-faint)' }}>Task Title</th>
                  <th className="py-3 px-4 font-bold" style={{ color: 'var(--text-faint)' }}>Lecture</th>
                  <th className="py-3 px-4 font-bold" style={{ color: 'var(--text-faint)' }}>Tag</th>
                  <th className="py-3 px-4 font-bold" style={{ color: 'var(--text-faint)' }}>Priority</th>
                  <th className="py-3 px-4 font-bold" style={{ color: 'var(--text-faint)' }}>Assignees</th>
                  <th className="py-3 px-4 font-bold text-right" style={{ color: 'var(--text-faint)' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                {filteredTasks.map(task => {
                  const taskLecture = task.lectureId || task.week || 1;
                  const assigneeList = Array.isArray(task.assigneeIds) ? task.assigneeIds : (task.assigneeId ? [task.assigneeId] : []);
                  const assignedMembers = members.filter(m => assigneeList.includes(m.id));
                  const isSpecificMember = selectedAssignee !== 'all';
                  const displayStatus = isSpecificMember ? getTaskMemberStatus(task, selectedAssignee) : task.status;

                  return (
                    <tr 
                      key={task.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors cursor-pointer"
                      onClick={() => openEditModal(task)}
                    >
                      <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                        <select
                          value={displayStatus}
                          onChange={(e) => {
                            const newStatus = e.target.value as TaskStatus;
                            if (isSpecificMember) {
                              setMemberTaskStatus(task.id, selectedAssignee, newStatus);
                            } else {
                              updateTask({ ...task, status: newStatus });
                            }
                          }}
                          className="text-xs font-bold py-1 px-2 rounded-lg border cursor-pointer"
                          style={{
                            borderColor: 'var(--border-subtle)',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            color: displayStatus === 'Done' ? 'var(--accent-emerald)' : 'var(--text-main)'
                          }}
                        >
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold block" style={{ color: 'var(--text-main)' }}>{task.title}</span>
                        <span className="text-[11px] line-clamp-1" style={{ color: 'var(--text-muted)' }}>{task.description}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="pill-badge pill-blue text-[10px]">
                          Lecture {taskLecture}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`pill-badge text-[10px] ${getTagBadgeClass(task.tag || task.pillar)}`}>
                          {task.tag || task.pillar}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${getPriorityBadgeClass(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {assignedMembers.map(m => {
                            const isDone = isTaskDoneForMember(task, m.id);
                            return (
                              <span 
                                key={m.id}
                                title={`${m.name} (${isDone ? 'Done' : 'In Progress'})`}
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-xs transition-transform ${
                                  isDone ? 'ring-2 ring-emerald-500' : 'opacity-70'
                                }`}
                                style={{ backgroundColor: m.avatarBg }}
                              >
                                {m.initials}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(task)}
                            className="p-1 rounded text-muted hover:text-blue-500"
                            title="Edit task"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="p-1 rounded text-muted hover:text-red-500"
                            title="Delete task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
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
                        ⚙ Manage / Delete Tags...
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
