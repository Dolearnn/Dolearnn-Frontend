'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, DollarSign, TrendingUp, Wallet } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import StatTile from '@/components/dashboard/StatTile';
import { PageShellSkeleton } from '@/components/dashboard/Skeletons';
import {
  getTeacherProfile,
  listTeacherSessions,
  teacherKeys,
} from '@/lib/api/teacher';
import {
  listTeacherPayouts,
  paymentKeys,
  type TeacherPayoutRecord,
} from '@/lib/api/payments';
import { cn } from '@/lib/utils';
import type { Session } from '@/lib/types';

const EMPTY_SESSIONS: Session[] = [];
const EMPTY_PAYOUTS: TeacherPayoutRecord[] = [];

export default function TeacherEarningsPage() {
  const profileQuery = useQuery({
    queryKey: teacherKeys.profile,
    queryFn: getTeacherProfile,
  });
  const sessionsQuery = useQuery({
    queryKey: teacherKeys.sessions,
    queryFn: listTeacherSessions,
  });
  const payoutsQuery = useQuery({
    queryKey: paymentKeys.teacherPayouts,
    queryFn: listTeacherPayouts,
  });
  const teacher = profileQuery.data;
  const sessions = sessionsQuery.data ?? EMPTY_SESSIONS;
  const payouts = payoutsQuery.data ?? EMPTY_PAYOUTS;
  const isLoading =
    profileQuery.isLoading || sessionsQuery.isLoading || payoutsQuery.isLoading;
  const isError =
    profileQuery.isError || sessionsQuery.isError || payoutsQuery.isError;

  const rows = useMemo(() => {
    if (!teacher) return [];
    return sessions
      .filter((session) => session.status === 'Completed')
      .map((session) => {
        const teacherConfirmed = Boolean(session.attendance?.teacherConfirmedAt);
        const familyConfirmed = Boolean(session.attendance?.familyConfirmedAt);
        const verified = teacherConfirmed && familyConfirmed;
        return {
          sessionId: session.id,
          date: session.startsAt,
          studentName: session.childName ?? 'Student',
          subject: session.subject,
          durationMins: session.durationMins,
          amount: (session.durationMins / 60) * teacher.hourlyRate,
          status: verified ? 'Verified' : 'Pending confirmation',
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [sessions, teacher]);

  const totals = useMemo(() => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonth = rows.filter((e) => e.date.startsWith(monthKey));
    const verifiedThisMonth = thisMonth.filter((e) => e.status === 'Verified');
    const verifiedHours =
      verifiedThisMonth.reduce((sum, e) => sum + e.durationMins, 0) / 60;
    const expected = verifiedThisMonth.reduce((sum, e) => sum + e.amount, 0);
    const pending = thisMonth
      .filter((e) => e.status !== 'Verified')
      .reduce((sum, e) => sum + e.amount, 0);
    const paid = payouts
      .filter((payout) => payout.status === 'Paid')
      .reduce((sum, payout) => sum + payout.amount, 0);
    return { expected, pending, verifiedHours, paid };
  }, [rows, payouts]);

  if (isLoading) {
    return <PageShellSkeleton />;
  }

  if (isError || !teacher) {
    return (
      <div className="space-y-6">
        <PageHeader title="Earnings" description="" />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          We could not load earnings right now. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Earnings"
        description="Monthly payout estimate based on verified teaching hours."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          icon={Wallet}
          label="Expected this month"
          value={`$${totals.expected.toFixed(0)}`}
          sub="verified sessions"
          accent
        />
        <StatTile
          icon={DollarSign}
          label="Paid out"
          value={`$${totals.paid.toFixed(0)}`}
          sub={`${payouts.length} payout record${payouts.length === 1 ? '' : 's'}`}
        />
        <StatTile
          icon={Clock}
          label="Verified hours"
          value={totals.verifiedHours.toFixed(1)}
          sub="family + teacher confirmed"
        />
        <StatTile
          icon={TrendingUp}
          label="Admin-set rate"
          value={`$${teacher.hourlyRate}/hr`}
        />
      </div>

      <section>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90 mb-3">
          Session earnings
        </h2>
        {rows.length === 0 ? (
          <div className="bg-white dark:bg-card rounded-2xl border border-dashed border-gray-300 dark:border-border p-10 text-center">
            <p className="text-sm text-gray-500 dark:text-muted-foreground">
              No session earnings yet. Completed classes will show up here.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-background text-xs text-gray-500 dark:text-muted-foreground uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Student</th>
                  <th className="text-left px-4 py-3 font-medium">Subject</th>
                  <th className="text-right px-4 py-3 font-medium">Duration</th>
                  <th className="text-right px-4 py-3 font-medium">Amount</th>
                  <th className="text-right px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((e) => (
                  <tr
                    key={e.sessionId}
                    className="hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3 text-gray-700 dark:text-foreground/90">
                      {new Date(e.date).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-foreground/90">
                      {e.studentName}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-foreground/90">
                      {e.subject}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 dark:text-muted-foreground">
                      {e.durationMins} min
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-foreground">
                      ${e.amount.toFixed(0)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          'text-[11px] font-medium px-2 py-0.5 rounded-full',
                          e.status === 'Verified'
                            ? 'bg-accent2-50 text-accent2-700'
                            : 'bg-amber-50 text-amber-700',
                        )}
                      >
                        {e.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90 mb-3">
          Payout history
        </h2>
        {payouts.length === 0 ? (
          <div className="bg-white dark:bg-card rounded-2xl border border-dashed border-gray-300 dark:border-border p-10 text-center">
            <p className="text-sm text-gray-500 dark:text-muted-foreground">
              No payouts have been recorded yet.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {payouts.map((payout) => (
              <div
                key={payout.id}
                className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-gray-900 dark:text-foreground text-sm">
                    {payout.month} payout
                  </p>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground">
                    {new Date(payout.date).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-foreground">
                    ${payout.amount.toFixed(0)}
                  </p>
                  <span
                    className={cn(
                      'text-[11px] font-medium px-2 py-0.5 rounded-full',
                      payout.status === 'Paid'
                        ? 'bg-accent2-50 text-accent2-700'
                        : 'bg-amber-50 text-amber-700',
                    )}
                  >
                    {payout.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
