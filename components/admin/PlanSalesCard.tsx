'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Crown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { sheetContent } from '@/components/quiz/pills';
import { useToast } from '@/hooks/use-toast';
import {
  billingKeys,
  getAdminPlanPurchases,
  PRODUCT_NAMES,
  recordOfflinePlanPurchase,
  type PlanProduct,
} from '@/lib/api/billing';
import { naira } from '@/lib/money';
import { examPassPrice, PRICING } from '@/lib/pricing';
import { cn } from '@/lib/utils';

const numberFormat = new Intl.NumberFormat();

function shortDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
}

/** Pro and Exam Season Pass sales, and a way to record a bank transfer or centre sale. */
export default function PlanSalesCard() {
  const [recording, setRecording] = useState(false);
  const query = useQuery({ queryKey: billingKeys.adminPurchases, queryFn: getAdminPlanPurchases, staleTime: 30_000 });
  const totals = query.data?.totals ?? [];
  const totalAmount = totals.reduce((sum, row) => sum + row.amount, 0);
  const passes = totals.find((row) => row.product === 'EXAM_PASS')?.count ?? 0;
  const months = totals.find((row) => row.product === 'PRO_MONTH')?.count ?? 0;

  return (
    <section
      aria-labelledby="plan-sales-heading"
      className="rounded-3xl border border-gray-200/80 bg-white p-4 dark:border-border dark:bg-card sm:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="plan-sales-heading" className="flex items-center gap-2 font-display text-lg font-bold text-gray-950 dark:text-foreground">
            <Crown className="h-5 w-5 text-accent2-600" aria-hidden /> Pro and Exam Season Passes
          </h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-muted-foreground">
            Paystack payments appear here on their own. Record bank transfers and lesson-centre sales yourself.
          </p>
        </div>
        <Button type="button" onClick={() => setRecording(true)} className="h-11 shrink-0 rounded-2xl">
          <Plus className="mr-1.5 h-4 w-4" /> Record a payment
        </Button>
      </div>

      {query.isLoading ? (
        <Skeleton className="mt-5 h-40 w-full rounded-2xl" />
      ) : query.isError || !query.data ? (
        <p className="mt-5 text-sm text-red-600">Plan sales could not load. Refresh to try again.</p>
      ) : (
        <>
          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Figure label="Plan revenue" value={naira(totalAmount)} />
            <Figure label="Passes sold" value={numberFormat.format(passes)} />
            <Figure label="Pro months sold" value={numberFormat.format(months)} />
            <Figure label="Learners on Pro now" value={numberFormat.format(query.data.activeProLearners)} />
          </dl>

          {query.data.purchases.length === 0 ? (
            <p className="mt-5 rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:bg-white/5 dark:text-muted-foreground">
              No plan payments yet.
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-gray-100 dark:divide-white/10">
              {query.data.purchases.map((purchase) => (
                <li key={purchase.id} className="flex items-start gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-foreground">
                      {purchase.learner.name}{' '}
                      <span className="font-normal text-gray-500 dark:text-muted-foreground">{purchase.learner.email}</span>
                    </p>
                    <p className="truncate text-xs text-gray-500 dark:text-muted-foreground">
                      {PRODUCT_NAMES[purchase.product]} · {purchase.gateway === 'PAYSTACK' ? `Paystack${purchase.channel ? `, ${purchase.channel.replace('_', ' ')}` : ''}` : 'Recorded by admin'} ·{' '}
                      {shortDate(purchase.paidAt)} · Pro to {shortDate(purchase.endsAt)}
                      {purchase.note ? ` · ${purchase.note}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 font-display text-sm font-bold tabular-nums text-gray-950 dark:text-foreground">
                    {naira(purchase.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {recording && <RecordPlanDialog onClose={() => setRecording(false)} />}
    </section>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gray-50 p-3 dark:bg-white/5">
      <dt className="text-xs text-gray-500 dark:text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-display text-xl font-bold tabular-nums text-gray-950 dark:text-foreground">{value}</dd>
    </div>
  );
}

function defaultAmount(product: PlanProduct) {
  return product === 'EXAM_PASS' ? examPassPrice().price : PRICING.proMonth;
}

function RecordPlanDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [product, setProduct] = useState<PlanProduct>('EXAM_PASS');
  const [amount, setAmount] = useState(String(defaultAmount('EXAM_PASS')));
  const [note, setNote] = useState('');

  const record = useMutation({
    mutationFn: () =>
      recordOfflinePlanPurchase({ email, product, amount: Number(amount), note: note.trim() || undefined }),
    onSuccess: (purchase) => {
      void queryClient.invalidateQueries({ queryKey: billingKeys.adminPurchases });
      toast({
        title: 'Pro is on',
        description: `${PRODUCT_NAMES[purchase.product]} recorded. Pro runs to ${shortDate(purchase.endsAt)}.`,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Could not record the payment',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const amountValid = /^\d+$/.test(amount);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn('max-w-md', sheetContent)}>
        <DialogHeader>
          <DialogTitle>Record a plan payment</DialogTitle>
          <DialogDescription>
            For a bank transfer you have seen arrive, or a pass sold by a lesson centre. Pro switches on straight away for the
            learner with this email.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            record.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="plan-email">Learner&apos;s account email</Label>
            <Input
              id="plan-email"
              type="email"
              required
              autoComplete="off"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 rounded-2xl"
            />
          </div>
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-gray-900 dark:text-foreground">Plan</legend>
            <div className="grid grid-cols-2 gap-1 rounded-2xl bg-gray-100 p-1 dark:bg-white/5" role="radiogroup" aria-label="Plan">
              {(['EXAM_PASS', 'PRO_MONTH'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={product === value}
                  onClick={() => {
                    setProduct(value);
                    setAmount(String(defaultAmount(value)));
                  }}
                  className={cn(
                    'min-h-11 rounded-xl text-sm font-semibold transition-colors',
                    product === value ? 'bg-white text-gray-950 shadow-sm dark:bg-card dark:text-foreground' : 'text-gray-600 dark:text-muted-foreground',
                  )}
                >
                  {PRODUCT_NAMES[value]}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="space-y-1.5">
            <Label htmlFor="plan-amount">Amount paid (₦)</Label>
            <Input
              id="plan-amount"
              inputMode="numeric"
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(/[^\d]/g, ''))}
              className="h-12 rounded-2xl tabular-nums"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan-note">Note (optional)</Label>
            <Input
              id="plan-note"
              placeholder="e.g. Transfer seen 3 Dec, or the centre's name"
              maxLength={300}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="h-12 rounded-2xl"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} className="h-12 rounded-2xl">
              Cancel
            </Button>
            <Button type="submit" disabled={record.isPending || !email || !amountValid} className="h-12 rounded-2xl">
              {record.isPending ? 'Recording…' : 'Record and switch Pro on'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
