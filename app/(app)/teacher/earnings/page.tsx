'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Banknote, Clock, TrendingUp, Wallet } from 'lucide-react';
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
import { naira } from '@/lib/money';

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
        const hasNote = Boolean(session.note || session.noteId);
        return {
          sessionId: session.id,
          date: session.startsAt,
          studentName: session.childName ?? 'Student',
          subject: session.subject,
          durationMins: session.durationMins,
          // Tutors are paid per session at their own rate.
          amount: teacher.hourlyRate,
          // Paid once attendance is confirmed and the session note is written.
          status: !verified ? 'Pending confirmation' : hasNote ? 'Verified' : 'Note needed',
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [sessions, teacher]);

  const totals = useMemo(() => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonth = rows.filter((e) => e.date.startsWith(monthKey));
    const verifiedThisMonth = thisMonth.filter((e) => e.status === 'Verified');
    const expected = verifiedThisMonth.reduce((sum, e) => sum + e.amount, 0);
    const pending = thisMonth
      .filter((e) => e.status !== 'Verified')
      .reduce((sum, e) => sum + e.amount, 0);
    const paid = payouts
      .filter((payout) => payout.status === 'Paid')
      .reduce((sum, payout) => sum + payout.amount, 0);
    return { expected, pending, verifiedSessions: verifiedThisMonth.length, paid };
  }, [rows, payouts]);

  if (isLoading) {
    return <PageShellSkeleton />;
  }

  if (isError || !teacher) {
    return (
      <div className="space-y-6">
        <PageHeader title="Earnings" description="" />
        <div className="rounded-3xl bg-red-50 p-5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          We could not load earnings right now. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Earnings"
        description="Your expected pay this month, based on verified sessions."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          icon={Wallet}
          label="Expected this month"
          value={naira(totals.expected)}
          sub="verified sessions"
          accent
        />
        <StatTile
          icon={Banknote}
          label="Paid out"
          value={naira(totals.paid)}
          sub={`${payouts.length} payout record${payouts.length === 1 ? '' : 's'}`}
        />
        <StatTile
          icon={Clock}
          label="Verified sessions"
          value={totals.verifiedSessions}
          sub="confirmed by you and the learner, note written"
        />
        <StatTile
          icon={TrendingUp}
          label="Your pay"
          value={naira(teacher.hourlyRate)}
          sub="per session"
        />
      </div>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-gray-950 dark:text-foreground">
          Session earnings
        </h2>
        {rows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white dark:border-border dark:bg-card p-10 text-center">
            <p className="text-sm text-gray-500 dark:text-muted-foreground">
              No session earnings yet. Completed classes will show up here.
            </p>
          </div>
        ) : (
          <div className="rounded-3xl border border-gray-200/80 bg-white dark:border-border dark:bg-card overflow-hidden">
            <ul className="divide-y divide-gray-100 dark:divide-border">
              {rows.map((e) => (
                <li key={e.sessionId} className="flex min-h-16 items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-foreground">
                      {e.studentName}, {e.subject}
                    </p>
                    <p className="truncate text-xs text-gray-500 dark:text-muted-foreground">
                      {new Date(e.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}, {e.durationMins} min
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-base font-bold tabular-nums text-gray-950 dark:text-foreground">{naira(e.amount)}</p>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        e.status === 'Verified'
                          ? 'bg-accent2-50 text-accent2-700 dark:bg-accent2-500/15 dark:text-accent2-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
                      )}
                    >
                      {e.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-gray-950 dark:text-foreground">
          Payout history
        </h2>
        {payouts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white dark:border-border dark:bg-card p-10 text-center">
            <p className="text-sm text-gray-500 dark:text-muted-foreground">
              No payouts have been recorded yet.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {payouts.map((payout) => (
              <div
                key={payout.id}
                className="rounded-3xl border border-gray-200/80 bg-white dark:border-border dark:bg-card p-4 flex items-center justify-between"
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
                    {naira(payout.amount)}
                  </p>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
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
