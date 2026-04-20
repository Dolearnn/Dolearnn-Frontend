import { apiFetch } from '@/lib/api/client';
import type { Notification } from '@/lib/types';

interface ApiNotification {
  id: string;
  userId: string;
  role: 'PARENT' | 'STUDENT' | 'TEACHER' | 'ADMIN';
  title: string;
  body: string;
  read: boolean;
  studentId?: string | null;
  teacherId?: string | null;
  createdAt: string;
}

const roleFromApi: Record<ApiNotification['role'], Notification['role']> = {
  PARENT: 'parent',
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin',
};

export const notificationKeys = {
  all: ['notifications'] as const,
};

function mapNotification(notification: ApiNotification): Notification {
  return {
    id: notification.id,
    userId: notification.userId,
    role: roleFromApi[notification.role],
    title: notification.title,
    body: notification.body,
    read: notification.read,
    childId: notification.studentId ?? undefined,
    teacherId: notification.teacherId ?? undefined,
    createdAt: notification.createdAt,
  };
}

export async function listNotifications() {
  const response = await apiFetch<{ notifications: ApiNotification[] }>(
    '/notifications',
  );
  return response.notifications.map(mapNotification);
}

export async function setNotificationRead(id: string, read: boolean) {
  const response = await apiFetch<{ notification: ApiNotification }>(
    `/notifications/${id}/read`,
    {
      method: 'PATCH',
      body: JSON.stringify({ read }),
    },
  );
  return mapNotification(response.notification);
}

export async function markAllNotificationsRead() {
  await apiFetch('/notifications/read-all', {
    method: 'POST',
  });
}
