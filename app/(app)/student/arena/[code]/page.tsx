'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Check, Copy, Share2, Swords, Trophy } from 'lucide-react';
import QuizRunner from '@/components/quiz/QuizRunner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  arenaKeys,
  cleanBattleCode,
  getBattle,
  joinBattle,
  type ArenaBattle,
  type ArenaEntryView,
} from '@/lib/api/arena';
import { ApiError } from '@/lib/api/client';
import { familyKeys, listFamilyStudents } from '@/lib/api/family';
import { getQuizAttempt, isSubmittedView, quizKeys } from '@/lib/api/quiz';
import { formatClock, scoreTone, toneClasses } from '@/lib/quiz';
import { attemptReviewPath, useLearnerBase, type LearnerBase } from '@/lib/learner-paths';
import { cn } from '@/lib/utils';

const SELF = 'self';
// While waiting for the rival, check every so often. Paused when the tab is hidden.
const WAIT_POLL_MS = 20_000;

function shareMessage(code: string, subject: string, base: LearnerBase) {
  const link = `${window.location.origin}${base}/arena/${code}`;
  return `Join my DoLearnn ${subject} battle! Code: ${code}\n${link}`;
}

function CodeCard({ code, subject }: { code: string; subject: string }) {
  const base = useLearnerBase();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareMessage(code, subject, base));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the code is still on screen.
    }
  }

  return (
    <div className="rounded-3xl border border-gray-200/80 bg-white p-5 text-center dark:border-border dark:bg-card">
      <p className="text-sm text-gray-500 dark:text-muted-foreground">Battle code</p>
      <p className="mt-1 font-display text-[40px] font-extrabold leading-none tracking-[0.25em] text-brand dark:text-accent2-400">
        {code}
      </p>
      <div className="mt-5 grid gap-2 sm:flex sm:justify-center">
        <Button asChild className="h-12 rounded-2xl bg-[#25D366] px-5 text-[15px] text-white hover:bg-[#1fb857]">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareMessage(code, subject, base))}`}
            target="_blank"
            rel="noreferrer"
          >
            <Share2 className="mr-2 h-4 w-4" /> Send on WhatsApp
          </a>
        </Button>
        <Button variant="outline" className="h-12 rounded-2xl px-5" onClick={copy}>
          {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
          {copied ? 'Copied' : 'Copy invite'}
        </Button>
      </div>
    </div>
  );
}

function PlayerCard({
  entry,
  isWinner,
}: {
  entry: ArenaEntryView | undefined;
  isWinner: boolean;
}) {
  if (!entry) {
    return (
      <div className="min-w-0 flex-1 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-white/30 font-display text-lg font-bold text-white/40">
          ?
        </span>
        <p className="mt-2 text-sm font-semibold text-white/70">Waiting for a rival</p>
        <p className="mt-0.5 text-xs text-white/50">Share the code below</p>
      </div>
    );
  }

  return (
    <div className="min-w-0 flex-1 text-center">
      <span
        className={cn(
          'mx-auto flex h-12 w-12 items-center justify-center rounded-full font-display text-lg font-bold',
          isWinner ? 'bg-accent2-400 text-brand-700' : 'bg-white/15 text-white',
        )}
      >
        {isWinner ? <Trophy className="h-5 w-5" aria-label="Winner" /> : entry.playerName.trim().charAt(0).toUpperCase()}
      </span>
      <p className="mt-2 truncate text-sm font-semibold">
        {entry.playerName}
        {entry.isMine && <span className="font-normal text-white/60"> (you)</span>}
      </p>
      {entry.scorePercent !== null ? (
        <>
          <p className={cn('mt-1 font-display text-[44px] font-extrabold leading-none tabular-nums', isWinner ? 'text-accent2-300' : 'text-white')}>
            {entry.scorePercent}
            <span className="text-xl">%</span>
          </p>
          <p className="mt-1 text-xs tabular-nums text-white/60">
            {entry.correctCount} correct
            {entry.secondsTaken !== null ? `, ${formatClock(entry.secondsTaken)}` : ''}
          </p>
        </>
      ) : (
        <p className="mt-2 text-xs text-white/60">
          {entry.status === 'FINISHED' ? 'Finished. You see the score once you finish.' : 'Playing…'}
        </p>
      )}
    </div>
  );
}

function BattleResult({ battle }: { battle: ArenaBattle }) {
  const base = useLearnerBase();
  const { challenge, entries, outcome } = battle;
  const first = entries.find((entry) => entry.slot === 1);
  const second = entries.find((entry) => entry.slot === 2);
  const mine = entries.filter((entry) => entry.isMine);
  const myFirstAttempt = mine.find((entry) => entry.attemptId)?.attemptId ?? null;

  let headline = 'Battle in progress';
  let detail = '';
  if (outcome) {
    if (outcome.isDraw) {
      headline = 'It is a draw!';
      detail = 'Same score and time. Start another battle to settle it.';
    } else {
      const winner = entries.find((entry) => entry.slot === outcome.winnerSlot);
      const iWon = Boolean(winner?.isMine);
      const bothMine = mine.length === entries.length;
      headline = bothMine ? `${winner?.playerName} wins!` : iWon ? 'You won!' : 'You lost this one';
      detail = iWon || bothMine ? 'Great work.' : 'Review your answers and go again.';
    }
  } else if (!second) {
    headline = 'Send the code to a friend';
    detail = 'Their score appears here once you have both finished.';
  } else {
    headline = 'Waiting for your rival to finish';
    detail = 'This page updates by itself.';
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section
        aria-labelledby="battle-headline"
        className="relative overflow-hidden rounded-[28px] bg-brand p-5 text-white shadow-[0_18px_40px_-24px_rgba(4,66,114,0.9)] dark:bg-[hsl(208,70%,16%)] sm:p-7"
      >
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-accent2-400/25 blur-3xl" />
        <div className="relative text-center">
          <p className="text-sm text-white/70">
            {challenge.subject.name}, {challenge.totalQuestions} questions
          </p>
          <h1 id="battle-headline" className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">{headline}</h1>
          {detail && <p className="mt-1 text-sm text-white/75">{detail}</p>}
        </div>

        <div className="relative mt-6 flex items-start gap-2">
          <PlayerCard entry={first} isWinner={outcome?.winnerSlot === 1} />
          <span aria-hidden className="mt-3 shrink-0 font-display text-sm font-extrabold text-white/40">VS</span>
          <PlayerCard entry={second} isWinner={outcome?.winnerSlot === 2} />
        </div>
      </section>

      {!second && !challenge.isExpired && (
        <CodeCard code={challenge.code} subject={challenge.subject.name} />
      )}

      <div className="grid gap-2 sm:flex sm:justify-center">
        <Button asChild className="h-12 rounded-2xl px-5 text-[15px]">
          <Link href={`${base}/arena`}>
            <Swords className="mr-2 h-4 w-4" /> New battle
          </Link>
        </Button>
        {myFirstAttempt && (
          <Button asChild variant="outline" className="h-12 rounded-2xl px-5">
            <Link href={attemptReviewPath(base, myFirstAttempt)}>Review my answers</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

// Plays one of your own games. When it is submitted, the battle refreshes.
function PlayEntry({ code, attemptId }: { code: string; attemptId: string }) {
  const base = useLearnerBase();
  const queryClient = useQueryClient();
  const attemptQuery = useQuery({
    queryKey: quizKeys.attempt(attemptId),
    queryFn: () => getQuizAttempt(attemptId),
    staleTime: Infinity,
  });

  const data = attemptQuery.data;
  const submitted = data ? isSubmittedView(data) : false;

  useEffect(() => {
    if (submitted) {
      void queryClient.invalidateQueries({ queryKey: arenaKeys.battle(code) });
      void queryClient.invalidateQueries({ queryKey: arenaKeys.mine });
    }
  }, [submitted, code, queryClient]);

  if (attemptQuery.isError) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-gray-200/80 bg-white p-8 text-center dark:border-border dark:bg-card">
        <p className="text-base font-semibold text-gray-900 dark:text-foreground">
          We could not open your game
        </p>
        <p className="text-sm text-gray-500 dark:text-muted-foreground mt-1 mb-5">
          {attemptQuery.error instanceof Error ? attemptQuery.error.message : 'Please try again.'}
        </p>
        <Button asChild className="h-10 px-5 rounded-xl">
          <Link href={`${base}/arena`}>Back to Arena</Link>
        </Button>
      </div>
    );
  }

  if (!data || isSubmittedView(data)) {
    return <Skeleton className="h-64 max-w-3xl mx-auto rounded-[28px]" />;
  }

  return <QuizRunner view={data} />;
}

function JoinPanel({ battle, code }: { battle: ArenaBattle; code: string }) {
  const base = useLearnerBase();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [learner, setLearner] = useState<string>(SELF);

  const studentsQuery = useQuery({
    queryKey: familyKeys.students,
    queryFn: listFamilyStudents,
    enabled: false,
  });
  const children = studentsQuery.data ?? [];
  const { challenge, entries } = battle;
  const host = entries.find((entry) => entry.slot === 1);
  const closed = challenge.isExpired || challenge.isFull;

  const join = useMutation({
    mutationFn: () => joinBattle(code, learner === SELF ? undefined : learner),
    onSuccess: (view) => {
      queryClient.setQueryData(quizKeys.attempt(view.attempt.id), {
        attempt: view.attempt,
        questions: view.questions,
      });
      void queryClient.invalidateQueries({ queryKey: arenaKeys.battle(code) });
      void queryClient.invalidateQueries({ queryKey: arenaKeys.mine });
    },
    onError: (error) => {
      toast({
        title: 'Could not join the battle',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-gray-200/80 bg-white p-6 text-center dark:border-border dark:bg-card">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-brand text-white dark:bg-accent2-500 dark:text-brand flex items-center justify-center">
        <Swords className="w-6 h-6" />
      </div>
      <h1 className="mt-3 text-xl font-bold text-gray-900 dark:text-foreground">
        {host ? `${host.playerName} challenged you` : 'You are challenged'}
      </h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-muted-foreground">
        {challenge.subject.name} · {challenge.totalQuestions} questions
      </p>

      {closed ? (
        <p className="mt-5 text-sm text-gray-500 dark:text-muted-foreground">
          {challenge.isExpired
            ? 'This battle has expired.'
            : 'This battle already has two players.'}
        </p>
      ) : (
        <div className="mt-5 space-y-4 text-left">
          {children.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="join-learner">Who is playing</Label>
              <Select value={learner} onValueChange={setLearner}>
                <SelectTrigger id="join-learner" className="bg-white dark:bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELF}>Myself</SelectItem>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button
            className="h-11 w-full rounded-xl"
            disabled={join.isPending}
            onClick={() => join.mutate()}
          >
            {join.isPending ? 'Joining...' : 'Accept the challenge'}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function BattlePage() {
  const base = useLearnerBase();
  const params = useParams<{ code: string }>();
  const code = cleanBattleCode(params.code ?? '');

  const battleQuery = useQuery({
    queryKey: arenaKeys.battle(code),
    queryFn: () => getBattle(code),
    retry: (count, err) => !(err instanceof ApiError && err.status === 404) && count < 1,
    // Only poll while waiting on a rival.
    refetchInterval: (query) => {
      const battle = query.state.data;
      if (!battle?.viewerIsPlayer || battle.outcome) return false;
      return battle.entries.every((entry) => !entry.isMine || entry.status === 'FINISHED')
        ? WAIT_POLL_MS
        : false;
    },
  });

  if (battleQuery.isLoading) {
    return <Skeleton className="h-64 max-w-3xl mx-auto rounded-[28px]" />;
  }

  if (battleQuery.isError || !battleQuery.data) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-gray-200/80 bg-white p-8 text-center dark:border-border dark:bg-card">
        <p className="text-base font-semibold text-gray-900 dark:text-foreground">
          We could not find that battle
        </p>
        <p className="text-sm text-gray-500 dark:text-muted-foreground mt-1 mb-5">
          {battleQuery.error instanceof Error ? battleQuery.error.message : 'Check the code and try again.'}
        </p>
        <Button asChild className="h-10 px-5 rounded-xl">
          <Link href={`${base}/arena`}>Back to Arena</Link>
        </Button>
      </div>
    );
  }

  const battle = battleQuery.data;

  if (!battle.viewerIsPlayer) {
    return <JoinPanel battle={battle} code={code} />;
  }

  const pending = battle.entries.find(
    (entry) => entry.isMine && entry.status === 'PLAYING' && entry.attemptId,
  );
  if (pending?.attemptId) {
    return <PlayEntry code={code} attemptId={pending.attemptId} />;
  }

  return <BattleResult battle={battle} />;
}
