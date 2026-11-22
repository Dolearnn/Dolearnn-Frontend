'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { funnelKeys, getFunnelReport, type FunnelPeriod } from '@/lib/api/reports';
import { cn } from '@/lib/utils';

const PERIODS: FunnelPeriod[] = [7, 30, 90];
const numberFormat = new Intl.NumberFormat();

/**
 * Where new learners drop off: everyone who signed up in the period, and how
 * many of them reached each later step. Real counts from the database.
 */
export default function FunnelCard() {
  const [days, setDays] = useState<FunnelPeriod>(30);
  const query = useQuery({
    queryKey: funnelKeys.admin(days),
    queryFn: () => getFunnelReport(days),
    staleTime: 60_000,
  });

  return (
    <section
      aria-labelledby="funnel-heading"
      className="rounded-3xl border border-gray-200/80 bg-white p-4 dark:border-border dark:bg-card sm:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="funnel-heading" className="font-display text-lg font-bold text-gray-950 dark:text-foreground">
            Sign-up funnel
          </h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-muted-foreground">
            Learners who signed up in the last {days} days, and how far they got.
          </p>
        </div>
        <div className="grid shrink-0 grid-cols-3 rounded-full bg-gray-100 p-1 text-sm dark:bg-white/5" role="radiogroup" aria-label="Period">
          {PERIODS.map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={days === value}
              onClick={() => setDays(value)}
              className={cn(
                'min-h-9 rounded-full px-3.5 font-medium tabular-nums transition-colors',
                days === value ? 'bg-white text-gray-950 shadow-sm dark:bg-accent2-500 dark:text-brand' : 'text-gray-600 dark:text-muted-foreground',
              )}
            >
              {value} days
            </button>
          ))}
        </div>
      </div>

      {query.isLoading ? (
        <Skeleton className="mt-5 h-56 w-full rounded-2xl" />
      ) : query.isError || !query.data ? (
        <p className="mt-5 text-sm text-red-600">The funnel could not load. Refresh to try again.</p>
      ) : (
        <>
          <ol className="mt-5 space-y-3">
            {query.data.steps.map((step, index) => {
              const previous = index > 0 ? query.data.steps[index - 1] : null;
              // Share of the step before, so the biggest drop-off stands out. Steps are
              // not strictly nested (an Arena invite can lead to a quiz before the plan
              // is set up), so a step larger than the one before shows no share.
              const fromPrevious =
                previous && previous.count > 0 && step.count <= previous.count
                  ? Math.round((step.count / previous.count) * 100)
                  : null;
              return (
                <li key={step.key}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium text-gray-800 dark:text-foreground">{step.label}</span>
                    <span className="shrink-0 text-sm tabular-nums text-gray-500 dark:text-muted-foreground">
                      <strong className="font-display text-base font-bold text-gray-950 dark:text-foreground">
                        {numberFormat.format(step.count)}
                      </strong>
                      {index > 0 && <span className="ml-1.5">({step.percentOfSignups}%)</span>}
                    </span>
                  </div>
                  <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10" aria-hidden>
                    <div
                      className={cn('h-full rounded-full', index === 0 ? 'bg-brand dark:bg-accent2-500' : 'bg-accent2-500')}
                      style={{ width: `${index === 0 ? (step.count > 0 ? 100 : 0) : step.percentOfSignups}%` }}
                    />
                  </div>
                  {fromPrevious !== null && (
                    <p className="mt-1 text-xs tabular-nums text-gray-500 dark:text-muted-foreground">
                      {fromPrevious}% of those who {previous!.label.toLowerCase()}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
          <p className="mt-5 flex items-center gap-2 rounded-2xl bg-gray-50 px-3.5 py-2.5 text-sm text-gray-700 dark:bg-white/5 dark:text-foreground/90">
            <Zap className="h-4 w-4 shrink-0 text-accent2-600" aria-hidden />
            <span>
              <strong className="font-semibold tabular-nums">{numberFormat.format(query.data.guestDailyPlayers)}</strong> guests
              played the Daily in this period without signing up yet.
            </span>
          </p>
        </>
      )}
    </section>
  );
}
