'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Check, Clock, Copy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getAuthToken } from '@/lib/api/auth-storage';
import {
  answerDaily,
  claimGuestDaily,
  dailyKeys,
  getDailyState,
  rememberGuestKey,
  startDaily,
  type DailyQuestion,
  type DailyResult,
  type DailyState,
} from '@/lib/api/daily';
import { cn } from '@/lib/utils';
import ReportQuestion from '@/components/quiz/ReportQuestion';
import DailyLeaderboard from './DailyLeaderboard';

const CATEGORY: Record<string, string> = { english: 'English', maths: 'Maths', history: 'History' };

function Question({
  question,
  onAnswer,
  busy,
}: {
  question: DailyQuestion;
  onAnswer: (optionId: string | null) => void;
  busy: boolean;
}) {
  const [left, setLeft] = useState(question.secondsLeft);
  const answer = useRef(onAnswer);
  answer.current = onAnswer;

  useEffect(() => {
    setLeft(question.secondsLeft);
    const deadline = Date.now() + question.secondsLeft * 1000;
    const timer = setInterval(() => {
      const remaining = Math.ceil((deadline - Date.now()) / 1000);
      setLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        clearInterval(timer);
        answer.current(null);
      }
    }, 250);
    return () => clearInterval(timer);
  }, [question.id, question.secondsLeft]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-medium text-gray-600">
          Question {question.index + 1} of {question.total} · {CATEGORY[question.category]}
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold tabular-nums',
            left <= 5 ? 'bg-red-100 text-red-700' : 'bg-accent2-100 text-brand',
          )}
          role="timer"
          aria-label="Seconds left"
        >
          <Clock className="h-4 w-4" aria-hidden /> {left}s
        </span>
      </div>
      <div className="mb-6 h-2 overflow-hidden rounded-full bg-gray-200">
        <div className="h-full rounded-full bg-accent2-500 transition-all" style={{ width: `${(question.index / question.total) * 100}%` }} />
      </div>
      <h1 className="whitespace-pre-line text-xl font-semibold leading-snug text-gray-950">{question.text}</h1>
      <div className="mt-6 space-y-3">
        {question.options.map((option) => (
          <button
            key={option.id}
            type="button"
            disabled={busy}
            onClick={() => onAnswer(option.id)}
            className="min-h-14 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left font-medium text-gray-900 transition-colors hover:border-brand hover:bg-accent2-50 disabled:opacity-60"
          >
            {option.text}
          </button>
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-gray-500">One attempt. Your answer locks as soon as you tap it.</p>
    </div>
  );
}

function Share({ number, result }: { number: number; result: DailyResult }) {
  const [copied, setCopied] = useState(false);
  const rank = result.ranked && !result.flagged ? `, #${result.rank} today` : '';
  const text = `DoLearnn Daily #${number}: ${result.score}/${result.total}${rank}. Can you beat me? ${window.location.origin}/daily`;

  return (
    <div className="mt-4 flex flex-wrap justify-center gap-2">
      <Button asChild className="rounded-full">
        <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">
          Share on WhatsApp
        </a>
      </Button>
      <Button
        variant="outline"
        className="rounded-full"
        onClick={async () => {
          await navigator.clipboard.writeText(text).catch(() => undefined);
          setCopied(true);
        }}
      >
        <Copy className="mr-2 h-4 w-4" /> {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  );
}

function Results({ number, result }: { number: number; result: DailyResult }) {
  const signedIn = Boolean(getAuthToken());

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-brand p-7 text-center text-white">
        <p className="text-sm font-semibold text-accent2-300">The Daily #{number}</p>
        <p className="mt-2 text-6xl font-extrabold">
          {result.score}
          <span className="text-3xl text-white/60">/{result.total}</span>
        </p>
        <p className="mt-2 text-white/80">in {result.seconds} {result.seconds === 1 ? 'second' : 'seconds'}</p>
        {result.flagged ? (
          <p className="mt-3 text-sm text-white/80">Your score is being checked before it goes on the leaderboard.</p>
        ) : (
          <p className="mt-3 text-lg font-semibold">
            {result.ranked ? `You're #${result.rank} today` : `That would be #${result.rank} today`}
            {result.players > 1 && result.aheadPercent > 0 ? `, ahead of ${result.aheadPercent}% of players` : ''}
          </p>
        )}
      </section>

      {!result.ranked && !signedIn && (
        <section className="rounded-2xl border border-accent2-200 bg-accent2-50 p-5 text-center">
          <p className="font-semibold text-gray-950">Save your score and get on the leaderboard</p>
          <p className="mt-1 text-sm text-gray-600">Create a free account and today&apos;s score comes with you.</p>
          <Button asChild className="mt-4 rounded-full">
            <Link href="/register">
              Create free account <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>
      )}

      <Share number={number} result={result} />
      <p className="text-center text-sm text-gray-500">A new quiz arrives at midnight.</p>

      <DailyLeaderboard />

      <section aria-labelledby="daily-review-title">
        <h2 id="daily-review-title" className="mb-3 text-lg font-semibold text-gray-950">Answers</h2>
        <ol className="space-y-3">
          {result.review.map((question) => {
            const correct = question.yourAnswer === question.correctOptionId;
            const right = question.options.find((option) => option.id === question.correctOptionId);
            const yours = question.options.find((option) => option.id === question.yourAnswer);
            return (
              <li key={question.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                <p className="flex items-start gap-2 font-medium text-gray-950">
                  {correct ? (
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-label="Correct" />
                  ) : (
                    <X className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-label="Wrong" />
                  )}
                  {question.text}
                </p>
                {!correct && (
                  <p className="mt-2 text-sm text-red-700">{yours ? `You chose: ${yours.text}` : 'Time ran out.'}</p>
                )}
                <p className="mt-1 text-sm font-medium text-emerald-700">Answer: {right?.text}</p>
                {question.explanation && <p className="mt-1 text-sm text-gray-600">{question.explanation}</p>}
                <ReportQuestion kind="daily" questionId={question.id} />
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

export default function DailyPlay() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<DailyState | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  // Claim a score from before signing up, then read today's state.
  const loaded = useQuery({
    queryKey: ['daily', 'play'],
    queryFn: async () => {
      await claimGuestDaily();
      return getDailyState();
    },
    staleTime: Infinity,
    gcTime: 0,
  });

  const apply = useCallback(
    (next: DailyState) => {
      rememberGuestKey(next.guestKey);
      setState(next);
      if (next.status === 'finished') {
        void queryClient.invalidateQueries({ queryKey: ['daily'], refetchType: 'none' });
        void queryClient.invalidateQueries({ queryKey: dailyKeys.leaderboard });
      }
    },
    [queryClient],
  );

  const current = state ?? loaded.data ?? null;
  const questionId = current?.status === 'playing' ? current.question.id : null;

  const run = async (action: () => Promise<DailyState>) => {
    setBusy(true);
    setFailed(false);
    try {
      apply(await action());
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  if (loaded.isLoading) return <Skeleton className="h-96 w-full rounded-3xl" />;
  if (loaded.isError || !current) {
    return (
      <div className="text-center">
        <p className="text-gray-700">Today&apos;s quiz could not load.</p>
        <Button className="mt-4 rounded-full" onClick={() => loaded.refetch()}>Try again</Button>
      </div>
    );
  }

  return (
    <>
      {failed && (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-center text-sm text-red-700">
          Your connection dropped. Tap your answer again.
        </p>
      )}
      {current.status === 'new' && (
        <section className="text-center">
          <p className="text-sm font-semibold text-accent2-600">The Daily #{current.number}</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-brand-700">One quiz. Everyone. Today.</h1>
          <p className="mx-auto mt-4 max-w-md leading-7 text-gray-600">
            {current.total} questions in English, Maths and History. About 3 minutes. You only get one attempt, so make it count.
          </p>
          <Button className="mt-7 h-12 rounded-full px-8 text-base" disabled={busy} onClick={() => run(startDaily)}>
            {busy ? 'Starting…' : 'Start the quiz'}
          </Button>
          <p className="mt-3 text-sm text-gray-500">The timer starts as soon as you tap.</p>
          <div className="mt-10 text-left">
            <DailyLeaderboard />
          </div>
        </section>
      )}
      {current.status === 'playing' && questionId && (
        <Question
          key={questionId}
          question={current.question}
          busy={busy}
          onAnswer={(optionId) => run(() => answerDaily(questionId, optionId))}
        />
      )}
      {current.status === 'finished' && <Results number={current.number} result={current.result} />}
    </>
  );
}
