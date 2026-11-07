'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BookOpenCheck, ChevronRight, Layers, Target } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import PracticeLoop, { type PracticeLoopStep } from '@/components/quiz/PracticeLoop';
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
      className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 transition-colors hover:bg-accent2-50 dark:border-border dark:bg-card dark:hover:bg-accent2-500/10"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-foreground">
          {attempt.subject.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-muted-foreground">
          {attempt.mode === 'MOCK' ? 'Exam mode' : 'Practice'} · {attempt.totalQuestions} questions ·{' '}
          {formatDate(attempt.startedAt)}
        </p>
      </div>
      {inProgress ? (
        <span className="shrink-0 bg-accent2-100 px-3 py-1 text-xs font-medium text-brand dark:bg-accent2-500/20 dark:text-accent2-400">
          Resume
        </span>
      ) : (
        <span className={cn('shrink-0 px-3 py-1 text-xs font-semibold tabular-nums', tone?.soft)}>
          {attempt.scorePercent ?? 0}%
        </span>
      )}
    </Link>
  );
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

  const availableFor = (subjectId: string) =>
    (catalog?.availability ?? [])
      .filter((row) => row.subjectId === subjectId && (!activeExam || row.examId === activeExam.id))
      .reduce((sum, row) => sum + row.questionCount, 0);

  const subjects = useMemo(
    () =>
      (catalog?.subjects ?? [])
        .map((subject) => ({
          subject,
          available: availableFor(subject.id),
        }))
        // The whole bank: only list subjects that have questions for this exam.
        .filter((row) => scope === 'plan' || row.available > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [catalog, activeExam?.id, scope],
  );

  const weakTopics = (overviewQuery.data?.weak.topics ?? []).filter((topic) => topic.isWeak).slice(0, 5);
  const history = overviewQuery.data?.history.attempts ?? [];
  const hasAttempts = history.length > 0;
  const loopStep: PracticeLoopStep = weakTopics.length > 0
    ? 'Practise'
    : hasAttempts
      ? 'Reassess'
      : 'Assess';

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Practice"
        description="Start with an assessment, work on the gaps it finds, then return to measure the change."
      />

      {/* Practice is for choosing what to practise. Rewards, missions, badges and the
          leaderboard live on the Today page; weak topics below carry their own missions. */}
      <PracticeLoop active={loopStep} />

      {(overviewQuery.data?.learningPlan?.unavailableExams.length ?? 0) > 0 && (
        <aside className="mb-8 border-l-4 border-amber-400 bg-amber-50 p-4 dark:bg-amber-500/10" aria-label="Examination content availability">
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
        <div className="grid grid-cols-1 gap-0 border-y border-gray-200 dark:border-border sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-none" />
          ))}
        </div>
      ) : overviewQuery.isError ? (
        <p className="text-sm text-red-600">
          {overviewQuery.error instanceof Error ? overviewQuery.error.message : 'Could not load practice.'}
        </p>
      ) : !catalog || catalog.exams.length === 0 ? (
        <div className="border border-dashed border-gray-300 bg-white p-10 text-center dark:border-border dark:bg-card">
          <BookOpenCheck className="mx-auto mb-2 h-8 w-8 text-gray-400 dark:text-muted-foreground" />
          <p className="text-sm font-medium text-gray-700 dark:text-foreground/90">Quizzes are coming soon</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-muted-foreground">
            We are adding exam questions now. Check back shortly.
          </p>
        </div>
      ) : (
        <section id="choose-subject" className="scroll-mt-24" aria-labelledby="choose-subject-heading">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-muted-foreground">
                Question bank
              </p>
              <h2 id="choose-subject-heading" className="mt-1 text-2xl font-semibold text-gray-950 dark:text-foreground">
                {hasAttempts ? 'Choose another subject' : 'Choose your first assessment'}
              </h2>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <div className="inline-flex rounded-full border border-gray-200 bg-white p-1 text-sm dark:border-border dark:bg-card" role="tablist" aria-label="Which subjects to show">
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
                      'rounded-full px-4 py-1.5 font-medium transition-colors',
                      scope === value
                        ? 'bg-brand text-white dark:bg-accent2-500 dark:text-brand'
                        : 'text-gray-600 hover:text-brand dark:text-muted-foreground',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="max-w-sm text-xs leading-5 text-gray-500 dark:text-muted-foreground sm:text-right">
                Use all topics for a broad diagnosis, select topics for a focused mission, or mix subjects for a full exam.
              </p>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            {catalog.exams.length > 1 && (
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Exam">
                {catalog.exams.map((exam) => (
                  <button
                    key={exam.id}
                    type="button"
                    role="tab"
                    aria-selected={activeExam?.id === exam.id}
                    onClick={() => setExamId(exam.id)}
                    className={cn(
                      'px-4 py-1.5 text-sm font-medium transition-colors',
                      activeExam?.id === exam.id
                        ? 'bg-brand text-white dark:bg-accent2-500 dark:text-brand'
                        : 'border border-gray-200 bg-white text-gray-700 hover:border-brand/50 dark:border-border dark:bg-card dark:text-foreground',
                    )}
                  >
                    {exam.name}
                  </button>
                ))}
              </div>
            )}
            {activeExam && (
              <p className="text-sm text-gray-600 dark:text-muted-foreground">
                <span className="font-semibold text-gray-900 dark:text-foreground">{activeExam.name}</span>
                {activeExam.description ? ` · ${activeExam.description}` : ''}
              </p>
            )}
          </div>

          {subjects.filter((row) => row.available > 0).length >= 2 && (
            <button
              type="button"
              onClick={() => setMixing(true)}
              className="group mb-4 flex w-full items-center gap-4 border border-brand/15 bg-gradient-to-r from-accent2-50 to-white p-4 text-left transition-colors hover:border-brand/40 dark:border-border dark:from-accent2-500/10 dark:to-card"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-brand text-white dark:bg-accent2-500 dark:text-brand">
                <Layers className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-gray-900 dark:text-foreground">Mix subjects</span>
                <span className="block text-sm text-gray-600 dark:text-muted-foreground">
                  Build one {activeExam?.name ?? 'exam'} from several subjects and topics, like the real paper.
                </span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-gray-400 transition-colors group-hover:text-brand" />
            </button>
          )}

          <div className="grid grid-cols-1 border-y border-gray-200 dark:border-border sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map(({ subject, available }) => {
              const ready = available > 0;
              return (
                <button
                  key={subject.id}
                  type="button"
                  disabled={!ready}
                  onClick={() => setChosenSubject(subject)}
                  className={cn(
                    'group min-h-36 border-b border-gray-200 p-5 text-left transition-colors dark:border-border sm:border-r',
                    ready
                      ? 'bg-white hover:bg-accent2-50 dark:bg-card dark:hover:bg-accent2-500/10'
                      : 'cursor-not-allowed bg-gray-50 opacity-60 dark:bg-card/50',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center bg-accent2-100 text-brand dark:bg-accent2-500/20 dark:text-accent2-400">
                      <BookOpenCheck className="h-5 w-5" />
                    </div>
                    {ready && <ChevronRight className="h-4 w-4 text-gray-400 transition-colors group-hover:text-brand" />}
                  </div>
                  <p className="mt-3 text-base font-semibold text-gray-900 dark:text-foreground">{subject.name}</p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-muted-foreground">
                    {ready ? `${available} questions · ${subject.topics.length} topics` : 'Coming soon'}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {weakTopics.length > 0 && (
        <section className="mt-10" aria-labelledby="learning-map-heading">
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-muted-foreground">
              Diagnosis
            </p>
            <h2 id="learning-map-heading" className="mt-1 text-xl font-semibold text-gray-950 dark:text-foreground">
              Topics to strengthen
            </h2>
          </div>
          <div className="border-y border-gray-200 bg-white dark:border-border dark:bg-card">
            {weakTopics.map((topic) => (
              <div key={topic.topicId} className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0 dark:border-border">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-foreground">{topic.name}</p>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground">
                    {topic.subject.name} · {topic.correct}/{topic.attempted} correct
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className={cn('text-sm font-semibold tabular-nums', toneClasses.weak.text)}>
                    {topic.accuracyPercent}%
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 px-3"
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
                    <Target className="mr-1.5 h-3.5 w-3.5" /> Start mission
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {hasAttempts && (
        <section className="mt-10" aria-labelledby="recent-practice-heading">
          <div className="mb-3 flex items-end justify-between gap-4">
            <h2 id="recent-practice-heading" className="text-xl font-semibold text-gray-950 dark:text-foreground">
              Recent practice
            </h2>
            <Link href={progressPath} className="text-sm font-medium text-brand hover:underline dark:text-accent2-400">
              See progress
            </Link>
          </div>
          <div className="border-t border-gray-200 dark:border-border md:grid md:grid-cols-2">
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
          studentId={studentId}
          onClose={() => setChosenSubject(null)}
        />
      )}
    </div>
  );
}
