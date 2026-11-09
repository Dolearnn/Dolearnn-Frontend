'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EyeOff, Medal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { dailyKeys, getDailyLeaderboard, setDailyNickname, type DailyBoardRow } from '@/lib/api/daily';
import { setLeaderboardPrivacy } from '@/lib/api/quiz';
import { cn } from '@/lib/utils';

const MEDALS = ['text-amber-500', 'text-slate-400', 'text-orange-700'];

function Row({ row, period }: { row: DailyBoardRow; period: 'today' | 'week' }) {
  return (
    <li className={cn('flex items-center gap-3 px-4 py-2.5 text-sm', row.isMe && 'bg-accent2-50 dark:bg-accent2-500/10')}>
      <span className="flex w-7 shrink-0 justify-center font-semibold tabular-nums text-gray-500 dark:text-muted-foreground">
        {row.rank <= 3 ? <Medal className={cn('h-5 w-5', MEDALS[row.rank - 1])} aria-label={`Rank ${row.rank}`} /> : row.rank}
      </span>
      <span className="min-w-0 flex-1 truncate font-medium text-gray-900 dark:text-foreground">
        {row.name}
        {row.isMe ? ' (you)' : ''}
      </span>
      {period === 'week' && (
        <span className="text-xs text-gray-500 dark:text-muted-foreground">
          {row.days} {row.days === 1 ? 'day' : 'days'}
        </span>
      )}
      <span className="w-12 text-right font-semibold tabular-nums text-brand dark:text-accent2-400">{row.score}</span>
    </li>
  );
}

function Nickname({ current }: { current: string | null }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(current ?? '');
  const save = useMutation({
    mutationFn: () => setDailyNickname(value),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dailyKeys.leaderboard });
      setEditing(false);
    },
  });

  if (current && !editing) {
    return (
      <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-700 dark:border-border dark:text-foreground/90">
        <span className="min-w-0 truncate">
          Playing as <strong className="font-semibold">{current}</strong>
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setValue(current);
            setEditing(true);
          }}
        >
          Change
        </Button>
      </div>
    );
  }

  return (
    <form
      className="border-t border-gray-100 px-4 py-3 dark:border-border"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      <label htmlFor="daily-nickname" className="text-sm font-medium text-gray-900 dark:text-foreground">
        {current ? 'Change your nickname' : 'Choose a nickname for the leaderboard'}
      </label>
      <div className="mt-2 flex gap-2">
        <Input
          id="daily-nickname"
          value={value}
          maxLength={20}
          autoComplete="off"
          placeholder="e.g. MathsKing_07"
          aria-describedby="daily-nickname-help"
          onChange={(event) => setValue(event.target.value)}
        />
        <Button type="submit" disabled={save.isPending || value.trim().length < 3}>
          {save.isPending ? 'Saving…' : 'Save'}
        </Button>
        {current && (
          <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        )}
      </div>
      <p id="daily-nickname-help" className="mt-2 text-xs text-gray-500 dark:text-muted-foreground">
        3 to 20 letters, numbers or underscores. Don&apos;t use your real name.
      </p>
      {save.isError && (
        <p role="alert" className="mt-1 text-sm text-red-600">
          {save.error instanceof Error ? save.error.message : 'Your nickname could not be saved. Please try again.'}
        </p>
      )}
    </form>
  );
}

/** The one leaderboard: today's Daily and this week's running total. */
export default function DailyLeaderboard({ className }: { className?: string }) {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<'today' | 'week'>('today');
  const query = useQuery({ queryKey: dailyKeys.leaderboard, queryFn: getDailyLeaderboard, staleTime: 30_000 });
  const privacy = useMutation({
    mutationFn: (hidden: boolean) => setLeaderboardPrivacy(null, hidden),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dailyKeys.leaderboard }),
  });

  if (query.isLoading) return <Skeleton className={cn('h-72 w-full rounded-2xl', className)} />;
  if (query.isError || !query.data) {
    return <p className={cn('text-sm text-gray-500 dark:text-muted-foreground', className)}>The leaderboard could not load. Refresh to try again.</p>;
  }

  const data = query.data;
  const board = data[period];
  const meOutsideTop = board.me && !board.top.some((row) => row.isMe);

  return (
    <section className={cn('rounded-2xl border border-gray-200 bg-white dark:border-border dark:bg-card', className)} aria-labelledby="daily-board-title">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <h2 id="daily-board-title" className="text-lg font-semibold text-gray-950 dark:text-foreground">Leaderboard</h2>
        <div className="inline-flex rounded-full border border-gray-200 p-1 text-sm dark:border-border" role="tablist" aria-label="Leaderboard period">
          {(
            [
              ['today', 'Today'],
              ['week', 'This week'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={period === value}
              onClick={() => setPeriod(value)}
              className={cn(
                'rounded-full px-4 py-1.5 font-medium transition-colors',
                period === value ? 'bg-brand text-white dark:bg-accent2-500 dark:text-brand' : 'text-gray-600 dark:text-muted-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {board.top.length === 0 ? (
        <p className="border-t border-gray-100 p-8 text-center text-sm text-gray-500 dark:border-border dark:text-muted-foreground">
          No scores yet. Be the first on the board.
        </p>
      ) : (
        <ol className="divide-y divide-gray-100 border-t border-gray-100 dark:divide-border dark:border-border">
          {board.top.map((row) => (
            <Row key={`${row.rank}-${row.name}`} row={row} period={period} />
          ))}
          {meOutsideTop && board.me && <Row row={board.me} period={period} />}
        </ol>
      )}

      {data.yesterday.length > 0 && (
        <p className="border-t border-gray-100 px-4 py-3 text-sm text-gray-600 dark:border-border dark:text-muted-foreground">
          <span className="font-medium text-gray-900 dark:text-foreground">Yesterday&apos;s top 3:</span>{' '}
          {data.yesterday.map((row) => `${row.name} (${row.score})`).join(', ')}
        </p>
      )}

      {data.canHide && <Nickname key={data.nickname ?? ''} current={data.nickname} />}

      {data.canHide && (
        <label className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-700 dark:border-border dark:text-foreground/90">
          <span className="flex items-center gap-2">
            <EyeOff className="h-4 w-4" aria-hidden /> Hide my nickname
          </span>
          <Switch checked={data.hidden} disabled={privacy.isPending} onCheckedChange={(hidden) => privacy.mutate(hidden)} />
        </label>
      )}
    </section>
  );
}
