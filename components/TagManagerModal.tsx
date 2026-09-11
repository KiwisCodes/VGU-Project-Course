'use client';

import React, { useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Tag as TagIcon, X, Plus, Trash2, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

interface TagManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTagDeleted?: (deletedTag: string) => void;
}

export const TagManagerModal: React.FC<TagManagerModalProps> = ({
  isOpen,
  onClose,
  onTagDeleted
}) => {
  const { tags, tasks, addTag, deleteTag } = useProject();
  const [newTagInput, setNewTagInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  // Calculate task counts per tag
  const getTaskCountForTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    return tasks.filter(t => (t.tag || t.pillar || '').trim().toLowerCase() === trimmed).length;
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTagInput.trim();
    if (!trimmed) return;

    if (tags.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
      setFeedback({
        type: 'error',
        message: `Tag "${trimmed}" already exists.`
      });
      return;
    }

    addTag(trimmed);
    setNewTagInput('');
    setFeedback({
      type: 'success',
      message: `Tag "${trimmed}" created successfully.`
    });
  };

  const handleDeleteTag = (tag: string) => {
    const result = deleteTag(tag);
    if (result.success) {
      setFeedback({ type: 'success', message: result.message });
      if (onTagDeleted) {
        onTagDeleted(tag);
      }
    } else {
      setFeedback({ type: 'error', message: result.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div 
        className="bento-card w-full max-w-md p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-150"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-500">
              <TagIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm" style={{ color: 'var(--text-main)' }}>
                Manage Project Tags
              </h3>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Tags with active tasks cannot be deleted to maintain data integrity.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div 
            className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
              feedback.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span className="flex-1 leading-relaxed">{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-[10px] font-bold opacity-60 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Create New Tag Input */}
        <form onSubmit={handleAddTag} className="flex gap-2">
          <input
            type="text"
            placeholder="Add new tag name..."
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1"
            style={{ 
              backgroundColor: 'var(--bg-surface-elevated)', 
              borderColor: 'var(--border-strong)', 
              color: 'var(--text-main)' 
            }}
          />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            style={{ backgroundColor: 'var(--accent-blue)' }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>

        {/* Tag List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold px-1" style={{ color: 'var(--text-faint)' }}>
            <span>ALL TAGS ({tags.length})</span>
            <span>ASSOCIATED TASKS</span>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
            {tags.map((tag) => {
              const taskCount = getTaskCountForTag(tag);
              const isLocked = taskCount > 0;

              return (
                <div
                  key={tag}
                  className="flex items-center justify-between p-2.5 rounded-xl border transition-all"
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-subtle)'
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span 
                      className="px-2 py-0.5 rounded-md text-xs font-bold tracking-tight truncate"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      {tag}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isLocked ? (
                      <div 
                        className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-muted"
                        title={`Cannot delete: Assigned to ${taskCount} task(s)`}
                      >
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>{taskCount} task{taskCount > 1 ? 's' : ''}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted px-2 py-0.5">
                        0 tasks
                      </span>
                    )}

                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => handleDeleteTag(tag)}
                      title={
                        isLocked
                          ? `Cannot delete: ${taskCount} task(s) currently use this tag.`
                          : `Delete "${tag}" tag`
                      }
                      className={`p-1.5 rounded-lg border transition-all ${
                        isLocked
                          ? 'opacity-30 cursor-not-allowed border-transparent'
                          : 'hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 hover:border-rose-200 dark:hover:border-rose-800 text-muted cursor-pointer'
                      }`}
                      style={{ borderColor: isLocked ? 'transparent' : 'var(--border-subtle)' }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t flex justify-end" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold border hover:opacity-80 transition-all cursor-pointer"
            style={{ 
              borderColor: 'var(--border-subtle)', 
              backgroundColor: 'var(--bg-surface-elevated)', 
              color: 'var(--text-main)' 
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
