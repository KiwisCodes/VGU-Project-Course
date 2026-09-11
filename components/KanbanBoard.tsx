'use client';

import React, { useState } from 'react';
import { Task, TaskStatus, Priority, PillarTag, Member, getMemberShortName } from '@/types';
import { 
  CheckSquare, 
  Clock, 
  Trash2, 
  Edit3, 
  Plus, 
  Users2, 
  Zap, 
  GripVertical 
} from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  members: Member[];
  onUpdateTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onCreateTaskInStatus?: (status: TaskStatus) => void;
}

const STATUSES: TaskStatus[] = ['Backlog', 'In Progress', 'Review', 'Done'];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  members,
  onUpdateTask,
  onEditTask,
  onDeleteTask,
  onCreateTaskInStatus
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStatus !== status) {
      setDragOverStatus(status);
    }
  };

  const handleDragLeave = (e: React.DragEvent, status: TaskStatus) => {
    // Only reset if leaving the column element itself
    if (e.currentTarget === e.target && dragOverStatus === status) {
      setDragOverStatus(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverStatus(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== targetStatus) {
      onUpdateTask({
        ...task,
        status: targetStatus
      });
    }
    setDraggedTaskId(null);
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

  const getPriorityBadgeClass = (priority: Priority) => {
    switch (priority) {
      case 'High': return 'text-red-500 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900';
      case 'Medium': return 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900';
      case 'Low': return 'text-slate-500 bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800';
    }
  };

  const renderAssignees = (assigneeIds: string[]) => {
    if (!assigneeIds || assigneeIds.length === 0) {
      return (
        <span className="text-[11px] text-muted italic flex items-center gap-1">
          <Users2 className="w-3 h-3 text-slate-400" /> Unassigned
        </span>
      );
    }

    const assignedMembers = members.filter(m => assigneeIds.includes(m.id));
    const isAll = members.length > 0 && assignedMembers.length === members.length;

    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <div className="flex -space-x-1.5 items-center">
          {assignedMembers.slice(0, 4).map(m => (
            <div
              key={m.id}
              title={`${m.name} (${m.role})`}
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 shrink-0 shadow-xs"
              style={{ backgroundColor: m.avatarBg, borderColor: 'var(--bg-surface)' }}
            >
              {m.initials}
            </div>
          ))}
          {assignedMembers.length > 4 && (
            <div 
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 shrink-0 bg-slate-700"
              style={{ borderColor: 'var(--bg-surface)' }}
            >
              +{assignedMembers.length - 4}
            </div>
          )}
        </div>

        {isAll ? (
          <span className="pill-badge pill-emerald text-[9px] py-0 px-1.5">
            <Zap className="w-2.5 h-2.5" /> All Team ({members.length})
          </span>
        ) : (
          <span className="text-[11px] font-bold truncate max-w-[120px]" style={{ color: 'var(--text-muted)' }}>
            {assignedMembers.map(m => getMemberShortName(m.name)).join(', ')}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
      {STATUSES.map(status => {
        const columnTasks = tasks.filter(t => t.status === status);
        const isColumnDragOver = dragOverStatus === status;

        return (
          <div
            key={status}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={(e) => handleDragLeave(e, status)}
            onDrop={(e) => handleDrop(e, status)}
            className={`bento-card p-3.5 min-w-0 transition-all ${
              isColumnDragOver 
                ? 'ring-2 ring-blue-500 scale-[1.01]' 
                : ''
            }`}
            style={{ 
              backgroundColor: isColumnDragOver ? 'var(--accent-blue-soft)' : 'var(--bg-surface-subtle)',
              borderColor: isColumnDragOver ? 'var(--accent-blue)' : 'var(--border-subtle)'
            }}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-2 mb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs tracking-tight" style={{ color: 'var(--text-main)' }}>
                  {status}
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {columnTasks.length}
                </span>
              </div>

              {onCreateTaskInStatus && (
                <button
                  type="button"
                  onClick={() => onCreateTaskInStatus(status)}
                  title={`Add task to ${status}`}
                  className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-muted cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Tasks Cards Container */}
            <div className="space-y-3 min-h-[140px]">
              {columnTasks.map(task => {
                const taskLecture = task.lectureId || task.week || 1;
                const assigneeList = Array.isArray(task.assigneeIds) ? task.assigneeIds : (task.assigneeId ? [task.assigneeId] : []);
                const isBeingDragged = draggedTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => onEditTask(task)}
                    className={`bento-card p-3.5 group cursor-grab active:cursor-grabbing hover:border-blue-400 transition-all ${
                      isBeingDragged ? 'opacity-40 scale-95' : 'shadow-xs'
                    }`}
                    style={{ backgroundColor: 'var(--bg-surface)' }}
                  >
                    {/* Grip & Badges Header */}
                    <div className="flex items-center justify-between gap-1.5 mb-2">
                      <div className="flex items-center gap-1.5">
                        <GripVertical className="w-3 h-3 text-slate-400 opacity-40 group-hover:opacity-100" />
                        <span className={`pill-badge text-[10px] py-0.5 px-2 ${getTagBadgeClass(task.tag || task.pillar)}`}>
                          {task.tag || task.pillar}
                        </span>
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${getPriorityBadgeClass(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h4 className="font-bold text-xs leading-snug mb-1" style={{ color: 'var(--text-main)' }}>
                      {task.title}
                    </h4>
                    <p className="text-[11px] line-clamp-2 leading-relaxed mb-3" style={{ color: 'var(--text-muted)' }}>
                      {task.description}
                    </p>

                    {/* Footer: Assignees, Lecture Badge, Due Date */}
                    <div className="pt-2 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
                      <div className="min-w-0 flex-1">
                        {renderAssignees(assigneeList)}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="pill-badge pill-blue text-[9px] py-0 px-1.5">
                          L{taskLecture}
                        </span>
                        <span className="text-[10px] font-medium flex items-center gap-1" style={{ color: 'var(--text-faint)' }}>
                          <Clock className="w-2.5 h-2.5" />
                          {task.dueDate.slice(5)}
                        </span>
                      </div>
                    </div>

                    {/* Quick Action Footer on Hover */}
                    <div 
                      className="mt-2 pt-2 border-t flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity" 
                      style={{ borderColor: 'var(--border-subtle)' }} 
                      onClick={e => e.stopPropagation()}
                    >
                      <select
                        value={task.status}
                        onChange={(e) => onUpdateTask({ ...task, status: e.target.value as TaskStatus })}
                        className="text-[10px] font-bold py-0.5 px-1.5 rounded border"
                        style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditTask(task)}
                          title="Edit Task"
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-muted"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Delete this task?')) onDeleteTask(task.id);
                          }}
                          title="Delete Task"
                          className="p-1 rounded hover:bg-red-50 hover:text-red-500 transition-all text-muted"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {columnTasks.length === 0 && (
                <div className="py-8 text-center text-xs border border-dashed rounded-xl" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-faint)' }}>
                  Drag tasks here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
