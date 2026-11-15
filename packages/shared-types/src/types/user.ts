export type UserRole =
  | 'SUPER_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'TRANSPORT_MANAGER'
  | 'DRIVER'
  | 'ATTENDANT'
  | 'PARENT';

export interface User {
  id: string;
  schoolId?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface UserRoleRecord {
  id: string;
  userId: string;
  role: UserRole;
  schoolId?: string;
  createdAt: string;
}

export interface AuthContext {
  userId: string;
  schoolId?: string;
  role: UserRole;
  email: string;
  isSuperAdmin: boolean;
}
