'use client';

import Link from 'next/link';
import { ArrowRight, Pencil } from 'lucide-react';
import type { QuizExamPlan } from '@/lib/api/quiz';
import { cn } from '@/lib/utils';
import { useStartQuiz } from './useStartQuiz';

// The final two weeks are kept for revision and full mock exams (see quiz-exam-plan.ts).
const REVISION_DAYS = 14;
// Above this many topics the segments get too thin to read, so it becomes one bar.
const MAX_SEGMENTS = 48;

function topics(count: number) {
  return `${count} ${count === 1 ? 'topic' : 'topics'}`;
}

function advice(plan: QuizExamPlan) {
  const left = plan.totalTopics - plan.coveredTopics;
  if (left === 0) return 'Every topic covered. Now turn the weak ones into strong ones.';
  if (plan.daysLeft === null) return null;
  if (plan.daysLeft <= REVISION_DAYS) return 'Your exam is close. Work on your weakest topics and take full exams in exam mode.';
  return `Cover ${topics(plan.topicsPerWeek ?? 0)} a week to finish two weeks before your exam.`;
}

/**
 * The top of the Today page: days left to the exam and how much of the
 * syllabus is covered, one segment per topic. Every number comes from the
 * learner's own plan and answers.
 */
export default function ExamCountdown({
  examName,
  daysLeft,
  plan,
}: {
  examName: string;
  daysLeft: number | null;
  plan: QuizExamPlan | null | undefined;
}) {
  const start = useStartQuiz();
  const hasPlan = !!plan && plan.totalTopics > 0;
  const message = hasPlan ? advice(plan) : null;
  const next = plan?.nextTopic ?? null;

  return (
    <section
      aria-labelledby="countdown-heading"
      className="relative overflow-hidden rounded-[28px] bg-brand p-5 text-white shadow-[0_18px_40px_-24px_rgba(4,66,114,0.9)] dark:bg-[hsl(208,70%,16%)] sm:p-7"
    >
      {/* A quiet mint glow in the corner: the only decoration on the page. */}
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-accent2-400/25 blur-3xl" />

      <div className="relative flex items-center justify-between gap-3">
        <p className="truncate text-sm font-medium text-white/75">{examName}</p>
        <Link
          href="/student/onboarding"
          className="-my-2 -mr-2 inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit plan
        </Link>
      </div>

      <h2 id="countdown-heading" className="relative mt-3 flex items-baseline gap-2.5">
        {daysLeft === null ? (
          <span className="font-display text-2xl font-bold">No exam date yet</span>
        ) : daysLeft === 0 ? (
          <span className="font-display text-4xl font-extrabold">Exam day. You&apos;ve got this.</span>
        ) : (
          <>
            <span className="font-display text-[64px] font-extrabold leading-[0.9] tracking-[-0.04em] tabular-nums sm:text-[80px]">
              {daysLeft}
            </span>
            <span className="text-lg font-medium text-white/80">{daysLeft === 1 ? 'day to go' : 'days to go'}</span>
          </>
        )}
      </h2>
      {daysLeft === null && (
        <p className="relative mt-1 text-sm text-white/75">
          <Link href="/student/onboarding" className="font-semibold text-accent2-300 underline underline-offset-2">
            Add your exam date
          </Link>{' '}
          and we&apos;ll pace your topics week by week.
        </p>
      )}

      {hasPlan && (
        <div className="relative mt-6">
          <SyllabusBar plan={plan} />
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/85">
            <span>
              <strong className="font-display text-base font-bold tabular-nums text-white">{plan.coveredTopics}</strong>
              <span className="text-white/60"> / {plan.totalTopics}</span> topics covered
            </span>
            {plan.strongTopics > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-accent2-400" aria-hidden />
                <strong className="font-semibold tabular-nums">{plan.strongTopics}</strong> strong
              </span>
            )}
          </p>
          {message && <p className="mt-1.5 max-w-prose text-sm leading-6 text-white/65">{message}</p>}
        </div>
      )}

      {next && (
        <button
          type="button"
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
          className="relative mt-5 flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl bg-white px-4 py-2.5 text-left text-brand transition-transform hover:bg-accent2-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent2-300 active:scale-[0.98] disabled:opacity-70 sm:w-auto sm:min-w-[22rem]"
        >
          <span className="min-w-0">
            <span className="block truncate text-xs font-medium text-brand/60">
              {start.isPending ? 'Starting…' : `Next topic in ${next.subjectName}`}
            </span>
            <span className="block truncate font-semibold">{next.name}</span>
          </span>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white">
            <ArrowRight className="h-4 w-4" aria-hidden />
          </span>
        </button>
      )}
    </section>
  );
}

/** Strong topics first, then covered ones, then the rest of the syllabus. */
function SyllabusBar({ plan }: { plan: QuizExamPlan }) {
  const covered = Math.min(plan.coveredTopics, plan.totalTopics);
  const strong = Math.min(plan.strongTopics, covered);
  const label = `${covered} of ${topics(plan.totalTopics)} covered, ${strong} strong`;

  if (plan.totalTopics > MAX_SEGMENTS) {
    const pct = (n: number) => `${(n / plan.totalTopics) * 100}%`;
    return (
      <div role="img" aria-label={label} className="flex h-2.5 overflow-hidden rounded-full bg-white/15">
        <div className="h-full bg-accent2-400" style={{ width: pct(strong) }} />
        <div className="h-full bg-white/70" style={{ width: pct(covered - strong) }} />
      </div>
    );
  }

  return (
    <div role="img" aria-label={label} className="flex gap-[3px]">
      {Array.from({ length: plan.totalTopics }, (_, i) => (
        <span
          key={i}
          className={cn(
            'h-2.5 flex-1 rounded-full',
            i < strong ? 'bg-accent2-400' : i < covered ? 'bg-white/70' : 'bg-white/15',
          )}
        />
      ))}
    </div>
  );
}
