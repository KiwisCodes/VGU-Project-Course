export type Priority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'Backlog' | 'In Progress' | 'Review' | 'Done';
export type TaskTag = string;
export type PillarTag = string; // Deprecated alias for TaskTag

export interface Member {
  id: string;
  name: string;
  studentId?: string;
  role: string;
  email: string;
  phone?: string;
  avatarBg: string;
  initials: string;
  bio: string;
  skills: string[];
}

/**
 * In Vietnamese naming conventions, the given name is the final word of the full name.
 * e.g. "Phan Thành Hưng" -> "Hưng"
 * e.g. "Lê Quang Minh Khoa" -> "Khoa"
 * e.g. "Nguyễn Võ Minh Khôi" -> "Khôi"
 * e.g. "Nguyễn Đức Khang" -> "Khang"
 * e.g. "Dương Quý Trang" -> "Trang"
 */
export function getMemberShortName(fullName?: string): string {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1] || fullName;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeIds: string[]; // 1, many, or all team members
  lectureId: number;     // Scoped to Lecture (1, 2, ..., 16)
  tag: string;           // Dynamic tag category (formerly pillar)
  priority: Priority;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  // Backward compatibility fields
  pillar?: string;
  assigneeId?: string;
  week?: number;
}

export interface MemberNote {
  id: string;
  memberId: string;
  week: number;
  content: string;
  blockers?: string;
  createdAt: string;
}

export interface LectureSession {
  week: number;
  date: string;
  title: string;
  folderName: string;
  status: 'active' | 'upcoming';
  phase: 'Data' | 'Modeling' | 'Agents' | 'Evaluation' | 'Delivery';
  summary: string;
  materials: {
    title: string;
    type: 'pdf' | 'slides' | 'link' | 'html';
    url: string;
    filename?: string;
    size?: string;
  }[];
  keyActionItems: string[];
}

export interface DriveFile {
  id: string;
  name: string;
  title: string;
  author?: string;
  type: 'pdf' | 'html' | 'slides' | 'doc';
  size: string;
  sizeBytes: number;
  url: string;
  updatedAt: string;
  description?: string;
  highlights?: string[];
}

export interface DriveFolder {
  id: string;
  name: string;
  lectureNumber: number;
  date: string;
  status: 'active' | 'upcoming';
  description: string;
  files: DriveFile[];
}
