'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Check, Circle } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Notification } from '@/lib/types';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function NotificationList({
  title = 'Notifications',
  emptyTitle = 'Nothing here',
  emptyDescription = 'Updates will appear here.',
  initialItems,
  onMarkAllRead,
  onToggleRead,
}: {
  title?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  initialItems: Notification[];
  onMarkAllRead?: () => Promise<void> | void;
  onToggleRead?: (id: string, read: boolean) => Promise<void> | void;
}) {
  const [items, setItems] = useState<Notification[]>(initialItems);
  const unread = items.filter((n) => !n.read).length;

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const markAll = async () => {
    await onMarkAllRead?.();
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const toggle = async (id: string) => {
    const item = items.find((n) => n.id === id);
    if (!item) return;
    const nextRead = !item.read;
    await onToggleRead?.(id, nextRead);
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: nextRead } : n)),
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={title}
        description={
          unread === 0
            ? 'You are all caught up.'
            : `${unread} unread update${unread === 1 ? '' : 's'}.`
        }
        action={
          unread > 0 ? (
            <Button
              variant="outline"
              className="h-11 rounded-full"
              onClick={markAll}
            >
              <Check className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
          ) : null
        }
      />

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-border dark:bg-card">
          <BellOff className="mx-auto mb-2 h-6 w-6 text-gray-400 dark:text-muted-foreground" />
          <p className="text-sm font-semibold text-gray-700 dark:text-foreground/90">{emptyTitle}</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-muted-foreground">{emptyDescription}</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-3xl border border-gray-200/80 bg-white dark:divide-border dark:border-border dark:bg-card">
          {items.map((n) => (
            <li
              key={n.id}
              className={cn('flex items-start gap-3 p-4', !n.read && 'bg-accent2-50/50 dark:bg-accent2-500/5')}
            >
              <div
                className={cn(
                  'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl',
                  n.read
                    ? 'bg-gray-100 text-gray-400 dark:bg-white/10'
                    : 'bg-brand text-white dark:bg-accent2-500 dark:text-brand',
                )}
              >
                <Bell className="h-4 w-4" />
                {!n.read && (
                  <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-accent2-400 ring-2 ring-white dark:ring-card" aria-hidden />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'text-sm font-semibold',
                    n.read ? 'text-gray-700 dark:text-foreground/80' : 'text-gray-950 dark:text-foreground',
                  )}
                >
                  {n.title}
                </p>
                <p className="mt-0.5 text-sm leading-6 text-gray-600 dark:text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-xs text-gray-400 dark:text-muted-foreground">{timeAgo(n.createdAt)}</p>
              </div>
              <button
                type="button"
                onClick={() => toggle(n.id)}
                aria-label={n.read ? `Mark "${n.title}" as unread` : `Mark "${n.title}" as read`}
                title={n.read ? 'Mark unread' : 'Mark read'}
                className={cn(
                  '-mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  n.read
                    ? 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                    : 'text-brand hover:bg-brand/10 dark:text-accent2-400',
                )}
              >
                {n.read ? <Circle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
