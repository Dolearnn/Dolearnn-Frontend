'use client';

import { useMemo } from 'react';
import NotificationList from '@/components/dashboard/NotificationList';
import { familyNotifications } from '@/lib/store/family';

export default function FamilyNotificationsPage() {
  const initial = useMemo(() => familyNotifications(), []);

  return (
    <NotificationList
      initialItems={initial}
      emptyDescription="Session reminders and feedback will appear here."
    />
  );
}
