'use client';

import { useMemo } from 'react';
import NotificationList from '@/components/dashboard/NotificationList';
import PageHeader from '@/components/dashboard/PageHeader';
import { teacherMe, teacherNotifications } from '@/lib/store/teacher';
import { useMounted } from '@/lib/use-mounted';

export default function TeacherNotificationsPage() {
  const mounted = useMounted();
  const teacher = teacherMe();
  const initial = useMemo(() => teacherNotifications(teacher.id), [teacher.id]);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading…" description="" />
      </div>
    );
  }

  return (
    <NotificationList
      initialItems={initial}
      emptyDescription="Student deactivation alerts and schedule updates will appear here."
    />
  );
}
