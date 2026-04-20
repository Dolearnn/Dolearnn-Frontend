'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Plus,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import StatTile from '@/components/dashboard/StatTile';
import { PageShellSkeleton } from '@/components/dashboard/Skeletons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  createAdminPayment,
  listAdminPaymentParents,
  listAdminPayments,
  listAdminTeacherPayouts,
  markAdminTeacherPayoutPaid,
  paymentKeys,
  type TeacherPayoutSummary,
  type PaymentParent,
} from '@/lib/api/payments';
import { cn } from '@/lib/utils';
import type { Payment, PaymentGateway, PaymentPlan } from '@/lib/types';

const EMPTY_PAYMENTS: Payment[] = [];
const EMPTY_PARENTS: PaymentParent[] = [];
const EMPTY_PAYOUT_SUMMARIES: TeacherPayoutSummary[] = [];

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default function AdminPaymentsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [month] = useState(currentMonth);
  const paymentsQuery = useQuery({
    queryKey: paymentKeys.adminPayments,
    queryFn: listAdminPayments,
  });
  const parentsQuery = useQuery({
    queryKey: paymentKeys.adminParents,
    queryFn: listAdminPaymentParents,
  });
  const payoutsQuery = useQuery({
    queryKey: paymentKeys.adminPayouts(month),
    queryFn: () => listAdminTeacherPayouts(month),
  });

  const payments = paymentsQuery.data ?? EMPTY_PAYMENTS;
  const parents = parentsQuery.data ?? EMPTY_PARENTS;
  const teacherPayouts = payoutsQuery.data ?? EMPTY_PAYOUT_SUMMARIES;
  const isLoading =
    paymentsQuery.isLoading || parentsQuery.isLoading || payoutsQuery.isLoading;
  const isError =
    paymentsQuery.isError || parentsQuery.isError || payoutsQuery.isError;

  const markPaidMutation = useMutation({
    mutationFn: (teacherId: string) => markAdminTeacherPayoutPaid(teacherId, month),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: paymentKeys.adminPayouts(month),
      });
      toast({
        title: 'Payout marked paid',
        description: 'The teacher can now see this payout as paid.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Could not mark payout paid',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const revenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const teacherOwed = teacherPayouts.reduce(
    (sum, row) => sum + (row.status === 'Paid' ? 0 : row.amount),
    0,
  );
  const paidOut = teacherPayouts.reduce(
    (sum, row) => sum + (row.status === 'Paid' ? row.amount : 0),
    0,
  );
  const totalTeacherPayouts = teacherPayouts.reduce(
    (sum, row) => sum + row.amount,
    0,
  );
  const margin = revenue - totalTeacherPayouts;
  const marginPct = revenue > 0 ? Math.round((margin / revenue) * 100) : 0;
  const monthLabel = new Date(`${month}-01T00:00:00`).toLocaleDateString(
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
        label: `${p.plan} - ${parent?.name ?? 'Parent'}`,
        sub: `${p.gateway} - ${p.sessionsUsed}/${p.sessionsIncluded} used`,
      });
    }
    for (const p of teacherPayouts.filter((item) => item.status === 'Paid')) {
      rows.push({
        kind: 'out',
        date: p.paidAt ?? `${p.month}-01T00:00:00Z`,
        amount: p.amount,
        label: `${p.teacherName} payout`,
        sub: `${p.month} teacher earnings`,
      });
    }
    return rows.sort((a, b) => b.date.localeCompare(a.date));
  }, [payments, teacherPayouts, parents]);

  if (isLoading) {
    return <PageShellSkeleton />;
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Payments" description="" />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          We could not load payments right now. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Revenue, teacher payouts and active plans."
        action={<RecordPaymentDialog parents={parents} />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          icon={Wallet}
          label="Revenue"
          value={`$${revenue.toFixed(0)}`}
          sub="all-time family spend"
          accent
        />
        <StatTile
          icon={ArrowUpRight}
          label="Teacher payout due"
          value={`$${teacherOwed.toFixed(0)}`}
          sub={`${teacherPayouts.length} teacher rows`}
        />
        <StatTile
          icon={TrendingUp}
          label="Gross margin"
          value={`$${margin.toFixed(0)}`}
          sub={`${marginPct}% retained`}
        />
        <StatTile
          icon={ArrowDownRight}
          label="Paid to teachers"
          value={`$${paidOut.toFixed(0)}`}
          sub="this payout month"
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
                        {row.status === 'Paid'
                          ? 'Paid'
                          : row.amount > 0
                            ? 'Pending'
                            : 'No payout'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant={row.status === 'Paid' ? 'outline' : 'default'}
                        className={cn(
                          'rounded-full',
                          row.status !== 'Paid' && 'bg-brand hover:bg-brand-600',
                        )}
                        disabled={
                          row.status === 'Paid' ||
                          row.amount === 0 ||
                          markPaidMutation.isPending
                        }
                        onClick={() => markPaidMutation.mutate(row.teacherId)}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        {row.status === 'Paid' ? 'Paid' : 'Mark paid'}
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
          <p className="text-xs text-gray-500 dark:text-muted-foreground">
            No plans yet.
          </p>
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
        <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90 mb-3">
          Ledger
        </h2>
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
                    <p className="font-medium text-gray-900 dark:text-foreground">
                      {row.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-muted-foreground">
                      {row.sub}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-foreground whitespace-nowrap">
                    {row.kind === 'in' ? '+' : '-'}${row.amount.toFixed(0)}
                  </td>
                </tr>
              ))}
              {combined.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    No ledger entries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function RecordPaymentDialog({ parents }: { parents: PaymentParent[] }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [parentId, setParentId] = useState(parents[0]?.id ?? '');
  const [plan, setPlan] = useState<PaymentPlan>('Starter Bundle');
  const [gateway, setGateway] = useState<PaymentGateway>('Stripe');
  const [amount, setAmount] = useState('150');
  const [sessionsIncluded, setSessionsIncluded] = useState('5');
  const mutation = useMutation({
    mutationFn: createAdminPayment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: paymentKeys.adminPayments });
      setOpen(false);
      toast({
        title: 'Payment recorded',
        description: 'The family can now see this payment.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Could not record payment',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-brand hover:bg-brand-600 rounded-full">
          <Plus className="w-4 h-4 mr-2" />
          Record payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record parent payment</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Parent</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select parent" />
              </SelectTrigger>
              <SelectContent>
                {parents.map((parent) => (
                  <SelectItem key={parent.id} value={parent.id}>
                    {parent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Plan</Label>
              <Select
                value={plan}
                onValueChange={(value) => setPlan(value as PaymentPlan)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Single Session">Single Session</SelectItem>
                  <SelectItem value="Starter Bundle">Starter Bundle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Gateway</Label>
              <Select
                value={gateway}
                onValueChange={(value) => setGateway(value as PaymentGateway)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stripe">Stripe</SelectItem>
                  <SelectItem value="Flutterwave">Flutterwave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Amount</Label>
              <Input
                type="number"
                min="1"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Sessions included</Label>
              <Input
                type="number"
                min="1"
                value={sessionsIncluded}
                onChange={(event) => setSessionsIncluded(event.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            className="bg-brand hover:bg-brand-600"
            disabled={!parentId || mutation.isPending}
            onClick={() =>
              mutation.mutate({
                parentId,
                plan,
                gateway,
                amount: Number(amount),
                sessionsIncluded: Number(sessionsIncluded),
              })
            }
          >
            {mutation.isPending ? 'Recording...' : 'Record payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlanRow({
  payment,
  parentName,
}: {
  payment: Payment;
  parentName: string;
}) {
  const percent =
    payment.sessionsIncluded > 0
      ? (payment.sessionsUsed / payment.sessionsIncluded) * 100
      : 0;
  const remaining = payment.sessionsIncluded - payment.sessionsUsed;
  return (
    <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="font-semibold text-gray-900 dark:text-foreground text-sm">
            {payment.plan}
          </p>
          <p className="text-xs text-gray-500 dark:text-muted-foreground">
            {parentName} - via {payment.gateway}
          </p>
        </div>
        <p className="text-sm font-semibold text-gray-900 dark:text-foreground">
          ${payment.amount}
        </p>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent2-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-[11px] text-gray-500 dark:text-muted-foreground mt-2">
        {payment.sessionsUsed}/{payment.sessionsIncluded} used - {remaining}{' '}
        remaining
      </p>
    </div>
  );
}
