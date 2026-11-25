'use client';

import Link from 'next/link';
import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBilling } from './useBilling';

/** Header shortcut to the Plan page: "Go Pro" on the free plan, a Pro badge after. */
export default function PlanPill() {
  const billing = useBilling();
  if (!billing.data) return null;
  const isPro = billing.data.plan === 'PRO';
  if (!isPro && !billing.data.limited) return null;

  return (
    <Link
      href="/student/plan"
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95',
        isPro
          ? 'bg-brand/10 text-brand hover:bg-brand/15 dark:bg-accent2-500/15 dark:text-accent2-300'
          : 'bg-accent2-400 text-brand-700 hover:bg-accent2-300',
      )}
    >
      <Crown className="h-3.5 w-3.5" aria-hidden />
      {isPro ? 'Pro' : 'Go Pro'}
    </Link>
  );
}
