'use client';

import { useQuery } from '@tanstack/react-query';
import { Flame, Sparkles, Trophy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getQuizRewards, quizKeys } from '@/lib/api/quiz';
import { cn } from '@/lib/utils';

/**
 * Level, XP and streak for one learner. XP comes from practice and Arena:
 * the rules live on the server and are echoed back in `rules`.
 */
export default function RewardsStrip({
  studentId,
  className,
}: {
  studentId: string | null;
  className?: string;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: quizKeys.rewards(studentId),
    queryFn: () => getQuizRewards(studentId),
    staleTime: 30_000,
  });

  if (isLoading) return <Skeleton className={cn('h-28 w-full rounded-2xl', className)} />;
  if (isError || !data) return null;

  const { level, nextLevel, streak, rules } = data;
  const toNext = nextLevel ? nextLevel.minXp - data.xp : 0;

  return (
    <section
      aria-label="Your rewards"
      className={cn(
        'grid gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 dark:border-border dark:bg-border sm:grid-cols-[1.6fr_1fr_1fr]',
        className,
      )}
    >
      <div className="bg-white p-4 dark:bg-card">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-muted-foreground">
          <Trophy className="h-4 w-4 text-brand dark:text-accent2-400" /> Level
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <p className="text-lg font-semibold text-gray-950 dark:text-foreground">{level.name}</p>
          <p className="text-sm text-gray-600 dark:text-muted-foreground">{data.xp.toLocaleString()} XP</p>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={data.progressPercent}
          aria-label={nextLevel ? `Progress to ${nextLevel.name}` : 'Top level reached'}
        >
          <div className="h-full rounded-full bg-brand dark:bg-accent2-400" style={{ width: `${data.progressPercent}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-gray-500 dark:text-muted-foreground">
          {nextLevel
            ? `${toNext.toLocaleString()} XP to ${nextLevel.name}`
            : 'Top level reached. Keep your streak going.'}
        </p>
      </div>

      <div className="bg-white p-4 dark:bg-card">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-muted-foreground">
          <Flame className={cn('h-4 w-4', streak.current > 0 ? 'text-orange-500' : 'text-gray-400')} /> Streak
        </div>
        <p className="mt-1 text-lg font-semibold text-gray-950 dark:text-foreground">
          {streak.current} {streak.current === 1 ? 'day' : 'days'}
        </p>
        <p className="mt-1.5 text-xs text-gray-500 dark:text-muted-foreground">
          {streak.activeToday
            ? 'Done for today.'
            : streak.current > 0
              ? 'Practise today to keep it going.'
              : 'Finish a quiz to start a streak.'}
          {streak.best > streak.current ? ` Best: ${streak.best}.` : ''}
        </p>
      </div>

      <div className="bg-white p-4 dark:bg-card">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-muted-foreground">
          <Sparkles className="h-4 w-4 text-accent2-500" /> This week
        </div>
        <p className="mt-1 text-lg font-semibold text-gray-950 dark:text-foreground">{data.weekXp.toLocaleString()} XP</p>
        <p className="mt-1.5 text-xs text-gray-500 dark:text-muted-foreground">
          {data.dailyCapReached
            ? `Daily limit of ${rules.dailyXpCap} XP reached. More tomorrow.`
            : `${rules.xpPerCorrect} XP per correct answer, +${rules.xpForCompletion} for finishing.`}
        </p>
      </div>
    </section>
  );
}
