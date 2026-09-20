'use client';

import { useMutation } from '@tanstack/react-query';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { explainQuizQuestion } from '@/lib/api/quiz';

// Asks the server for an AI-written worked explanation of one reviewed
// question. The server writes each explanation once and reuses it for everyone.
export default function ExplainWithAI({
  attemptId,
  questionId,
}: {
  attemptId: string;
  questionId: string;
}) {
  const explain = useMutation({
    mutationFn: () => explainQuizQuestion(attemptId, questionId),
  });

  if (explain.data) {
    return (
      <div className="mt-3 rounded-lg border border-accent2-200 bg-accent2-50 dark:border-accent2-500/30 dark:bg-accent2-500/10 px-3 py-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-brand dark:text-accent2-400 mb-1.5">
          <Sparkles className="w-3.5 h-3.5" /> AI explanation
        </p>
        <p className="text-sm text-gray-800 dark:text-foreground/90 whitespace-pre-line">
          {explain.data.explanation}
        </p>
        <p className="mt-2 text-xs text-gray-500 dark:text-muted-foreground">
          Written by AI. If something looks wrong, check with a teacher.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <Button
        type="button"
        variant="outline"
        className="h-9 px-4 rounded-xl"
        disabled={explain.isPending}
        onClick={() => explain.mutate()}
      >
        {explain.isPending ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4 mr-2" />
        )}
        {explain.isPending ? 'Thinking...' : 'Explain with AI'}
      </Button>
      {explain.isError && (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {explain.error instanceof Error
            ? explain.error.message
            : 'Could not get an explanation.'}{' '}
          Tap the button to try again.
        </p>
      )}
    </div>
  );
}
