'use client';

import { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import StatTile from '@/components/dashboard/StatTile';
import { Button } from '@/components/ui/button';
import {
  adminParents,
  adminPayments,
  adminPayouts,
  adminSessions,
  adminTeacherById,
  adminTeachers,
} from '@/lib/store/admin';
import { cn } from '@/lib/utils';
import { isSessionPayoutEligible, type Payment } from '@/lib/types';
import { useMounted } from '@/lib/use-mounted';

export default function AdminPaymentsPage() {
  const mounted = useMounted();
  const [paidTeacherIds, setPaidTeacherIds] = useState<Set<string>>(
    () => new Set(),
  );
  const payments = adminPayments();
  const payouts = adminPayouts();
  const parents = adminParents();
  const sessions = adminSessions();
  const teachers = adminTeachers();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const verifiedSessions = sessions.filter((s) =>
    isSessionPayoutEligible(s.attendance) && s.startsAt.startsWith(currentMonth),
  );

  const revenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const teacherPayouts = useMemo(
    () =>
      teachers.map((teacher) => {
        const teacherSessions = verifiedSessions.filter(
          (session) => session.teacherId === teacher.id,
        );
        const verifiedMins = teacherSessions.reduce(
          (sum, session) => sum + session.durationMins,
          0,
        );
        const verifiedHours = verifiedMins / 60;
        const amountDue = Math.round(verifiedHours * teacher.hourlyRate);
        return {
          teacher,
          verifiedHours,
          sessionCount: teacherSessions.length,
          amountDue,
          paid: paidTeacherIds.has(teacher.id),
        };
      }),
    [teachers, verifiedSessions, paidTeacherIds],
  );
  const teacherOwed = teacherPayouts.reduce(
    (sum, row) => sum + (row.paid ? 0 : row.amountDue),
    0,
  );
  const paidOut =
    payouts.reduce((sum, p) => sum + p.amount, 0) +
    teacherPayouts.reduce((sum, row) => sum + (row.paid ? row.amountDue : 0), 0);
  const totalTeacherPayouts = teacherPayouts.reduce(
    (sum, row) => sum + row.amountDue,
    0,
  );
  const margin = revenue - totalTeacherPayouts;
  const marginPct = revenue > 0 ? Math.round((margin / revenue) * 100) : 0;
  const monthLabel = new Date(`${currentMonth}-01T00:00:00`).toLocaleDateString(
    undefined,
    {
      month: 'long',
      year: 'numeric',
    },
  );

  const combined = useMemo(() => {
    type Row =
      | { kind: 'in'; date: string; amount: number; label: string; sub: string }
      | { kind: 'out'; date: string; amount: number; label: string; sub: string };
    const rows: Row[] = [];
    for (const p of payments) {
      const parent = parents.find((pa) => pa.id === p.parentId);
      rows.push({
        kind: 'in',
        date: p.createdAt,
        amount: p.amount,
        label: `${p.plan} · ${parent?.name ?? 'Parent'}`,
        sub: `${p.gateway} · ${p.sessionsUsed}/${p.sessionsIncluded} used`,
      });
    }
    for (const p of payouts) {
      rows.push({
        kind: 'out',
        date: p.date,
        amount: p.amount,
        label: `Payout via ${p.method}`,
        sub: 'Teacher earnings',
      });
    }
    return rows.sort((a, b) => b.date.localeCompare(a.date));
  }, [payments, payouts, parents]);

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
        title="Payments"
        description="Revenue, teacher payouts and active plans."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          icon={Wallet}
          label="Revenue"
          value={`$${revenue}`}
          sub="all-time family spend"
          accent
        />
        <StatTile
          icon={ArrowUpRight}
          label="Teacher payout due"
          value={`$${Math.round(teacherOwed)}`}
          sub={`${verifiedSessions.length} verified session${verifiedSessions.length === 1 ? '' : 's'}`}
        />
        <StatTile
          icon={TrendingUp}
          label="Gross margin"
          value={`$${margin}`}
          sub={`${marginPct}% retained`}
        />
        <StatTile
          icon={ArrowDownRight}
          label="Paid to teachers"
          value={`$${paidOut}`}
          sub={`${payouts.length} payouts`}
        />
      </div>

      <section>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90">
              Teacher payouts for {monthLabel}
            </h2>
            <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
              Pay teachers individually from verified sessions only.
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead className="bg-gray-50 dark:bg-background text-xs text-gray-500 dark:text-muted-foreground uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Teacher</th>
                  <th className="text-right px-4 py-3 font-medium">Sessions</th>
                  <th className="text-right px-4 py-3 font-medium">Verified hours</th>
                  <th className="text-right px-4 py-3 font-medium">Rate</th>
                  <th className="text-right px-4 py-3 font-medium">Amount due</th>
                  <th className="text-right px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {teacherPayouts.map((row) => (
                  <tr
                    key={row.teacher.id}
                    className="hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 dark:text-foreground">
                        {row.teacher.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-muted-foreground">
                        {row.teacher.subjects.join(', ')}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-foreground/90">
                      {row.sessionCount}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-foreground/90">
                      {row.verifiedHours.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-foreground/90">
                      ${row.teacher.hourlyRate}/hr
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-foreground">
                      ${row.amountDue}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          'text-[11px] font-medium px-2 py-0.5 rounded-full',
                          row.paid
                            ? 'bg-accent2-50 text-accent2-700'
                            : row.amountDue > 0
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-gray-100 text-gray-500',
                        )}
                      >
                        {row.paid
                          ? 'Paid'
                          : row.amountDue > 0
                          ? 'Pending'
                          : 'No payout'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant={row.paid ? 'outline' : 'default'}
                        className={cn(
                          'rounded-full',
                          !row.paid && 'bg-brand hover:bg-brand-600',
                        )}
                        disabled={row.paid || row.amountDue === 0}
                        onClick={() =>
                          setPaidTeacherIds((prev) =>
                            new Set(prev).add(row.teacher.id),
                          )
                        }
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        {row.paid ? 'Paid' : 'Mark paid'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90 mb-3">
          Active plans
        </h2>
        {payments.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-muted-foreground">No plans yet.</p>
        ) : (
          <div className="grid lg:grid-cols-2 gap-3">
            {payments.map((p) => (
              <PlanRow
                key={p.id}
                payment={p}
                parentName={
                  parents.find((pa) => pa.id === p.parentId)?.name ?? 'Parent'
                }
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90 mb-3">Ledger</h2>
        <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-background text-xs text-gray-500 dark:text-muted-foreground uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Description</th>
                <th className="text-right px-4 py-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {combined.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5">
                  <td className="px-4 py-3 text-gray-700 dark:text-foreground/90 whitespace-nowrap">
                    {new Date(row.date).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        row.kind === 'in'
                          ? 'text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent2-50 text-accent2-700'
                          : 'text-[11px] font-medium px-2 py-0.5 rounded-full bg-brand/10 text-brand'
                      }
                    >
                      {row.kind === 'in' ? 'Revenue' : 'Payout'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-foreground/90">
                    <p className="font-medium text-gray-900 dark:text-foreground">{row.label}</p>
                    <p className="text-xs text-gray-500 dark:text-muted-foreground">{row.sub}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-foreground whitespace-nowrap">
                    {row.kind === 'in' ? '+' : '−'}${row.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function PlanRow({
  payment,
  parentName,
}: {
  payment: Payment;
  parentName: string;
}) {
  const percent = (payment.sessionsUsed / payment.sessionsIncluded) * 100;
  const remaining = payment.sessionsIncluded - payment.sessionsUsed;
  return (
    <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="font-semibold text-gray-900 dark:text-foreground text-sm">{payment.plan}</p>
          <p className="text-xs text-gray-500 dark:text-muted-foreground">
            {parentName} · via {payment.gateway}
          </p>
        </div>
        <p className="text-sm font-semibold text-gray-900 dark:text-foreground">${payment.amount}</p>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent2-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-[11px] text-gray-500 dark:text-muted-foreground mt-2">
        {payment.sessionsUsed}/{payment.sessionsIncluded} used · {remaining}{' '}
        remaining
      </p>
    </div>
  );
}
