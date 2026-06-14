export type PagedResponse<T> = {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
};

export type ListParams = {
  page?: number;
  size?: number;
  search?: string;
  active?: boolean;
};
