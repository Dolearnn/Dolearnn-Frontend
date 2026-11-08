'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { QuizCatalog } from '@/lib/api/quiz';
import { cn } from '@/lib/utils';
import { useStartQuiz } from './useStartQuiz';

const FIRST_QUIZ_QUESTIONS = 10;

const STEPS = [
  { label: 'Your plan', done: true },
  { label: 'A short quiz', done: false },
  { label: 'See your weak topics', done: false },
];

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-accent2-400 bg-accent2-400 text-brand-700'
          : 'border-white/30 text-white hover:border-white/60',
      )}
    >
      {children}
    </button>
  );
}

/**
 * What a new learner sees until their first quiz is done: one clear step,
 * already set to the exam and subject from their plan.
 */
export default function FirstQuizCard({
  catalog,
  warmUpTopics,
}: {
  catalog: QuizCatalog;
  // Weak topics from a guest warm-up taken before signing up.
  warmUpTopics: string[];
}) {
  const start = useStartQuiz();

  const countFor = (examId: string, subjectId: string) =>
    catalog.availability
      .filter((row) => row.examId === examId && row.subjectId === subjectId)
      .reduce((sum, row) => sum + row.questionCount, 0);

  const exams = useMemo(
    () => catalog.exams.filter((exam) => catalog.subjects.some((subject) => countFor(exam.id, subject.id) > 0)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [catalog],
  );

  const [examId, setExamId] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const exam = exams.find((item) => item.id === examId) ?? exams[0];
  const subjects = exam ? catalog.subjects.filter((item) => countFor(exam.id, item.id) > 0) : [];
  const subject = subjects.find((item) => item.id === subjectId) ?? subjects[0];

  return (
    <section className="rounded-3xl bg-brand p-6 text-white sm:p-8" aria-labelledby="first-quiz-heading">
      <ol className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm" aria-label="Getting started">
        {STEPS.map((step, index) => (
          <li key={step.label} className={cn('flex items-center gap-2', index === 1 ? 'font-semibold' : 'text-white/60')}>
            <span
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                step.done && 'bg-accent2-400 text-brand-700',
                index === 1 && 'bg-white text-brand',
                !step.done && index !== 1 && 'border border-white/30',
              )}
            >
              {step.done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : index + 1}
            </span>
            {step.label}
          </li>
        ))}
      </ol>

      <h2 id="first-quiz-heading" className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
        Let&apos;s find the topics costing you marks
      </h2>
      <p className="mt-2 max-w-2xl leading-7 text-white/80">
        {warmUpTopics.length > 0
          ? `Your warm-up pointed to ${warmUpTopics.join(', ')}. This short quiz will confirm where to start.`
          : 'Answer 10 questions. There is no timer, and a low score is fine: it shows us where to help.'}
      </p>

      {exam && subject ? (
        <>
          {exams.length > 1 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-white/70">Exam</p>
              <div className="flex flex-wrap gap-2">
                {exams.map((item) => (
                  <Choice
                    key={item.id}
                    active={item.id === exam.id}
                    onClick={() => {
                      setExamId(item.id);
                      setSubjectId(null);
                    }}
                  >
                    {item.name}
                  </Choice>
                ))}
              </div>
            </div>
          )}

          {subjects.length > 1 && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium text-white/70">Subject</p>
              <div className="flex flex-wrap gap-2">
                {subjects.map((item) => (
                  <Choice key={item.id} active={item.id === subject.id} onClick={() => setSubjectId(item.id)}>
                    {item.name}
                  </Choice>
                ))}
              </div>
            </div>
          )}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              variant="secondary"
              className="h-12 px-6 text-base"
              disabled={start.isPending}
              onClick={() =>
                start.mutate({
                  subjectId: subject.id,
                  examId: exam.id,
                  count: FIRST_QUIZ_QUESTIONS,
                  mode: 'PRACTICE',
                })
              }
            >
              {start.isPending ? 'Starting…' : `Start ${subject.name} quiz`}
              {!start.isPending && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
            <span className="inline-flex items-center gap-1.5 text-sm text-white/70">
              <Clock className="h-4 w-4" /> About 5 minutes
            </span>
          </div>
        </>
      ) : (
        <Button asChild variant="secondary" className="mt-7 h-12 px-6 text-base">
          <Link href="/student/practice">
            Choose a subject <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      )}
    </section>
  );
}
