'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Member, Task, DriveFolder, DriveFile, TaskStatus, getTaskOverallStatus } from '@/types';
import { INITIAL_MEMBERS, INITIAL_TASKS, INITIAL_MEMBER_NOTES } from '@/data/initialData';
import { DRIVE_FOLDERS } from '@/data/driveData';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface ProjectContextType {
  members: Member[];
  tasks: Task[];
  memberNotes: Record<string, string>;
  driveFolders: DriveFolder[];
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  isSupabase: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline';
  // Task Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  setMemberTaskStatus: (taskId: string, memberId: string, status: TaskStatus) => void;
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

const STORAGE_KEYS = {
  MEMBERS: 'vgu_project_members_v2',
  TASKS: 'vgu_project_tasks_v5',
  LEGACY_TASKS_V4: 'vgu_project_tasks_v4',
  LEGACY_TASKS_V3: 'vgu_project_tasks_v3',
  LEGACY_TASKS_V2: 'vgu_project_tasks_v2',
  LEGACY_TASKS: 'vgu_project_tasks_v1',
  NOTES: 'vgu_project_notes_v2',
  LEGACY_NOTES_V1: 'vgu_project_notes_v1',
  DRIVE: 'vgu_project_drive_v1',
  THEME: 'vgu_project_theme_preference'
};

export const normalizeTask = (t: any): Task => {
  let assigneeIds: string[] = [];
  if (Array.isArray(t.assigneeIds)) {
    assigneeIds = t.assigneeIds;
  } else if (t.assigneeId) {
    assigneeIds = [t.assigneeId];
  }
  const lectureId = typeof t.lectureId === 'number' ? t.lectureId : (typeof t.week === 'number' ? t.week : 1);
  const memberStatuses = (t.memberStatuses && typeof t.memberStatuses === 'object' && !Array.isArray(t.memberStatuses))
    ? { ...t.memberStatuses }
    : {};

  const status: TaskStatus = t.status || 'Backlog';

  // Ensure memberStatuses has entries for all assignees
  assigneeIds.forEach((mId) => {
    if (!memberStatuses[mId]) {
      memberStatuses[mId] = status;
    }
  });

  return {
    ...t,
    link: t.link || '',
    assigneeIds,
    lectureId,
    memberStatuses,
    status,
  };
};

function mapDbProfileToMember(row: any): Member {
  return {
    id: row.id,
    name: row.name,
    studentId: row.student_id || undefined,
    role: row.role || '',
    email: row.email || '',
    phone: row.phone || undefined,
    avatarBg: row.avatar_bg || '#2563eb',
    initials: row.initials || (row.name ? row.name.slice(0, 2).toUpperCase() : 'U'),
    bio: row.bio || '',
    skills: Array.isArray(row.skills) ? row.skills : [],
    isTeamLeader: Boolean(row.is_team_leader),
  };
}

function mapDbTaskToTask(row: any): Task {
  const assignees = Array.isArray(row.task_assignees) ? row.task_assignees : [];
  const assigneeIds = assignees.map((a: any) => a.member_id);
  const memberStatuses: Record<string, TaskStatus> = {};
  assignees.forEach((a: any) => {
    if (a.member_id) {
      memberStatuses[a.member_id] = a.status || 'Backlog';
    }
  });

  const baseTask: Task = {
    id: row.id,
    title: row.title,
    description: row.description || '',
    link: row.link || '',
    lectureId: row.lecture_id || 1,
    priority: row.priority || 'Medium',
    status: row.status || 'Backlog',
    dueDate: row.due_date ? String(row.due_date).split('T')[0] : new Date().toISOString().split('T')[0],
    createdAt: row.created_at ? String(row.created_at).split('T')[0] : new Date().toISOString().split('T')[0],
    assigneeIds,
    memberStatuses,
  };
  return normalizeTask(baseTask);
}

function mapDbFolderToFolder(folderRow: any): DriveFolder {
  const files = Array.isArray(folderRow.drive_files)
    ? folderRow.drive_files.map((f: any) => ({
        id: f.id,
        name: f.name,
        title: f.title,
        author: f.author || undefined,
        type: f.type || 'pdf',
        size: f.size || '0 KB',
        sizeBytes: Number(f.size_bytes) || 0,
        url: f.url || '',
        updatedAt: f.updated_at ? String(f.updated_at).split('T')[0] : new Date().toISOString().split('T')[0],
        description: f.description || undefined,
        highlights: Array.isArray(f.highlights) ? f.highlights : [],
      }))
    : [];

  return {
    id: folderRow.id,
    name: folderRow.name,
    lectureNumber: folderRow.lecture_number,
    date: folderRow.date,
    status: folderRow.status,
    description: folderRow.description || '',
    files,
  };
}

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [memberNotes, setMemberNotes] = useState<Record<string, string>>({});
  const [driveFolders, setDriveFolders] = useState<DriveFolder[]>(DRIVE_FOLDERS);
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [isHydrated, setIsHydrated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('offline');

  // Load theme preference early
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark';
      if (storedTheme === 'dark' || storedTheme === 'light') {
        setThemeState(storedTheme);
        document.documentElement.setAttribute('data-theme', storedTheme);
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } catch (e) {}
  }, []);

  // Fetch all state from Supabase
  const fetchSupabaseData = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setSyncStatus('syncing');

    try {
      // 1. Fetch Profiles
      const { data: profileRows, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (!profileErr && profileRows) {
        setMembers(profileRows.map(mapDbProfileToMember));
      }

      // 2. Fetch Tasks with Assignees
      const { data: taskRows, error: taskErr } = await supabase
        .from('tasks')
        .select('*, task_assignees(*)');

      if (!taskErr && taskRows) {
        setTasks(taskRows.map(mapDbTaskToTask));
      }

      // 3. Fetch Member Notes
      const { data: noteRows, error: noteErr } = await supabase
        .from('member_notes')
        .select('*');

      if (!noteErr && noteRows) {
        const notesMap: Record<string, string> = {};
        noteRows.forEach((n: any) => {
          notesMap[`${n.member_id}_lecture_${n.lecture_id}`] = n.content;
          if (n.lecture_id === 1) {
            notesMap[n.member_id] = n.content;
          }
        });
        setMemberNotes(notesMap);
      }

      // 4. Fetch Drive Folders with Files
      const { data: folderRows, error: folderErr } = await supabase
        .from('drive_folders')
        .select('*, drive_files(*)')
        .order('lecture_number', { ascending: true });

      if (!folderErr && folderRows && folderRows.length > 0) {
        setDriveFolders(folderRows.map(mapDbFolderToFolder));
      }

      setSyncStatus('synced');
    } catch (err) {
      console.error('Error fetching Supabase data:', err);
      setSyncStatus('offline');
    }
  }, []);

  // Primary Hydration: Supabase first, fallback to LocalStorage
  useEffect(() => {
    if (isSupabaseConfigured) {
      fetchSupabaseData().finally(() => setIsHydrated(true));
      return;
    }

    // LocalStorage Fallback
    try {
      const storedMembers = localStorage.getItem(STORAGE_KEYS.MEMBERS);
      if (storedMembers) {
        try {
          const parsed = JSON.parse(storedMembers);
          if (Array.isArray(parsed)) {
            const hasLegacyDummy = parsed.some((m: any) => 
              m.name === 'Alex Nguyen' || 
              m.name === 'Lê Quang Minh Khoa' || 
              m.name === 'Nguyễn Võ Minh Khôi' || 
              m.name === 'Nguyễn Đức Khang' || 
              m.name === 'Dương Quý Trang'
            );
            if (hasLegacyDummy) {
              setMembers(INITIAL_MEMBERS);
              localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(INITIAL_MEMBERS));
            } else if (parsed.length > 0) {
              setMembers(parsed);
            }
          }
        } catch (e) {
          setMembers(INITIAL_MEMBERS);
        }
      }

      const storedTasksV5 = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (storedTasksV5) {
        try {
          const parsed = JSON.parse(storedTasksV5);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTasks(parsed.map(normalizeTask));
          }
        } catch (e) {}
      }

      const storedNotes = localStorage.getItem(STORAGE_KEYS.NOTES);
      if (storedNotes) {
        try {
          const parsedNotes = JSON.parse(storedNotes);
          if (parsedNotes && typeof parsedNotes === 'object' && !Array.isArray(parsedNotes)) {
            setMemberNotes(parsedNotes);
          }
        } catch (e) {}
      }

      const storedDrive = localStorage.getItem(STORAGE_KEYS.DRIVE);
      if (storedDrive) {
        try {
          setDriveFolders(JSON.parse(storedDrive));
        } catch (e) {}
      }
    } catch (e) {
      console.error('Failed to load project state from localStorage:', e);
    } finally {
      setIsHydrated(true);
      setSyncStatus('offline');
    }
  }, [fetchSupabaseData]);

  // Realtime Subscriptions when Supabase is configured
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('vgu-project-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchSupabaseData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_assignees' }, () => {
        fetchSupabaseData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'member_notes' }, () => {
        fetchSupabaseData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchSupabaseData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drive_folders' }, () => {
        fetchSupabaseData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drive_files' }, () => {
        fetchSupabaseData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSupabaseData]);

  // Sync to LocalStorage as secondary offline backup
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(memberNotes));
      localStorage.setItem(STORAGE_KEYS.DRIVE, JSON.stringify(driveFolders));
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (e) {}
  }, [members, tasks, memberNotes, driveFolders, theme, isHydrated]);

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
  };

  // --- Task Methods ---
  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const tempId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'task-' + Date.now();
    const today = new Date().toISOString().split('T')[0];

    const newTask: Task = {
      ...taskData,
      id: tempId,
      createdAt: today,
    };

    setTasks((prev) => [newTask, ...prev]);

    if (isSupabaseConfigured) {
      try {
        // Insert task row
        const { data: inserted, error: taskErr } = await supabase
          .from('tasks')
          .insert({
            title: taskData.title,
            description: taskData.description || '',
            link: taskData.link || null,
            lecture_id: taskData.lectureId || 1,
            priority: taskData.priority || 'High',
            status: taskData.status || 'In Progress',
            due_date: taskData.dueDate || today,
          })
          .select()
          .single();

        if (taskErr) throw taskErr;

        if (inserted && taskData.assigneeIds && taskData.assigneeIds.length > 0) {
          const assigneeRows = taskData.assigneeIds.map((memberId) => ({
            task_id: inserted.id,
            member_id: memberId,
            status: taskData.memberStatuses?.[memberId] || taskData.status || 'In Progress',
          }));
          await supabase.from('task_assignees').insert(assigneeRows);
        }
      } catch (err) {
        console.error('Failed to create task in Supabase:', err);
      }
    }
  };

  const updateTask = async (updatedTask: Task) => {
    const targetStatus = updatedTask.status;
    const synchronizedMemberStatuses: Record<string, TaskStatus> = {
      ...(updatedTask.memberStatuses || {}),
    };
    if (Array.isArray(updatedTask.assigneeIds)) {
      updatedTask.assigneeIds.forEach((mId) => {
        synchronizedMemberStatuses[mId] = targetStatus;
      });
    }

    const taskToSave: Task = {
      ...updatedTask,
      status: targetStatus,
      memberStatuses: synchronizedMemberStatuses,
    };

    setTasks((prev) => prev.map((t) => (t.id === taskToSave.id ? taskToSave : t)));

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('tasks')
          .update({
            title: taskToSave.title,
            description: taskToSave.description,
            link: taskToSave.link || null,
            lecture_id: taskToSave.lectureId,
            priority: taskToSave.priority,
            status: taskToSave.status,
            due_date: taskToSave.dueDate,
          })
          .eq('id', taskToSave.id);

        // Sync assignees
        if (taskToSave.assigneeIds) {
          await supabase.from('task_assignees').delete().eq('task_id', taskToSave.id);
          if (taskToSave.assigneeIds.length > 0) {
            const rows = taskToSave.assigneeIds.map((mId) => ({
              task_id: taskToSave.id,
              member_id: mId,
              status: taskToSave.memberStatuses?.[mId] || taskToSave.status || 'Backlog',
            }));
            await supabase.from('task_assignees').insert(rows);
          }
        }
      } catch (err) {
        console.error('Failed to update task in Supabase:', err);
      }
    }
  };

  const setMemberTaskStatus = async (taskId: string, memberId: string, newStatus: TaskStatus) => {
    let latestComputedOverall: TaskStatus | null = null;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const memberStatuses: Record<string, TaskStatus> = {
          ...(t.memberStatuses || {}),
          [memberId]: newStatus,
        };
        const computedOverall = getTaskOverallStatus({ ...t, memberStatuses });
        latestComputedOverall = computedOverall;
        return {
          ...t,
          memberStatuses,
          status: computedOverall,
        };
      })
    );

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('task_assignees')
          .upsert(
            { task_id: taskId, member_id: memberId, status: newStatus },
            { onConflict: 'task_id,member_id' }
          );

        // Also update task overall status in Supabase
        if (latestComputedOverall) {
          await supabase.from('tasks').update({ status: latestComputedOverall }).eq('id', taskId);
        }
      } catch (err) {
        console.error('Failed to update assignee status in Supabase:', err);
      }
    }
  };

  const deleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('tasks').delete().eq('id', taskId);
      } catch (err) {
        console.error('Failed to delete task in Supabase:', err);
      }
    }
  };

  // --- Member Methods ---
  const addMember = async (memberData: Omit<Member, 'id'>) => {
    const tempId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'member-' + Date.now();
    const newMember: Member = { ...memberData, id: tempId };
    setMembers((prev) => [...prev, newMember]);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('profiles').insert({
          name: memberData.name,
          student_id: memberData.studentId || null,
          role: memberData.role,
          email: memberData.email,
          phone: memberData.phone || null,
          avatar_bg: memberData.avatarBg,
          initials: memberData.initials,
          bio: memberData.bio,
          skills: memberData.skills,
          is_team_leader: Boolean(memberData.isTeamLeader),
        });
      } catch (err) {
        console.error('Failed to add member to Supabase:', err);
      }
    }
  };

  const updateMember = async (updatedMember: Member) => {
    setMembers((prev) => prev.map((m) => (m.id === updatedMember.id ? updatedMember : m)));

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('profiles')
          .update({
            name: updatedMember.name,
            student_id: updatedMember.studentId || null,
            role: updatedMember.role,
            phone: updatedMember.phone || null,
            avatar_bg: updatedMember.avatarBg,
            initials: updatedMember.initials,
            bio: updatedMember.bio,
            skills: updatedMember.skills,
            is_team_leader: Boolean(updatedMember.isTeamLeader),
          })
          .eq('id', updatedMember.id);
      } catch (err) {
        console.error('Failed to update member in Supabase:', err);
      }
    }
  };

  const deleteMember = async (memberId: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    setTasks((prev) =>
      prev.map((t) => ({
        ...t,
        assigneeIds: t.assigneeIds.filter((id) => id !== memberId),
      }))
    );

    if (isSupabaseConfigured) {
      try {
        await supabase.from('profiles').delete().eq('id', memberId);
      } catch (err) {
        console.error('Failed to delete member in Supabase:', err);
      }
    }
  };

  const getMemberLectureNote = (memberId: string, lectureId: number): string => {
    const key = `${memberId}_lecture_${lectureId}`;
    if (memberNotes[key] !== undefined) {
      return memberNotes[key];
    }
    if (lectureId === 1 && memberNotes[memberId] !== undefined) {
      return memberNotes[memberId];
    }
    return '';
  };

  const setMemberLectureNote = async (memberId: string, lectureId: number, note: string) => {
    const key = `${memberId}_lecture_${lectureId}`;
    setMemberNotes((prev) => {
      const next = { ...prev, [key]: note };
      if (lectureId === 1) next[memberId] = note;
      return next;
    });

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('member_notes')
          .upsert(
            { member_id: memberId, lecture_id: lectureId, content: note },
            { onConflict: 'member_id,lecture_id' }
          );
      } catch (err) {
        console.error('Failed to save member note in Supabase:', err);
      }
    }
  };

  const setMemberNote = (memberId: string, note: string) => {
    setMemberLectureNote(memberId, 1, note);
  };

  // --- Drive System Methods ---
  const addDriveFolder = async (folderData: Omit<DriveFolder, 'id' | 'files'>) => {
    const tempId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : folderData.name || `Folder-${Date.now()}`;
    const newFolder: DriveFolder = {
      ...folderData,
      id: tempId,
      files: [],
    };
    setDriveFolders((prev) => [...prev, newFolder]);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('drive_folders').insert({
          name: folderData.name,
          lecture_number: folderData.lectureNumber,
          date: folderData.date,
          status: folderData.status,
          description: folderData.description || '',
        });
      } catch (err) {
        console.error('Failed to add drive folder in Supabase:', err);
      }
    }
  };

  const updateDriveFolder = async (folderId: string, updates: Partial<DriveFolder>) => {
    setDriveFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, ...updates } : f)));

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('drive_folders')
          .update({
            name: updates.name,
            lecture_number: updates.lectureNumber,
            date: updates.date,
            status: updates.status,
            description: updates.description,
          })
          .eq('id', folderId);
      } catch (err) {
        console.error('Failed to update drive folder in Supabase:', err);
      }
    }
  };

  const deleteDriveFolder = async (folderId: string) => {
    setDriveFolders((prev) => prev.filter((f) => f.id !== folderId));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('drive_folders').delete().eq('id', folderId);
      } catch (err) {
        console.error('Failed to delete drive folder in Supabase:', err);
      }
    }
  };

  const addDriveFile = async (folderId: string, fileData: Omit<DriveFile, 'id' | 'updatedAt'>) => {
    const tempId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'file-' + Date.now();
    const today = new Date().toISOString().split('T')[0];
    const newFile: DriveFile = {
      ...fileData,
      id: tempId,
      updatedAt: today,
    };

    setDriveFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, files: [newFile, ...f.files] } : f))
    );

    if (isSupabaseConfigured) {
      try {
        await supabase.from('drive_files').insert({
          folder_id: folderId,
          name: fileData.name,
          title: fileData.title,
          author: fileData.author || null,
          type: fileData.type,
          size: fileData.size,
          size_bytes: fileData.sizeBytes,
          url: fileData.url,
          description: fileData.description || null,
          highlights: fileData.highlights || [],
        });
      } catch (err) {
        console.error('Failed to add drive file in Supabase:', err);
      }
    }
  };

  const updateDriveFile = async (folderId: string, fileId: string, updates: Partial<DriveFile>) => {
    setDriveFolders((prev) =>
      prev.map((f) =>
        f.id === folderId
          ? {
              ...f,
              files: f.files.map((file) => (file.id === fileId ? { ...file, ...updates } : file)),
            }
          : f
      )
    );

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('drive_files')
          .update({
            title: updates.title,
            author: updates.author,
            description: updates.description,
            highlights: updates.highlights,
          })
          .eq('id', fileId);
      } catch (err) {
        console.error('Failed to update drive file in Supabase:', err);
      }
    }
  };

  const deleteDriveFile = async (folderId: string, fileId: string) => {
    setDriveFolders((prev) =>
      prev.map((f) =>
        f.id === folderId ? { ...f, files: f.files.filter((file) => file.id !== fileId) } : f
      )
    );

    if (isSupabaseConfigured) {
      try {
        await supabase.from('drive_files').delete().eq('id', fileId);
      } catch (err) {
        console.error('Failed to delete drive file in Supabase:', err);
      }
    }
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
    try {
      localStorage.removeItem(STORAGE_KEYS.MEMBERS);
      localStorage.removeItem(STORAGE_KEYS.TASKS);
      localStorage.removeItem(STORAGE_KEYS.NOTES);
      localStorage.removeItem(STORAGE_KEYS.DRIVE);
    } catch (e) {}
  };

  return (
    <ProjectContext.Provider
      value={{
        members,
        tasks,
        memberNotes,
        driveFolders,
        theme,
        setTheme,
        toggleTheme,
        isSupabase: isSupabaseConfigured,
        syncStatus,
        addTask,
        updateTask,
        deleteTask,
        setMemberTaskStatus,
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
        resetToDefaults,
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
