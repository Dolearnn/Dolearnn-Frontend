'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { ChevronRight, Swords } from 'lucide-react';
import DailyCard from '@/components/daily/DailyCard';
import DailyLeaderboard from '@/components/daily/DailyLeaderboard';
import PageHeader from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  createBattle,
  listMyBattles,
  type ArenaBattleListItem,
  type ArenaResult,
} from '@/lib/api/arena';
import { familyKeys, listFamilyStudents } from '@/lib/api/family';
import { getQuizCatalog, quizKeys } from '@/lib/api/quiz';
import { useLearnerBase } from '@/lib/learner-paths';
import { cn } from '@/lib/utils';

const SELF = 'self';
const COUNTS = [5, 10, 15];

const RESULT_LABEL: Record<ArenaResult, { text: string; className: string }> = {
  PLAYING: { text: 'Your turn', className: 'bg-accent2-100 text-brand dark:bg-accent2-500/20 dark:text-accent2-400' },
  OPEN: { text: 'Waiting for a rival', className: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-muted-foreground' },
  WAITING: { text: 'Rival still playing', className: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-muted-foreground' },
  WON: { text: 'Won', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
  LOST: { text: 'Lost', className: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300' },
  DRAW: { text: 'Draw', className: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
};

function BattleRow({ battle }: { battle: ArenaBattleListItem }) {
  const base = useLearnerBase();
  const label = RESULT_LABEL[battle.result];
  const scored = battle.myScorePercent !== null && battle.opponentScorePercent !== null;
  return (
    <Link
      href={`${base}/arena/${battle.code}`}
      className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-white/5"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-foreground">
          {battle.subject.name}, {battle.totalQuestions} questions
        </p>
        <p className="truncate text-xs text-gray-500 dark:text-muted-foreground">
          You vs {battle.opponentName ?? 'a friend (not joined yet)'}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', label.className)}>{label.text}</span>
        {scored && (
          <span
            className="font-display text-sm font-bold tabular-nums text-gray-950 dark:text-foreground"
            aria-label={`You ${battle.myScorePercent}%, rival ${battle.opponentScorePercent}%`}
          >
            {battle.myScorePercent}
            <span className="mx-1 font-medium text-gray-300 dark:text-white/30">–</span>
            {battle.opponentScorePercent}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function ArenaHubPage() {
  const base = useLearnerBase();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [subjectId, setSubjectId] = useState<string>('');
  const [count, setCount] = useState<number>(10);
  const [learner, setLearner] = useState<string>(SELF);
  const [code, setCode] = useState('');

  const catalogQuery = useQuery({
    queryKey: quizKeys.catalog,
    queryFn: getQuizCatalog,
    staleTime: 5 * 60_000,
  });
  const studentsQuery = useQuery({
    queryKey: familyKeys.students,
    queryFn: listFamilyStudents,
    enabled: false,
  });
  const battlesQuery = useQuery({
    queryKey: arenaKeys.mine,
    queryFn: listMyBattles,
  });

  const catalog = catalogQuery.data;
  const children = studentsQuery.data ?? [];
  const playable = (catalog?.subjects ?? []).filter((subject) =>
    (catalog?.availability ?? []).some(
      (row) => row.subjectId === subject.id && row.questionCount > 0,
    ),
  );
  const chosenSubject = subjectId || playable[0]?.id || '';

  const create = useMutation({
    mutationFn: createBattle,
    onSuccess: (view) => {
      // The response already holds the questions, so the game opens instantly.
      queryClient.setQueryData(quizKeys.attempt(view.attempt.id), {
        attempt: view.attempt,
        questions: view.questions,
      });
      void queryClient.invalidateQueries({ queryKey: arenaKeys.mine });
      router.push(`${base}/arena/${view.code}`);
    },
    onError: (error) => {
      toast({
        title: 'Could not start the battle',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = cleanBattleCode(code);
    if (clean.length === 6) router.push(`${base}/arena/${clean}`);
  }

  const battles = battlesQuery.data?.battles ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Arena"
        description="Challenge a friend. You both answer the same questions, then your scores are compared."
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <section
          aria-labelledby="start-battle-heading"
          className="relative overflow-hidden rounded-[28px] bg-brand p-5 text-white shadow-[0_18px_40px_-24px_rgba(4,66,114,0.9)] dark:bg-[hsl(208,70%,16%)] sm:p-6"
        >
          <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-accent2-400/25 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent2-400 text-brand-700">
              <Swords className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 id="start-battle-heading" className="font-display text-xl font-bold">Start a battle</h2>
              <p className="text-sm text-white/70">You play first, then send your friend the code.</p>
            </div>
          </div>

          {catalogQuery.isLoading ? (
            <Skeleton className="relative mt-5 h-40 rounded-2xl bg-white/10" />
          ) : playable.length === 0 ? (
            <p className="relative mt-5 text-sm text-white/75">Battles open as soon as quiz questions are available.</p>
          ) : (
            <div className="relative mt-5 space-y-5">
              <div>
                <p id="arena-subject-label" className="mb-2 text-sm font-medium text-white/80">Subject</p>
                {/* Swipe sideways through subjects on phones. */}
                <div
                  role="radiogroup"
                  aria-labelledby="arena-subject-label"
                  className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0 [&::-webkit-scrollbar]:hidden"
                >
                  {playable.map((subject) => (
                    <button
                      key={subject.id}
                      type="button"
                      role="radio"
                      aria-checked={chosenSubject === subject.id}
                      onClick={() => setSubjectId(subject.id)}
                      className={cn(
                        'min-h-10 shrink-0 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent2-300',
                        chosenSubject === subject.id
                          ? 'bg-white text-brand'
                          : 'bg-white/10 text-white/85 hover:bg-white/15',
                      )}
                    >
                      {subject.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p id="arena-count-label" className="mb-2 text-sm font-medium text-white/80">Questions</p>
                <div role="radiogroup" aria-labelledby="arena-count-label" className="grid grid-cols-3 gap-1 rounded-2xl bg-white/10 p-1">
                  {COUNTS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      role="radio"
                      aria-checked={count === option}
                      onClick={() => setCount(option)}
                      className={cn(
                        'min-h-11 rounded-xl font-display text-base font-bold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent2-300',
                        count === option ? 'bg-white text-brand' : 'text-white/80 hover:bg-white/10',
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {children.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="arena-learner" className="text-white/80">Who is playing</Label>
                  <Select value={learner} onValueChange={setLearner}>
                    <SelectTrigger id="arena-learner" className="h-11 rounded-xl border-white/20 bg-white/10 text-white">
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
                className="h-12 w-full rounded-2xl bg-accent2-400 text-[15px] font-semibold text-brand-700 hover:bg-accent2-300"
                disabled={create.isPending || !chosenSubject}
                onClick={() =>
                  create.mutate({
                    subjectId: chosenSubject,
                    count,
                    studentId: learner === SELF ? undefined : learner,
                  })
                }
              >
                {create.isPending ? 'Starting…' : 'Start battle'}
              </Button>
            </div>
          )}
        </section>

        <section
          aria-labelledby="join-battle-heading"
          className="rounded-3xl border border-gray-200/80 bg-white p-5 dark:border-border dark:bg-card"
        >
          <h2 id="join-battle-heading" className="font-display text-lg font-bold text-gray-950 dark:text-foreground">
            Join with a code
          </h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-muted-foreground">
            Got a code from a friend? Enter it to play the same questions.
          </p>
          <form onSubmit={handleJoin} className="mt-4 flex gap-2">
            <Label htmlFor="arena-code" className="sr-only">Battle code</Label>
            <Input
              id="arena-code"
              value={code}
              onChange={(event) => setCode(cleanBattleCode(event.target.value))}
              placeholder="K7M2QX"
              autoComplete="off"
              autoCapitalize="characters"
              inputMode="text"
              className="h-12 min-w-0 flex-1 rounded-2xl text-center font-display text-lg font-bold uppercase tracking-[0.3em] placeholder:font-medium placeholder:text-gray-300 dark:placeholder:text-white/25"
            />
            <Button
              type="submit"
              className="h-12 shrink-0 rounded-2xl px-5"
              disabled={code.length !== 6}
            >
              Join <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </form>
        </section>
      </div>

      <section className="mt-9" aria-labelledby="your-battles-heading">
        <h2 id="your-battles-heading" className="mb-3 font-display text-xl font-bold text-gray-950 dark:text-foreground">
          Your battles
        </h2>
        {battlesQuery.isLoading ? (
          <Skeleton className="h-16 rounded-3xl" />
        ) : battlesQuery.isError ? (
          <p className="text-sm text-gray-500 dark:text-muted-foreground">
            Your battles could not be loaded. Check your connection and refresh the page.
          </p>
        ) : battles.length === 0 ? (
          // How a battle works, shown until the learner has played one.
          <ol className="divide-y divide-gray-100 rounded-3xl border border-gray-200/80 bg-white text-sm dark:divide-border dark:border-border dark:bg-card sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[
              ['1', 'Start a battle', 'Pick a subject and how many questions. You play first.'],
              ['2', 'Send the code', 'Share the 6-letter code with a friend, on WhatsApp or anywhere.'],
              ['3', 'Compare scores', 'Your friend answers the same questions. Highest score wins, and both earn XP.'],
            ].map(([step, title, text]) => (
              <li key={step} className="flex gap-3 p-4">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-accent2-100 font-display text-xs font-bold text-brand dark:bg-accent2-500/20 dark:text-accent2-400">
                  {step}
                </span>
                <span>
                  <span className="block font-semibold text-gray-900 dark:text-foreground">{title}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-gray-500 dark:text-muted-foreground">{text}</span>
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <div className="divide-y divide-gray-100 overflow-hidden rounded-3xl border border-gray-200/80 bg-white dark:divide-border dark:border-border dark:bg-card">
            {battles.map((battle) => (
              <BattleRow key={battle.code} battle={battle} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-9 space-y-4" aria-label="The Daily">
        <DailyCard />
        <DailyLeaderboard />
      </section>
    </div>
  );
}
