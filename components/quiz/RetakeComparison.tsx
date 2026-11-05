'use client';

import { ArrowRight, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import type { QuizRetakeComparison } from '@/lib/api/quiz';
import { scoreTone, toneClasses } from '@/lib/quiz';
import { cn } from '@/lib/utils';

function formatDate(value: string | null) {
  if (!value) return 'your earlier quiz';
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/** Before vs after on the topics a retake targeted. */
export default function RetakeComparison({ retake }: { retake: QuizRetakeComparison }) {
  const improved = retake.changePoints > 0;
  const same = retake.changePoints === 0;
  const Icon = improved ? TrendingUp : same ? Minus : TrendingDown;

  return (
    <section
      aria-labelledby="retake-heading"
      className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-border dark:bg-card sm:p-6"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-muted-foreground">
        Proof of progress
      </p>
      <h2 id="retake-heading" className="mt-1 text-lg font-semibold text-gray-950 dark:text-foreground">
        {improved
          ? `You improved by ${retake.changePoints} points on these topics`
          : same
            ? 'Same score as before on these topics'
            : `Down ${Math.abs(retake.changePoints)} points on these topics. Practise them once more`}
      </h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-muted-foreground">
        Compared with {formatDate(retake.originalSubmittedAt)}, on the same topics with new questions.
      </p>

      <div className="mt-4 flex items-center gap-4">
        <span className="text-3xl font-semibold tabular-nums text-gray-500 dark:text-muted-foreground">
          {retake.beforePercent}%
        </span>
        <ArrowRight className="h-5 w-5 text-gray-400" aria-hidden />
        <span className={cn('text-3xl font-semibold tabular-nums', toneClasses[scoreTone(retake.afterPercent)].text)}>
          {retake.afterPercent}%
        </span>
        <Icon
          className={cn('h-6 w-6', improved ? 'text-emerald-600' : same ? 'text-gray-400' : 'text-red-600')}
          aria-hidden
        />
      </div>

      <ul className="mt-5 divide-y divide-gray-100 dark:divide-border">
        {retake.topics.map((topic) => {
          const change = topic.afterPercent - topic.beforePercent;
          return (
            <li key={topic.topicId} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="text-gray-800 dark:text-foreground">{topic.name}</span>
              <span className="tabular-nums text-gray-700 dark:text-foreground/90">
                {topic.beforePercent}% → {topic.afterPercent}%
                <span
                  className={cn(
                    'ml-2 font-semibold',
                    change > 0 ? 'text-emerald-600' : change < 0 ? 'text-red-600' : 'text-gray-500',
                  )}
                >
                  {change > 0 ? `+${change}` : change}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
