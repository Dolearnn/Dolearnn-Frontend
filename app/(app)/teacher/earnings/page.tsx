'use client';

import { useMemo } from 'react';
import { Clock, DollarSign, TrendingUp, Wallet } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import StatTile from '@/components/dashboard/StatTile';
import { cn } from '@/lib/utils';
import {
  teacherEarnings,
  teacherMe,
  teacherPayouts,
} from '@/lib/store/teacher';
import { useMounted } from '@/lib/use-mounted';

export default function TeacherEarningsPage() {
  const mounted = useMounted();
  const teacher = teacherMe();
  const earnings = teacherEarnings();
  const payouts = teacherPayouts();

  const totals = useMemo(() => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonth = earnings.filter((e) => e.date.startsWith(monthKey));
    const payoutTotal = payouts.reduce((sum, p) => sum + p.amount, 0);
    const verifiedHours =
      thisMonth.reduce((sum, e) => sum + e.durationMins, 0) / 60;
    const expected = thisMonth.reduce((sum, e) => sum + e.amount, 0);
    return { expected, payoutTotal, verifiedHours };
  }, [earnings, payouts]);

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
        title="Earnings"
        description="Monthly payout estimate based on verified teaching hours."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          icon={Wallet}
          label="Lifetime payouts"
          value={`$${totals.payoutTotal}`}
          sub={`${payouts.length} transfer${payouts.length === 1 ? '' : 's'}`}
          accent
        />
        <StatTile
          icon={DollarSign}
          label="Expected this month"
          value={`$${totals.expected}`}
          sub="verified sessions only"
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
          Verified session earnings
        </h2>
        {earnings.length === 0 ? (
          <div className="bg-white dark:bg-card rounded-2xl border border-dashed border-gray-300 dark:border-border p-10 text-center">
            <p className="text-sm text-gray-500 dark:text-muted-foreground">
              No session earnings yet — teach your first session to get paid.
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
                {earnings.map((e) => (
                  <tr key={e.sessionId} className="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-4 py-3 text-gray-700 dark:text-foreground/90">
                      {new Date(e.date).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-foreground/90">{e.studentName}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-foreground/90">{e.subject}</td>
                    <td className="px-4 py-3 text-right text-gray-500 dark:text-muted-foreground">
                      {e.durationMins} min
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-foreground">
                      ${e.amount}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          'text-[11px] font-medium px-2 py-0.5 rounded-full',
                          e.status === 'Paid'
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
        <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90 mb-3">Payouts</h2>
        {payouts.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-muted-foreground">No payouts yet.</p>
        ) : (
          <div className="space-y-2">
            {payouts.map((p) => (
              <div
                key={p.id}
                className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-gray-900 dark:text-foreground text-sm">
                    Payout via {p.method}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground">
                    {new Date(p.date).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <p className="font-semibold text-gray-900 dark:text-foreground">${p.amount}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
