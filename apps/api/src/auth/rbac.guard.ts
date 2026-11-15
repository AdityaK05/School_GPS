import { AuthContext, UserRole } from '@school-transport-platform/shared-types';
import { errorResponse } from '@school-transport-platform/utils';

export class RbacGuard {
  /**
   * Enforces that the caller has at least one of the allowed roles.
   */
  public static requireRole(auth: AuthContext | undefined, allowedRoles: UserRole[]): void {
    if (!auth) {
      throw new Error('UNAUTHORIZED: Caller is not authenticated');
    }
    if (auth.isSuperAdmin) {
      return; // SUPER_ADMIN bypasses role checks
    }
    if (!allowedRoles.includes(auth.role)) {
      throw new Error(`FORBIDDEN: User role ${auth.role} does not have required permissions`);
    }
  }

  /**
   * Enforces tenant boundary. The target entity's schoolId must match the user's authenticated schoolId.
   */
  public static requireSchoolAccess(auth: AuthContext | undefined, targetSchoolId: string): void {
    if (!auth) {
      throw new Error('UNAUTHORIZED: Caller is not authenticated');
    }
    if (auth.isSuperAdmin) {
      return; // SUPER_ADMIN can access all schools
    }
    if (!auth.schoolId || auth.schoolId !== targetSchoolId) {
      throw new Error(`TENANT_ACCESS_DENIED: User cannot access resources of school ${targetSchoolId}`);
    }
  }

  /**
   * Enforces that a parent can only access their authorized students.
   */
  public static requireStudentAccess(
    auth: AuthContext | undefined,
    studentId: string,
    authorizedStudentIds: string[]
  ): void {
    if (!auth) {
      throw new Error('UNAUTHORIZED: Caller is not authenticated');
    }
    if (auth.isSuperAdmin || auth.role === 'SCHOOL_ADMIN' || auth.role === 'TRANSPORT_MANAGER') {
      return;
    }
    if (auth.role === 'PARENT') {
      if (!authorizedStudentIds.includes(studentId)) {
        throw new Error(`FORBIDDEN: Parent does not have authorization for student ${studentId}`);
      }
    }
  }
}
