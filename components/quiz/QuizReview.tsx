'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { getQuizCatalog, quizKeys, type QuizReviewQuestion } from '@/lib/api/quiz';
import { cn } from '@/lib/utils';
import ExplainWithAI from './ExplainWithAI';

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
        <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground">
          Review your answers
        </h2>
        {wrongCount > 0 && (
          <button
            type="button"
            onClick={() => setWrongOnly((current) => !current)}
            className="text-xs font-medium rounded-full px-3 py-1.5 bg-accent2-100 text-brand dark:bg-accent2-500/20 dark:text-accent2-400"
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
            className="rounded-2xl border border-gray-200 dark:border-border bg-white dark:bg-card p-4 sm:p-5"
          >
            <div className="flex items-start gap-2.5">
              {question.isCorrect ? (
                <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-emerald-500" aria-label="Correct" />
              ) : (
                <XCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-500" aria-label="Incorrect" />
              )}
              <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-foreground whitespace-pre-line">
                <span className="text-gray-400 dark:text-muted-foreground mr-1">{number}.</span>
                {question.text}
              </p>
            </div>

            <ul className="mt-3 space-y-1.5">
              {question.options.map((option) => {
                const isCorrect = option.id === question.correctOptionId;
                const isYours = option.id === question.yourAnswer;
                return (
                  <li
                    key={option.id}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm',
                      isCorrect
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200'
                        : isYours
                          ? 'border-red-300 bg-red-50 text-red-900 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200'
                          : 'border-gray-200 text-gray-700 dark:border-border dark:text-foreground/80',
                    )}
                  >
                    <span className="font-semibold w-5">{option.id}</span>
                    <span className="flex-1">{option.text}</span>
                    {isCorrect && <span className="text-xs font-medium">Correct answer</span>}
                    {isYours && !isCorrect && <span className="text-xs font-medium">Your answer</span>}
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
              <p className="mt-3 rounded-lg bg-gray-50 dark:bg-white/5 px-3 py-2 text-sm text-gray-700 dark:text-foreground/80">
                <span className="font-semibold">Why: </span>
                {question.explanation}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
