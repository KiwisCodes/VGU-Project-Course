/**
 * Authentication and Identity Resolution Utilities
 * 
 * Dynamically resolves student IDs, VGU institutional emails, and Gmail addresses.
 * 100% dynamic: NO hardcoded user IDs, emails, or personal identifiers.
 */

export const VGU_STUDENT_DOMAIN = 'student.vgu.edu.vn';
export const VGU_FACULTY_DOMAIN = 'vgu.edu.vn';

export interface ResolvedIdentity {
  /** Standardized email used for Supabase Auth */
  email: string;
  /** Extracted or entered student ID (if numeric or explicitly given) */
  studentId?: string;
  /** Whether the user entered an ID rather than a full email */
  isStudentIdOnly: boolean;
  /** The email domain part */
  domain: string;
}

/**
 * Dynamically resolves any user input (Student ID, VGU email, Gmail, etc.)
 * into a standardized email and extracted student ID.
 *
 * Rules:
 * 1. If input does NOT contain '@':
 *    - Treated as a student ID (e.g. '10423051', '0001', '10423057').
 *    - Standardized email: `${id}@student.vgu.edu.vn`.
 *    - Extracted studentId: `${id}`.
 * 2. If input CONTAINS '@':
 *    - Standardized email: trimmed, lowercase full email.
 *    - If the local-part (before '@') consists of digits (e.g. '10423051@student.vgu.edu.vn'),
 *      extract it as studentId.
 *    - If local-part is alphanumeric or a name (e.g. 'john.doe@gmail.com'), studentId is left
 *      optional and can be set in the profile settings.
 */
export function resolveUserIdentifier(input: string): ResolvedIdentity {
  const clean = (input || '').trim().toLowerCase();

  if (!clean.includes('@')) {
    // Pure Student ID entered
    return {
      email: clean ? `${clean}@${VGU_STUDENT_DOMAIN}` : '',
      studentId: clean || undefined,
      isStudentIdOnly: true,
      domain: VGU_STUDENT_DOMAIN,
    };
  }

  const parts = clean.split('@');
  const localPart = parts[0] || '';
  const domain = parts[1] || '';

  // Check if the local-part is numeric (standard VGU student ID format)
  const isNumericId = /^[0-9]+$/.test(localPart);

  return {
    email: clean,
    studentId: isNumericId ? localPart : undefined,
    isStudentIdOnly: false,
    domain,
  };
}
