'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import { BookOpenCheck, ChevronRight, Target } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import NextActions from '@/components/quiz/NextActions';
import PracticeLoop, { type PracticeLoopStep } from '@/components/quiz/PracticeLoop';
import StartQuizDialog from '@/components/quiz/StartQuizDialog';
import { useStartQuiz } from '@/components/quiz/useStartQuiz';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { familyKeys, listFamilyStudents } from '@/lib/api/family';
import {
  getQuizPracticeOverview,
  quizKeys,
  type QuizCatalogSubject,
  type QuizHistoryItem,
} from '@/lib/api/quiz';
import { scoreTone, toneClasses } from '@/lib/quiz';
import { cn } from '@/lib/utils';

const SELF = 'self';

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
          {attempt.mode === 'MOCK' ? 'Timed mock' : 'Practice'} · {attempt.totalQuestions} questions ·{' '}
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
  const [learner, setLearner] = useState<string>(SELF);
  const [chosenSubject, setChosenSubject] = useState<QuizCatalogSubject | null>(null);
  const pathname = usePathname();
  const studentWorkspace = pathname.startsWith('/student');
  const practicePath = studentWorkspace ? '/student/practice' : '/family/quiz';
  const progressPath = studentWorkspace ? '/student/progress' : '/family/progress';
  const start = useStartQuiz();
  const studentId = learner === SELF ? null : learner;

  const overviewQuery = useQuery({
    queryKey: quizKeys.overview(studentId),
    queryFn: () => getQuizPracticeOverview(studentId),
    staleTime: 30_000,
  });
  const studentsQuery = useQuery({
    queryKey: familyKeys.students,
    queryFn: listFamilyStudents,
    enabled: !studentWorkspace,
  });

  const catalog = overviewQuery.data?.catalog;
  const children = studentsQuery.data ?? [];
  const activeExam = catalog?.exams.find((exam) => exam.id === examId) ?? catalog?.exams[0];

  const availableFor = (subjectId: string) =>
    (catalog?.availability ?? [])
      .filter((row) => row.subjectId === subjectId && (!activeExam || row.examId === activeExam.id))
      .reduce((sum, row) => sum + row.questionCount, 0);

  const subjects = useMemo(
    () =>
      (catalog?.subjects ?? []).map((subject) => ({
        subject,
        available: availableFor(subject.id),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [catalog, activeExam?.id],
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
        action={
          !studentWorkspace && children.length > 0 ? (
            <div className="w-full sm:w-56">
              <Select value={learner} onValueChange={setLearner}>
                <SelectTrigger aria-label="Who is practising" className="bg-white dark:bg-card">
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
          ) : undefined
        }
      />

      <PracticeLoop active={loopStep} />
      <NextActions
        studentId={studentId}
        actions={overviewQuery.data?.actions ?? []}
        isLoading={overviewQuery.isLoading}
      />

      {studentWorkspace && (overviewQuery.data?.learningPlan?.unavailableExams.length ?? 0) > 0 && (
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
            <p className="max-w-sm text-sm leading-6 text-gray-500 dark:text-muted-foreground">
              Use all topics for a broad diagnosis, or select topics for a focused mission.
            </p>
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
