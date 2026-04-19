'use client';

import { useMemo } from 'react';
import NotificationList from '@/components/dashboard/NotificationList';
import PageHeader from '@/components/dashboard/PageHeader';
import { adminNotifications } from '@/lib/store/admin';
import { useMounted } from '@/lib/use-mounted';

export default function AdminNotificationsPage() {
  const mounted = useMounted();
  const initial = useMemo(() => adminNotifications(), []);

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
      emptyDescription="Student deactivation alerts and operational updates will appear here."
    />
  );
}
