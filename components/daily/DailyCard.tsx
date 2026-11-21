'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Zap } from 'lucide-react';
import { dailyKeys, getDailyState } from '@/lib/api/daily';
import { cn } from '@/lib/utils';

/** The way into today's Daily, or today's score once it has been played. */
export default function DailyCard({ className }: { className?: string }) {
  const { data } = useQuery({ queryKey: dailyKeys.state, queryFn: getDailyState, staleTime: 30_000 });
  const finished = data?.status === 'finished' ? data.result : null;

  return (
    <Link
      href="/daily"
      className={cn(
        'group flex min-h-[76px] items-center gap-4 rounded-3xl bg-accent2-400 p-4 pr-5 text-brand-700 transition-[transform,background-color] hover:bg-accent2-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 active:scale-[0.98]',
        className,
      )}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-700 text-accent2-300">
        <Zap className="h-5 w-5 fill-current" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-base font-bold">
          The Daily{data ? <span className="tabular-nums"> #{data.number}</span> : null}
        </span>
        <span className="block text-sm leading-5 text-brand-700/80">
          {finished ? (
            <>
              You scored <strong className="font-semibold tabular-nums">{finished.score}/{finished.total}</strong>, rank{' '}
              <strong className="font-semibold tabular-nums">#{finished.rank}</strong>. Back tomorrow.
            </>
          ) : data?.status === 'playing' ? (
            'Your quiz is in progress. The clock is running.'
          ) : (
            '10 questions, about 3 minutes, one try. Same quiz for everyone.'
          )}
        </span>
      </span>
      <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}
