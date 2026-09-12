'use client';

import React, { useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Task, TaskStatus, Priority } from '@/types';
import { KanbanBoard } from '@/components/KanbanBoard';
import { LectureDial } from '@/components/LectureDial';
import { 
  Plus, 
  Search, 
  X, 
  Zap, 
  UserCheck, 
  Columns,
  CheckSquare
} from 'lucide-react';

interface LectureTaskTrackerProps {
  weekNum: number;
}

const STATUSES: TaskStatus[] = ['Backlog', 'In Progress', 'Review', 'Done'];
const PRIORITIES: Priority[] = ['High', 'Medium', 'Low'];
const TOTAL_LECTURES = 16;

export const LectureTaskTracker: React.FC<LectureTaskTrackerProps> = ({ weekNum }) => {
  const { tasks, members, addTask, updateTask, deleteTask, setMemberTaskStatus } = useProject();

  // Scoped lecture filter: defaults to weekNum, but allows user to cycle/switch to any lecture or 'all'
  const [selectedLecture, setSelectedLecture] = useState<number | 'all'>(weekNum);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigneeIds: [] as string[],
    lectureId: weekNum,
    priority: 'High' as Priority,
    status: 'In Progress' as TaskStatus,
    dueDate: new Date().toISOString().split('T')[0]
  });

  // Filter tasks for the Kanban Board
  const filteredTasks = tasks.filter(task => {
    // Lecture scope
    const taskLecture = task.lectureId || task.week || 1;
    if (selectedLecture !== 'all' && taskLecture !== selectedLecture) {
      return false;
    }

    // Assignee filter
    if (selectedAssignee !== 'all') {
      const assignees = Array.isArray(task.assigneeIds) 
        ? task.assigneeIds 
        : (task.assigneeId ? [task.assigneeId] : []);
      if (!assignees.includes(selectedAssignee)) {
        return false;
      }
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = (task.description || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) {
        return false;
      }
    }

    return true;
  });

  // Open Create Modal
  const openCreateModal = (defaultStatus: TaskStatus = 'In Progress') => {
    setEditingTaskId(null);
    setFormData({
      title: '',
      description: '',
      assigneeIds: members.map(m => m.id), // Default to all members
      lectureId: selectedLecture === 'all' ? weekNum : selectedLecture,
      priority: 'High',
      status: defaultStatus,
      dueDate: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (task: Task) => {
    setEditingTaskId(task.id);
    setFormData({
      title: task.title,
      description: task.description,
      assigneeIds: Array.isArray(task.assigneeIds) ? task.assigneeIds : (task.assigneeId ? [task.assigneeId] : []),
      lectureId: task.lectureId || task.week || 1,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate
    });
    setIsModalOpen(true);
  };

  // Assignee toggles
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

  // Save Task
  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingTaskId) {
      const existing = tasks.find(t => t.id === editingTaskId);
      if (existing) {
        updateTask({
          ...existing,
          title: formData.title.trim(),
          description: formData.description.trim(),
          assigneeIds: formData.assigneeIds,
          lectureId: formData.lectureId,
          priority: formData.priority,
          status: formData.status,
          dueDate: formData.dueDate
        });
      }
    } else {
      addTask({
        title: formData.title.trim(),
        description: formData.description.trim(),
        assigneeIds: formData.assigneeIds,
        lectureId: formData.lectureId,
        week: formData.lectureId,
        priority: formData.priority,
        status: formData.status,
        dueDate: formData.dueDate
      });
    }

    setIsModalOpen(false);
  };

  // Current lecture tasks count for metrics
  const currentLectureTasks = tasks.filter(
    t => selectedLecture === 'all' || (t.lectureId || t.week || 1) === selectedLecture
  );
  const doneCount = currentLectureTasks.filter(t => t.status === 'Done').length;

  return (
    <div className="space-y-4">
      
      {/* Minimal Circle Dial: lets user navigate each and all lectures */}
      <LectureDial
        selectedLecture={selectedLecture}
        onSelectLecture={setSelectedLecture}
        tasks={tasks}
        totalLectures={TOTAL_LECTURES}
      />

      {/* Kanban Header & Filters */}
      <div className="bento-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Columns className="w-4 h-4 text-blue-500" />
              <h3 className="text-base font-extrabold" style={{ color: 'var(--text-main)' }}>
                {selectedLecture === 'all' ? 'All Lectures Kanban Board' : `Lecture ${selectedLecture} Kanban Board`}
              </h3>
              <span className="pill-badge pill-emerald text-[10px]">
                {doneCount}/{currentLectureTasks.length} Done
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Drag and drop deliverables between columns to update sprint status. Synchronized across all views.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openCreateModal('In Progress')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all cursor-pointer shrink-0"
              style={{ backgroundColor: 'var(--accent-blue)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Deliverable</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search deliverables in board..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-main)'
              }}
            />
          </div>

          {/* Selectors: Assignee */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Assignee Filter */}
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl text-xs border font-semibold cursor-pointer"
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

          </div>

        </div>
      </div>

      {/* The 4-Column Drag-and-Drop Kanban Board */}
      {filteredTasks.length === 0 && selectedLecture !== 'all' && currentLectureTasks.length === 0 ? (
        <div className="bento-card p-10 text-center max-w-md mx-auto space-y-3">
          <div className="w-10 h-10 rounded-2xl mx-auto flex items-center justify-center bg-blue-50 dark:bg-blue-950/40 text-blue-500">
            <CheckSquare className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-sm" style={{ color: 'var(--text-main)' }}>
            No Deliverables for Lecture {selectedLecture} Yet
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            This lecture does not have active Kanban cards yet. Create the first deliverable to begin tracking action items.
          </p>
          <div className="pt-2">
            <button
              onClick={() => openCreateModal('Backlog')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all cursor-pointer"
              style={{ backgroundColor: 'var(--accent-blue)' }}
            >
              + Create First Deliverable for Lecture {selectedLecture}
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
      )}

      {/* Task Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div 
            className="bento-card w-full max-w-lg p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-150"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <h3 className="font-extrabold text-sm" style={{ color: 'var(--text-main)' }}>
                  {editingTaskId ? 'Edit Sprint Deliverable' : 'Create New Sprint Deliverable'}
                </h3>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Deliverables sync with the central task engine and individual member portals.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-muted hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-3.5">
              {/* Title */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Benchmark LLaVA-1.5 zero-shot inference"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-strong)', color: 'var(--text-main)' }}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>
                  Description / Verification Criteria
                </label>
                <textarea
                  rows={2}
                  placeholder="Key deliverables, models tested, verification scripts..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none resize-none"
                  style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-strong)', color: 'var(--text-main)' }}
                />
              </div>

              {/* Lecture Session & Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>
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
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                    Assignees ({formData.assigneeIds.length} Selected)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={assignAllMembers}
                      className="text-[11px] font-bold text-blue-500 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3" /> All ({members.length})
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

                <div className="grid grid-cols-2 gap-1.5 p-2 rounded-xl border max-h-36 overflow-y-auto" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-subtle)' }}>
                  {members.map(m => {
                    const isChecked = formData.assigneeIds.includes(m.id);
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => toggleAssignee(m.id)}
                        className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                          isChecked 
                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30' 
                            : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                          style={{ backgroundColor: m.avatarBg }}
                        >
                          {m.initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-xs truncate block" style={{ color: 'var(--text-main)' }}>
                            {m.name}
                          </span>
                          {m.studentId && (
                            <span className="text-[10px] font-mono block text-muted">
                              {m.studentId}
                            </span>
                          )}
                        </div>
                        {isChecked && <UserCheck className="w-3 h-3 text-blue-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Priority */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                    className="w-full px-2.5 py-1.5 rounded-xl text-xs border font-semibold cursor-pointer"
                    style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-strong)', color: 'var(--text-main)' }}
                  >
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>
                    Status
                  </label>
                  <select
                    value={formData.status === 'Done' ? 'Done' : 'In Progress'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                    className="w-full px-2.5 py-1.5 rounded-xl text-xs border font-semibold cursor-pointer"
                    style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-strong)', color: 'var(--text-main)' }}
                  >
                    <option value="In Progress">New</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-2 border-t flex justify-end gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold border hover:opacity-80 transition-all cursor-pointer"
                  style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-muted)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all cursor-pointer"
                  style={{ backgroundColor: 'var(--accent-blue)' }}
                >
                  {editingTaskId ? 'Save Changes' : 'Create Deliverable'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
