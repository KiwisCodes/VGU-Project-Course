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
  isTeamLeader?: boolean;
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
  memberStatuses?: Record<string, TaskStatus>; // Per-member individual status overrides
  dueDate: string;
  createdAt: string;
  link?: string;
  // Backward compatibility fields
  pillar?: string;
  assigneeId?: string;
  week?: number;
}

/**
 * Returns the individual status for a specific member on a task.
 * Falls back to the task's base status if no override is recorded.
 */
export function getTaskMemberStatus(task: Task, memberId: string): TaskStatus {
  if (task.memberStatuses && task.memberStatuses[memberId]) {
    return task.memberStatuses[memberId];
  }
  return task.status;
}

/**
 * Returns true if the task is marked as Done for the specific member.
 */
export function isTaskDoneForMember(task: Task, memberId: string): boolean {
  return getTaskMemberStatus(task, memberId) === 'Done';
}

/**
 * Determines the overall status of a task:
 * - If 0 or 1 assignee: returns the task/member status.
 * - If multiple assignees:
 *   - 'Done' if ALL assignees marked it Done.
 *   - 'Backlog' if ALL assignees have it in Backlog.
 *   - 'Review' if ANY assignee has it in Review and none are in Backlog/In Progress.
 *   - 'In Progress' if at least one assignee has it In Progress (or some Done, some In Progress).
 */
export function getTaskOverallStatus(task: Task): TaskStatus {
  const assignees = Array.isArray(task.assigneeIds)
    ? task.assigneeIds
    : (task.assigneeId ? [task.assigneeId] : []);

  if (assignees.length === 0) {
    return task.status;
  }

  if (assignees.length === 1) {
    return getTaskMemberStatus(task, assignees[0]);
  }

  const statuses = assignees.map(mId => getTaskMemberStatus(task, mId));
  if (statuses.every(s => s === 'Done')) return 'Done';
  if (statuses.every(s => s === 'Backlog')) return 'Backlog';
  if (statuses.some(s => s === 'Review') && statuses.every(s => s === 'Review' || s === 'Done')) return 'Review';
  return 'In Progress';
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
