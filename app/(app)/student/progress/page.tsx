'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowRight, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import ParentReportCard from '@/components/quiz/ParentReportCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getQuizPracticeOverview, quizKeys } from '@/lib/api/quiz';
import { cn } from '@/lib/utils';

export default function StudentProgressPage() {
  const query = useQuery({
    queryKey: quizKeys.overview(null),
    queryFn: () => getQuizPracticeOverview(null),
    staleTime: 30_000,
  });
  const progress = query.data?.progress;

  return (
    <div className="max-w-5xl">
      <PageHeader title="Progress" description="Compare your starting point with your latest result by subject and topic." />

      {query.isLoading ? (
        <div className="space-y-4"><Skeleton className="h-28 w-full rounded-3xl" /><Skeleton className="h-64 w-full rounded-3xl" /></div>
      ) : query.isError || !progress ? (
        <p className="text-sm text-red-600">Could not load your progress.</p>
      ) : progress.totalAttempts === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-center dark:border-border dark:bg-card">
          <TrendingUp className="mx-auto h-8 w-8 text-gray-400" />
          <h2 className="mt-3 font-semibold text-gray-950 dark:text-foreground">Your baseline starts with one assessment</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-muted-foreground">Return later for reassessment and DoLearnn will show the change.</p>
          <Button asChild className="mt-5"><Link href="/student/practice">Start assessment</Link></Button>
        </div>
      ) : (
        <div className="space-y-8">
          <section
            className="grid grid-cols-3 divide-x divide-gray-100 rounded-3xl border border-gray-200/80 bg-white dark:divide-border dark:border-border dark:bg-card"
            aria-label="Progress summary"
          >
            <SummaryNumber value={progress.totalAttempts} label="practice sessions" />
            <SummaryNumber value={progress.summary.subjectsImproved} of={progress.summary.subjectsCompared} label="subjects improved" />
            <SummaryNumber value={progress.summary.topicsImproved} label="topics up 10+ points" />
          </section>

          <ParentReportCard />

          <div className="space-y-5">
            {progress.subjects.map((subject) => {
              const change = subject.changePoints;
              const ChangeIcon = change === null || change === 0 ? Minus : change > 0 ? TrendingUp : TrendingDown;
              return (
                <section
                  key={subject.subject.id}
                  aria-labelledby={`subject-${subject.subject.id}`}
                  className="rounded-3xl border border-gray-200/80 bg-white p-4 dark:border-border dark:bg-card sm:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 id={`subject-${subject.subject.id}`} className="font-display text-lg font-bold text-gray-950 dark:text-foreground sm:text-xl">
                        {subject.subject.name}
                      </h2>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-muted-foreground">
                        {subject.attempts} {subject.attempts === 1 ? 'assessment' : 'assessments'}, first to latest
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-display text-[32px] font-extrabold leading-none tabular-nums text-gray-950 dark:text-foreground">
                        {subject.latestPercent}
                        <span className="text-lg font-bold text-gray-400">%</span>
                      </p>
                      <p
                        className={cn(
                          'mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
                          change !== null && change > 0
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                            : change !== null && change < 0
                              ? 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300'
                              : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-muted-foreground',
                        )}
                      >
                        <ChangeIcon className="h-3.5 w-3.5" aria-hidden />
                        {change === null ? 'Test again to compare' : `${change > 0 ? '+' : ''}${change} from ${subject.baselinePercent}%`}
                      </p>
                    </div>
                  </div>

                  {subject.topics.length > 0 && (
                    <ul className="mt-4 divide-y divide-gray-100 dark:divide-border">
                      {subject.topics.map((topic) => (
                        <li key={topic.topicId} className="py-3">
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="min-w-0 truncate text-sm font-medium text-gray-800 dark:text-foreground">{topic.name}</span>
                            <span className="shrink-0 text-sm tabular-nums text-gray-500 dark:text-muted-foreground">
                              {topic.baselinePercent}% <ArrowRight className="mx-0.5 inline h-3.5 w-3.5" aria-hidden />{' '}
                              <strong className="font-semibold text-gray-950 dark:text-foreground">{topic.latestPercent}%</strong>
                            </span>
                          </div>
                          <BeforeAfterBar before={topic.baselinePercent} after={topic.latestPercent} />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryNumber({ value, of, label }: { value: number; of?: number; label: string }) {
  return (
    <div className="p-4 sm:p-5">
      <p className="font-display text-[28px] font-extrabold leading-none tabular-nums text-gray-950 dark:text-foreground sm:text-4xl">
        {value}
        {of !== undefined && <span className="text-lg font-bold text-gray-400">/{of}</span>}
      </p>
      <p className="mt-1.5 text-xs leading-4 text-gray-500 dark:text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * One track: the part both scores share in navy, then the change on its end:
 * mint for points gained, faded red for points lost.
 */
function BeforeAfterBar({ before, after }: { before: number; after: number }) {
  const low = Math.min(before, after);
  const gap = Math.abs(after - before);
  return (
    <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10" aria-hidden>
      <div className="h-full bg-brand-300 dark:bg-white/35" style={{ width: `${low}%` }} />
      {gap > 0 && (
        <div
          className={cn('h-full', after > before ? 'bg-accent2-500' : 'bg-red-300 dark:bg-red-400/60')}
          style={{ width: `${gap}%` }}
        />
      )}
    </div>
  );
}
