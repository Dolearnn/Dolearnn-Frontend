'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EyeOff, Medal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { getQuizLeaderboard, quizKeys, setLeaderboardPrivacy, type QuizLeaderboard } from '@/lib/api/quiz';
import { cn } from '@/lib/utils';

const MEDAL_COLOURS = ['text-amber-500', 'text-slate-400', 'text-orange-700'];

/** This week's top learners by XP. Names are shortened by the server. */
export default function WeeklyLeaderboard({
  studentId,
  className,
}: {
  studentId: string | null;
  className?: string;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: quizKeys.leaderboard(studentId),
    queryFn: () => getQuizLeaderboard(studentId),
    staleTime: 60_000,
  });

  const queryClient = useQueryClient();
  const privacy = useMutation({
    mutationFn: (hidden: boolean) => setLeaderboardPrivacy(studentId, hidden),
    onSuccess: ({ hidden }) => {
      queryClient.setQueryData<QuizLeaderboard>(quizKeys.leaderboard(studentId), (current) =>
        current ? { ...current, hidden } : current,
      );
    },
  });

  if (isLoading) return <Skeleton className={cn('h-64 w-full rounded-2xl', className)} />;
  if (isError || !data) return null;

  const meInTop = data.entries.some((entry) => entry.isMe);

  return (
    <section
      aria-label="Weekly leaderboard"
      className={cn('rounded-2xl border border-gray-200 bg-white p-5 dark:border-border dark:bg-card', className)}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-950 dark:text-foreground">This week&apos;s leaderboard</h2>
        <p className="text-xs text-gray-500 dark:text-muted-foreground">Resets every Monday</p>
      </div>

      {data.entries.length === 0 ? (
        <p className="mt-4 text-sm text-gray-600 dark:text-muted-foreground">
          No one has earned XP this week yet. Finish a quiz to take the top spot.
        </p>
      ) : (
        <ol className="mt-4 divide-y divide-gray-100 dark:divide-border">
          {data.entries.map((entry, index) => (
            <li
              key={`${index}-${entry.rank}`}
              className={cn(
                'flex items-center gap-3 py-2.5 text-sm',
                entry.isMe && '-mx-2 rounded-lg bg-brand/5 px-2 font-semibold',
              )}
            >
              <span className="flex w-7 justify-center">
                {entry.rank <= 3 ? (
                  <Medal className={cn('h-5 w-5', MEDAL_COLOURS[entry.rank - 1])} aria-label={`Rank ${entry.rank}`} />
                ) : (
                  <span className="text-gray-500 dark:text-muted-foreground">{entry.rank}</span>
                )}
              </span>
              <span className="flex-1 text-gray-900 dark:text-foreground">
                {entry.name}
                {entry.isMe && (
                  <span className="ml-2 text-xs font-normal text-brand dark:text-accent2-400">
                    {data.hidden ? '(you, hidden from others)' : '(you)'}
                  </span>
                )}
              </span>
              <span className="tabular-nums text-gray-700 dark:text-foreground/90">{entry.xp.toLocaleString()} XP</span>
            </li>
          ))}
        </ol>
      )}

      {!meInTop && (
        <p className="mt-3 border-t border-gray-100 pt-3 text-sm text-gray-600 dark:border-border dark:text-muted-foreground">
          {data.me
            ? `You are #${data.me.rank} with ${data.me.xp.toLocaleString()} XP this week.`
            : 'Finish a quiz this week to appear on the leaderboard.'}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-100 pt-3 dark:border-border">
        <label
          htmlFor={`leaderboard-hide-${studentId ?? 'self'}`}
          className="flex items-center gap-2 text-sm text-gray-700 dark:text-foreground/90"
        >
          <EyeOff className="h-4 w-4 text-gray-400 dark:text-muted-foreground" aria-hidden />
          <span>
            Hide {studentId ? 'this learner’s' : 'my'} name
            <span className="block text-xs text-gray-500 dark:text-muted-foreground">
              Others see “Hidden learner”. Your rank and XP still count.
            </span>
          </span>
        </label>
        <Switch
          id={`leaderboard-hide-${studentId ?? 'self'}`}
          checked={privacy.isPending ? Boolean(privacy.variables) : data.hidden}
          disabled={privacy.isPending}
          onCheckedChange={(checked) => privacy.mutate(checked)}
        />
      </div>
      {privacy.isError && (
        <p className="mt-2 text-xs text-red-600">Could not save that setting. Please try again.</p>
      )}
    </section>
  );
}
