'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { getQuizCatalog, quizKeys, type QuizReviewQuestion } from '@/lib/api/quiz';
import { cn } from '@/lib/utils';
import ExplainWithAI from './ExplainWithAI';
import ReportQuestion from './ReportQuestion';

export default function QuizReview({
  attemptId,
  review,
}: {
  attemptId: string;
  review: QuizReviewQuestion[];
}) {
  const [wrongOnly, setWrongOnly] = useState(false);
  // The catalog is already cached from the quiz hub, so this costs no request.
  const catalog = useQuery({
    queryKey: quizKeys.catalog,
    queryFn: getQuizCatalog,
    staleTime: 5 * 60_000,
  });
  const aiEnabled = catalog.data?.ai?.explanations === true;
  const wrongCount = review.filter((question) => !question.isCorrect).length;
  const visible = review
    .map((question, index) => ({ question, number: index + 1 }))
    .filter(({ question }) => !wrongOnly || !question.isCorrect);

  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="font-display text-lg font-bold text-gray-950 dark:text-foreground">
          Review your answers
        </h2>
        {wrongCount > 0 && (
          <button
            type="button"
            onClick={() => setWrongOnly((current) => !current)}
            className="min-h-10 shrink-0 rounded-full bg-accent2-100 px-3.5 text-xs font-semibold text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-accent2-500/20 dark:text-accent2-400"
            aria-pressed={wrongOnly}
          >
            {wrongOnly ? 'Show all' : `Only wrong or skipped (${wrongCount})`}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {visible.map(({ question, number }) => (
          <article
            key={question.id}
            className="rounded-3xl border border-gray-200/80 bg-white p-4 dark:border-border dark:bg-card sm:p-5"
          >
            <div className="flex items-start gap-2.5">
              {question.isCorrect ? (
                <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-emerald-500" aria-label="Correct" />
              ) : (
                <XCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-500" aria-label="Incorrect" />
              )}
              <p className="whitespace-pre-line text-[15px] font-medium leading-relaxed text-gray-950 dark:text-foreground sm:text-base">
                <span className="mr-1 font-display font-bold tabular-nums text-gray-400 dark:text-muted-foreground">{number}.</span>
                {question.text}
              </p>
            </div>

            <ul className="mt-3 space-y-2">
              {question.options.map((option) => {
                const isCorrect = option.id === question.correctOptionId;
                const isYours = option.id === question.yourAnswer;
                return (
                  <li
                    key={option.id}
                    className={cn(
                      'flex min-h-11 items-center gap-2.5 rounded-xl border px-3 py-2 text-sm',
                      isCorrect
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200'
                        : isYours
                          ? 'border-red-300 bg-red-50 text-red-900 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200'
                          : 'border-gray-200 text-gray-700 dark:border-border dark:text-foreground/80',
                    )}
                  >
                    <span className="w-5 shrink-0 font-display font-bold">{option.id}</span>
                    <span className="min-w-0 flex-1">{option.text}</span>
                    {isCorrect && <span className="shrink-0 text-xs font-semibold">{isYours ? 'Your answer, correct' : 'Correct'}</span>}
                    {isYours && !isCorrect && <span className="shrink-0 text-xs font-semibold">Your answer</span>}
                  </li>
                );
              })}
            </ul>

            {!question.yourAnswer && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                You skipped this question.
              </p>
            )}
            {aiEnabled && (
              <ExplainWithAI attemptId={attemptId} questionId={question.id} />
            )}
            {question.explanation && (
              <p className="mt-3 rounded-2xl bg-gray-50 px-3.5 py-2.5 text-sm leading-6 text-gray-700 dark:bg-white/5 dark:text-foreground/80">
                <span className="font-semibold">Why: </span>
                {question.explanation}
              </p>
            )}
            <ReportQuestion kind="bank" questionId={question.id} />
          </article>
        ))}
      </div>
    </section>
  );
}
