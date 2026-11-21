'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  CreditCard,
} from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import StatTile from '@/components/dashboard/StatTile';
import { PageShellSkeleton } from '@/components/dashboard/Skeletons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { familyKeys, listFamilySessions } from '@/lib/api/family';
import { cn } from '@/lib/utils';
import { isSessionPayoutEligible, type Session } from '@/lib/types';
import { naira } from '@/lib/money';

const EMPTY_SESSIONS: Session[] = [];

function monthKey(date: string) {
  return date.slice(0, 7);
}

function monthLabel(key: string) {
  return new Date(`${key}-01T00:00:00`).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

export default function ReportsPage() {
  const sessionsQuery = useQuery({
    queryKey: familyKeys.sessions,
    queryFn: listFamilySessions,
  });
  const allSessions = sessionsQuery.data ?? EMPTY_SESSIONS;
  const isLoading = sessionsQuery.isLoading;
  const isError = sessionsQuery.isError;

  const monthOptions = useMemo(() => {
    const keys = new Set<string>([new Date().toISOString().slice(0, 7)]);
    allSessions.forEach((session) => keys.add(monthKey(session.startsAt)));
    return Array.from(keys).sort((a, b) => b.localeCompare(a));
  }, [allSessions]);

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );

  const report = useMemo(() => {
    const monthlySessions = allSessions.filter(
      (session) => monthKey(session.startsAt) === selectedMonth,
    );
    const completed = monthlySessions.filter((s) => s.status === 'Completed');
    const upcoming = monthlySessions.filter((s) => s.status === 'Upcoming');
    const cancelled = monthlySessions.filter((s) => s.status === 'Cancelled');
    const verified = completed.filter((session) =>
      isSessionPayoutEligible(session.attendance),
    );
    const awaitingConfirmation = completed.filter(
      (session) => !session.attendance?.familyConfirmedAt,
    );
    const cancellations = monthlySessions.filter((s) => s.cancellation);
    const sessionValue = completed.reduce((sum, session) => sum + session.amount, 0);
    const feedback = completed
      .filter((session) => session.note)
      .slice(0, 4);

    return {
      monthlySessions,
      completed,
      upcoming,
      cancelled,
      verified,
      awaitingConfirmation,
      cancellations,
      sessionValue,
      feedback,
    };
  }, [allSessions, selectedMonth]);

  if (isLoading) {
    return <PageShellSkeleton />;
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Monthly report" description="" />
        <div className="rounded-3xl bg-red-50 p-5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          We could not load your report right now. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Monthly report"
        description="Your lessons and confirmations this month."
        action={
          <div className="w-full sm:w-48">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="h-11 rounded-xl bg-white dark:bg-card" aria-label="Month">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((key) => (
                  <SelectItem key={key} value={key}>
                    {monthLabel(key)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile
          icon={Calendar}
          label="Completed"
          value={report.completed.length}
          sub={`${report.verified.length} verified`}
          accent
        />
        <StatTile
          icon={Calendar}
          label="Upcoming"
          value={report.upcoming.length}
        />
        <StatTile
          icon={CreditCard}
          label="Session value"
          value={naira(report.sessionValue)}
          sub="completed lessons"
        />
        <StatTile
          icon={CheckCircle2}
          label="To confirm"
          value={report.awaitingConfirmation.length}
          sub="completed classes"
        />
        <StatTile
          icon={CreditCard}
          label="Total sessions"
          value={report.monthlySessions.length}
          sub="this month"
        />
        <StatTile
          icon={AlertTriangle}
          label="Cancellations"
          value={report.cancellations.length}
          sub={`${report.cancelled.length} approved`}
        />
      </div>

      <section className="grid lg:grid-cols-2 gap-4">
        <ReportList
          title="Sessions awaiting your confirmation"
          empty="No completed sessions need confirmation."
          rows={report.awaitingConfirmation.map((session) => ({
            id: session.id,
            label: session.subject,
            sub: `${new Date(session.startsAt).toLocaleDateString()} with ${session.teacherName ?? 'Teacher'}`,
            tone: 'warning',
          }))}
        />
        <ReportList
          title="Cancellation activity"
          empty="No cancellation requests this month."
          rows={report.cancellations.map((session) => ({
            id: session.id,
            label: `${session.cancellation?.requestedBy === 'family' ? 'Learner' : session.cancellation?.requestedBy ?? 'Someone'} requested cancellation`,
            sub: session.cancellation?.reason ?? '',
            tone:
              session.cancellation?.status === 'Approved'
                ? 'danger'
                : session.cancellation?.status === 'Rejected'
                  ? 'muted'
                  : 'warning',
          }))}
        />
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-gray-950 dark:text-foreground">
          Recent feedback
        </h2>
        {report.feedback.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-center dark:border-border dark:bg-card">
            <p className="text-sm text-gray-500 dark:text-muted-foreground">
              Feedback will appear after completed sessions.
            </p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-3">
            {report.feedback.map((session) => (
              <div
                key={session.id}
                className="rounded-3xl border border-gray-200/80 bg-white p-4 dark:border-border dark:bg-card"
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-foreground">{session.subject}</p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-muted-foreground">
                  {session.teacherName ?? 'Your teacher'}, {new Date(session.startsAt).toLocaleDateString()}
                </p>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-700 dark:text-foreground/90">
                  {session.note?.covered}
                </p>
                <p className="mt-2 text-xs text-gray-500 dark:text-muted-foreground">
                  Next: {session.note?.focusNext}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const TONE_LABEL: Record<string, string> = {
  warning: 'Pending',
  danger: 'Cancelled',
  muted: 'Declined',
};

function ReportList({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: Array<{ id: string; label: string; sub: string; tone: string }>;
}) {
  return (
    <div className="rounded-3xl border border-gray-200/80 bg-white p-4 dark:border-border dark:bg-card sm:p-5">
      <h2 className="mb-3 font-display text-base font-bold text-gray-950 dark:text-foreground">
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-muted-foreground">
          {empty}
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex items-start justify-between gap-3 rounded-2xl bg-gray-50 p-3 dark:bg-white/5"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-foreground truncate">
                  {row.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-muted-foreground line-clamp-2">
                  {row.sub}
                </p>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                  row.tone === 'danger' && 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300',
                  row.tone === 'warning' && 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
                  row.tone === 'muted' && 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-muted-foreground',
                )}
              >
                {TONE_LABEL[row.tone] ?? row.tone}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
