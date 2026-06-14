import type { PagedResponse } from '../../lib/api-types';

export type NotificationType =
  | 'CLAIM_SUBMITTED'
  | 'CLAIM_MANAGER_APPROVED'
  | 'CLAIM_MANAGER_REJECTED'
  | 'CLAIM_FINANCE_APPROVED'
  | 'CLAIM_PAID';

export type AppNotification = {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
  readAt: string | null;
};

export type NotificationListResponse = PagedResponse<AppNotification>;

export type CountResponse = {
  count: number;
};
