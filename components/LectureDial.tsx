'use client';

import React from 'react';
import { Task } from '@/types';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';

interface LectureDialProps {
  selectedLecture: number | 'all';
  onSelectLecture: (lecture: number | 'all') => void;
  tasks: Task[];
  totalLectures?: number;
}

export const LectureDial: React.FC<LectureDialProps> = ({
  selectedLecture,
  onSelectLecture,
  tasks,
  totalLectures = 16
}) => {
  // Resolved active lecture number for math
  const activeLectureNum = typeof selectedLecture === 'number' ? selectedLecture : 1;

  // Cyclic navigation via buttons
  const handlePrev = () => {
    if (selectedLecture === 'all') {
      onSelectLecture(totalLectures);
      return;
    }
    const prev = selectedLecture === 1 ? totalLectures : selectedLecture - 1;
    onSelectLecture(prev);
  };

  const handleNext = () => {
    if (selectedLecture === 'all') {
      onSelectLecture(1);
      return;
    }
    const next = selectedLecture === totalLectures ? 1 : selectedLecture + 1;
    onSelectLecture(next);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    }
  };

  // Offsets for the dial circle window: 7 positions [-3, -2, -1, 0, 1, 2, 3]
  const visibleOffsets = [-3, -2, -1, 0, 1, 2, 3];

  const getLectureAtOffset = (offset: number) => {
    const raw = activeLectureNum + offset;
    // 1-indexed cyclic modulo
    return (((raw - 1) % totalLectures + totalLectures) % totalLectures) + 1;
  };

  // Task count for current selection
  const currentTasks = selectedLecture === 'all'
    ? tasks
    : tasks.filter(t => (t.lectureId || t.week || 1) === selectedLecture);
  const currentCompleted = currentTasks.filter(t => t.status === 'Done').length;

  return (
    <div
      className="bento-card p-3 sm:px-4 sm:py-3 select-none"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Left: Info Label */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onSelectLecture('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedLecture === 'all'
                ? 'shadow-xs text-white'
                : 'border hover:opacity-80'
            }`}
            style={{
              backgroundColor: selectedLecture === 'all' ? 'var(--accent-blue)' : 'var(--bg-surface-elevated)',
              borderColor: selectedLecture === 'all' ? 'transparent' : 'var(--border-subtle)',
              color: selectedLecture === 'all' ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All ({tasks.length})</span>
          </button>

          <div className="hidden sm:block">
            <span className="text-xs font-extrabold block" style={{ color: 'var(--text-main)' }}>
              {selectedLecture === 'all' ? 'All Course Lectures' : `Lecture ${selectedLecture}`}
            </span>
            <span className="text-[10px] block" style={{ color: 'var(--text-muted)' }}>
              {currentTasks.length === 0 ? '0 tasks assigned' : `${currentCompleted}/${currentTasks.length} completed`}
            </span>
          </div>
        </div>

        {/* Center: Minimal Circle Dial with Active Center Node */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-1 max-w-md mx-auto">
          
          {/* Previous Arrow */}
          <button
            type="button"
            onClick={handlePrev}
            title="Previous Lecture"
            className="p-1.5 rounded-full border hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-muted cursor-pointer shrink-0"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Dial Strip */}
          <div className="flex items-center justify-center gap-1 sm:gap-2 overflow-hidden px-1 py-1">
            {visibleOffsets.map(offset => {
              const lecNum = getLectureAtOffset(offset);
              const isCenter = offset === 0 && selectedLecture !== 'all';
              const lecTasks = tasks.filter(t => (t.lectureId || t.week || 1) === lecNum);
              const hasTasks = lecTasks.length > 0;
              const allDone = hasTasks && lecTasks.every(t => t.status === 'Done');

              // Distances for visual scale & opacity
              const absDist = Math.abs(offset);
              const scale = absDist === 0 ? 'scale-110' : absDist === 1 ? 'scale-95 opacity-80' : absDist === 2 ? 'scale-85 opacity-55' : 'scale-75 opacity-30';

              return (
                <button
                  key={`${offset}-${lecNum}`}
                  type="button"
                  onClick={() => onSelectLecture(lecNum)}
                  title={`Lecture ${lecNum} (${lecTasks.length} tasks)`}
                  className={`relative flex flex-col items-center justify-center rounded-full transition-all duration-200 cursor-pointer ${scale} ${
                    isCenter
                      ? 'w-10 h-10 sm:w-11 sm:h-11 shadow-md ring-2 ring-blue-500/50'
                      : 'w-8 h-8 sm:w-9 sm:h-9 hover:opacity-100 hover:scale-100'
                  }`}
                  style={{
                    backgroundColor: isCenter 
                      ? 'var(--accent-blue)' 
                      : 'var(--bg-surface-elevated)',
                    border: isCenter 
                      ? '2px solid #ffffff' 
                      : '1px solid var(--border-subtle)',
                    color: isCenter ? '#ffffff' : 'var(--text-main)'
                  }}
                >
                  <span className={`text-xs ${isCenter ? 'font-black' : 'font-semibold'}`}>
                    {lecNum}
                  </span>

                  {/* Task Indicator Dot */}
                  {hasTasks && (
                    <span 
                      className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border ${
                        allDone ? 'bg-emerald-500' : 'bg-blue-400'
                      }`}
                      style={{ borderColor: 'var(--bg-surface)' }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Next Arrow */}
          <button
            type="button"
            onClick={handleNext}
            title="Next Lecture"
            className="p-1.5 rounded-full border hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-muted cursor-pointer shrink-0"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Lecture Range Indicator */}
        <div className="hidden md:flex items-center justify-end gap-2 text-[11px] shrink-0" style={{ color: 'var(--text-faint)' }}>
          <span className="px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
            1 - {totalLectures}
          </span>
        </div>

      </div>
    </div>
  );
};
