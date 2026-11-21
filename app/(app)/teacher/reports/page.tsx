'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Banknote,
  GraduationCap,
  Users,
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
import {
  getTeacherProfile,
  listTeacherSessions,
  teacherKeys,
} from '@/lib/api/teacher';
import { cn } from '@/lib/utils';
import { isSessionPayable, isSessionPayoutEligible, type Session } from '@/lib/types';
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

export default function TeacherReportsPage() {
  const profileQuery = useQuery({
    queryKey: teacherKeys.profile,
    queryFn: getTeacherProfile,
  });
  const sessionsQuery = useQuery({
    queryKey: teacherKeys.sessions,
    queryFn: listTeacherSessions,
  });
  const teacher = profileQuery.data;
  const sessions = sessionsQuery.data ?? EMPTY_SESSIONS;

  const monthOptions = useMemo(() => {
    const keys = new Set<string>([new Date().toISOString().slice(0, 7)]);
    sessions.forEach((session) => keys.add(monthKey(session.startsAt)));
    return Array.from(keys).sort((a, b) => b.localeCompare(a));
  }, [sessions]);

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );

  const report = useMemo(() => {
    if (!teacher) return null;
    const monthlySessions = sessions.filter(
      (session) => monthKey(session.startsAt) === selectedMonth,
    );
    const completed = monthlySessions.filter((s) => s.status === 'Completed');
    const verified = completed.filter((session) =>
      isSessionPayoutEligible(session.attendance),
    );
    const awaitingAttendance = completed.filter(
      (session) => !isSessionPayoutEligible(session.attendance),
    );
    const cancellationRequests = monthlySessions.filter((s) => s.cancellation);
    const uniqueStudentIds = new Set(monthlySessions.map((s) => s.childId));
    const verifiedHours =
      verified.reduce((sum, session) => sum + session.durationMins, 0) / 60;
    // Tutors are paid per verified session that has its note, at their own rate.
    const expectedPayout = Math.round(verified.filter(isSessionPayable).length * teacher.hourlyRate);
    const confirmationRate =
      completed.length > 0
        ? Math.round((verified.length / completed.length) * 100)
        : 0;
    const byStudent = Array.from(uniqueStudentIds).map((studentId) => {
      const studentSessions = monthlySessions.filter(
        (session) => session.childId === studentId,
      );
      const verifiedStudentSessions = studentSessions.filter((session) =>
        isSessionPayoutEligible(session.attendance),
      );
      const hours =
        verifiedStudentSessions.reduce(
          (sum, session) => sum + session.durationMins,
          0,
        ) / 60;
      return {
        studentId,
        studentName: studentSessions[0]?.childName ?? 'Student',
        sessions: studentSessions.length,
        verifiedSessions: verifiedStudentSessions.length,
        hours,
      };
    });

    return {
      monthlySessions,
      completed,
      verified,
      awaitingAttendance,
      cancellationRequests,
      uniqueStudentCount: uniqueStudentIds.size,
      verifiedHours,
      expectedPayout,
      confirmationRate,
      byStudent,
    };
  }, [selectedMonth, sessions, teacher]);

  if (profileQuery.isLoading || sessionsQuery.isLoading) {
    return <PageShellSkeleton />;
  }

  if (profileQuery.isError || sessionsQuery.isError || !teacher || !report) {
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
        description="Your verified sessions, expected pay, attendance and cancellations."
        action={
          <div className="w-48">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          icon={Banknote}
          label="Expected payout"
          value={naira(report.expectedPayout)}
          sub={`at ${naira(teacher.hourlyRate)} per session`}
          accent
        />
        <StatTile
          icon={Clock}
          label="Verified sessions"
          value={report.verified.length}
          sub={`${report.verifiedHours.toFixed(1)} teaching hours`}
        />
        <StatTile
          icon={CheckCircle2}
          label="Attendance verified"
          value={`${report.confirmationRate}%`}
          sub={`${report.verified.length}/${report.completed.length} completed`}
        />
        <StatTile
          icon={Users}
          label="Students taught"
          value={report.uniqueStudentCount}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          icon={GraduationCap}
          label="Total sessions"
          value={report.monthlySessions.length}
          sub={`${report.completed.length} completed`}
        />
        <StatTile
          icon={AlertTriangle}
          label="Cancellations"
          value={report.cancellationRequests.length}
        />
        <StatTile
          icon={Clock}
          label="Awaiting attendance"
          value={report.awaitingAttendance.length}
          sub="not payout eligible yet"
        />
        <StatTile
          icon={Banknote}
          label="Rate"
          value={`${naira(teacher.hourlyRate)} per session`}
          sub="set by admin"
        />
      </div>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-gray-950 dark:text-foreground">
          Student breakdown
        </h2>
        <div className="rounded-3xl border border-gray-200/80 bg-white dark:border-border dark:bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <ul className="divide-y divide-gray-100 dark:divide-border">
              {report.byStudent.map((row) => (
                <li key={row.studentId} className="flex min-h-16 items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-foreground">{row.studentName}</p>
                    <p className="text-xs tabular-nums text-gray-500 dark:text-muted-foreground">
                      {row.sessions} {row.sessions === 1 ? 'session' : 'sessions'}, {row.verifiedSessions} verified
                    </p>
                  </div>
                  <p className="shrink-0 text-right">
                    <span className="font-display text-xl font-extrabold tabular-nums text-gray-950 dark:text-foreground">{row.hours.toFixed(1)}</span>
                    <span className="block text-xs text-gray-500 dark:text-muted-foreground">hours</span>
                  </p>
                </li>
              ))}
              {report.byStudent.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-gray-500 dark:text-muted-foreground">No sessions for this month.</li>
              )}
            </ul>
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <ReportList
          title="Sessions awaiting attendance"
          empty="Every completed session is verified."
          rows={report.awaitingAttendance.map((session) => ({
            id: session.id,
            label: `${session.subject} with ${session.childName ?? 'Student'}`,
            sub: `${new Date(session.startsAt).toLocaleDateString()} - ${session.durationMins} min`,
            tone: 'warning',
          }))}
        />
        <ReportList
          title="Cancellation activity"
          empty="No cancellation requests this month."
          rows={report.cancellationRequests.map((session) => ({
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
    </div>
  );
}

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
    <div className="rounded-3xl border border-gray-200/80 bg-white dark:border-border dark:bg-card p-4">
      <h2 className="mb-3 font-display text-lg font-bold text-gray-950 dark:text-foreground">
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-500 dark:text-muted-foreground">
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
                  'text-[11px] font-medium px-2 py-0.5 rounded-full capitalize',
                  row.tone === 'danger' && 'bg-red-50 text-red-600',
                  row.tone === 'warning' && 'bg-amber-50 text-amber-700',
                  row.tone === 'muted' && 'bg-gray-100 text-gray-500',
                )}
              >
                {row.tone}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
