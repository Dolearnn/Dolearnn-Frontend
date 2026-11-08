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
        'group flex items-center gap-4 rounded-2xl bg-gradient-to-r from-accent2-400 to-accent2-500 p-5 text-brand-700 transition hover:shadow-lg',
        className,
      )}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/40">
        <Zap className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-bold">The Daily{data ? ` #${data.number}` : ''}</span>
        <span className="block text-sm text-brand-700/80">
          {finished
            ? `You scored ${finished.score}/${finished.total} today, rank #${finished.rank}. Back tomorrow.`
            : data?.status === 'playing'
              ? 'You have a quiz in progress. The clock is running.'
              : '10 questions, about 3 minutes, one attempt. Everyone gets the same quiz.'}
        </span>
      </span>
      <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}
