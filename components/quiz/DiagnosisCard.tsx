'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getQuizDiagnosis, quizKeys } from '@/lib/api/quiz';

const SECTIONS = ['Strengths', 'Needs work', 'Next step'] as const;

function parseSections(text: string) {
  const parts = SECTIONS.map((label) => {
    const match = text.match(
      new RegExp(`^${label}:\\s*([\\s\\S]*?)(?=^(?:${SECTIONS.join('|')}):|$(?![\\s\\S]))`, 'm'),
    );
    return match ? { label, body: match[1].trim() } : null;
  });
  return parts.every(Boolean) ? (parts as Array<{ label: string; body: string }>) : null;
}

// Diagnosis is part of the result, so it loads as soon as grading finishes.
// The server always has a rules-based answer and may replace the wording with
// AI; scores and next actions remain platform-verified.
export default function DiagnosisCard({ attemptId }: { attemptId: string }) {
  const diagnosis = useQuery({
    queryKey: quizKeys.diagnosis(attemptId),
    queryFn: () => getQuizDiagnosis(attemptId),
    staleTime: Infinity,
    retry: 1,
  });
  const result = diagnosis.data;
  const sections = result ? parseSections(result.diagnosis) : null;

  return (
    <section className="border-l-4 border-accent2-500 bg-accent2-50 p-5 dark:bg-accent2-500/10 sm:p-6" aria-labelledby="diagnosis-heading">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand dark:text-accent2-400">
            Diagnose
          </p>
          <h2 id="diagnosis-heading" className="mt-1 flex items-center gap-2 text-xl font-semibold text-gray-950 dark:text-foreground">
            <Sparkles className="h-5 w-5 text-brand dark:text-accent2-400" />
            What this result means
          </h2>
        </div>
        {diagnosis.isFetching && <Loader2 className="h-5 w-5 animate-spin text-brand dark:text-accent2-400" aria-label="Reading your results" />}
      </div>

      {diagnosis.isLoading && (
        <p className="mt-3 text-sm text-gray-600 dark:text-muted-foreground">
          Reading your topic results and choosing the next useful step…
        </p>
      )}

      {diagnosis.isError && (
        <div className="mt-3" role="alert">
          <p className="text-sm text-red-700 dark:text-red-400">
            {diagnosis.error instanceof Error ? diagnosis.error.message : 'Could not read your results.'}
          </p>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => diagnosis.refetch()}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" /> Try again
          </Button>
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-4">
          {sections ? (
            sections.map((section) => (
              <div key={section.label} className="grid gap-1 sm:grid-cols-[7rem_1fr] sm:gap-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand dark:text-accent2-400">
                  {section.label}
                </p>
                <p className="text-sm leading-6 text-gray-800 dark:text-foreground/90">{section.body}</p>
              </div>
            ))
          ) : (
            <p className="whitespace-pre-line text-sm leading-6 text-gray-800 dark:text-foreground/90">
              {result.diagnosis}
            </p>
          )}
          <p className="border-t border-accent2-200 pt-3 text-xs text-gray-500 dark:border-accent2-500/25 dark:text-muted-foreground">
            {result.source === 'AI'
              ? 'AI explains the result. DoLearnn verifies the scores and chooses actions from your recorded answers.'
              : 'DoLearnn worked this out from your recorded answers.'}
          </p>
        </div>
      )}
    </section>
  );
}
