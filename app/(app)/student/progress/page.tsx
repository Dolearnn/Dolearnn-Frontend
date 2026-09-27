'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowRight, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import NextActions from '@/components/quiz/NextActions';
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
        <div className="space-y-4"><Skeleton className="h-28 w-full" /><Skeleton className="h-64 w-full" /></div>
      ) : query.isError || !progress ? (
        <p className="text-sm text-red-600">Could not load your progress.</p>
      ) : progress.totalAttempts === 0 ? (
        <div className="border border-dashed border-gray-300 bg-white p-10 text-center dark:border-border dark:bg-card">
          <TrendingUp className="mx-auto h-8 w-8 text-gray-400" />
          <h2 className="mt-3 font-semibold text-gray-950 dark:text-foreground">Your baseline starts with one assessment</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-muted-foreground">Return later for reassessment and DoLearnn will show the change.</p>
          <Button asChild className="mt-5"><Link href="/student/practice">Start assessment</Link></Button>
        </div>
      ) : (
        <div className="space-y-9">
          <section className="grid border-y border-gray-200 bg-white dark:border-border dark:bg-card sm:grid-cols-3" aria-label="Progress summary">
            <div className="border-b border-gray-200 p-5 dark:border-border sm:border-b-0 sm:border-r"><p className="text-3xl font-semibold text-gray-950 dark:text-foreground">{progress.totalAttempts}</p><p className="mt-1 text-xs uppercase tracking-wide text-gray-500">Practice sessions</p></div>
            <div className="border-b border-gray-200 p-5 dark:border-border sm:border-b-0 sm:border-r"><p className="text-3xl font-semibold text-gray-950 dark:text-foreground">{progress.summary.subjectsImproved}<span className="text-lg text-gray-400">/{progress.summary.subjectsCompared}</span></p><p className="mt-1 text-xs uppercase tracking-wide text-gray-500">Subjects improved</p></div>
            <div className="p-5"><p className="text-3xl font-semibold text-gray-950 dark:text-foreground">{progress.summary.topicsImproved}</p><p className="mt-1 text-xs uppercase tracking-wide text-gray-500">Topics up 10+ points</p></div>
          </section>

          <NextActions studentId={null} actions={query.data?.actions ?? []} />

          <div className="space-y-6">
            {progress.subjects.map((subject) => {
              const change = subject.changePoints;
              const ChangeIcon = change === null || change === 0 ? Minus : change > 0 ? TrendingUp : TrendingDown;
              return (
                <section key={subject.subject.id} className="border-t border-gray-200 pt-5 dark:border-border">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">{subject.attempts} {subject.attempts === 1 ? 'assessment' : 'assessments'}</p>
                      <h2 className="mt-1 text-2xl font-semibold text-gray-950 dark:text-foreground">{subject.subject.name}</h2>
                    </div>
                    <div className="flex items-center gap-3 tabular-nums">
                      <span className="text-gray-500">{subject.baselinePercent}%</span><ArrowRight className="h-4 w-4 text-gray-400" /><span className="text-2xl font-semibold text-gray-950 dark:text-foreground">{subject.latestPercent}%</span>
                      <span className={cn('inline-flex items-center gap-1 text-sm font-semibold', change !== null && change > 0 ? 'text-emerald-600' : change !== null && change < 0 ? 'text-red-600' : 'text-gray-500')}><ChangeIcon className="h-4 w-4" />{change === null ? 'Reassess to compare' : `${change > 0 ? '+' : ''}${change}`}</span>
                    </div>
                  </div>
                  {subject.topics.length > 0 && (
                    <div className="mt-4 border-y border-gray-200 bg-white dark:border-border dark:bg-card">
                      {subject.topics.map((topic) => (
                        <div key={topic.topicId} className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-3 last:border-0 dark:border-border">
                          <span className="text-sm font-medium text-gray-800 dark:text-foreground">{topic.name}</span>
                          <span className="text-sm tabular-nums text-gray-600 dark:text-muted-foreground">{topic.baselinePercent}% <ArrowRight className="mx-1 inline h-3.5 w-3.5" /> <strong className="text-gray-950 dark:text-foreground">{topic.latestPercent}%</strong></span>
                        </div>
                      ))}
                    </div>
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
