'use client';

import { useMutation } from '@tanstack/react-query';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getQuizDiagnosis } from '@/lib/api/quiz';

const SECTIONS = ['Strengths', 'Needs work', 'Next step'] as const;

// Splits "Strengths: ...\nNeeds work: ...\nNext step: ..." into labelled parts.
// If the text does not match, it is shown as-is.
function parseSections(text: string) {
  const parts = SECTIONS.map((label) => {
    const match = text.match(new RegExp(`^${label}:\\s*([\\s\\S]*?)(?=^(?:${SECTIONS.join('|')}):|$(?![\\s\\S]))`, 'm'));
    return match ? { label, body: match[1].trim() } : null;
  });
  return parts.every(Boolean) ? (parts as Array<{ label: string; body: string }>) : null;
}

// A short read of the quiz result: what went well, what needs work, and the next
// step. The server writes it once per quiz and reuses it.
export default function DiagnosisCard({ attemptId }: { attemptId: string }) {
  const diagnose = useMutation({ mutationFn: () => getQuizDiagnosis(attemptId) });
  const result = diagnose.data;
  const sections = result ? parseSections(result.diagnosis) : null;

  return (
    <section className="rounded-2xl border border-accent2-200 bg-accent2-50 dark:border-accent2-500/30 dark:bg-accent2-500/10 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-foreground">
            <Sparkles className="w-5 h-5 text-brand dark:text-accent2-400" />
            {result?.source === 'AI' ? 'AI diagnosis' : 'Your diagnosis'}
          </h2>
          {!result && (
            <p className="mt-1 text-sm text-gray-600 dark:text-muted-foreground">
              A short summary of what went well, what needs work, and what to do next.
            </p>
          )}
        </div>
        {!result && (
          <Button
            type="button"
            className="h-10 px-4 rounded-xl shrink-0"
            disabled={diagnose.isPending}
            onClick={() => diagnose.mutate()}
          >
            {diagnose.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {diagnose.isPending ? 'Reading your results...' : 'Explain my results'}
          </Button>
        )}
      </div>

      {diagnose.isError && (
        <p className="mt-3 text-xs text-red-600" role="alert">
          {diagnose.error instanceof Error ? diagnose.error.message : 'Could not get your diagnosis.'}{' '}
          Tap the button to try again.
        </p>
      )}

      {result && (
        <div className="mt-3 space-y-3">
          {sections ? (
            sections.map((section) => (
              <div key={section.label}>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand dark:text-accent2-400">
                  {section.label}
                </p>
                <p className="text-sm text-gray-800 dark:text-foreground/90">{section.body}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-800 dark:text-foreground/90 whitespace-pre-line">
              {result.diagnosis}
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-muted-foreground">
            {result.source === 'AI'
              ? 'Written by AI from your quiz results. The numbers come from your quiz and the next step is set by DoLearnn. If something looks wrong, check with a teacher.'
              : 'Worked out from your quiz results.'}
          </p>
        </div>
      )}
    </section>
  );
}
