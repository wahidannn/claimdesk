import type { ListParams } from '../../lib/api-types';

export type ExpenseCategory = {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CategoryListParams = ListParams;

export type CategoryRequest = {
  name: string;
  description: string;
  active: boolean;
};
