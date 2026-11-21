'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, CreditCard, Receipt } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import { PageShellSkeleton } from '@/components/dashboard/Skeletons';
import { Button } from '@/components/ui/button';
import { familyKeys, listFamilySessions } from '@/lib/api/family';
import { listFamilyPayments, paymentKeys } from '@/lib/api/payments';
import { cn } from '@/lib/utils';
import type { Payment, Session } from '@/lib/types';
import { naira } from '@/lib/money';

const EMPTY_PAYMENTS: Payment[] = [];
const EMPTY_SESSIONS: Session[] = [];

export default function FamilyPaymentsPage() {
  const paymentsQuery = useQuery({
    queryKey: paymentKeys.familyPayments,
    queryFn: listFamilyPayments,
  });
  const sessionsQuery = useQuery({
    queryKey: familyKeys.sessions,
    queryFn: listFamilySessions,
  });
  const payments = paymentsQuery.data ?? EMPTY_PAYMENTS;
  const allSessions = sessionsQuery.data ?? EMPTY_SESSIONS;
  const isLoading = paymentsQuery.isLoading || sessionsQuery.isLoading;
  const isError = paymentsQuery.isError || sessionsQuery.isError;

  const activePlan = useMemo(() => {
    return (
      payments.find((p) => p.sessionsUsed < p.sessionsIncluded) ?? payments[0]
    );
  }, [payments]);

  const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);
  const completedReceipts = allSessions.filter(
    (s) => s.status === 'Completed',
  );

  if (isLoading) {
    return <PageShellSkeleton />;
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Payments" description="" />
        <div className="rounded-3xl bg-red-50 p-5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          We could not load payments right now. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Payments"
        description="Your tutoring sessions, receipts and billing history in one place."
      />

      {activePlan ? (
        <PlanCard plan={activePlan} />
      ) : (
        <div className="flex flex-col gap-4 rounded-3xl bg-accent2-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 dark:bg-accent2-500/10">
          <div>
            <p className="font-display text-base font-bold text-brand dark:text-accent2-400">No tutoring sessions paid for yet</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-muted-foreground">
              Tutoring is ₦10,000 per session. Request a tutor and we will confirm your lessons and how to pay.
            </p>
          </div>
          <Button asChild className="h-12 shrink-0 rounded-2xl px-5">
            <Link href="/student/tutor">Request a tutor</Link>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryTile
          icon={CreditCard}
          label="Lifetime spent"
          value={naira(totalSpent)}
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
          label="Payment method"
          value={payments[0]?.gateway ?? '-'}
        />
      </div>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-gray-950 dark:text-foreground">
          Receipts
        </h2>
        {completedReceipts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-center dark:border-border dark:bg-card">
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
        <h2 className="mb-3 font-display text-lg font-bold text-gray-950 dark:text-foreground">
          Purchases
        </h2>
        <div className="divide-y divide-gray-100 overflow-hidden rounded-3xl border border-gray-200/80 bg-white dark:divide-border dark:border-border dark:bg-card">
          {payments.length === 0 ? (
            <p className="p-4 text-sm text-gray-500 dark:text-muted-foreground">
              No purchases yet.
            </p>
          ) : (
            payments.map((p) => <PurchaseRow key={p.id} payment={p} />)
          )}
        </div>
      </section>
    </div>
  );
}

function PlanCard({ plan }: { plan: Payment }) {
  const remaining = plan.sessionsIncluded - plan.sessionsUsed;
  const percent =
    plan.sessionsIncluded > 0
      ? (plan.sessionsUsed / plan.sessionsIncluded) * 100
      : 0;
  return (
    <section className="relative overflow-hidden rounded-[28px] bg-brand p-5 text-white shadow-[0_18px_40px_-24px_rgba(4,66,114,0.9)] dark:bg-[hsl(208,70%,16%)] sm:p-7">
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-accent2-400/25 blur-3xl" />
      <div className="relative">
        <p className="text-sm text-white/70">Current plan</p>
        <h2 className="mt-1 font-display text-2xl font-extrabold">{plan.plan}</h2>
        <p className="mt-1 text-sm text-white/70">
          {naira(plan.amount)}, paid by {plan.gateway}
        </p>
        <p className="mt-5 flex items-baseline gap-2">
          <span className="font-display text-[56px] font-extrabold leading-none tabular-nums">{remaining}</span>
          <span className="text-base text-white/80">
            {remaining === 1 ? 'session left' : 'sessions left'}, {plan.sessionsUsed} of {plan.sessionsIncluded} used
          </span>
        </p>
        <div
          className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/15"
          role="progressbar"
          aria-label="Sessions used"
          aria-valuemin={0}
          aria-valuemax={plan.sessionsIncluded}
          aria-valuenow={plan.sessionsUsed}
        >
          <div className="h-full rounded-full bg-accent2-400 transition-[width]" style={{ width: `${percent}%` }} />
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
    <div className="rounded-3xl border border-gray-200/80 bg-white p-4 dark:border-border dark:bg-card">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-accent2-100 text-brand dark:bg-accent2-500/15 dark:text-accent2-400">
        <Icon className="h-4 w-4" />
      </div>
      <p className="truncate font-display text-xl font-extrabold tabular-nums text-gray-950 dark:text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-muted-foreground">{label}</p>
    </div>
  );
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

// One row per paid session: a list that fits a phone, instead of a wide table.
function ReceiptTable({ sessions }: { sessions: Session[] }) {
  return (
    <ul className="divide-y divide-gray-100 overflow-hidden rounded-3xl border border-gray-200/80 bg-white dark:divide-border dark:border-border dark:bg-card">
      {sessions.map((s) => (
        <li key={s.id} className="flex min-h-16 items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-foreground">{s.subject}</p>
            <p className="truncate text-xs text-gray-500 dark:text-muted-foreground">
              {formatDay(s.startsAt)} with {s.teacherName ?? 'your teacher'}
            </p>
          </div>
          <p className="shrink-0 font-display text-base font-bold tabular-nums text-gray-950 dark:text-foreground">
            {naira(s.amount)}
          </p>
        </li>
      ))}
    </ul>
  );
}

function PurchaseRow({ payment }: { payment: Payment }) {
  return (
    <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-foreground">{payment.plan}</p>
        <p className="truncate text-xs text-gray-500 dark:text-muted-foreground">
          {formatDay(payment.createdAt)}, {payment.gateway}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-display text-base font-bold tabular-nums text-gray-950 dark:text-foreground">
          {naira(payment.amount)}
        </p>
        <p
          className={cn(
            'text-xs font-medium tabular-nums',
            payment.sessionsUsed < payment.sessionsIncluded
              ? 'text-accent2-600 dark:text-accent2-400'
              : 'text-gray-400',
          )}
        >
          {payment.sessionsUsed}/{payment.sessionsIncluded} used
        </p>
      </div>
    </div>
  );
}
