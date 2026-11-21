'use client';

import { useQuery } from '@tanstack/react-query';
import { Flame } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getQuizRewards, quizKeys } from '@/lib/api/quiz';
import ShareStreak from './ShareStreak';
import { cn } from '@/lib/utils';

/**
 * Streak, this week's XP and level for one learner, as one compact row that
 * fits a phone screen. XP comes from practice and Arena: the rules live on the
 * server and are echoed back in `rules`.
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

  if (isLoading) return <Skeleton className={cn('h-[104px] w-full rounded-3xl', className)} />;
  if (isError || !data) return null;

  const { level, nextLevel, streak } = data;
  const toNext = nextLevel ? nextLevel.minXp - data.xp : 0;
  const lit = streak.current > 0;

  return (
    <section
      aria-label="Your rewards"
      className={cn(
        'grid grid-cols-3 divide-x divide-gray-100 rounded-3xl border border-gray-200/80 bg-white dark:divide-border dark:border-border dark:bg-card',
        className,
      )}
    >
      <div className="relative p-4">
        <div className="flex items-start justify-between">
          <Flame
            className={cn('h-5 w-5', lit ? 'fill-amber-400 text-amber-500' : 'text-gray-300 dark:text-white/25')}
            aria-hidden
          />
          {lit && <ShareStreak days={streak.current} level={level.name} xp={data.xp} compact />}
        </div>
        <p className="mt-2 font-display text-[28px] font-extrabold leading-none tabular-nums text-gray-950 dark:text-foreground">
          {streak.current}
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-muted-foreground">
          {streak.activeToday ? 'day streak, done today' : lit ? 'day streak, practise today' : 'day streak'}
        </p>
      </div>

      <div className="p-4">
        <p className="h-5 text-xs font-medium text-gray-500 dark:text-muted-foreground">This week</p>
        <p className="mt-2 font-display text-[28px] font-extrabold leading-none tabular-nums text-gray-950 dark:text-foreground">
          {data.weekXp.toLocaleString()}
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-muted-foreground">
          {data.dailyCapReached ? "XP, today's max" : 'XP earned'}
        </p>
      </div>

      <div className="p-4">
        <p className="h-5 text-xs font-medium text-gray-500 dark:text-muted-foreground">Level</p>
        <p className="mt-2 truncate font-display text-lg font-bold leading-[28px] text-gray-950 dark:text-foreground">
          {level.name}
        </p>
        <div
          className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={data.progressPercent}
          aria-label={nextLevel ? `${toNext.toLocaleString()} XP to ${nextLevel.name}` : 'Top level reached'}
        >
          <div className="h-full rounded-full bg-brand dark:bg-accent2-400" style={{ width: `${data.progressPercent}%` }} />
        </div>
        <p className="mt-1 truncate text-xs tabular-nums text-gray-500 dark:text-muted-foreground">
          {nextLevel ? `${toNext.toLocaleString()} XP to go` : 'Top level'}
        </p>
      </div>
    </section>
  );
}
