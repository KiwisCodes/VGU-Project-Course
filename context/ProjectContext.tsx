'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Member, Task, DriveFolder, DriveFile } from '@/types';
import { INITIAL_MEMBERS, INITIAL_TASKS, INITIAL_MEMBER_NOTES } from '@/data/initialData';
import { DRIVE_FOLDERS } from '@/data/driveData';

interface ProjectContextType {
  members: Member[];
  tasks: Task[];
  memberNotes: Record<string, string>;
  driveFolders: DriveFolder[];
  tags: string[];
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  // Tag Actions
  addTag: (tag: string) => void;
  deleteTag: (tag: string) => { success: boolean; message: string };
  // Task Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  // Member Actions
  addMember: (member: Omit<Member, 'id'>) => void;
  updateMember: (member: Member) => void;
  deleteMember: (memberId: string) => void;
  setMemberNote: (memberId: string, note: string) => void;
  setMemberLectureNote: (memberId: string, lectureId: number, note: string) => void;
  getMemberLectureNote: (memberId: string, lectureId: number) => string;
  // Drive System Actions
  addDriveFolder: (folder: Omit<DriveFolder, 'id' | 'files'>) => void;
  updateDriveFolder: (folderId: string, updates: Partial<DriveFolder>) => void;
  deleteDriveFolder: (folderId: string) => void;
  addDriveFile: (folderId: string, file: Omit<DriveFile, 'id' | 'updatedAt'>) => void;
  updateDriveFile: (folderId: string, fileId: string, updates: Partial<DriveFile>) => void;
  deleteDriveFile: (folderId: string, fileId: string) => void;
  // Backup
  exportData: () => void;
  importData: (jsonStr: string) => boolean;
  resetToDefaults: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const DEFAULT_TAGS = [
  'Data Engineering',
  'Fine-Tuning',
  'RAG / KG',
  'Multi-Agents',
  'DevOps / Report',
  'Evaluation'
];

const STORAGE_KEYS = {
  MEMBERS: 'vgu_project_members_v2',
  TASKS: 'vgu_project_tasks_v4',
  LEGACY_TASKS_V3: 'vgu_project_tasks_v3',
  LEGACY_TASKS_V2: 'vgu_project_tasks_v2',
  LEGACY_TASKS: 'vgu_project_tasks_v1',
  NOTES: 'vgu_project_notes_v2',
  LEGACY_NOTES_V1: 'vgu_project_notes_v1',
  DRIVE: 'vgu_project_drive_v1',
  TAGS: 'vgu_project_tags_v1',
  THEME: 'vgu_project_theme_preference'
};

const normalizeTask = (t: any): Task => {
  let assigneeIds: string[] = [];
  if (Array.isArray(t.assigneeIds)) {
    assigneeIds = t.assigneeIds;
  } else if (t.assigneeId) {
    assigneeIds = [t.assigneeId];
  }
  const lectureId = typeof t.lectureId === 'number' ? t.lectureId : (typeof t.week === 'number' ? t.week : 1);
  const tag = t.tag || t.pillar || 'Data Engineering';
  return {
    ...t,
    assigneeIds,
    lectureId,
    tag,
    pillar: tag // Keep pillar for backward compatibility
  };
};

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS.map(normalizeTask));
  const [memberNotes, setMemberNotes] = useState<Record<string, string>>(INITIAL_MEMBER_NOTES);
  const [driveFolders, setDriveFolders] = useState<DriveFolder[]>(DRIVE_FOLDERS);
  const [tags, setTags] = useState<string[]>(DEFAULT_TAGS);
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize from LocalStorage with auto-migration
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark';
      if (storedTheme === 'dark' || storedTheme === 'light') {
        setThemeState(storedTheme);
        document.documentElement.setAttribute('data-theme', storedTheme);
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
      }

      const storedMembers = localStorage.getItem(STORAGE_KEYS.MEMBERS);
      if (storedMembers) {
        try {
          const parsed = JSON.parse(storedMembers);
          if (Array.isArray(parsed) && parsed.some((m: any) => m.name === 'Alex Nguyen')) {
            setMembers(INITIAL_MEMBERS);
            localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(INITIAL_MEMBERS));
          } else if (Array.isArray(parsed) && parsed.length > 0) {
            setMembers(parsed);
          }
        } catch (e) {
          setMembers(INITIAL_MEMBERS);
        }
      }

      const storedTasksV4 = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (storedTasksV4) {
        try {
          const parsed = JSON.parse(storedTasksV4);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTasks(parsed.map(normalizeTask));
          } else {
            setTasks(INITIAL_TASKS.map(normalizeTask));
          }
        } catch (e) {
          setTasks(INITIAL_TASKS.map(normalizeTask));
        }
      } else {
        // Automatically switch to new INITIAL_TASKS and remove obsolete task keys
        setTasks(INITIAL_TASKS.map(normalizeTask));
        try {
          localStorage.removeItem(STORAGE_KEYS.LEGACY_TASKS_V3);
          localStorage.removeItem(STORAGE_KEYS.LEGACY_TASKS_V2);
          localStorage.removeItem(STORAGE_KEYS.LEGACY_TASKS);
        } catch (e) {}
      }

      const storedNotes = localStorage.getItem(STORAGE_KEYS.NOTES);
      if (storedNotes) {
        try {
          const parsedNotes = JSON.parse(storedNotes);
          if (parsedNotes && typeof parsedNotes === 'object' && !Array.isArray(parsedNotes)) {
            setMemberNotes(parsedNotes);
          } else {
            setMemberNotes({});
          }
        } catch (e) {
          setMemberNotes({});
        }
      } else {
        // Reset to completely clean notes
        setMemberNotes({});
        try {
          localStorage.removeItem(STORAGE_KEYS.LEGACY_NOTES_V1);
        } catch (e) {}
      }

      const storedDrive = localStorage.getItem(STORAGE_KEYS.DRIVE);
      if (storedDrive) {
        setDriveFolders(JSON.parse(storedDrive));
      }

      const storedTags = localStorage.getItem(STORAGE_KEYS.TAGS);
      if (storedTags) {
        try {
          const parsed = JSON.parse(storedTags);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTags(Array.from(new Set([...DEFAULT_TAGS, ...parsed])));
          }
        } catch (e) {}
      }
    } catch (e) {
      console.error('Failed to load project state from localStorage:', e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Sync to LocalStorage whenever state updates
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(memberNotes));
      localStorage.setItem(STORAGE_KEYS.DRIVE, JSON.stringify(driveFolders));
      localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
    }
  }, [members, tasks, memberNotes, driveFolders, tags, theme, isHydrated]);

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
  };

  const addTag = (newTag: string) => {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    setTags(prev => prev.includes(trimmed) ? prev : [...prev, trimmed]);
  };

  const deleteTag = (tagToDelete: string): { success: boolean; message: string } => {
    const trimmed = tagToDelete.trim();
    if (!trimmed) {
      return { success: false, message: 'Tag name cannot be empty.' };
    }
    const associatedTasksCount = tasks.filter(
      t => (t.tag || t.pillar || '').trim().toLowerCase() === trimmed.toLowerCase()
    ).length;

    if (associatedTasksCount > 0) {
      return {
        success: false,
        message: `Cannot delete tag "${trimmed}": It is currently assigned to ${associatedTasksCount} task${associatedTasksCount > 1 ? 's' : ''}. Reassign or remove the tag from those tasks first.`
      };
    }

    setTags(prev => prev.filter(t => t.toLowerCase() !== trimmed.toLowerCase()));
    return {
      success: true,
      message: `Tag "${trimmed}" deleted successfully.`
    };
  };

  // --- Task Methods ---
  const addTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const tag = taskData.tag || (taskData as any).pillar || 'Data Engineering';
    const newTask: Task = {
      ...taskData,
      tag,
      pillar: tag,
      id: 'task-' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0]
    };
    setTasks(prev => [newTask, ...prev]);
    addTag(tag);
  };

  const updateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => (t.id === updatedTask.id ? normalizeTask(updatedTask) : t)));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // --- Member Methods ---
  const addMember = (memberData: Omit<Member, 'id'>) => {
    const newMember: Member = {
      ...memberData,
      id: 'member-' + Date.now()
    };
    setMembers(prev => [...prev, newMember]);
  };

  const updateMember = (updatedMember: Member) => {
    setMembers(prev => prev.map(m => (m.id === updatedMember.id ? updatedMember : m)));
  };

  const deleteMember = (memberId: string) => {
    setMembers(prev => prev.filter(m => m.id !== memberId));
    setTasks(prev => prev.map(t => ({
      ...t,
      assigneeIds: t.assigneeIds.filter(id => id !== memberId)
    })));
  };

  const getMemberLectureNote = (memberId: string, lectureId: number): string => {
    const key = `${memberId}_lecture_${lectureId}`;
    if (memberNotes[key] !== undefined) {
      return memberNotes[key];
    }
    // Backward compatibility for lecture 1
    if (lectureId === 1 && memberNotes[memberId] !== undefined) {
      return memberNotes[memberId];
    }
    return '';
  };

  const setMemberLectureNote = (memberId: string, lectureId: number, note: string) => {
    const key = `${memberId}_lecture_${lectureId}`;
    setMemberNotes(prev => {
      const next = {
        ...prev,
        [key]: note
      };
      if (lectureId === 1) {
        next[memberId] = note;
      }
      return next;
    });
  };

  const setMemberNote = (memberId: string, note: string) => {
    setMemberLectureNote(memberId, 1, note);
  };

  // --- Drive System Methods ---
  const addDriveFolder = (folderData: Omit<DriveFolder, 'id' | 'files'>) => {
    const newFolder: DriveFolder = {
      ...folderData,
      id: folderData.name || `Folder-${Date.now()}`,
      files: []
    };
    setDriveFolders(prev => [...prev, newFolder]);
  };

  const updateDriveFolder = (folderId: string, updates: Partial<DriveFolder>) => {
    setDriveFolders(prev => prev.map(f => (f.id === folderId ? { ...f, ...updates } : f)));
  };

  const deleteDriveFolder = (folderId: string) => {
    setDriveFolders(prev => prev.filter(f => f.id !== folderId));
  };

  const addDriveFile = (folderId: string, fileData: Omit<DriveFile, 'id' | 'updatedAt'>) => {
    const newFile: DriveFile = {
      ...fileData,
      id: 'file-' + Date.now(),
      updatedAt: new Date().toISOString().split('T')[0]
    };
    setDriveFolders(prev => prev.map(f => {
      if (f.id === folderId) {
        return {
          ...f,
          files: [newFile, ...f.files]
        };
      }
      return f;
    }));
  };

  const updateDriveFile = (folderId: string, fileId: string, updates: Partial<DriveFile>) => {
    setDriveFolders(prev => prev.map(f => {
      if (f.id === folderId) {
        return {
          ...f,
          files: f.files.map(file => (file.id === fileId ? { ...file, ...updates } : file))
        };
      }
      return f;
    }));
  };

  const deleteDriveFile = (folderId: string, fileId: string) => {
    setDriveFolders(prev => prev.map(f => {
      if (f.id === folderId) {
        return {
          ...f,
          files: f.files.filter(file => file.id !== fileId)
        };
      }
      return f;
    }));
  };

  // --- Backup & Restore ---
  const exportData = () => {
    const data = {
      version: 3,
      exportedAt: new Date().toISOString(),
      members,
      tasks,
      memberNotes,
      driveFolders,
      tags
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vgu-project-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed.members) && Array.isArray(parsed.tasks)) {
        setMembers(parsed.members);
        setTasks(parsed.tasks.map(normalizeTask));
        if (parsed.memberNotes && typeof parsed.memberNotes === 'object' && !Array.isArray(parsed.memberNotes)) {
          setMemberNotes(parsed.memberNotes);
        }
        if (Array.isArray(parsed.driveFolders)) setDriveFolders(parsed.driveFolders);
        if (Array.isArray(parsed.tags)) setTags(Array.from(new Set([...DEFAULT_TAGS, ...parsed.tags])));
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to parse import data:', e);
      return false;
    }
  };

  const resetToDefaults = () => {
    setMembers(INITIAL_MEMBERS);
    setTasks(INITIAL_TASKS.map(normalizeTask));
    setMemberNotes({});
    setDriveFolders(DRIVE_FOLDERS);
    setTags(DEFAULT_TAGS);
    localStorage.removeItem(STORAGE_KEYS.MEMBERS);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.LEGACY_TASKS_V3);
    localStorage.removeItem(STORAGE_KEYS.LEGACY_TASKS_V2);
    localStorage.removeItem(STORAGE_KEYS.LEGACY_TASKS);
    localStorage.removeItem(STORAGE_KEYS.NOTES);
    localStorage.removeItem(STORAGE_KEYS.LEGACY_NOTES_V1);
    localStorage.removeItem(STORAGE_KEYS.DRIVE);
    localStorage.removeItem(STORAGE_KEYS.TAGS);
  };

  return (
    <ProjectContext.Provider
      value={{
        members,
        tasks,
        memberNotes,
        driveFolders,
        tags,
        theme,
        setTheme,
        toggleTheme,
        addTag,
        deleteTag,
        addTask,
        updateTask,
        deleteTask,
        addMember,
        updateMember,
        deleteMember,
        setMemberNote,
        setMemberLectureNote,
        getMemberLectureNote,
        addDriveFolder,
        updateDriveFolder,
        deleteDriveFolder,
        addDriveFile,
        updateDriveFile,
        deleteDriveFile,
        exportData,
        importData,
        resetToDefaults
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
