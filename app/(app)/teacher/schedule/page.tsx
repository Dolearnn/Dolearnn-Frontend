'use client';

import { useMemo } from 'react';
import { CalendarX2 } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import StudentSessionRow from '@/components/dashboard/StudentSessionRow';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { teacherSessions } from '@/lib/store/teacher';
import { useMounted } from '@/lib/use-mounted';
import type { Session, SessionStatus } from '@/lib/types';

const TAB_ORDER: SessionStatus[] = ['Upcoming', 'Completed', 'Cancelled'];

export default function TeacherSchedulePage() {
  const mounted = useMounted();
  const sessions = teacherSessions();

  const grouped = useMemo(() => {
    const bucket: Record<SessionStatus, Session[]> = {
      Upcoming: [],
      Completed: [],
      Cancelled: [],
    };
    for (const s of sessions) bucket[s.status].push(s);
    bucket.Upcoming.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    bucket.Completed.sort((a, b) => b.startsAt.localeCompare(a.startsAt));
    bucket.Cancelled.sort((a, b) => b.startsAt.localeCompare(a.startsAt));
    return bucket;
  }, [sessions]);

  const byDay = useMemo(() => {
    const groups = new Map<string, Session[]>();
    for (const s of grouped.Upcoming) {
      const key = new Date(s.startsAt).toLocaleDateString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
      });
      const arr = groups.get(key) ?? [];
      arr.push(s);
      groups.set(key, arr);
    }
    return Array.from(groups.entries());
  }, [grouped.Upcoming]);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading…" description="" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule"
        description="Every lesson you're booked for — past, present and upcoming."
      />

      <Tabs defaultValue="Upcoming" className="space-y-4">
        <TabsList className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-full p-1 w-fit">
          {TAB_ORDER.map((status) => (
            <TabsTrigger
              key={status}
              value={status}
              className="rounded-full px-4 text-sm data-[state=active]:bg-brand data-[state=active]:text-white"
            >
              {status}
              <span className="ml-2 text-xs opacity-70">
                {grouped[status].length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="Upcoming" className="space-y-6">
          {byDay.length === 0 ? (
            <EmptyState
              title="Nothing scheduled"
              hint="New bookings will appear here once matched."
            />
          ) : (
            byDay.map(([day, items]) => (
              <div key={day} className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-muted-foreground font-medium">
                  {day}
                </p>
                <div className="space-y-3">
                  {items.map((s) => (
                    <StudentSessionRow key={s.id} session={s} />
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="Completed" className="space-y-3">
          {grouped.Completed.length === 0 ? (
            <EmptyState title="No completed sessions yet" hint="" />
          ) : (
            grouped.Completed.map((s) => (
              <StudentSessionRow key={s.id} session={s} />
            ))
          )}
        </TabsContent>

        <TabsContent value="Cancelled" className="space-y-3">
          {grouped.Cancelled.length === 0 ? (
            <EmptyState title="No cancellations" hint="" />
          ) : (
            grouped.Cancelled.map((s) => (
              <StudentSessionRow key={s.id} session={s} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="bg-white dark:bg-card border border-dashed border-gray-300 dark:border-border rounded-2xl p-10 text-center">
      <CalendarX2 className="w-6 h-6 text-gray-400 dark:text-muted-foreground mx-auto mb-2" />
      <p className="text-sm font-semibold text-gray-700 dark:text-foreground/90">{title}</p>
      {hint && <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
