'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BookOpenCheck, ChevronRight, Layers, Target } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import MixedQuizDialog from '@/components/quiz/MixedQuizDialog';
import StartQuizDialog from '@/components/quiz/StartQuizDialog';
import { useStartQuiz } from '@/components/quiz/useStartQuiz';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getQuizCatalog,
  getQuizPracticeOverview,
  quizKeys,
  type QuizCatalogSubject,
  type QuizHistoryItem,
} from '@/lib/api/quiz';
import { scoreTone, toneClasses } from '@/lib/quiz';
import { cn } from '@/lib/utils';


function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
}

function AttemptRow({ attempt, practicePath }: { attempt: QuizHistoryItem; practicePath: string }) {
  const inProgress = attempt.status === 'IN_PROGRESS';
  const tone = attempt.scorePercent !== null ? toneClasses[scoreTone(attempt.scorePercent)] : null;

  return (
    <Link
      href={`${practicePath}/attempt/${attempt.id}`}
      className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-white/5"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-foreground">{attempt.subject.name}</p>
        <p className="text-xs text-gray-500 dark:text-muted-foreground">
          {attempt.mode === 'MOCK' ? 'Exam mode' : 'Practice'}, {attempt.totalQuestions} questions, {formatDate(attempt.startedAt)}
        </p>
      </div>
      {inProgress ? (
        <span className="shrink-0 rounded-full bg-accent2-100 px-3 py-1 text-xs font-semibold text-brand dark:bg-accent2-500/20 dark:text-accent2-400">
          Resume
        </span>
      ) : (
        <span className={cn('min-w-[3.25rem] shrink-0 rounded-full px-2.5 py-1 text-center font-display text-sm font-bold tabular-nums', tone?.soft)}>
          {attempt.scorePercent ?? 0}%
        </span>
      )}
    </Link>
  );
}

/** Two letters that stand for a subject, e.g. "En" for Use of English. */
function monogram(name: string) {
  const words = name.replace(/^Use of\s+/i, '').split(/\s+/).filter(Boolean);
  if (words.length > 1 && !/^(and|&|in)$/i.test(words[1])) return (words[0][0] + words[1][0]).toUpperCase();
  return words[0].slice(0, 2).replace(/^./, (c) => c.toUpperCase());
}

export default function QuizHubPage() {
  const [examId, setExamId] = useState<string | null>(null);
  // "plan": the exams and subjects in the learner's study plan; "all": the whole bank.
  const [scope, setScope] = useState<'plan' | 'all'>('plan');
  const [chosenSubject, setChosenSubject] = useState<QuizCatalogSubject | null>(null);
  const [mixing, setMixing] = useState(false);
  const practicePath = '/student/practice';
  const progressPath = '/student/progress';
  const start = useStartQuiz();
  // The signed-in learner practises as themselves.
  const studentId = null;

  const overviewQuery = useQuery({
    queryKey: quizKeys.overview(studentId),
    queryFn: () => getQuizPracticeOverview(studentId),
    staleTime: 30_000,
  });

  const fullCatalogQuery = useQuery({
    queryKey: quizKeys.catalog,
    queryFn: getQuizCatalog,
    enabled: scope === 'all',
    staleTime: 5 * 60_000,
  });

  const catalog = scope === 'all' ? fullCatalogQuery.data ?? overviewQuery.data?.catalog : overviewQuery.data?.catalog;
  const activeExam = catalog?.exams.find((exam) => exam.id === examId) ?? catalog?.exams[0];

  const availabilityFor = (subjectId: string) =>
    (catalog?.availability ?? []).filter(
      (row) => row.subjectId === subjectId && (!activeExam || row.examId === activeExam.id),
    );
  const availableFor = (subjectId: string) =>
    availabilityFor(subjectId).reduce((sum, row) => sum + row.questionCount, 0);
  // Published questions per topic, so the dialogs can grey out empty topics.
  const byTopicFor = (subjectId: string) =>
    availabilityFor(subjectId).reduce<Record<string, number>>((counts, row) => {
      counts[row.topicId] = (counts[row.topicId] ?? 0) + row.questionCount;
      return counts;
    }, {});

  const subjects = useMemo(
    () =>
      (catalog?.subjects ?? [])
        .map((subject) => ({
          subject,
          available: availableFor(subject.id),
          byTopic: byTopicFor(subject.id),
        }))
        // The whole bank: only list subjects that have questions for this exam.
        .filter((row) => scope === 'plan' || row.available > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [catalog, activeExam?.id, scope],
  );

  const weakTopics = (overviewQuery.data?.weak.topics ?? []).filter((topic) => topic.isWeak).slice(0, 5);
  const history = overviewQuery.data?.history.attempts ?? [];
  const hasAttempts = history.length > 0;

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Practice"
        description="Pick a subject, see your weak topics, then test yourself again to see the change."
      />

      {/* Practice is for choosing what to practise. Rewards, missions, badges and the
          leaderboard live on the Today page. */}

      {(overviewQuery.data?.learningPlan?.unavailableExams.length ?? 0) > 0 && (
        <aside className="mb-6 rounded-2xl bg-amber-50 p-4 dark:bg-amber-500/10" aria-label="Examination content availability">
          <p className="text-sm font-semibold text-gray-950 dark:text-foreground">
            Content is still being prepared for{' '}
            {overviewQuery.data?.learningPlan?.unavailableExams.join(', ')}.
          </p>
          <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-muted-foreground">
            Your goal is saved. Available examination content is shown below while the question bank is reviewed and published.
          </p>
        </aside>
      )}

      {overviewQuery.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-11 w-full rounded-full" />
          <Skeleton className="h-24 w-full rounded-3xl" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : overviewQuery.isError ? (
        <p className="text-sm text-red-600">
          {overviewQuery.error instanceof Error ? overviewQuery.error.message : 'Could not load practice.'}
        </p>
      ) : !catalog || catalog.exams.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-border dark:bg-card">
          <BookOpenCheck className="mx-auto mb-2 h-8 w-8 text-gray-400 dark:text-muted-foreground" />
          <p className="text-sm font-medium text-gray-700 dark:text-foreground/90">Quizzes are coming soon</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-muted-foreground">
            We are adding exam questions now. Check back shortly.
          </p>
        </div>
      ) : (
        <section id="choose-subject" className="scroll-mt-24" aria-labelledby="choose-subject-heading">
          <div
            className="mb-3 grid grid-cols-2 rounded-full border border-gray-200/80 bg-white p-1 text-sm dark:border-border dark:bg-card sm:inline-grid sm:w-72"
            role="tablist"
            aria-label="Which subjects to show"
          >
            {([['plan', 'My plan'], ['all', 'All subjects']] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={scope === value}
                onClick={() => {
                  setScope(value);
                  setExamId(null);
                }}
                className={cn(
                  'min-h-10 rounded-full px-4 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  scope === value
                    ? 'bg-brand text-white dark:bg-accent2-500 dark:text-brand'
                    : 'text-gray-600 hover:text-brand dark:text-muted-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {catalog.exams.length > 1 && (
            // Swipe sideways through exams on phones.
            <div
              className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:px-0 [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label="Exam"
            >
              {catalog.exams.map((exam) => (
                <button
                  key={exam.id}
                  type="button"
                  role="tab"
                  aria-selected={activeExam?.id === exam.id}
                  onClick={() => setExamId(exam.id)}
                  className={cn(
                    'min-h-10 shrink-0 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    activeExam?.id === exam.id
                      ? 'bg-gray-950 text-white dark:bg-white dark:text-gray-950'
                      : 'border border-gray-200 bg-white text-gray-700 hover:border-brand/40 dark:border-border dark:bg-card dark:text-foreground',
                  )}
                >
                  {exam.name}
                </button>
              ))}
            </div>
          )}

          {subjects.filter((row) => row.available > 0).length >= 2 && (
            <button
              type="button"
              onClick={() => setMixing(true)}
              className="group relative mb-6 flex w-full items-center gap-4 overflow-hidden rounded-3xl bg-brand p-5 text-left text-white shadow-[0_18px_40px_-26px_rgba(4,66,114,0.9)] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent2-400 focus-visible:ring-offset-2 active:scale-[0.99] dark:bg-[hsl(208,70%,16%)]"
            >
              <span aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-accent2-400/25 blur-3xl" />
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent2-400 text-brand-700">
                <Layers className="h-5 w-5" />
              </span>
              <span className="relative min-w-0 flex-1">
                <span className="block font-display text-lg font-bold leading-snug">Full {activeExam?.name ?? 'exam'} paper</span>
                <span className="block text-sm leading-5 text-white/75">
                  Mix your subjects and topics into one paper, like the real exam.
                </span>
              </span>
              <ChevronRight className="relative h-5 w-5 shrink-0 text-white/70 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}

          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 id="choose-subject-heading" className="font-display text-xl font-bold text-gray-950 dark:text-foreground">
              {hasAttempts ? 'Practise a subject' : 'Choose your first subject'}
            </h2>
            {activeExam && (
              <p className="truncate text-xs text-gray-500 dark:text-muted-foreground">{activeExam.name} questions</p>
            )}
          </div>

          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map(({ subject, available }) => {
              const ready = available > 0;
              return (
                <li key={subject.id}>
                  <button
                    type="button"
                    disabled={!ready}
                    onClick={() => setChosenSubject(subject)}
                    className={cn(
                      'group flex w-full items-center gap-3 rounded-2xl border p-3 pr-4 text-left transition-[transform,border-color,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      ready
                        ? 'border-gray-200/80 bg-white hover:border-brand/30 active:scale-[0.98] dark:border-border dark:bg-card dark:hover:border-accent2-500/40'
                        : 'cursor-not-allowed border-dashed border-gray-200 bg-transparent opacity-60 dark:border-border',
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-display text-base font-extrabold',
                        ready
                          ? 'bg-accent2-100 text-brand dark:bg-accent2-500/15 dark:text-accent2-400'
                          : 'bg-gray-100 text-gray-400 dark:bg-white/5',
                      )}
                    >
                      {monogram(subject.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-gray-900 dark:text-foreground">{subject.name}</span>
                      <span className="block text-xs text-gray-500 dark:text-muted-foreground">
                        {ready ? (
                          <>
                            <span className="font-semibold tabular-nums text-gray-700 dark:text-foreground/80">{available}</span> questions,{' '}
                            <span className="tabular-nums">{subject.topics.length}</span> topics
                          </>
                        ) : (
                          'Questions on the way'
                        )}
                      </span>
                    </span>
                    {ready && (
                      <ChevronRight className="h-5 w-5 shrink-0 text-gray-300 transition-colors group-hover:text-brand dark:text-white/30" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {weakTopics.length > 0 && (
        <section className="mt-10" aria-labelledby="learning-map-heading">
          <h2 id="learning-map-heading" className="font-display text-xl font-bold text-gray-950 dark:text-foreground">
            Topics to strengthen
          </h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-muted-foreground">Your lowest scores so far</p>
          <ul className="mt-3 divide-y divide-gray-100 rounded-3xl border border-gray-200/80 bg-white dark:divide-border dark:border-border dark:bg-card">
            {weakTopics.map((topic) => (
              <li key={topic.topicId} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={cn(
                    'w-12 shrink-0 font-display text-xl font-extrabold tabular-nums',
                    toneClasses[scoreTone(topic.accuracyPercent)].text,
                  )}
                >
                  {topic.accuracyPercent}
                  <span className="text-xs font-bold">%</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-foreground">{topic.name}</p>
                  <p className="truncate text-xs text-gray-500 dark:text-muted-foreground">
                    {topic.subject.name}, <span className="tabular-nums">{topic.correct}/{topic.attempted}</span> right
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 shrink-0 rounded-full px-4"
                  disabled={start.isPending}
                  onClick={() =>
                    start.mutate({
                      subjectId: topic.subject.id,
                      topicIds: [topic.topicId],
                      count: 10,
                      mode: 'PRACTICE',
                      studentId: studentId ?? undefined,
                    })
                  }
                >
                  <Target className="mr-1.5 h-3.5 w-3.5" /> Practise
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasAttempts && (
        <section className="mt-10" aria-labelledby="recent-practice-heading">
          <div className="mb-3 flex items-end justify-between gap-4">
            <h2 id="recent-practice-heading" className="font-display text-xl font-bold text-gray-950 dark:text-foreground">
              Recent practice
            </h2>
            <Link href={progressPath} className="-my-2 inline-flex min-h-10 items-center text-sm font-medium text-brand hover:underline dark:text-accent2-400">
              See progress
            </Link>
          </div>
          <div className="divide-y divide-gray-100 overflow-hidden rounded-3xl border border-gray-200/80 bg-white dark:divide-border dark:border-border dark:bg-card">
            {history.map((attempt) => <AttemptRow key={attempt.id} attempt={attempt} practicePath={practicePath} />)}
          </div>
        </section>
      )}


      {mixing && (
        <MixedQuizDialog
          key={activeExam?.id ?? 'any'}
          subjects={subjects}
          exam={activeExam}
          studentId={studentId}
          onClose={() => setMixing(false)}
        />
      )}

      {chosenSubject && (
        <StartQuizDialog
          key={chosenSubject.id}
          subject={chosenSubject}
          exam={activeExam}
          available={availableFor(chosenSubject.id)}
          byTopic={byTopicFor(chosenSubject.id)}
          studentId={studentId}
          onClose={() => setChosenSubject(null)}
        />
      )}
    </div>
  );
}
