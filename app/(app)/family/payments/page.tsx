'use client';

import { useMemo } from 'react';
import { CheckCircle2, CreditCard, Plus, Receipt } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  familyAllSessions,
  familyPayments,
  familyTeacher,
} from '@/lib/store/family';
import type { Payment, Session } from '@/lib/types';

export default function FamilyPaymentsPage() {
  const payments = familyPayments();
  const allSessions = familyAllSessions();

  const activePlan = useMemo(() => {
    return (
      payments.find((p) => p.sessionsUsed < p.sessionsIncluded) ?? payments[0]
    );
  }, [payments]);

  const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);
  const completedReceipts = allSessions.filter(
    (s) => s.status === 'Completed',
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Your plan, receipts and next billing — all in one place."
        action={
          <Button className="bg-brand hover:bg-brand-600 rounded-full">
            <Plus className="w-4 h-4 mr-2" />
            Top up bundle
          </Button>
        }
      />

      {activePlan ? (
        <PlanCard plan={activePlan} />
      ) : (
        <div className="bg-accent2-50 border border-accent2-100 rounded-3xl p-6 text-center">
          <p className="text-sm font-semibold text-brand">No active plan yet</p>
          <p className="text-xs text-gray-600 dark:text-muted-foreground mt-1">
            Pick a single session or a starter bundle to begin.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryTile
          icon={CreditCard}
          label="Lifetime spent"
          value={`$${totalSpent}`}
        />
        <SummaryTile
          icon={CheckCircle2}
          label="Sessions used"
          value={String(completedReceipts.length)}
        />
        <SummaryTile
          icon={Receipt}
          label="Bundles purchased"
          value={String(payments.length)}
        />
        <SummaryTile
          icon={CreditCard}
          label="Default method"
          value={payments[0]?.gateway ?? '—'}
        />
      </div>

      <section>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90 mb-3">Receipts</h2>
        {completedReceipts.length === 0 ? (
          <div className="bg-white dark:bg-card rounded-2xl border border-dashed border-gray-300 dark:border-border p-10 text-center">
            <Receipt className="w-6 h-6 text-gray-400 dark:text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700 dark:text-foreground/90">
              No receipts yet
            </p>
            <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
              Completed sessions will appear here with their charge.
            </p>
          </div>
        ) : (
          <ReceiptTable sessions={completedReceipts} />
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90 mb-3">Purchases</h2>
        <div className="space-y-2">
          {payments.map((p) => (
            <PurchaseRow key={p.id} payment={p} />
          ))}
        </div>
      </section>
    </div>
  );
}

function PlanCard({ plan }: { plan: Payment }) {
  const remaining = plan.sessionsIncluded - plan.sessionsUsed;
  const percent = (plan.sessionsUsed / plan.sessionsIncluded) * 100;
  return (
    <section className="bg-brand text-white rounded-3xl p-6 lg:p-8 relative overflow-hidden">
      <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-accent2-500/20" />
      <div className="relative z-10 space-y-4">
        <p className="text-xs uppercase tracking-wide text-accent2-400 font-semibold">
          Current plan
        </p>
        <div className="flex items-baseline gap-3 flex-wrap">
          <h2 className="text-2xl lg:text-3xl font-bold">{plan.plan}</h2>
          <span className="text-sm text-white/70">
            via {plan.gateway} · ${plan.amount}
          </span>
        </div>
        <p className="text-white/80 text-sm">
          {plan.sessionsUsed} of {plan.sessionsIncluded} sessions used ·{' '}
          {remaining} remaining
        </p>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent2-500 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </section>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-4">
      <div className="w-9 h-9 rounded-lg bg-accent2-100 text-brand flex items-center justify-center mb-3">
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xs text-gray-500 dark:text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold text-gray-900 dark:text-foreground mt-1">{value}</p>
    </div>
  );
}

function ReceiptTable({ sessions }: { sessions: Session[] }) {
  return (
    <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-background text-xs text-gray-500 dark:text-muted-foreground uppercase tracking-wide">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Date</th>
            <th className="text-left px-4 py-3 font-medium">Subject</th>
            <th className="text-left px-4 py-3 font-medium">Teacher</th>
            <th className="text-right px-4 py-3 font-medium">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sessions.map((s) => {
            const teacher = familyTeacher(s.teacherId);
            return (
              <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                <td className="px-4 py-3 text-gray-700 dark:text-foreground/90">
                  {new Date(s.startsAt).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-4 py-3 text-gray-700 dark:text-foreground/90">{s.subject}</td>
                <td className="px-4 py-3 text-gray-700 dark:text-foreground/90">{teacher.name}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-foreground">
                  ${s.amount}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PurchaseRow({ payment }: { payment: Payment }) {
  return (
    <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-4 flex items-center justify-between">
      <div>
        <p className="font-semibold text-gray-900 dark:text-foreground text-sm">{payment.plan}</p>
        <p className="text-xs text-gray-500 dark:text-muted-foreground">
          {new Date(payment.createdAt).toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}{' '}
          · {payment.gateway}
        </p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-gray-900 dark:text-foreground">${payment.amount}</p>
        <p
          className={cn(
            'text-[11px] font-medium',
            payment.sessionsUsed < payment.sessionsIncluded
              ? 'text-accent2-600'
              : 'text-gray-400',
          )}
        >
          {payment.sessionsUsed}/{payment.sessionsIncluded} used
        </p>
      </div>
    </div>
  );
}
