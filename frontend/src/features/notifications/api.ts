import { apiClient } from '../../lib/api-client';
import type { CountResponse, NotificationListResponse, AppNotification } from './types';

export async function listNotifications() {
  const response = await apiClient.get<NotificationListResponse>('/notifications', {
    params: {
      page: 0,
      size: 8,
    },
  });
  return response.data;
}

export async function getUnreadNotificationCount() {
  const response = await apiClient.get<CountResponse>('/notifications/unread-count');
  return response.data;
}

export async function markNotificationRead(id: number) {
  const response = await apiClient.patch<AppNotification>(`/notifications/${id}/read`);
  return response.data;
}

export async function markAllNotificationsRead() {
  await apiClient.patch('/notifications/read-all');
}
