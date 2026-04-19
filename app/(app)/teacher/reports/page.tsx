'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  GraduationCap,
  Users,
} from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import StatTile from '@/components/dashboard/StatTile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  teacherChild,
  teacherMe,
  teacherSessions,
} from '@/lib/store/teacher';
import { cn } from '@/lib/utils';
import { isSessionPayoutEligible } from '@/lib/types';
import { useMounted } from '@/lib/use-mounted';

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
  const mounted = useMounted();
  const teacher = teacherMe();
  const sessions = teacherSessions(teacher.id);

  const monthOptions = useMemo(() => {
    const keys = new Set<string>([new Date().toISOString().slice(0, 7)]);
    sessions.forEach((session) => keys.add(monthKey(session.startsAt)));
    return Array.from(keys).sort((a, b) => b.localeCompare(a));
  }, [sessions]);

  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]);

  const report = useMemo(() => {
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
    const expectedPayout = Math.round(verifiedHours * teacher.hourlyRate);
    const confirmationRate =
      completed.length > 0 ? Math.round((verified.length / completed.length) * 100) : 0;
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
        student: teacherChild(studentId),
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
  }, [selectedMonth, sessions, teacher.hourlyRate]);

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
        title="Monthly report"
        description="Your verified teaching hours, payout estimate, attendance and cancellations."
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
          icon={DollarSign}
          label="Expected payout"
          value={`$${report.expectedPayout}`}
          sub={`at $${teacher.hourlyRate}/hr`}
          accent
        />
        <StatTile
          icon={Clock}
          label="Verified hours"
          value={report.verifiedHours.toFixed(1)}
          sub={`${report.verified.length} verified session${report.verified.length === 1 ? '' : 's'}`}
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
          icon={DollarSign}
          label="Rate"
          value={`$${teacher.hourlyRate}/hr`}
          sub="set by admin"
        />
      </div>

      <section>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90 mb-3">
          Student breakdown
        </h2>
        <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-gray-50 dark:bg-background text-xs text-gray-500 dark:text-muted-foreground uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Student</th>
                  <th className="text-right px-4 py-3 font-medium">Sessions</th>
                  <th className="text-right px-4 py-3 font-medium">Verified</th>
                  <th className="text-right px-4 py-3 font-medium">Verified hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.byStudent.map((row) => (
                  <tr key={row.student?.id ?? 'unknown'} className="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 dark:text-foreground">
                        {row.student?.fullName ?? 'Student'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-muted-foreground">
                        {row.student?.school ?? 'No school listed'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-foreground/90">
                      {row.sessions}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-foreground/90">
                      {row.verifiedSessions}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-foreground">
                      {row.hours.toFixed(1)}
                    </td>
                  </tr>
                ))}
                {report.byStudent.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-sm text-gray-500 dark:text-muted-foreground"
                    >
                      No sessions for this month.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <ReportList
          title="Sessions awaiting attendance"
          empty="Every completed session is verified."
          rows={report.awaitingAttendance.map((session) => ({
            id: session.id,
            label: `${session.subject} with ${teacherChild(session.childId)?.fullName ?? 'Student'}`,
            sub: `${new Date(session.startsAt).toLocaleDateString()} - ${session.durationMins} min`,
            tone: 'warning',
          }))}
        />
        <ReportList
          title="Cancellation activity"
          empty="No cancellation requests this month."
          rows={report.cancellationRequests.map((session) => ({
            id: session.id,
            label: `${session.cancellation?.requestedBy ?? 'Someone'} requested cancellation`,
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
    <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-4">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90 mb-3">
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-500 dark:text-muted-foreground">{empty}</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex items-start justify-between gap-3 rounded-xl bg-gray-50 dark:bg-background p-3"
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
