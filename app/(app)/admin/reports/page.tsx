'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  GraduationCap,
  TrendingUp,
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
  adminChildren,
  adminPayments,
  adminSessions,
  adminTeachers,
} from '@/lib/store/admin';
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

export default function AdminReportsPage() {
  const mounted = useMounted();
  const payments = adminPayments();
  const sessions = adminSessions();
  const teachers = adminTeachers();
  const children = adminChildren();

  const monthOptions = useMemo(() => {
    const keys = new Set<string>([new Date().toISOString().slice(0, 7)]);
    payments.forEach((payment) => keys.add(monthKey(payment.createdAt)));
    sessions.forEach((session) => keys.add(monthKey(session.startsAt)));
    return Array.from(keys).sort((a, b) => b.localeCompare(a));
  }, [payments, sessions]);

  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]);

  const report = useMemo(() => {
    const monthlyPayments = payments.filter(
      (payment) => monthKey(payment.createdAt) === selectedMonth,
    );
    const monthlySessions = sessions.filter(
      (session) => monthKey(session.startsAt) === selectedMonth,
    );
    const completed = monthlySessions.filter((s) => s.status === 'Completed');
    const verified = completed.filter((session) =>
      isSessionPayoutEligible(session.attendance),
    );
    const cancellationRequests = monthlySessions.filter((s) => s.cancellation);
    const approvedCancellations = cancellationRequests.filter(
      (s) => s.cancellation?.status === 'Approved',
    );
    const revenue = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);
    const verifiedHours =
      verified.reduce((sum, session) => sum + session.durationMins, 0) / 60;
    const teacherRows = teachers.map((teacher) => {
      const teacherSessions = verified.filter(
        (session) => session.teacherId === teacher.id,
      );
      const hours =
        teacherSessions.reduce((sum, session) => sum + session.durationMins, 0) /
        60;
      const amountDue = Math.round(hours * teacher.hourlyRate);
      return {
        teacher,
        sessions: teacherSessions.length,
        hours,
        amountDue,
      };
    });
    const teacherPayoutDue = teacherRows.reduce(
      (sum, row) => sum + row.amountDue,
      0,
    );
    const confirmationRate =
      completed.length > 0 ? Math.round((verified.length / completed.length) * 100) : 0;
    const deactivatedStudents = children.filter(
      (child) => child.status === 'Deactivated',
    ).length;

    return {
      monthlyPayments,
      monthlySessions,
      completed,
      verified,
      cancellationRequests,
      approvedCancellations,
      revenue,
      verifiedHours,
      teacherRows,
      teacherPayoutDue,
      margin: revenue - teacherPayoutDue,
      confirmationRate,
      deactivatedStudents,
    };
  }, [children, payments, selectedMonth, sessions, teachers]);

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
        description="Revenue, verified teaching, payouts, attendance and cancellations."
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
          label="Revenue"
          value={`$${report.revenue}`}
          sub={`${report.monthlyPayments.length} parent payment${report.monthlyPayments.length === 1 ? '' : 's'}`}
          accent
        />
        <StatTile
          icon={Clock}
          label="Verified hours"
          value={report.verifiedHours.toFixed(1)}
          sub={`${report.verified.length} verified session${report.verified.length === 1 ? '' : 's'}`}
        />
        <StatTile
          icon={GraduationCap}
          label="Teacher payout due"
          value={`$${report.teacherPayoutDue}`}
          sub="pay teachers individually"
        />
        <StatTile
          icon={TrendingUp}
          label="Gross margin"
          value={`$${report.margin}`}
          sub="revenue minus teacher due"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          icon={CheckCircle2}
          label="Attendance verified"
          value={`${report.confirmationRate}%`}
          sub={`${report.verified.length}/${report.completed.length} completed`}
        />
        <StatTile
          icon={AlertTriangle}
          label="Cancellation requests"
          value={report.cancellationRequests.length}
          sub={`${report.approvedCancellations.length} approved`}
        />
        <StatTile
          icon={Users}
          label="Active students"
          value={children.length - report.deactivatedStudents}
          sub={`${report.deactivatedStudents} deactivated`}
        />
        <StatTile
          icon={Clock}
          label="Total sessions"
          value={report.monthlySessions.length}
          sub={`${report.completed.length} completed`}
        />
      </div>

      <section>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90 mb-3">
          Teacher payout breakdown
        </h2>
        <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead className="bg-gray-50 dark:bg-background text-xs text-gray-500 dark:text-muted-foreground uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Teacher</th>
                  <th className="text-right px-4 py-3 font-medium">Verified sessions</th>
                  <th className="text-right px-4 py-3 font-medium">Hours</th>
                  <th className="text-right px-4 py-3 font-medium">Rate</th>
                  <th className="text-right px-4 py-3 font-medium">Amount due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.teacherRows.map((row) => (
                  <tr key={row.teacher.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 dark:text-foreground">
                        {row.teacher.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-muted-foreground">
                        {row.teacher.subjects.join(', ')}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-foreground/90">
                      {row.sessions}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-foreground/90">
                      {row.hours.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-foreground/90">
                      ${row.teacher.hourlyRate}/hr
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-foreground">
                      ${row.amountDue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <ReportList
          title="Sessions needing attendance"
          empty="Every completed session is verified."
          rows={report.completed
            .filter((session) => !isSessionPayoutEligible(session.attendance))
            .map((session) => ({
              id: session.id,
              label: session.subject,
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
