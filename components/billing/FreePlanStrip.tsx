'use client';

import Link from 'next/link';
import { ChevronRight, Crown } from 'lucide-react';
import { useBilling } from './useBilling';

/** On Today, for free learners: how many of today's free quizzes are left. */
export default function FreePlanStrip() {
  const billing = useBilling();
  if (!billing.data?.limited) return null;
  const { quizzesPerDay } = billing.data.limits;
  const left = Math.max(0, quizzesPerDay - billing.data.usage.quizzesToday);

  return (
    <Link
      href="/student/plan"
      className="flex min-h-14 items-center gap-3 rounded-3xl border border-gray-200/80 bg-white p-4 text-sm transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-border dark:bg-card dark:hover:bg-white/5"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand dark:bg-accent2-500/15 dark:text-accent2-300">
        <Crown className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 text-gray-700 dark:text-foreground/90">
        <strong className="font-display font-bold tabular-nums text-gray-950 dark:text-foreground">
          {left} of {quizzesPerDay}
        </strong>{' '}
        free quizzes left today. <span className="font-semibold text-brand dark:text-accent2-300">Go Pro</span> for unlimited.
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
    </Link>
  );
}
