'use client';

import React, { useState, useRef } from 'react';
import { Task, TaskStatus, Priority, Member, getMemberShortName, getTaskMemberStatus, getTaskOverallStatus } from '@/types';
import { 
  CheckSquare, 
  Clock, 
  Trash2, 
  Edit3, 
  Plus, 
  Users2, 
  Zap, 
  GripVertical,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface KanbanBoardProps {
  tasks: Task[];
  members: Member[];
  onUpdateTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onCreateTaskInStatus?: (status: TaskStatus) => void;
  currentMemberId?: string;
  activeAssigneeFilter?: string;
  onUpdateMemberTaskStatus?: (taskId: string, memberId: string, status: TaskStatus) => void;
}

type KanbanColumnType = 'new' | 'done';

interface ColumnDef {
  type: KanbanColumnType;
  title: string;
  badgeLabel: string;
  badgeClass: string;
  targetStatus: TaskStatus;
}

const COLUMNS: ColumnDef[] = [
  {
    type: 'new',
    title: 'New Tasks',
    badgeLabel: 'New',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    targetStatus: 'In Progress',
  },
  {
    type: 'done',
    title: 'Done Tasks',
    badgeLabel: 'Done',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    targetStatus: 'Done',
  },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  members,
  onUpdateTask,
  onEditTask,
  onDeleteTask,
  onCreateTaskInStatus,
  currentMemberId,
  activeAssigneeFilter,
  onUpdateMemberTaskStatus
}) => {
  const { user, profile, canMoveTask, canEditTaskStatus } = useAuth();
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<KanbanColumnType | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const isDraggingRef = useRef(false);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isTaskDone = (task: Task): boolean => {
    if (currentMemberId) {
      return getTaskMemberStatus(task, currentMemberId) === 'Done';
    }
    return task.status === 'Done';
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    isDraggingRef.current = true;
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
    dragTimeoutRef.current = setTimeout(() => {
      isDraggingRef.current = false;
    }, 200);
    setDraggedTaskId(null);
    setDragOverCol(null);
  };

  const handleDragOver = (e: React.DragEvent, colType: KanbanColumnType) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colType) {
      setDragOverCol(colType);
    }
  };

  const handleDragLeave = (e: React.DragEvent, colType: KanbanColumnType) => {
    if (e.currentTarget && e.relatedTarget && e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    if (dragOverCol === colType) {
      setDragOverCol(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetCol: KanbanColumnType) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Smart Task Access Permission Check
    const check = canMoveTask(task, currentMemberId);
    if (!check.allowed) {
      setNoticeMessage(check.reason || 'Permission denied: unable to modify deliverable.');
      setTimeout(() => setNoticeMessage(null), 4000);
      setDraggedTaskId(null);
      return;
    }

    const targetStatus: TaskStatus = targetCol === 'done' ? 'Done' : 'In Progress';

    // 1. Personal member portal: update this specific member's deliverable status
    if (currentMemberId) {
      const currentMemberStatus = getTaskMemberStatus(task, currentMemberId);
      if (currentMemberStatus !== targetStatus) {
        if (onUpdateMemberTaskStatus) {
          onUpdateMemberTaskStatus(task.id, currentMemberId, targetStatus);
        } else {
          const updatedStatuses = { ...(task.memberStatuses || {}), [currentMemberId]: targetStatus };
          const assigneeList = Array.isArray(task.assigneeIds) ? task.assigneeIds : [];
          const allDone = assigneeList.length > 0 && assigneeList.every(mId => updatedStatuses[mId] === 'Done');
          onUpdateTask({
            ...task,
            status: allDone ? 'Done' : 'In Progress',
            memberStatuses: updatedStatuses
          });
        }
      }
      setDraggedTaskId(null);
      return;
    }

    // 2. Shared team board (/tasks, /lectures):
    const assigneeList = Array.isArray(task.assigneeIds) ? task.assigneeIds : (task.assigneeId ? [task.assigneeId] : []);
    const isMultiAssignee = assigneeList.length > 1;

    // Rule: On the shared page, an individual member cannot change the status of the shared deliverable.
    // Only Team Leader can directly override the overall deliverable status for multi-assignee tasks.
    if (isMultiAssignee && !profile?.is_team_leader) {
      setNoticeMessage(
        'On the shared Tasks page, deliverables reflect team progress. To update your individual progress, click your member chip or visit your personal portal. Deliverables become Done when all assignees finish.'
      );
      setTimeout(() => setNoticeMessage(null), 4500);
      setDraggedTaskId(null);
      return;
    }

    // If single assignee: only that assignee or Team Leader can move
    if (!isMultiAssignee && assigneeList.length === 1 && !profile?.is_team_leader && profile?.id && !assigneeList.includes(profile.id)) {
      setNoticeMessage('Access restriction: Only the assigned member or Team Leader can move this deliverable.');
      setTimeout(() => setNoticeMessage(null), 4000);
      setDraggedTaskId(null);
      return;
    }

    // Otherwise, update overall task status AND all assignees
    if (task.status !== targetStatus) {
      const newMemberStatuses: Record<string, TaskStatus> = {};
      assigneeList.forEach(mId => {
        newMemberStatuses[mId] = targetStatus;
      });

      onUpdateTask({
        ...task,
        status: targetStatus,
        memberStatuses: newMemberStatuses
      });
    }
    setDraggedTaskId(null);
  };

  const handleToggleCardStatus = (task: Task) => {
    const cardDone = isTaskDone(task);
    const targetCol: KanbanColumnType = cardDone ? 'new' : 'done';
    const targetStatus: TaskStatus = targetCol === 'done' ? 'Done' : 'In Progress';

    const check = canMoveTask(task, currentMemberId);
    if (!check.allowed) {
      setNoticeMessage(check.reason || 'Permission denied: unable to modify deliverable.');
      setTimeout(() => setNoticeMessage(null), 4000);
      return;
    }

    // 1. Personal member portal
    if (currentMemberId) {
      if (onUpdateMemberTaskStatus) {
        onUpdateMemberTaskStatus(task.id, currentMemberId, targetStatus);
      } else {
        const updatedStatuses = { ...(task.memberStatuses || {}), [currentMemberId]: targetStatus };
        const assigneeList = Array.isArray(task.assigneeIds) ? task.assigneeIds : [];
        const allDone = assigneeList.length > 0 && assigneeList.every(mId => updatedStatuses[mId] === 'Done');
        onUpdateTask({
          ...task,
          status: allDone ? 'Done' : 'In Progress',
          memberStatuses: updatedStatuses
        });
      }
      return;
    }

    // 2. Shared board
    const assigneeList = Array.isArray(task.assigneeIds) ? task.assigneeIds : (task.assigneeId ? [task.assigneeId] : []);
    const isMultiAssignee = assigneeList.length > 1;

    if (isMultiAssignee && !profile?.is_team_leader) {
      setNoticeMessage(
        'On the shared Tasks page, deliverables reflect team progress. To update your individual progress, click your member chip or visit your personal portal. Deliverables become Done when all assignees finish.'
      );
      setTimeout(() => setNoticeMessage(null), 4500);
      return;
    }

    if (!isMultiAssignee && assigneeList.length === 1 && !profile?.is_team_leader && profile?.id && !assigneeList.includes(profile.id)) {
      setNoticeMessage('Access restriction: Only the assigned member or Team Leader can modify this deliverable.');
      setTimeout(() => setNoticeMessage(null), 4000);
      return;
    }

    const newMemberStatuses: Record<string, TaskStatus> = {};
    assigneeList.forEach(mId => {
      newMemberStatuses[mId] = targetStatus;
    });

    onUpdateTask({
      ...task,
      status: targetStatus,
      memberStatuses: newMemberStatuses
    });
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
    <div className="space-y-4">
      {noticeMessage && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300 animate-in fade-in duration-200">
          <span className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{noticeMessage}</span>
          </span>
          <button 
            type="button" 
            onClick={() => setNoticeMessage(null)}
            className="p-1 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded transition-colors text-amber-700 dark:text-amber-400 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2-Column Kanban Grid: New Tasks and Done Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {COLUMNS.map(col => {
          const columnTasks = tasks.filter(t => (col.type === 'done' ? isTaskDone(t) : !isTaskDone(t)));
          const isColumnDragOver = dragOverCol === col.type;

          return (
            <div
              key={col.type}
              onDragOver={(e) => handleDragOver(e, col.type)}
              onDragLeave={(e) => handleDragLeave(e, col.type)}
              onDrop={(e) => handleDrop(e, col.type)}
              className={`bento-card p-4 min-w-0 transition-all ${
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
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold border ${col.badgeClass}`}>
                    {col.badgeLabel}
                  </span>
                  <span className="font-extrabold text-sm tracking-tight" style={{ color: 'var(--text-main)' }}>
                    {col.title}
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {columnTasks.length}
                  </span>
                </div>

                {onCreateTaskInStatus && (
                  <button
                    type="button"
                    onClick={() => onCreateTaskInStatus(col.targetStatus)}
                    title={`Add task to ${col.title}`}
                    className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-muted cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Tasks Cards Container */}
              <div className="space-y-3 min-h-[160px]">
                {columnTasks.map(task => {
                  const taskLecture = task.lectureId || task.week || 1;
                  const assigneeList = Array.isArray(task.assigneeIds) ? task.assigneeIds : (task.assigneeId ? [task.assigneeId] : []);
                  const isBeingDragged = draggedTaskId === task.id;
                  const cardDone = isTaskDone(task);

                  const rawLink = task.link || (task.description && task.description.startsWith('http') ? task.description.trim() : undefined);

                  return (
                    <div
                      key={task.id}
                      draggable={Boolean(user)}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => {
                        if (isDraggingRef.current) return;
                        onEditTask(task);
                      }}
                      className={`bento-card p-3.5 group transition-all ${
                        user ? 'cursor-grab active:cursor-grabbing hover:border-blue-400' : 'cursor-pointer'
                      } ${
                        isBeingDragged ? 'opacity-40 scale-95' : 'shadow-xs'
                      }`}
                      style={{ backgroundColor: 'var(--bg-surface)' }}
                    >
                      {/* Header: Priority, Lecture Badge, Link */}
                      <div className="flex items-center justify-between gap-1.5 mb-2">
                        <div className="flex items-center gap-1.5">
                          <GripVertical className="w-3 h-3 text-slate-400 opacity-40 group-hover:opacity-100" />
                          <span className="pill-badge pill-blue text-[10px] py-0.5 px-2">
                            L{taskLecture}
                          </span>
                          {rawLink && (
                            <a
                              href={rawLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={rawLink}
                              onClick={e => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all hover:underline"
                              style={{
                                backgroundColor: 'var(--bg-surface-elevated)',
                                color: 'var(--accent-blue)',
                                borderColor: 'var(--border-subtle)'
                              }}
                            >
                              <span>Link</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${getPriorityBadgeClass(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>

                      {/* Title & Description (Taste: NO strike-through, clear typography) */}
                      <h4 
                        className={`font-bold text-xs leading-snug mb-1 ${cardDone ? 'opacity-70' : ''}`} 
                        style={{ color: 'var(--text-main)' }}
                      >
                        {task.title}
                      </h4>
                      <p className="text-[11px] line-clamp-2 leading-relaxed mb-2" style={{ color: 'var(--text-muted)' }}>
                        {task.description || '-'}
                      </p>

                      {/* Prominent Resource Link Banner on Kanban Card */}
                      {rawLink && (
                        <div className="mb-2.5" onClick={e => e.stopPropagation()}>
                          <a
                            href={rawLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={rawLink}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all hover:underline border shadow-xs max-w-full"
                            style={{
                              backgroundColor: 'var(--bg-surface-elevated)',
                              color: 'var(--accent-blue)',
                              borderColor: 'var(--border-subtle)'
                            }}
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            <span className="truncate">{rawLink.replace(/^https?:\/\//, '')}</span>
                          </a>
                        </div>
                      )}

                      {/* Member Completion Progress & Interactive Chips (for multi-assignee tasks) */}
                      {assigneeList.length > 1 && (
                        <div 
                          className="my-2 p-2 rounded-lg border bg-slate-50/60 dark:bg-slate-900/40" 
                          style={{ borderColor: 'var(--border-subtle)' }} 
                          onClick={e => e.stopPropagation()}
                          onDragStart={e => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                            <span className="flex items-center gap-1">
                              <CheckSquare className="w-3 h-3 text-slate-400" />
                              <span>Member Progress</span>
                            </span>
                            <span className={assigneeList.every(mId => getTaskMemberStatus(task, mId) === 'Done') ? 'text-emerald-500 font-extrabold' : 'text-blue-500 font-extrabold'}>
                              {assigneeList.filter(mId => getTaskMemberStatus(task, mId) === 'Done').length}/{assigneeList.length} Done
                            </span>
                          </div>

                          {/* Mini Progress Bar */}
                          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                            <div 
                              className={`h-full transition-all duration-300 rounded-full ${
                                assigneeList.every(mId => getTaskMemberStatus(task, mId) === 'Done') ? 'bg-emerald-500' : 'bg-blue-500'
                              }`}
                              style={{ 
                                width: `${Math.round((assigneeList.filter(mId => getTaskMemberStatus(task, mId) === 'Done').length / assigneeList.length) * 100)}%` 
                              }}
                            />
                          </div>

                          {/* Interactive Member Status Chips */}
                          <div className="flex flex-wrap gap-1">
                            {assigneeList.map(mId => {
                              const member = members.find(m => m.id === mId);
                              if (!member) return null;
                              const isMemberDone = getTaskMemberStatus(task, mId) === 'Done';
                              const shortName = getMemberShortName(member.name);
                              return (
                                <button
                                  key={mId}
                                  type="button"
                                  draggable={false}
                                  onDragStart={(e) => e.stopPropagation()}
                                  title={`${member.name}: ${isMemberDone ? 'Done (Click to mark In Progress)' : 'In Progress (Click to mark Done)'}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (profile && !canEditTaskStatus(mId)) {
                                      setNoticeMessage(`Access restriction: Only ${member.name} (or Team Leader) can mark their own progress.`);
                                      setTimeout(() => setNoticeMessage(null), 4000);
                                      return;
                                    }
                                    if (onUpdateMemberTaskStatus) {
                                      onUpdateMemberTaskStatus(task.id, mId, isMemberDone ? 'In Progress' : 'Done');
                                    }
                                  }}
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                    isMemberDone 
                                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isMemberDone ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                  <span>{isMemberDone ? `✓ ${shortName}` : shortName}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Footer: Assignees, Due Date */}
                      <div className="pt-2 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
                        <div className="min-w-0 flex-1">
                          {renderAssignees(assigneeList)}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] font-medium flex items-center gap-1" style={{ color: 'var(--text-faint)' }}>
                            <Clock className="w-2.5 h-2.5" />
                            {task.dueDate.slice(5)}
                          </span>
                        </div>
                      </div>

                      {/* Quick Action Footer: 2-State Toggle + Edit + Delete */}
                      <div 
                        className="mt-2 pt-2 border-t flex items-center justify-between" 
                        style={{ borderColor: 'var(--border-subtle)' }} 
                        onClick={e => e.stopPropagation()}
                        onDragStart={e => e.stopPropagation()}
                      >
                        {/* 2-State Status Button matching Table View */}
                        <button
                          type="button"
                          onClick={() => handleToggleCardStatus(task)}
                          title={`Toggle status (currently ${cardDone ? 'Done' : 'New'})`}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold transition-all cursor-pointer border shadow-xs hover:opacity-90 active:scale-95 ${
                            cardDone
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${cardDone ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{cardDone ? 'Done' : 'New'}</span>
                        </button>

                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => onEditTask(task)}
                            title="Edit Task"
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-muted cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Delete this task?')) onDeleteTask(task.id);
                            }}
                            title="Delete Task"
                            className="p-1 rounded hover:bg-red-50 hover:text-red-500 transition-all text-muted cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {columnTasks.length === 0 && (
                  <div className="py-10 text-center text-xs border border-dashed rounded-xl" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-faint)' }}>
                    {col.type === 'new' 
                      ? 'No new deliverables. All tasks complete!' 
                      : 'Drag completed tasks here'
                    }
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
