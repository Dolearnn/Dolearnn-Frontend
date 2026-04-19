'use client';

import { useState } from 'react';
import { Bell, BellOff, Check } from 'lucide-react';
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
}: {
  title?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  initialItems: Notification[];
}) {
  const [items, setItems] = useState<Notification[]>(initialItems);
  const unread = items.filter((n) => !n.read).length;

  const markAll = () =>
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));

  const toggle = (id: string) =>
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)),
    );

  return (
    <div className="space-y-6">
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
              className="rounded-full"
              onClick={markAll}
            >
              <Check className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
          ) : null
        }
      />

      {items.length === 0 ? (
        <div className="bg-white dark:bg-card border border-dashed border-gray-300 dark:border-border rounded-2xl p-10 text-center">
          <BellOff className="w-6 h-6 text-gray-400 dark:text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-700 dark:text-foreground/90">
            {emptyTitle}
          </p>
          <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
            {emptyDescription}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((n) => (
            <li
              key={n.id}
              className={cn(
                'bg-white dark:bg-card rounded-2xl border p-4 flex items-start gap-3 transition',
                n.read ? 'border-gray-200' : 'border-brand/30 shadow-sm',
              )}
            >
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                  n.read
                    ? 'bg-gray-100 dark:bg-white/10 text-gray-400'
                    : 'bg-accent2-100 text-brand',
                )}
              >
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <p
                    className={cn(
                      'text-sm font-semibold truncate',
                      n.read
                        ? 'text-gray-700 dark:text-foreground/80'
                        : 'text-gray-900 dark:text-foreground',
                    )}
                  >
                    {n.title}
                  </p>
                  <span className="text-[11px] text-gray-400 dark:text-muted-foreground shrink-0">
                    {timeAgo(n.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                  {n.body}
                </p>
              </div>
              <button
                onClick={() => toggle(n.id)}
                className={cn(
                  'text-[11px] font-medium px-2 py-1 rounded-full shrink-0 transition',
                  n.read
                    ? 'text-gray-500 dark:text-muted-foreground hover:bg-gray-100'
                    : 'text-brand hover:bg-brand/10',
                )}
              >
                {n.read ? 'Mark unread' : 'Mark read'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
