'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Check, CheckCircle2, Crown, Loader2, MessageCircle, Receipt } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  billingKeys,
  confirmCheckout,
  getMyBilling,
  PRODUCT_NAMES,
  startCheckout,
  type MyBilling,
  type PlanOffer,
  type PlanProduct,
} from '@/lib/api/billing';
import { naira } from '@/lib/money';
import { cn } from '@/lib/utils';

const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '2349057638887').replace(/\D/g, '');

function longDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

const WHATSAPP_PAY_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  'Hi DoLearnn, I would like to pay for Pro or the Exam Season Pass by bank transfer.',
)}`;

export default function PlanPage() {
  return (
    <Suspense fallback={<PlanSkeleton />}>
      <PlanContent />
    </Suspense>
  );
}

function PlanContent() {
  const search = useSearchParams();
  const reference = search.get('reference');
  const reason = search.get('reason');
  const query = useQuery({ queryKey: billingKeys.me, queryFn: getMyBilling, staleTime: 30_000 });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="Your plan" description="Practise free every day. Go Pro for unlimited practice and full mock papers." />

      {reference && <PaymentResult reference={reference} />}
      {!reference && reason && query.data?.plan === 'FREE' && <LimitNotice reason={reason} billing={query.data} />}

      {query.isLoading ? (
        <PlanSkeleton />
      ) : query.isError || !query.data ? (
        <p className="rounded-3xl bg-red-50 p-5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          We could not load your plan. Check your connection and refresh the page.
        </p>
      ) : (
        <>
          <StatusCard billing={query.data} />
          <Offers billing={query.data} />
          <WhatProAdds />
          <PayAnotherWay />
          {query.data.purchases.length > 0 && <History billing={query.data} />}
        </>
      )}
    </div>
  );
}

function PlanSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-48 w-full rounded-[28px]" />
      <Skeleton className="h-64 w-full rounded-3xl" />
    </div>
  );
}

/** After Paystack sends the learner back: check the payment once and say how it went. */
function PaymentResult({ reference }: { reference: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const confirm = useQuery({
    queryKey: billingKeys.confirm(reference),
    queryFn: () => confirmCheckout(reference),
    staleTime: Infinity,
    retry: 1,
  });
  const paid = confirm.data?.status === 'PAID';

  // Once Paystack confirms, the plan card and header pick up Pro.
  useEffect(() => {
    if (paid) void queryClient.invalidateQueries({ queryKey: billingKeys.me });
  }, [paid, queryClient]);

  const tidyUrl = () => router.replace('/student/plan');

  if (confirm.isPending || confirm.isFetching) {
    return (
      <div role="status" className="flex items-center gap-3 rounded-3xl bg-gray-100 p-4 text-sm text-gray-800 dark:bg-white/5 dark:text-foreground">
        <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden /> Checking your payment with Paystack…
      </div>
    );
  }

  if (confirm.isSuccess && paid) {
    return (
      <div role="status" className="flex items-start gap-3 rounded-3xl bg-accent2-50 p-4 text-sm leading-6 text-gray-900 dark:bg-accent2-500/10 dark:text-foreground">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent2-600" aria-hidden />
        <div className="flex-1">
          <p className="font-semibold">Payment received. Pro is on.</p>
          <p className="text-gray-700 dark:text-foreground/80">
            {PRODUCT_NAMES[confirm.data.product]}
            {confirm.data.endsAt ? `, active until ${longDate(confirm.data.endsAt)}` : ''}. Thank you!
          </p>
        </div>
        <button type="button" onClick={tidyUrl} className="-m-2 min-h-10 rounded-full px-3 text-xs font-medium text-gray-600 hover:bg-black/5 dark:text-muted-foreground">
          Close
        </button>
      </div>
    );
  }

  const failed = confirm.isSuccess && confirm.data.status === 'FAILED';
  return (
    <div role="alert" className="flex items-start gap-3 rounded-3xl bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:bg-amber-500/10 dark:text-amber-100">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div className="flex-1">
        <p className="font-semibold">{failed ? 'The payment did not go through.' : 'We have not received this payment yet.'}</p>
        <p>
          {failed
            ? 'No money was taken for Pro. You can try again below.'
            : 'If you paid by bank transfer or USSD it can take a few minutes. We will switch Pro on as soon as Paystack confirms it.'}
        </p>
        {!failed && (
          <button type="button" onClick={() => void confirm.refetch()} className="mt-1 font-semibold underline underline-offset-2">
            Check again
          </button>
        )}
      </div>
    </div>
  );
}

function LimitNotice({ reason, billing }: { reason: string; billing: MyBilling }) {
  const text =
    reason === 'utme'
      ? `You have used this month’s free full UTME paper (${billing.limits.utmePapersPerMonth} a month on the free plan).`
      : `You have used today’s ${billing.limits.quizzesPerDay} free quizzes. The Daily and Arena battles are still free.`;
  return (
    <div role="status" className="flex items-start gap-3 rounded-3xl bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:bg-amber-500/10 dark:text-amber-100">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <p>{text} Go Pro to keep going now.</p>
    </div>
  );
}

function StatusCard({ billing }: { billing: MyBilling }) {
  const isPro = billing.plan === 'PRO';
  return (
    <section
      aria-labelledby="plan-status-heading"
      className="relative overflow-hidden rounded-[28px] bg-brand p-5 text-white shadow-[0_18px_40px_-24px_rgba(4,66,114,0.9)] dark:bg-[hsl(208,70%,16%)] sm:p-7"
    >
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-accent2-400/25 blur-3xl" />
      <p className="relative text-sm font-medium text-white/75">Current plan</p>
      <h2 id="plan-status-heading" className="relative mt-2 flex items-center gap-2.5 font-display text-4xl font-extrabold tracking-tight">
        {isPro && <Crown className="h-8 w-8 text-accent2-300" aria-hidden />}
        {isPro ? 'Pro' : 'Free'}
      </h2>

      {isPro ? (
        <p className="relative mt-2 text-[15px] text-white/85">
          {billing.product ? `${PRODUCT_NAMES[billing.product]}. ` : ''}
          {billing.proUntil ? (
            <>
              Active until <strong className="font-semibold text-white">{longDate(billing.proUntil)}</strong>.
            </>
          ) : null}{' '}
          Unlimited quizzes and full UTME papers.
        </p>
      ) : billing.limited ? (
        <div className="relative mt-5 grid gap-4 sm:grid-cols-2">
          <UsageMeter
            label="Quizzes today"
            used={billing.usage.quizzesToday}
            limit={billing.limits.quizzesPerDay}
            note="Resets at midnight"
          />
          <UsageMeter
            label="Full UTME paper this month"
            used={billing.usage.utmePapersThisMonth}
            limit={billing.limits.utmePapersPerMonth}
            note="Resets on the 1st"
          />
        </div>
      ) : (
        <p className="relative mt-2 text-[15px] text-white/85">Staff accounts have no limits.</p>
      )}
    </section>
  );
}

function UsageMeter({ label, used, limit, note }: { label: string; used: number; limit: number; note: string }) {
  const shown = Math.min(used, limit);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-white/80">{label}</span>
        <span className="tabular-nums text-white/70">
          <strong className="font-display text-lg font-bold text-white">{shown}</strong> / {limit}
        </span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/15" aria-hidden>
        <div
          className={cn('h-full rounded-full', shown >= limit ? 'bg-amber-300' : 'bg-accent2-400')}
          style={{ width: `${(shown / limit) * 100}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-white/55">{note}</p>
    </div>
  );
}

function Offers({ billing }: { billing: MyBilling }) {
  const { toast } = useToast();
  const [opening, setOpening] = useState<PlanProduct | null>(null);
  const checkout = useMutation({
    mutationFn: startCheckout,
    onMutate: (product) => setOpening(product),
    onSuccess: (result) => {
      // Paystack's own page takes the payment, then sends the learner back here.
      window.location.assign(result.authorizationUrl);
    },
    onError: (error) => {
      setOpening(null);
      toast({
        title: 'Could not open the payment page',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  if (!billing.limited && billing.plan === 'FREE') return null;
  const pass = billing.products.find((offer) => offer.product === 'EXAM_PASS');
  const month = billing.products.find((offer) => offer.product === 'PRO_MONTH');
  const isPro = billing.plan === 'PRO';

  return (
    <section aria-labelledby="offers-heading" className="space-y-3">
      <h2 id="offers-heading" className="font-display text-lg font-bold text-gray-950 dark:text-foreground">
        {isPro ? 'Add more time' : 'Choose Pro'}
      </h2>
      {isPro && billing.proUntil && (
        <p className="-mt-1 text-sm text-gray-600 dark:text-muted-foreground">
          New time starts when your current Pro ends on {longDate(billing.proUntil)}.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {pass && (
          <OfferCard
            offer={pass}
            featured
            badge="Best value"
            perDay
            busy={opening === 'EXAM_PASS'}
            disabled={checkout.isPending || !billing.onlinePayment}
            onBuy={() => checkout.mutate('EXAM_PASS')}
          />
        )}
        {month && (
          <OfferCard
            offer={month}
            busy={opening === 'PRO_MONTH'}
            disabled={checkout.isPending || !billing.onlinePayment}
            onBuy={() => checkout.mutate('PRO_MONTH')}
          />
        )}
      </div>
      <p className="text-xs leading-5 text-gray-500 dark:text-muted-foreground">
        {billing.onlinePayment
          ? 'Paystack takes the payment: card, bank transfer or USSD. One payment, no automatic renewal.'
          : 'Online payment is not switched on yet. Message us on WhatsApp to pay by bank transfer.'}
      </p>
    </section>
  );
}

function OfferCard({
  offer,
  featured = false,
  badge,
  perDay = false,
  busy,
  disabled,
  onBuy,
}: {
  offer: PlanOffer;
  featured?: boolean;
  badge?: string;
  perDay?: boolean;
  busy: boolean;
  disabled: boolean;
  onBuy: () => void;
}) {
  const discounted = offer.price < offer.fullPrice;
  const days = offer.months * 30;
  return (
    <div
      className={cn(
        'flex flex-col rounded-3xl border bg-white p-5 dark:bg-card',
        featured ? 'border-brand ring-1 ring-brand dark:border-accent2-500 dark:ring-accent2-500' : 'border-gray-200/80 dark:border-border',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-base font-bold text-gray-950 dark:text-foreground">{offer.name}</h3>
        {badge && (
          <span className="rounded-full bg-accent2-100 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-accent2-500/15 dark:text-accent2-300">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-3 flex flex-wrap items-baseline gap-x-2">
        <span className="font-display text-4xl font-extrabold tabular-nums text-gray-950 dark:text-foreground">{naira(offer.price)}</span>
        {discounted && <s className="text-base tabular-nums text-gray-400">{naira(offer.fullPrice)}</s>}
      </p>
      <p className="mt-1 text-sm text-gray-600 dark:text-muted-foreground">
        {offer.months === 1 ? '1 month of Pro' : `${offer.months} months of Pro, one payment`}
        {perDay && ` · about ${naira(offer.price / days)} a day`}
      </p>
      {discounted && offer.foundingEndsAt && (
        <p className="mt-2 text-sm font-medium text-accent2-700 dark:text-accent2-300">
          Founding price until {longDate(new Date(new Date(offer.foundingEndsAt).getTime() - 1).toISOString())}
        </p>
      )}
      <Button
        type="button"
        onClick={onBuy}
        disabled={disabled}
        className={cn('mt-5 h-12 w-full rounded-2xl text-[15px]', !featured && 'bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900')}
      >
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
        {busy ? 'Opening Paystack…' : `Pay ${naira(offer.price)}`}
      </Button>
    </div>
  );
}

const PRO_ROWS: Array<{ feature: string; free: string; pro: string }> = [
  { feature: 'Topic quizzes', free: '5 a day', pro: 'Unlimited' },
  { feature: 'Full UTME paper in the CBT layout', free: '1 a month', pro: 'Unlimited' },
  { feature: 'Weekly report to send a parent', free: '—', pro: 'Included' },
  { feature: 'Daily quiz, Arena, streaks, explanations', free: 'Included', pro: 'Included' },
];

function WhatProAdds() {
  return (
    <section aria-labelledby="pro-adds-heading" className="rounded-3xl border border-gray-200/80 bg-white p-4 dark:border-border dark:bg-card sm:p-6">
      <h2 id="pro-adds-heading" className="font-display text-lg font-bold text-gray-950 dark:text-foreground">
        Free and Pro
      </h2>
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 dark:text-muted-foreground">
            <th scope="col" className="py-2 pr-2 font-medium">
              <span className="sr-only">Feature</span>
            </th>
            <th scope="col" className="w-20 py-2 pr-2 font-medium">Free</th>
            <th scope="col" className="w-24 py-2 font-medium text-brand dark:text-accent2-300">Pro</th>
          </tr>
        </thead>
        <tbody>
          {PRO_ROWS.map((row) => (
            <tr key={row.feature} className="border-t border-gray-100 dark:border-white/10">
              <th scope="row" className="py-3 pr-2 text-left font-medium text-gray-800 dark:text-foreground">
                {row.feature}
              </th>
              <td className="py-3 pr-2 tabular-nums text-gray-600 dark:text-muted-foreground">{row.free}</td>
              <td className="py-3 font-semibold text-gray-950 dark:text-foreground">
                <span className="inline-flex items-center gap-1">
                  {row.pro === 'Unlimited' || row.pro === 'Included' ? <Check className="h-4 w-4 text-accent2-600" aria-hidden /> : null}
                  {row.pro}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function PayAnotherWay() {
  return (
    <section className="flex items-start gap-3 rounded-3xl bg-gray-100 p-4 text-sm leading-6 text-gray-800 dark:bg-white/5 dark:text-foreground/90">
      <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#25D366]" aria-hidden />
      <p>
        <strong className="font-semibold">Paying by bank transfer, or through your lesson centre?</strong> Message us and we will switch Pro on for this
        account once the payment arrives.{' '}
        <a href={WHATSAPP_PAY_LINK} target="_blank" rel="noreferrer" className="font-semibold text-brand underline underline-offset-2 dark:text-accent2-300">
          Chat on WhatsApp
        </a>
      </p>
    </section>
  );
}

function History({ billing }: { billing: MyBilling }) {
  return (
    <section aria-labelledby="history-heading" className="rounded-3xl border border-gray-200/80 bg-white p-4 dark:border-border dark:bg-card sm:p-6">
      <h2 id="history-heading" className="font-display text-lg font-bold text-gray-950 dark:text-foreground">
        Payments
      </h2>
      <ul className="mt-2 divide-y divide-gray-100 dark:divide-white/10">
        {billing.purchases.map((purchase) => (
          <li key={purchase.id} className="flex items-center gap-3 py-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10">
              <Receipt className="h-4 w-4 text-gray-600 dark:text-muted-foreground" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-foreground">{PRODUCT_NAMES[purchase.product]}</p>
              <p className="truncate text-xs text-gray-500 dark:text-muted-foreground">
                {purchase.paidAt ? longDate(purchase.paidAt) : ''}
                {purchase.startsAt && purchase.endsAt ? ` · Pro ${longDate(purchase.startsAt)} to ${longDate(purchase.endsAt)}` : ''}
              </p>
            </div>
            <span className="shrink-0 font-display text-base font-bold tabular-nums text-gray-950 dark:text-foreground">{naira(purchase.amount)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
