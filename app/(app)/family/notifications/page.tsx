'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import NotificationList from '@/components/dashboard/NotificationList';
import PageHeader from '@/components/dashboard/PageHeader';
import { PageShellSkeleton } from '@/components/dashboard/Skeletons';
import {
  listNotifications,
  markAllNotificationsRead,
  notificationKeys,
  setNotificationRead,
} from '@/lib/api/notifications';

export default function FamilyNotificationsPage() {
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({
    queryKey: notificationKeys.all,
    queryFn: listNotifications,
  });
  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
  const readMutation = useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) =>
      setNotificationRead(id, read),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });

  if (notificationsQuery.isLoading) {
    return <PageShellSkeleton />;
  }

  if (notificationsQuery.isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Notifications" description="" />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          We could not load notifications right now. Please try again.
        </div>
      </div>
    );
  }

  return (
    <NotificationList
      initialItems={notificationsQuery.data ?? []}
      emptyDescription="Session updates and feedback will appear here."
      onMarkAllRead={() => markAllMutation.mutateAsync()}
      onToggleRead={async (id, read) => {
        await readMutation.mutateAsync({ id, read });
      }}
    />
  );
}
