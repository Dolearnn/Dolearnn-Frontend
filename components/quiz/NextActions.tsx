'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ClipboardCheck, GraduationCap, ListChecks, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getQuizNextActions, quizKeys, type QuizNextAction } from '@/lib/api/quiz';
import TutoringCta from './TutoringCta';
import { useStartQuiz } from './useStartQuiz';

const ICONS = {
  DIAGNOSTIC: ListChecks,
  PRACTISE_TOPIC: Target,
  TUTOR: GraduationCap,
  REASSESS: ClipboardCheck,
} as const;

const START_LABEL: Record<QuizNextAction['type'], string> = {
  DIAGNOSTIC: 'Choose a subject',
  PRACTISE_TOPIC: 'Start mission',
  TUTOR: '',
  REASSESS: 'Retake quiz',
};

// What to do next, worked out from the learner's results: practise weak topics,
// get a tutor when struggle persists, and retake a quiz to measure progress.
export default function NextActions({ studentId }: { studentId: string | null }) {
  const start = useStartQuiz();
  const query = useQuery({
    queryKey: quizKeys.nextActions(studentId),
    queryFn: () => getQuizNextActions(studentId),
    staleTime: 60_000,
  });

  const actions = query.data?.actions ?? [];
  if (actions.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-3">
        Your next steps
      </h2>
      <div className="space-y-3">
        {actions.map((action) => {
          const Icon = ICONS[action.type];

          if (action.type === 'TUTOR' && action.tutoring) {
            return (
              <div key={action.id}>
                <p className="mb-2 text-sm text-gray-600 dark:text-muted-foreground">
                  {action.reason}
                </p>
                <TutoringCta
                  prefill={action.tutoring.prefill}
                  weakTopics={action.tutoring.weakTopics}
                />
              </div>
            );
          }

          return (
            <div
              key={action.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-gray-200 dark:border-border bg-white dark:bg-card p-4"
            >
              <div className="w-10 h-10 shrink-0 rounded-xl bg-accent2-100 text-brand dark:bg-accent2-500/20 dark:text-accent2-400 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-foreground">
                  {action.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-muted-foreground mt-0.5">
                  {action.reason}
                </p>
              </div>
              {action.start ? (
                <Button
                  size="sm"
                  className="h-9 px-4 rounded-lg shrink-0"
                  disabled={start.isPending}
                  onClick={() =>
                    start.mutate({
                      ...action.start!,
                      studentId: studentId ?? undefined,
                    })
                  }
                >
                  {START_LABEL[action.type]}
                </Button>
              ) : (
                <Button asChild size="sm" className="h-9 px-4 rounded-lg shrink-0">
                  <Link href="/family/quiz">{START_LABEL[action.type]}</Link>
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
