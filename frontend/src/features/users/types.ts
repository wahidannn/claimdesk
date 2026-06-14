import type { Role } from '../auth/types';
import type { ListParams } from '../../lib/api-types';

export type SimpleDepartment = {
  id: number;
  name: string;
};

export type ManagedUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  department: SimpleDepartment | null;
  createdAt: string;
  updatedAt: string;
};

export type UserListParams = ListParams & {
  role?: Role;
};

export type CreateUserRequest = {
  name: string;
  email: string;
  password: string;
  role: Role;
  departmentId: number | null;
  active: boolean;
};

export type UpdateUserRequest = {
  name: string;
  email: string;
  password?: string;
  role: Role;
  departmentId: number | null;
  active: boolean;
};
