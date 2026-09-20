'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BookOpenCheck, ChevronRight, Target } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import NextActions from '@/components/quiz/NextActions';
import StartQuizDialog from '@/components/quiz/StartQuizDialog';
import TutoringCta from '@/components/quiz/TutoringCta';
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
  getQuizCatalog,
  getQuizWeakTopics,
  listQuizAttempts,
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

function AttemptRow({ attempt }: { attempt: QuizHistoryItem }) {
  const inProgress = attempt.status === 'IN_PROGRESS';
  const tone = attempt.scorePercent !== null ? toneClasses[scoreTone(attempt.scorePercent)] : null;

  return (
    <Link
      href={`/family/quiz/attempt/${attempt.id}`}
      className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-card px-4 py-3 hover:border-brand transition-colors"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-foreground truncate">
          {attempt.subject.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-muted-foreground">
          {attempt.mode === 'MOCK' ? 'Timed mock' : 'Practice'} · {attempt.totalQuestions} questions ·{' '}
          {formatDate(attempt.startedAt)}
        </p>
      </div>
      {inProgress ? (
        <span className="shrink-0 rounded-full bg-accent2-100 text-brand dark:bg-accent2-500/20 dark:text-accent2-400 px-3 py-1 text-xs font-medium">
          Resume
        </span>
      ) : (
        <span className={cn('shrink-0 rounded-full px-3 py-1 text-xs font-semibold tabular-nums', tone?.soft)}>
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
  const start = useStartQuiz();

  const studentId = learner === SELF ? null : learner;

  const catalogQuery = useQuery({
    queryKey: quizKeys.catalog,
    queryFn: getQuizCatalog,
    staleTime: 5 * 60_000,
  });
  const studentsQuery = useQuery({
    queryKey: familyKeys.students,
    queryFn: listFamilyStudents,
  });
  const historyQuery = useQuery({
    queryKey: quizKeys.history,
    queryFn: () => listQuizAttempts(6),
  });
  const weakQuery = useQuery({
    queryKey: quizKeys.weakTopics(studentId),
    queryFn: () => getQuizWeakTopics(studentId),
  });

  const catalog = catalogQuery.data;
  const children = studentsQuery.data ?? [];
  const activeExam =
    catalog?.exams.find((exam) => exam.id === examId) ?? catalog?.exams[0];

  const availableFor = (subjectId: string) =>
    (catalog?.availability ?? [])
      .filter(
        (row) => row.subjectId === subjectId && (!activeExam || row.examId === activeExam.id),
      )
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

  const weakTopics = (weakQuery.data?.topics ?? []).filter((topic) => topic.isWeak).slice(0, 5);
  const tutoring = weakQuery.data?.tutoring[0];

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Practice Quizzes"
        description="Practise exam questions, see where you are weak, and get a tutor for those topics."
        action={
          children.length > 0 ? (
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

      <NextActions studentId={studentId} />

      {catalogQuery.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : catalogQuery.isError ? (
        <p className="text-sm text-red-600">
          {catalogQuery.error instanceof Error
            ? catalogQuery.error.message
            : 'Could not load quizzes.'}
        </p>
      ) : !catalog || catalog.exams.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-border bg-white dark:bg-card p-10 text-center">
          <BookOpenCheck className="w-8 h-8 mx-auto text-gray-400 dark:text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-gray-700 dark:text-foreground/90">
            Quizzes are coming soon
          </p>
          <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
            We are adding exam questions now. Check back shortly.
          </p>
        </div>
      ) : (
        <>
          {catalog.exams.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-5" role="tablist" aria-label="Exam">
              {catalog.exams.map((exam) => (
                <button
                  key={exam.id}
                  type="button"
                  role="tab"
                  aria-selected={activeExam?.id === exam.id}
                  onClick={() => setExamId(exam.id)}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                    activeExam?.id === exam.id
                      ? 'bg-brand text-white dark:bg-accent2-500 dark:text-brand'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-brand/50 dark:bg-card dark:border-border dark:text-foreground',
                  )}
                >
                  {exam.name}
                </button>
              ))}
            </div>
          )}

          {activeExam && (
            <p className="mb-4 text-sm text-gray-600 dark:text-muted-foreground">
              <span className="font-semibold text-gray-900 dark:text-foreground">{activeExam.name}</span>
              {activeExam.description ? ` · ${activeExam.description}` : ''}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map(({ subject, available }) => {
              const ready = available > 0;
              return (
                <button
                  key={subject.id}
                  type="button"
                  disabled={!ready}
                  onClick={() => setChosenSubject(subject)}
                  className={cn(
                    'group text-left rounded-2xl border p-5 transition-all',
                    ready
                      ? 'bg-white dark:bg-card border-gray-200 dark:border-border hover:border-brand hover:-translate-y-0.5'
                      : 'bg-gray-50 dark:bg-card/50 border-gray-200 dark:border-border opacity-60 cursor-not-allowed',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-accent2-100 text-brand dark:bg-accent2-500/20 dark:text-accent2-400 flex items-center justify-center">
                      <BookOpenCheck className="w-5 h-5" />
                    </div>
                    {ready && (
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-brand transition-colors" />
                    )}
                  </div>
                  <p className="mt-3 text-base font-semibold text-gray-900 dark:text-foreground">
                    {subject.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mt-0.5">
                    {ready
                      ? `${available} questions · ${subject.topics.length} topics`
                      : 'Coming soon'}
                  </p>
                </button>
              );
            })}
          </div>
        </>
      )}

      {weakTopics.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-3">
            Topics to work on
          </h2>
          <div className="rounded-2xl border border-gray-200 dark:border-border bg-white dark:bg-card divide-y divide-gray-100 dark:divide-border">
            {weakTopics.map((topic) => (
              <div key={topic.topicId} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-foreground truncate">
                    {topic.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground">
                    {topic.subject.name} · {topic.correct}/{topic.attempted} correct
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={cn('text-sm font-semibold tabular-nums', toneClasses.weak.text)}>
                    {topic.accuracyPercent}%
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 rounded-lg"
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
                    <Target className="w-3.5 h-3.5 mr-1.5" /> Practise
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {tutoring && (
            <div className="mt-4">
              <TutoringCta prefill={tutoring.prefill} weakTopics={tutoring.weakTopics} />
            </div>
          )}
        </section>
      )}

      {(historyQuery.data?.attempts.length ?? 0) > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-3">
            Recent quizzes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {historyQuery.data?.attempts.map((attempt) => (
              <AttemptRow key={attempt.id} attempt={attempt} />
            ))}
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
