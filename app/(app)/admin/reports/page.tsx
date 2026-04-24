'use client';

import { useEffect, useState } from 'react';
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
import { getAdminReport, reportKeys } from '@/lib/api/reports';
import { cn } from '@/lib/utils';

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function monthLabel(key: string) {
  return new Date(`${key}-01T00:00:00`).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

export default function AdminReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const reportQuery = useQuery({
    queryKey: reportKeys.admin(selectedMonth),
    queryFn: () => getAdminReport(selectedMonth),
  });

  useEffect(() => {
    if (!reportQuery.data) return;
    if (!reportQuery.data.monthOptions.includes(selectedMonth)) {
      setSelectedMonth(reportQuery.data.month);
    }
  }, [reportQuery.data, selectedMonth]);

  if (reportQuery.isLoading) {
    return <PageShellSkeleton />;
  }

  if (reportQuery.isError || !reportQuery.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Monthly report" description="" />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          We could not load reports right now. Please try again.
        </div>
      </div>
    );
  }

  const report = reportQuery.data;

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
                {report.monthOptions.map((key) => (
                  <SelectItem key={key} value={key}>
                    {monthLabel(key)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          icon={DollarSign}
          label="Revenue"
          value={`$${report.summary.revenue.toFixed(0)}`}
          sub={`${report.summary.paymentCount} parent payment${report.summary.paymentCount === 1 ? '' : 's'}`}
          accent
        />
        <StatTile
          icon={Clock}
          label="Verified hours"
          value={report.summary.verifiedHours.toFixed(1)}
          sub={`${report.summary.verifiedSessions} verified session${report.summary.verifiedSessions === 1 ? '' : 's'}`}
        />
        <StatTile
          icon={GraduationCap}
          label="Teacher payout due"
          value={`$${report.summary.teacherPayoutDue.toFixed(0)}`}
          sub={`$${report.summary.paidTeacherPayout.toFixed(0)} paid`}
        />
        <StatTile
          icon={TrendingUp}
          label="Gross margin"
          value={`$${report.summary.margin.toFixed(0)}`}
          sub="revenue minus teacher due"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          icon={CheckCircle2}
          label="Attendance verified"
          value={`${report.summary.confirmationRate}%`}
          sub={`${report.summary.verifiedSessions}/${report.summary.completedSessions} completed`}
        />
        <StatTile
          icon={AlertTriangle}
          label="Cancellation requests"
          value={report.summary.cancellationRequests}
          sub={`${report.summary.approvedCancellations} approved`}
        />
        <StatTile
          icon={Users}
          label="Active students"
          value={report.summary.activeStudents}
          sub={`${report.summary.deactivatedStudents} deactivated`}
        />
        <StatTile
          icon={Clock}
          label="Total sessions"
          value={report.summary.totalSessions}
          sub={`${report.summary.completedSessions} completed`}
        />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-foreground/90">
          Teacher payout breakdown
        </h2>
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-border dark:bg-card">
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-background dark:text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Teacher</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Verified sessions
                  </th>
                  <th className="px-4 py-3 text-right font-medium">Hours</th>
                  <th className="px-4 py-3 text-right font-medium">Rate</th>
                  <th className="px-4 py-3 text-right font-medium">Amount due</th>
                  <th className="px-4 py-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-border">
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
                          'rounded-full px-2 py-0.5 text-[11px] font-medium',
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

      <section className="grid gap-4 lg:grid-cols-2">
        <ReportList
          title="Sessions needing attendance"
          empty="Every completed session is verified."
          rows={report.sessionsNeedingAttendance.map((row) => ({
            ...row,
            tone: 'warning' as const,
          }))}
        />
        <ReportList
          title="Cancellation activity"
          empty="No cancellation requests this month."
          rows={report.cancellationActivity}
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
  rows: Array<{
    id: string;
    label: string;
    sub: string;
    tone?: 'danger' | 'warning' | 'muted';
  }>;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-border dark:bg-card">
      <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-foreground/90">
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
              className="flex items-start justify-between gap-3 rounded-xl bg-gray-50 p-3 dark:bg-background"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-foreground">
                  {row.label}
                </p>
                <p className="line-clamp-2 text-xs text-gray-500 dark:text-muted-foreground">
                  {row.sub}
                </p>
              </div>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-medium capitalize',
                  row.tone === 'danger' && 'bg-red-50 text-red-600',
                  row.tone === 'warning' && 'bg-amber-50 text-amber-700',
                  row.tone === 'muted' && 'bg-gray-100 text-gray-500',
                )}
              >
                {row.tone ?? 'info'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
