'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { ChevronRight, Swords } from 'lucide-react';
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
  const label = RESULT_LABEL[battle.result];
  return (
    <Link
      href={`/family/arena/${battle.code}`}
      className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-card px-4 py-3 hover:border-brand transition-colors"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-foreground truncate">
          {battle.subject.name} · {battle.totalQuestions} questions
        </p>
        <p className="text-xs text-gray-500 dark:text-muted-foreground truncate">
          {battle.myName} vs {battle.opponentName ?? 'waiting for a rival'}
          {battle.myScorePercent !== null && battle.opponentScorePercent !== null
            ? ` · ${battle.myScorePercent}% to ${battle.opponentScorePercent}%`
            : ''}
        </p>
      </div>
      <span className={cn('shrink-0 rounded-full px-3 py-1 text-xs font-semibold', label.className)}>
        {label.text}
      </span>
    </Link>
  );
}

export default function ArenaHubPage() {
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
      router.push(`/family/arena/${view.code}`);
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
    if (clean.length === 6) router.push(`/family/arena/${clean}`);
  }

  const battles = battlesQuery.data?.battles ?? [];

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Arena"
        description="Challenge a friend. You both answer the same questions, then the scores are compared."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 dark:border-border bg-white dark:bg-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand text-white dark:bg-accent2-500 dark:text-brand flex items-center justify-center">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-foreground">
                Start a battle
              </h2>
              <p className="text-xs text-gray-500 dark:text-muted-foreground">
                You play first, then send your friend the code.
              </p>
            </div>
          </div>

          {catalogQuery.isLoading ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : playable.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-muted-foreground">
              Battles open as soon as quiz questions are available.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="arena-subject">Subject</Label>
                <Select value={chosenSubject} onValueChange={setSubjectId}>
                  <SelectTrigger id="arena-subject" className="bg-white dark:bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {playable.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Questions</Label>
                <div className="flex gap-2" role="radiogroup" aria-label="Number of questions">
                  {COUNTS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      role="radio"
                      aria-checked={count === option}
                      onClick={() => setCount(option)}
                      className={cn(
                        'h-10 min-w-14 rounded-xl border px-4 text-sm font-medium transition-colors',
                        count === option
                          ? 'border-brand bg-brand text-white dark:border-accent2-500 dark:bg-accent2-500 dark:text-brand'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-brand/50 dark:border-border dark:bg-card dark:text-foreground',
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {children.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="arena-learner">Who is playing</Label>
                  <Select value={learner} onValueChange={setLearner}>
                    <SelectTrigger id="arena-learner" className="bg-white dark:bg-card">
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
                disabled={create.isPending || !chosenSubject}
                onClick={() =>
                  create.mutate({
                    subjectId: chosenSubject,
                    count,
                    studentId: learner === SELF ? undefined : learner,
                  })
                }
              >
                {create.isPending ? 'Starting...' : 'Start battle'}
              </Button>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 dark:border-border bg-white dark:bg-card p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-foreground">
            Join with a code
          </h2>
          <p className="text-xs text-gray-500 dark:text-muted-foreground mt-0.5 mb-4">
            Got a code from a friend? Enter it to play the same questions.
          </p>
          <form onSubmit={handleJoin} className="space-y-3">
            <Label htmlFor="arena-code">Battle code</Label>
            <Input
              id="arena-code"
              value={code}
              onChange={(event) => setCode(cleanBattleCode(event.target.value))}
              placeholder="e.g. K7M2QX"
              autoComplete="off"
              autoCapitalize="characters"
              className="h-11 tracking-[0.3em] text-center text-lg font-semibold uppercase"
            />
            <Button
              type="submit"
              variant="outline"
              className="h-11 w-full rounded-xl"
              disabled={code.length !== 6}
            >
              Find battle <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </form>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-3">
          Your battles
        </h2>
        {battlesQuery.isLoading ? (
          <Skeleton className="h-16 rounded-xl" />
        ) : battlesQuery.isError ? (
          <p className="text-sm text-gray-500 dark:text-muted-foreground">
            Your battles could not be loaded right now.
          </p>
        ) : battles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 dark:border-border bg-white dark:bg-card p-8 text-center text-sm text-gray-500 dark:text-muted-foreground">
            No battles yet. Start one and send the code to a friend.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {battles.map((battle) => (
              <BattleRow key={battle.code} battle={battle} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
