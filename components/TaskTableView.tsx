'use client';

import React, { useState } from 'react';
import { 
  Task, 
  TaskStatus, 
  Priority, 
  Member, 
  getMemberShortName, 
  getTaskMemberStatus 
} from '@/types';
import { useAuth } from '@/context/AuthContext';
import { 
  ExternalLink, 
  Users2, 
  Edit3, 
  Trash2, 
  AlertCircle 
} from 'lucide-react';

interface TaskTableViewProps {
  tasks: Task[];
  members: Member[];
  onUpdateTask: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onUpdateMemberTaskStatus?: (taskId: string, memberId: string, status: TaskStatus) => void;
  currentMemberId?: string;
  onNotice?: (message: string) => void;
}

export const TaskTableView: React.FC<TaskTableViewProps> = ({
  tasks,
  members,
  onUpdateTask,
  onEditTask,
  onDeleteTask,
  onUpdateMemberTaskStatus,
  currentMemberId,
  onNotice
}) => {
  const { profile, isTeamLeader, canMoveTask, canEditTaskStatus } = useAuth();
  const [internalNotice, setInternalNotice] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    if (onNotice) {
      onNotice(msg);
    } else {
      setInternalNotice(msg);
      setTimeout(() => setInternalNotice(null), 4000);
    }
  };

  const getPriorityBadgeClass = (priority: Priority) => {
    switch (priority) {
      case 'High':
        return 'text-red-500 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900';
      case 'Medium':
        return 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900';
      case 'Low':
        return 'text-slate-500 bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800';
      default:
        return 'text-slate-500 bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800';
    }
  };

  // Toggle overall Task status (New <-> Done)
  const handleToggleTaskStatus = (task: Task) => {
    const isDone = task.status === 'Done';
    const check = canMoveTask(task, currentMemberId);
    if (!check.allowed) {
      showNotification(check.reason || 'Permission restricted: Unable to modify task status.');
      return;
    }

    const assigneeList = Array.isArray(task.assigneeIds) ? task.assigneeIds : [];
    const isMultiAssignee = assigneeList.length > 1;

    // If individual member on multi-assignee task, toggle their own progress
    if (currentMemberId && !isTeamLeader && isMultiAssignee) {
      const currentStatus = getTaskMemberStatus(task, currentMemberId);
      const nextMemberStatus: TaskStatus = currentStatus === 'Done' ? 'In Progress' : 'Done';
      
      if (onUpdateMemberTaskStatus) {
        onUpdateMemberTaskStatus(task.id, currentMemberId, nextMemberStatus);
      }
      return;
    }

    // Toggle full task
    const nextStatus: TaskStatus = isDone ? 'In Progress' : 'Done';
    const newMemberStatuses: Record<string, TaskStatus> = {};
    assigneeList.forEach(mId => {
      newMemberStatuses[mId] = nextStatus;
    });

    onUpdateTask({
      ...task,
      status: nextStatus,
      memberStatuses: newMemberStatuses
    });
  };

  // Toggle individual member chip on multi-assignee tasks
  const handleToggleMemberChip = (e: React.MouseEvent, task: Task, memberId: string) => {
    e.stopPropagation();
    
    if (profile && !canEditTaskStatus(memberId)) {
      const targetMember = members.find(m => m.id === memberId);
      showNotification(`Access restriction: Only ${targetMember?.name || 'the assignee'} (or Team Leader) can mark their own progress.`);
      return;
    }

    const currentStatus = getTaskMemberStatus(task, memberId);
    const nextStatus: TaskStatus = currentStatus === 'Done' ? 'In Progress' : 'Done';

    if (onUpdateMemberTaskStatus) {
      onUpdateMemberTaskStatus(task.id, memberId, nextStatus);
    } else {
      const updatedStatuses = { ...(task.memberStatuses || {}), [memberId]: nextStatus };
      const assigneeList = Array.isArray(task.assigneeIds) ? task.assigneeIds : [];
      const allDone = assigneeList.length > 0 && assigneeList.every(mId => updatedStatuses[mId] === 'Done');
      
      onUpdateTask({
        ...task,
        status: allDone ? 'Done' : 'In Progress',
        memberStatuses: updatedStatuses
      });
    }
  };

  // CRUCIAL REQUIREMENT: "done task goes down the list"
  const sortedTasks = [...tasks].sort((a, b) => {
    const aDone = a.status === 'Done' ? 1 : 0;
    const bDone = b.status === 'Done' ? 1 : 0;
    return aDone - bDone;
  });

  return (
    <div className="w-full space-y-3">
      {/* Optional Notice banner */}
      {internalNotice && (
        <div className="p-3 rounded-xl border bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
            <span>{internalNotice}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setInternalNotice(null)} 
            className="font-bold px-2 hover:opacity-70 cursor-pointer"
          >
            x
          </button>
        </div>
      )}

      {/* Bento Card Table Container */}
      <div className="bento-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr 
                className="border-b font-extrabold uppercase tracking-wider text-[10px]" 
                style={{ 
                  borderColor: 'var(--border-subtle)', 
                  backgroundColor: 'var(--bg-surface-elevated)', 
                  color: 'var(--text-faint)' 
                }}
              >
                <th className="py-3 px-4 min-w-[220px]">Task Title</th>
                <th className="py-3 px-4 min-w-[260px]">Description</th>
                <th className="py-3 px-3 w-20 text-center">Link</th>
                <th className="py-3 px-3 w-20 text-center">Lecture</th>
                <th className="py-3 px-3 w-24 text-center">Priority</th>
                <th className="py-3 px-4 min-w-[230px]">Assignees &amp; Member Progress</th>
                <th className="py-3 px-4 w-28 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {sortedTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs" style={{ color: 'var(--text-faint)' }}>
                    No tasks found matching the criteria.
                  </td>
                </tr>
              ) : (
                sortedTasks.map((task) => {
                  const isDone = task.status === 'Done';
                  const assigneeList = Array.isArray(task.assigneeIds) ? task.assigneeIds : [];
                  const assignedMembers = members.filter(m => assigneeList.includes(m.id));
                  
                  const doneCount = assigneeList.filter(
                    mId => getTaskMemberStatus(task, mId) === 'Done'
                  ).length;
                  const totalCount = assigneeList.length;
                  const allMembersDone = totalCount > 0 && doneCount === totalCount;
                  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : (isDone ? 100 : 0);

                  return (
                    <tr 
                      key={task.id}
                      className="transition-colors duration-150 ease-out hover:bg-slate-50/80 dark:hover:bg-white/[0.032] group"
                    >
                      {/* 1. Task Title (NO 'done' tag inside, NO line-through, crisp typography) */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-start justify-between gap-2">
                          <span 
                            className={`font-bold text-xs leading-snug tracking-tight block ${
                              isDone ? 'opacity-70' : ''
                            }`} 
                            style={{ color: 'var(--text-main)' }}
                          >
                            {task.title}
                          </span>

                          {/* Quick Edit/Delete on row hover */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            {onEditTask && (
                              <button
                                type="button"
                                onClick={() => onEditTask(task)}
                                title="Edit Task"
                                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            )}
                            {onDeleteTask && (
                              <button
                                type="button"
                                onClick={() => onDeleteTask(task.id)}
                                title="Delete Task"
                                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950/60 text-slate-400 hover:text-red-600 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Description (Clean text, NO 'done' badge inside) */}
                      <td className="py-3.5 px-4 align-top">
                        <span 
                          className="text-[11px] line-clamp-2 leading-relaxed block" 
                          style={{ color: 'var(--text-muted)' }}
                          title={task.description}
                        >
                          {task.description || '-'}
                        </span>
                      </td>

                      {/* 3. Link Column */}
                      <td className="py-3.5 px-3 align-top text-center" onClick={e => e.stopPropagation()}>
                        {task.link ? (
                          <a
                            href={task.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open resource link"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all hover:underline border shadow-xs"
                            style={{
                              backgroundColor: 'var(--bg-surface-elevated)',
                              color: 'var(--accent-blue)',
                              borderColor: 'var(--border-subtle)'
                            }}
                          >
                            <span>Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700 font-mono">-</span>
                        )}
                      </td>

                      {/* 4. Lecture Column */}
                      <td className="py-3.5 px-3 align-top text-center">
                        <span 
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border" 
                          style={{ 
                            backgroundColor: 'var(--accent-blue-soft)', 
                            borderColor: 'var(--border-subtle)', 
                            color: 'var(--accent-blue)' 
                          }}
                        >
                          L{task.lectureId || task.week || 1}
                        </span>
                      </td>

                      {/* 5. Priority Column */}
                      <td className="py-3.5 px-3 align-top text-center">
                        <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getPriorityBadgeClass(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>

                      {/* 6. Assignees & Member Progress Column */}
                      <td className="py-3.5 px-4 align-top" onClick={e => e.stopPropagation()}>
                        <div className="space-y-1.5">
                          {totalCount === 0 ? (
                            <span className="text-[11px] italic flex items-center gap-1 text-slate-400">
                              <Users2 className="w-3 h-3" /> Unassigned
                            </span>
                          ) : (
                            <>
                              {/* Overlapping Avatars + Progress Count */}
                              <div className="flex items-center gap-2">
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

                                <span className={`text-[10px] font-extrabold ${allMembersDone ? 'text-emerald-500' : 'text-blue-500'}`}>
                                  {doneCount}/{totalCount} Done
                                </span>
                              </div>

                              {/* Mini Progress Bar */}
                              <div className="w-full max-w-[150px] h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-300 rounded-full ${
                                    allMembersDone ? 'bg-emerald-500' : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>

                              {/* Interactive Member Chips for Multi-Assignee Tasks */}
                              {totalCount > 1 && (
                                <div className="flex items-center gap-1 flex-wrap pt-0.5">
                                  {assignedMembers.map(m => {
                                    const mDone = getTaskMemberStatus(task, m.id) === 'Done';
                                    const isCurrent = m.id === currentMemberId;
                                    const shortName = getMemberShortName(m.name);

                                    return (
                                      <button
                                        key={m.id}
                                        type="button"
                                        onClick={(e) => handleToggleMemberChip(e, task, m.id)}
                                        title={`${m.name}: ${mDone ? 'Done (Click to mark In Progress)' : 'In Progress (Click to mark Done)'}`}
                                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                          mDone 
                                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                                            : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                                        } ${isCurrent ? 'ring-1 ring-blue-500' : ''}`}
                                      >
                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${mDone ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                        <span>{mDone ? `✓ ${shortName}` : shortName}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </td>

                      {/* 7. Status Column (Interactive Button showing 'Done' or 'New', NOT a checkbox!) */}
                      <td className="py-3.5 px-4 align-top text-center" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleToggleTaskStatus(task)}
                          title="Click to toggle status between New and Done"
                          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer border shadow-xs hover:opacity-90 active:scale-95 ${
                            isDone 
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isDone ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                          <span>{isDone ? 'Done' : 'New'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
