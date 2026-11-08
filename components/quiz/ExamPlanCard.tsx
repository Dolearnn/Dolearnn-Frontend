'use client';

import Link from 'next/link';
import { ArrowRight, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { QuizExamPlan } from '@/lib/api/quiz';
import { useStartQuiz } from './useStartQuiz';

const REVISION_DAYS = 14;

function topics(count: number) {
  return `${count} ${count === 1 ? 'topic' : 'topics'}`;
}

function advice(plan: QuizExamPlan) {
  const left = plan.totalTopics - plan.coveredTopics;
  if (left === 0) return 'You have covered every topic. Now turn the weak ones into strong ones.';
  if (plan.daysLeft === null) return null;
  if (plan.daysLeft <= REVISION_DAYS) {
    return 'Your exam is close. Focus on your weakest topics and take full exams in exam mode.';
  }
  return `Cover ${topics(plan.topicsPerWeek ?? 0)} a week to finish two weeks before your exam.`;
}

export default function ExamPlanCard({ plan }: { plan: QuizExamPlan }) {
  const start = useStartQuiz();
  if (plan.totalTopics === 0) return null;

  const percent = Math.round((plan.coveredTopics / plan.totalTopics) * 100);
  const next = plan.nextTopic;
  const message = advice(plan);

  return (
    <section
      className="mb-10 rounded-2xl border border-gray-200 bg-white p-5 dark:border-border dark:bg-card sm:p-6"
      aria-labelledby="exam-plan-heading"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="exam-plan-heading" className="flex items-center gap-2 text-lg font-semibold text-gray-950 dark:text-foreground">
          <Flag className="h-5 w-5 text-brand dark:text-accent2-400" aria-hidden />
          Your exam plan
        </h2>
        {plan.daysLeft !== null && (
          <span className="shrink-0 text-sm font-medium text-gray-600 dark:text-muted-foreground">
            {plan.daysLeft === 0 ? 'Exam today' : `${plan.daysLeft} ${plan.daysLeft === 1 ? 'day' : 'days'} left`}
          </span>
        )}
      </div>

      <p className="mt-4 text-sm text-gray-700 dark:text-foreground/90">
        <strong className="text-2xl font-bold text-brand dark:text-accent2-400">{plan.coveredTopics}</strong> of{' '}
        {topics(plan.totalTopics)} covered
        {plan.strongTopics > 0 ? ` · ${plan.strongTopics} strong` : ''}
      </p>
      <div
        className="mt-2 h-2.5 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10"
        role="progressbar"
        aria-label="Topics covered"
        aria-valuemin={0}
        aria-valuemax={plan.totalTopics}
        aria-valuenow={plan.coveredTopics}
      >
        <div className="h-full rounded-full bg-accent2-500" style={{ width: `${percent}%` }} />
      </div>

      {message ? (
        <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-muted-foreground">{message}</p>
      ) : (
        <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-muted-foreground">
          <Link href="/student/onboarding" className="font-medium text-brand underline dark:text-accent2-400">
            Add your exam date
          </Link>{' '}
          and we will work out how many topics to cover each week.
        </p>
      )}

      {next && (
        <Button
          variant="outline"
          className="mt-4 h-auto min-h-11 w-full justify-between whitespace-normal rounded-xl px-4 py-2 text-left sm:w-auto sm:gap-3"
          disabled={start.isPending}
          onClick={() =>
            start.mutate({
              subjectId: next.subjectId,
              examId: next.examId,
              topicIds: [next.topicId],
              count: 10,
              mode: 'PRACTICE',
            })
          }
        >
          <span>
            {start.isPending ? 'Starting…' : `Next topic: ${next.name}`}{' '}
            <span className="font-normal text-gray-500 dark:text-muted-foreground">({next.subjectName})</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0" />
        </Button>
      )}
    </section>
  );
}
