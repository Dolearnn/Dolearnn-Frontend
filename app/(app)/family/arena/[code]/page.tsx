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
import { cn } from '@/lib/utils';

const SELF = 'self';
// While waiting for the rival, check every so often. Paused when the tab is hidden.
const WAIT_POLL_MS = 20_000;

function shareMessage(code: string, subject: string) {
  const link = `${window.location.origin}/family/arena/${code}`;
  return `Join my DoLearnn ${subject} battle! Code: ${code}\n${link}`;
}

function CodeCard({ code, subject }: { code: string; subject: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareMessage(code, subject));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the code is still on screen.
    }
  }

  return (
    <div className="rounded-2xl border border-accent2-200 bg-accent2-50 dark:border-accent2-500/30 dark:bg-accent2-500/10 p-5 text-center">
      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-muted-foreground">
        Battle code
      </p>
      <p className="mt-1 text-4xl font-bold tracking-[0.3em] text-brand dark:text-accent2-400">
        {code}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Button asChild className="h-10 px-4 rounded-xl">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareMessage(code, subject))}`}
            target="_blank"
            rel="noreferrer"
          >
            <Share2 className="w-4 h-4 mr-2" /> Send on WhatsApp
          </a>
        </Button>
        <Button variant="outline" className="h-10 px-4 rounded-xl" onClick={copy}>
          {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
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
      <div className="rounded-2xl border border-dashed border-gray-300 dark:border-border bg-white dark:bg-card p-5 text-center">
        <p className="text-sm font-semibold text-gray-500 dark:text-muted-foreground">
          Waiting for a rival
        </p>
        <p className="text-xs text-gray-400 mt-1">Share the code above.</p>
      </div>
    );
  }

  const tone = entry.scorePercent !== null ? toneClasses[scoreTone(entry.scorePercent)] : null;

  return (
    <div
      className={cn(
        'rounded-2xl border p-5 text-center bg-white dark:bg-card',
        isWinner
          ? 'border-emerald-400 dark:border-emerald-500/60'
          : 'border-gray-200 dark:border-border',
      )}
    >
      <p className="text-sm font-semibold text-gray-900 dark:text-foreground flex items-center justify-center gap-1.5">
        {isWinner && <Trophy className="w-4 h-4 text-amber-500" />}
        {entry.playerName}
        {entry.isMine && <span className="text-xs font-normal text-gray-500">(you)</span>}
      </p>
      {entry.scorePercent !== null ? (
        <>
          <p className={cn('mt-2 text-4xl font-bold tabular-nums', tone?.text)}>
            {entry.scorePercent}%
          </p>
          <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
            {entry.correctCount} correct
            {entry.secondsTaken !== null ? ` · ${formatClock(entry.secondsTaken)}` : ''}
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-gray-500 dark:text-muted-foreground">
          {entry.status === 'FINISHED' ? 'Finished. Score unlocks when you finish.' : 'Playing...'}
        </p>
      )}
    </div>
  );
}

function BattleResult({ battle }: { battle: ArenaBattle }) {
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
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="text-center">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-muted-foreground">
          {challenge.subject.name} · {challenge.totalQuestions} questions
        </p>
        <h1 className="mt-1 text-2xl font-bold text-brand dark:text-accent2-400">{headline}</h1>
        {detail && (
          <p className="mt-1 text-sm text-gray-600 dark:text-muted-foreground">{detail}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <PlayerCard entry={first} isWinner={outcome?.winnerSlot === 1} />
        <PlayerCard entry={second} isWinner={outcome?.winnerSlot === 2} />
      </div>

      {!second && !challenge.isExpired && (
        <CodeCard code={challenge.code} subject={challenge.subject.name} />
      )}

      <div className="flex flex-wrap justify-center gap-2">
        {myFirstAttempt && (
          <Button asChild variant="outline" className="h-10 px-4 rounded-xl">
            <Link href={`/family/quiz/attempt/${myFirstAttempt}`}>Review my answers</Link>
          </Button>
        )}
        <Button asChild className="h-10 px-4 rounded-xl">
          <Link href="/family/arena">
            <Swords className="w-4 h-4 mr-2" /> New battle
          </Link>
        </Button>
      </div>
    </div>
  );
}

// Plays one of your own games. When it is submitted, the battle refreshes.
function PlayEntry({ code, attemptId }: { code: string; attemptId: string }) {
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
      <div className="max-w-md mx-auto rounded-2xl border border-gray-200 dark:border-border bg-white dark:bg-card p-8 text-center">
        <p className="text-base font-semibold text-gray-900 dark:text-foreground">
          We could not open your game
        </p>
        <p className="text-sm text-gray-500 dark:text-muted-foreground mt-1 mb-5">
          {attemptQuery.error instanceof Error ? attemptQuery.error.message : 'Please try again.'}
        </p>
        <Button asChild className="h-10 px-5 rounded-xl">
          <Link href="/family/arena">Back to Arena</Link>
        </Button>
      </div>
    );
  }

  if (!data || isSubmittedView(data)) {
    return <Skeleton className="h-64 max-w-3xl mx-auto rounded-2xl" />;
  }

  return <QuizRunner view={data} />;
}

function JoinPanel({ battle, code }: { battle: ArenaBattle; code: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [learner, setLearner] = useState<string>(SELF);

  const studentsQuery = useQuery({
    queryKey: familyKeys.students,
    queryFn: listFamilyStudents,
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
    <div className="max-w-md mx-auto rounded-2xl border border-gray-200 dark:border-border bg-white dark:bg-card p-6 text-center">
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
    return <Skeleton className="h-64 max-w-3xl mx-auto rounded-2xl" />;
  }

  if (battleQuery.isError || !battleQuery.data) {
    return (
      <div className="max-w-md mx-auto rounded-2xl border border-gray-200 dark:border-border bg-white dark:bg-card p-8 text-center">
        <p className="text-base font-semibold text-gray-900 dark:text-foreground">
          We could not find that battle
        </p>
        <p className="text-sm text-gray-500 dark:text-muted-foreground mt-1 mb-5">
          {battleQuery.error instanceof Error ? battleQuery.error.message : 'Check the code and try again.'}
        </p>
        <Button asChild className="h-10 px-5 rounded-xl">
          <Link href="/family/arena">Back to Arena</Link>
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
