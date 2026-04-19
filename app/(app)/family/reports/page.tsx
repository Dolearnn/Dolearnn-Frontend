'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  CreditCard,
  PauseCircle,
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
  familyChildren,
  familyPayments,
  familySessionNote,
  familySessionsForChild,
  familyTeacher,
} from '@/lib/store/family';
import { cn } from '@/lib/utils';
import { isSessionPayoutEligible } from '@/lib/types';

function monthKey(date: string) {
  return date.slice(0, 7);
}

function monthLabel(key: string) {
  return new Date(`${key}-01T00:00:00`).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

export default function FamilyReportsPage() {
  const children = familyChildren();
  const payments = familyPayments();
  const allSessions = children.flatMap((child) =>
    familySessionsForChild(child.id).map((session) => ({
      ...session,
      child,
    })),
  );

  const monthOptions = useMemo(() => {
    const keys = new Set<string>([new Date().toISOString().slice(0, 7)]);
    payments.forEach((payment) => keys.add(monthKey(payment.createdAt)));
    allSessions.forEach((session) => keys.add(monthKey(session.startsAt)));
    return Array.from(keys).sort((a, b) => b.localeCompare(a));
  }, [allSessions, payments]);

  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]);

  const report = useMemo(() => {
    const monthlyPayments = payments.filter(
      (payment) => monthKey(payment.createdAt) === selectedMonth,
    );
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
    const amountPaid = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);
    const planSessions = monthlyPayments.reduce(
      (sum, p) => sum + p.sessionsIncluded,
      0,
    );
    const usedSessions = monthlyPayments.reduce(
      (sum, p) => sum + p.sessionsUsed,
      0,
    );
    const byChild = children.map((child) => {
      const childSessions = monthlySessions.filter((s) => s.childId === child.id);
      const childCompleted = childSessions.filter((s) => s.status === 'Completed');
      const childVerified = childCompleted.filter((s) =>
        isSessionPayoutEligible(s.attendance),
      );
      const childCancelled = childSessions.filter((s) => s.status === 'Cancelled');
      return {
        child,
        sessions: childSessions.length,
        completed: childCompleted.length,
        verified: childVerified.length,
        cancelled: childCancelled.length,
      };
    });
    const feedback = completed
      .map((session) => ({
        session,
        note: familySessionNote(session.noteId),
        teacher: familyTeacher(session.teacherId),
      }))
      .filter((item) => item.note)
      .slice(0, 4);

    return {
      monthlyPayments,
      monthlySessions,
      completed,
      upcoming,
      cancelled,
      verified,
      awaitingConfirmation,
      cancellations,
      amountPaid,
      planSessions,
      usedSessions,
      byChild,
      feedback,
      pausedChildren: children.filter((child) => child.status === 'Deactivated'),
    };
  }, [allSessions, children, payments, selectedMonth]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monthly report"
        description="Your family&apos;s lessons, payments, confirmations and child activity."
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
          label="Paid this month"
          value={`$${report.amountPaid}`}
          sub={`${report.monthlyPayments.length} payment${report.monthlyPayments.length === 1 ? '' : 's'}`}
        />
        <StatTile
          icon={CheckCircle2}
          label="To confirm"
          value={report.awaitingConfirmation.length}
          sub="completed classes"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          icon={Users}
          label="Children"
          value={children.length}
          sub={`${report.pausedChildren.length} paused`}
        />
        <StatTile
          icon={CreditCard}
          label="Plan usage"
          value={`${report.usedSessions}/${report.planSessions || 0}`}
          sub="sessions used"
        />
        <StatTile
          icon={AlertTriangle}
          label="Cancellations"
          value={report.cancellations.length}
          sub={`${report.cancelled.length} approved`}
        />
        <StatTile
          icon={PauseCircle}
          label="Paused students"
          value={report.pausedChildren.length}
        />
      </div>

      <section>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90 mb-3">
          Child activity
        </h2>
        <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead className="bg-gray-50 dark:bg-background text-xs text-gray-500 dark:text-muted-foreground uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Student</th>
                  <th className="text-right px-4 py-3 font-medium">Sessions</th>
                  <th className="text-right px-4 py-3 font-medium">Completed</th>
                  <th className="text-right px-4 py-3 font-medium">Verified</th>
                  <th className="text-right px-4 py-3 font-medium">Cancelled</th>
                  <th className="text-right px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.byChild.map((row) => (
                  <tr key={row.child.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 dark:text-foreground">
                        {row.child.fullName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-muted-foreground">
                        {row.child.school ?? 'No school listed'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-foreground/90">
                      {row.sessions}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-foreground/90">
                      {row.completed}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-foreground/90">
                      {row.verified}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-foreground/90">
                      {row.cancelled}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          'text-[11px] font-medium px-2 py-0.5 rounded-full',
                          row.child.status === 'Deactivated'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-accent2-50 text-accent2-700',
                        )}
                      >
                        {row.child.status === 'Deactivated' ? 'Paused' : 'Active'}
                      </span>
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
          title="Sessions awaiting your confirmation"
          empty="No completed sessions need confirmation."
          rows={report.awaitingConfirmation.map((session) => ({
            id: session.id,
            label: `${session.child.fullName} - ${session.subject}`,
            sub: `${new Date(session.startsAt).toLocaleDateString()} with ${familyTeacher(session.teacherId).name}`,
            tone: 'warning',
          }))}
        />
        <ReportList
          title="Cancellation activity"
          empty="No cancellation requests this month."
          rows={report.cancellations.map((session) => ({
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

      <section>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90 mb-3">
          Recent feedback
        </h2>
        {report.feedback.length === 0 ? (
          <div className="bg-white dark:bg-card rounded-2xl border border-dashed border-gray-300 dark:border-border p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-muted-foreground">
              Feedback will appear after completed sessions.
            </p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-3">
            {report.feedback.map(({ session, note, teacher }) => (
              <div
                key={session.id}
                className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-4"
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-foreground">
                  {session.child.fullName} - {session.subject}
                </p>
                <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                  {teacher.name} - {new Date(session.startsAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-700 dark:text-foreground/90 mt-3 line-clamp-2">
                  {note?.covered}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-muted-foreground mt-2">
                  Next: {note?.focusNext}
                </p>
              </div>
            ))}
          </div>
        )}
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
