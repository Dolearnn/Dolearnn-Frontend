'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Award, CheckCircle2, Lock, Target } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getQuizAchievements, quizKeys, type QuizMission } from '@/lib/api/quiz';
import { useLearnerBase, type LearnerBase } from '@/lib/learner-paths';
import { cn } from '@/lib/utils';

function actionHref(base: LearnerBase, action: QuizMission['action']) {
  if (action === 'arena') return `${base}/arena`;
  if (action === 'reassess') return `${base}/progress`;
  return '/student/practice';
}

const ACTION_LABEL: Record<QuizMission['action'], string> = {
  practice: 'Practise',
  reassess: 'Test again',
  arena: 'Open Arena',
};

/**
 * This week's missions (picked from the learner's own weak topics) and their
 * badges. Everything is computed by the server from real practice data.
 */
export default function AchievementsPanel({
  studentId,
  className,
}: {
  studentId: string | null;
  className?: string;
}) {
  const base = useLearnerBase();
  const { data, isLoading, isError } = useQuery({
    queryKey: quizKeys.achievements(studentId),
    queryFn: () => getQuizAchievements(studentId),
    staleTime: 30_000,
  });

  if (isLoading) return <Skeleton className={cn('h-72 w-full rounded-2xl', className)} />;
  if (isError || !data) return null;

  const earned = data.badges.filter((badge) => badge.earned).length;

  return (
    <div className={cn('grid gap-4 lg:grid-cols-[1.2fr_1fr]', className)}>
      <section
        aria-labelledby="missions-title"
        className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-border dark:bg-card"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="missions-title" className="flex items-center gap-2 text-lg font-semibold text-gray-950 dark:text-foreground">
            <Target className="h-5 w-5 text-brand dark:text-accent2-400" aria-hidden />
            This week&apos;s missions
          </h2>
          <p className="text-xs text-gray-500 dark:text-muted-foreground">New every Monday</p>
        </div>

        <ul className="mt-4 space-y-3">
          {data.missions.map((mission) => {
            const percent = Math.round((mission.current / mission.target) * 100);
            return (
              <li key={mission.id} className="rounded-xl border border-gray-100 p-3 dark:border-border">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-foreground">
                      {mission.done && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-label="Done" />}
                      {mission.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-muted-foreground">{mission.detail}</p>
                  </div>
                  {!mission.done && (
                    <Link
                      href={actionHref(base, mission.action)}
                      className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brand hover:underline dark:text-accent2-400"
                    >
                      {ACTION_LABEL[mission.action]} <ArrowRight className="h-3 w-3" aria-hidden />
                    </Link>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div
                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={mission.target}
                    aria-valuenow={mission.current}
                    aria-label={mission.title}
                  >
                    <div
                      className={cn('h-full rounded-full', mission.done ? 'bg-emerald-500' : 'bg-brand dark:bg-accent2-400')}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-xs tabular-nums text-gray-500 dark:text-muted-foreground">
                    {mission.current}/{mission.target}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section
        aria-labelledby="badges-title"
        className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-border dark:bg-card"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="badges-title" className="flex items-center gap-2 text-lg font-semibold text-gray-950 dark:text-foreground">
            <Award className="h-5 w-5 text-brand dark:text-accent2-400" aria-hidden />
            Badges
          </h2>
          <p className="text-xs text-gray-500 dark:text-muted-foreground">
            {earned} of {data.badges.length} earned
          </p>
        </div>

        <ul className="mt-4 grid grid-cols-2 gap-2">
          {data.badges.map((badge) => (
            <li
              key={badge.id}
              title={badge.description}
              className={cn(
                'rounded-xl border p-3',
                badge.earned
                  ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10'
                  : 'border-gray-100 dark:border-border',
              )}
            >
              <p
                className={cn(
                  'flex items-center gap-1.5 text-sm font-semibold',
                  badge.earned ? 'text-emerald-800 dark:text-emerald-300' : 'text-gray-700 dark:text-foreground/80',
                )}
              >
                {badge.earned ? (
                  <Award className="h-4 w-4 shrink-0" aria-hidden />
                ) : (
                  <Lock className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
                )}
                {badge.name}
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-gray-500 dark:text-muted-foreground">
                {badge.earned
                  ? badge.description
                  : `${badge.description} (${badge.current}/${badge.target})`}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
