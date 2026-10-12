import type { AdminNotification } from '@/types';
import { enc, http } from './http';

/** Admin notifications are created by the API (new orders, reviews, subscribers, low stock). */
export const notificationService = {
  list: () => http.get<AdminNotification[]>('/notifications'),
  markAllRead: () => http.post<void>('/notifications/read-all'),
  markRead: (id: string) => http.patch<AdminNotification>(`/notifications/${enc(id)}/read`, {}),
};
