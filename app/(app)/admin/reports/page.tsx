'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { PageShellSkeleton } from '@/components/dashboard/Skeletons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  adminKeys,
  listAdminSessions,
  listAdminStudents,
} from '@/lib/api/admin';
import {
  listAdminPayments,
  listAdminTeacherPayouts,
  paymentKeys,
  type TeacherPayoutSummary,
} from '@/lib/api/payments';
import { cn } from '@/lib/utils';
import { isSessionPayoutEligible, type Child, type Payment, type Session } from '@/lib/types';

const EMPTY_PAYMENTS: Payment[] = [];
const EMPTY_SESSIONS: Session[] = [];
const EMPTY_STUDENTS: Child[] = [];
const EMPTY_PAYOUTS: TeacherPayoutSummary[] = [];

function monthKey(date: string) {
  return date.slice(0, 7);
}

function monthLabel(key: string) {
  return new Date(`${key}-01T00:00:00`).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default function AdminReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const paymentsQuery = useQuery({
    queryKey: paymentKeys.adminPayments,
    queryFn: listAdminPayments,
  });
  const sessionsQuery = useQuery({
    queryKey: adminKeys.sessions,
    queryFn: listAdminSessions,
  });
  const studentsQuery = useQuery({
    queryKey: adminKeys.students,
    queryFn: listAdminStudents,
  });
  const payoutsQuery = useQuery({
    queryKey: paymentKeys.adminPayouts(selectedMonth),
    queryFn: () => listAdminTeacherPayouts(selectedMonth),
  });

  const payments = paymentsQuery.data ?? EMPTY_PAYMENTS;
  const sessions = sessionsQuery.data ?? EMPTY_SESSIONS;
  const children = studentsQuery.data ?? EMPTY_STUDENTS;
  const teacherRows = payoutsQuery.data ?? EMPTY_PAYOUTS;
  const isLoading =
    paymentsQuery.isLoading ||
    sessionsQuery.isLoading ||
    studentsQuery.isLoading ||
    payoutsQuery.isLoading;
  const isError =
    paymentsQuery.isError ||
    sessionsQuery.isError ||
    studentsQuery.isError ||
    payoutsQuery.isError;

  const monthOptions = useMemo(() => {
    const keys = new Set<string>([currentMonth()]);
    payments.forEach((payment) => keys.add(monthKey(payment.createdAt)));
    sessions.forEach((session) => keys.add(monthKey(session.startsAt)));
    return Array.from(keys).sort((a, b) => b.localeCompare(a));
  }, [payments, sessions]);

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
    const verifiedHours = teacherRows.reduce(
      (sum, row) => sum + row.verifiedHours,
      0,
    );
    const teacherPayoutDue = teacherRows.reduce(
      (sum, row) => sum + row.amount,
      0,
    );
    const paidTeacherPayout = teacherRows.reduce(
      (sum, row) => sum + (row.status === 'Paid' ? row.amount : 0),
      0,
    );
    const confirmationRate =
      completed.length > 0
        ? Math.round((verified.length / completed.length) * 100)
        : 0;
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
      paidTeacherPayout,
      margin: revenue - teacherPayoutDue,
      confirmationRate,
      deactivatedStudents,
    };
  }, [children, payments, selectedMonth, sessions, teacherRows]);

  if (isLoading) {
    return <PageShellSkeleton />;
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Monthly report" description="" />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          We could not load reports right now. Please try again.
        </div>
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
          value={`$${report.revenue.toFixed(0)}`}
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
          value={`$${report.teacherPayoutDue.toFixed(0)}`}
          sub={`$${report.paidTeacherPayout.toFixed(0)} paid`}
        />
        <StatTile
          icon={TrendingUp}
          label="Gross margin"
          value={`$${report.margin.toFixed(0)}`}
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
            <table className="w-full text-sm min-w-[760px]">
              <thead className="bg-gray-50 dark:bg-background text-xs text-gray-500 dark:text-muted-foreground uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Teacher</th>
                  <th className="text-right px-4 py-3 font-medium">
                    Verified sessions
                  </th>
                  <th className="text-right px-4 py-3 font-medium">Hours</th>
                  <th className="text-right px-4 py-3 font-medium">Rate</th>
                  <th className="text-right px-4 py-3 font-medium">Amount due</th>
                  <th className="text-right px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.teacherRows.map((row) => (
                  <tr
                    key={row.teacherId}
                    className="hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 dark:text-foreground">
                        {row.teacherName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-muted-foreground">
                        {row.subjects.join(', ')}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-foreground/90">
                      {row.sessionCount}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-foreground/90">
                      {row.verifiedHours.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-foreground/90">
                      ${row.hourlyRate}/hr
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-foreground">
                      ${row.amount.toFixed(0)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          'text-[11px] font-medium px-2 py-0.5 rounded-full',
                          row.status === 'Paid'
                            ? 'bg-accent2-50 text-accent2-700'
                            : row.amount > 0
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-gray-100 text-gray-500',
                        )}
                      >
                        {row.amount === 0 ? 'No payout' : row.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {report.teacherRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-gray-500"
                    >
                      No teachers found for this report.
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
          title="Sessions needing attendance"
          empty="Every completed session is verified."
          rows={report.completed
            .filter((session) => !isSessionPayoutEligible(session.attendance))
            .map((session) => ({
              id: session.id,
              label: `${session.subject} - ${session.childName ?? 'Student'}`,
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
        <p className="text-xs text-gray-500 dark:text-muted-foreground">
          {empty}
        </p>
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
