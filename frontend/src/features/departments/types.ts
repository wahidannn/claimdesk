import type { ListParams } from '../../lib/api-types';

export type SimpleManager = {
  id: number;
  name: string;
  email: string;
};

export type Department = {
  id: number;
  name: string;
  active: boolean;
  manager: SimpleManager | null;
  createdAt: string;
  updatedAt: string;
};

export type DepartmentListParams = ListParams;

export type DepartmentRequest = {
  name: string;
  managerId: number | null;
  active: boolean;
};
