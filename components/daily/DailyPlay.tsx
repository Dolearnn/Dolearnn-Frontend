'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Check, Clock, Copy, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

// The server can take up to half a minute to wake, so a slow load says so.
const SLOW_LOAD_MS = 5000;

function Loading() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_LOAD_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div role="status" className="flex h-96 flex-col items-center justify-center rounded-[28px] border border-gray-200/80 bg-white p-8 text-center">
      <Loader2 className="h-10 w-10 animate-spin text-brand" aria-hidden />
      <p className="mt-4 font-display text-lg font-bold text-gray-950">Loading today&apos;s quiz…</p>
      <p className="mt-1 max-w-xs text-sm text-gray-600">
        {slow ? 'Still working on it. This can take up to 30 seconds, so please keep this page open.' : 'This should only take a moment.'}
      </p>
    </div>
  );
}

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
  const [picked, setPicked] = useState<string | null>(null);
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

  // A bar that empties as the seconds run out, so the timer reads at a glance.
  const timePercent = question.secondsLeft > 0 ? (left / question.secondsLeft) * 100 : 0;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="flex items-baseline gap-1.5 text-gray-500">
          <span className="font-display text-2xl font-extrabold tabular-nums text-brand">{question.index + 1}</span>
          <span className="text-sm tabular-nums">of {question.total}</span>
          <span className="ml-1 text-sm">in {CATEGORY[question.category]}</span>
        </p>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 font-display text-base font-bold tabular-nums',
            left <= 5 ? 'bg-red-100 text-red-700' : 'bg-brand text-white',
          )}
          role="timer"
          aria-label="Seconds left"
        >
          <Clock className="h-4 w-4" aria-hidden /> {left}s
        </span>
      </div>
      <div className="mb-6 h-2 overflow-hidden rounded-full bg-gray-200" aria-hidden>
        <div
          className={cn('h-full rounded-full transition-[width] duration-300 ease-linear motion-reduce:transition-none', left <= 5 ? 'bg-red-500' : 'bg-accent2-500')}
          style={{ width: `${timePercent}%` }}
        />
      </div>
      <div className="rounded-3xl border border-gray-200/80 bg-white p-5 sm:p-6">
        <h1 className="whitespace-pre-line text-[19px] font-semibold leading-snug text-gray-950">{question.text}</h1>
        <div className="mt-5 space-y-2.5">
          {question.options.map((option) => {
            const saving = busy && picked === option.id;
            return (
              <button
                key={option.id}
                type="button"
                disabled={busy}
                onClick={() => {
                  setPicked(option.id);
                  onAnswer(option.id);
                }}
                className={cn(
                  'flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border-2 border-gray-200/80 bg-white px-4 py-3 text-left text-[15px] font-medium text-gray-900 transition-[border-color,background-color,transform] hover:border-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99] disabled:opacity-60',
                  saving && 'border-brand bg-brand-50 disabled:opacity-100',
                )}
              >
                {option.text}
                {saving && <Loader2 className="h-5 w-5 shrink-0 animate-spin text-brand" aria-hidden />}
              </button>
            );
          })}
        </div>
      </div>
      {busy ? (
        <p role="status" className="mt-4 flex items-center justify-center gap-2 text-center text-sm font-medium text-brand">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {picked ? 'Saving your answer…' : "Time's up. Loading the next question…"}
        </p>
      ) : (
        <p className="mt-4 text-center text-xs text-gray-500">One attempt. Your answer locks as soon as you tap it.</p>
      )}
    </div>
  );
}

function Share({ number, result }: { number: number; result: DailyResult }) {
  const [copied, setCopied] = useState(false);
  const rank = result.ranked && !result.flagged ? `, #${result.rank} today` : '';
  const text = `DoLearnn Daily #${number}: ${result.score}/${result.total}${rank}. Can you beat me? ${window.location.origin}/daily`;

  return (
    <div className="grid gap-2 sm:flex sm:justify-center">
      <Button asChild className="h-12 rounded-2xl bg-[#25D366] px-6 text-[15px] text-white hover:bg-[#1fb857]">
        <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">
          Share on WhatsApp
        </a>
      </Button>
      <Button
        variant="outline"
        className="h-12 rounded-2xl px-6"
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
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[28px] bg-brand p-7 text-center text-white shadow-[0_18px_40px_-24px_rgba(4,66,114,0.9)]">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-accent2-400/25 blur-3xl" />
        <p className="relative text-sm font-semibold text-accent2-300">The Daily #{number}</p>
        <p className="relative mt-2 font-display text-7xl font-extrabold leading-none tabular-nums">
          {result.score}
          <span className="text-3xl text-white/50">/{result.total}</span>
        </p>
        <p className="relative mt-3 text-white/75">in {result.seconds} {result.seconds === 1 ? 'second' : 'seconds'}</p>
        {result.flagged ? (
          <p className="relative mt-3 text-sm text-white/80">Your score is being checked before it goes on the leaderboard.</p>
        ) : (
          <p className="relative mx-auto mt-4 inline-block rounded-full bg-white/10 px-4 py-1.5 font-semibold">
            {result.ranked ? `You're #${result.rank} today` : `That would be #${result.rank} today`}
            {result.players > 1 && result.aheadPercent > 0 ? `, ahead of ${result.aheadPercent}% of players` : ''}
          </p>
        )}
      </section>

      {!result.ranked && !signedIn && (
        <section className="rounded-3xl bg-accent2-50 p-5 text-center">
          <p className="font-display text-lg font-bold text-gray-950">Want more? Create a free account</p>
          <p className="mt-1 text-sm text-gray-600">Practise any subject, save today&apos;s score and pick a nickname for the leaderboard.</p>
          <Button asChild className="mt-4 h-12 w-full rounded-2xl text-[15px] sm:w-auto sm:px-6">
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
        <h2 id="daily-review-title" className="mb-3 font-display text-lg font-bold text-gray-950">Answers</h2>
        <ol className="space-y-3">
          {result.review.map((question) => {
            const correct = question.yourAnswer === question.correctOptionId;
            const right = question.options.find((option) => option.id === question.correctOptionId);
            const yours = question.options.find((option) => option.id === question.yourAnswer);
            return (
              <li key={question.id} className="rounded-3xl border border-gray-200/80 bg-white p-4">
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
                {question.explanation && <p className="mt-2 rounded-2xl bg-gray-50 px-3.5 py-2.5 text-sm leading-6 text-gray-600">{question.explanation}</p>}
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

  if (loaded.isLoading) return <Loading />;
  if (loaded.isError || !current) {
    return (
      <div className="text-center">
        <p className="text-gray-700">Today&apos;s quiz could not load.</p>
        <Button className="mt-4 h-12 rounded-2xl px-6" disabled={loaded.isFetching} onClick={() => loaded.refetch()}>
          {loaded.isFetching && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
          {loaded.isFetching ? 'Trying again…' : 'Try again'}
        </Button>
      </div>
    );
  }

  return (
    <>
      {failed && (
        <p role="alert" className="mb-4 rounded-2xl bg-red-50 p-3 text-center text-sm text-red-700">
          Your connection dropped. Tap your answer again.
        </p>
      )}
      {current.status === 'new' && (
        <section>
          <div className="relative overflow-hidden rounded-[28px] bg-brand p-6 text-white shadow-[0_18px_40px_-24px_rgba(4,66,114,0.9)] sm:p-8">
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-accent2-400/25 blur-3xl" />
            <p className="relative text-sm font-semibold text-accent2-300">The Daily #{current.number}</p>
            <h1 className="relative mt-1 font-display text-[34px] font-extrabold leading-[1.05] tracking-tight sm:text-4xl">
              One quiz. Everyone. Today.
            </h1>
            <dl className="relative mt-6 grid grid-cols-3 gap-2">
              {[
                [String(current.total), 'questions'],
                ['~3', 'minutes'],
                ['1', 'try'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl bg-white/10 px-3 py-3">
                  <dd className="font-display text-3xl font-extrabold leading-none tabular-nums">{value}</dd>
                  <dt className="mt-1 text-xs text-white/70">{label}</dt>
                </div>
              ))}
            </dl>
            <p className="relative mt-4 text-sm leading-6 text-white/75">
              English, Maths and History. You only get one attempt, so make it count.
            </p>
            <Button
              className="relative mt-6 h-14 w-full rounded-2xl bg-accent2-400 text-base font-semibold text-brand-700 hover:bg-accent2-300"
              disabled={busy}
              onClick={() => run(startDaily)}
            >
              {busy && <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />}
              {busy ? 'Starting…' : 'Start the quiz'}
            </Button>
            <p role="status" className="relative mt-3 text-center text-sm text-white/60">
              {busy ? 'Getting your first question ready…' : 'The timer starts as soon as you tap.'}
            </p>
          </div>
          <div className="mt-6">
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
