'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowRight,
  ClipboardCheck,
  GraduationCap,
  ListChecks,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getQuizNextActions, quizKeys, type QuizNextAction } from '@/lib/api/quiz';
import TutoringCta from './TutoringCta';
import { useStartQuiz } from './useStartQuiz';

const ICONS = {
  DIAGNOSTIC: ListChecks,
  PRACTISE_TOPIC: Target,
  TUTOR: GraduationCap,
  REASSESS: ClipboardCheck,
} as const;

const EYEBROWS: Record<QuizNextAction['type'], string> = {
  DIAGNOSTIC: 'Start here',
  PRACTISE_TOPIC: 'Your mission',
  TUTOR: 'Human support',
  REASSESS: 'Measure the change',
};

const START_LABEL: Record<QuizNextAction['type'], string> = {
  DIAGNOSTIC: 'Choose a subject',
  PRACTISE_TOPIC: 'Start mission',
  TUTOR: '',
  REASSESS: 'Start reassessment',
};

function StartAction({
  action,
  studentId,
  prominent = false,
  practicePath,
}: {
  action: QuizNextAction;
  studentId: string | null;
  prominent?: boolean;
  practicePath: string;
}) {
  const start = useStartQuiz();
  const Icon = ICONS[action.type];

  return (
    <article
      className={
        prominent
          ? 'relative overflow-hidden bg-brand p-5 text-white dark:bg-accent2-500 dark:text-brand sm:p-7'
          : 'border-t border-gray-200 py-4 first:border-t-0 dark:border-border'
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div
          className={
            prominent
              ? 'flex h-11 w-11 shrink-0 items-center justify-center bg-white/15 dark:bg-brand/10'
              : 'flex h-10 w-10 shrink-0 items-center justify-center bg-accent2-100 text-brand dark:bg-accent2-500/20 dark:text-accent2-400'
          }
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={
              prominent
                ? 'text-[11px] font-semibold uppercase tracking-[0.18em] text-accent2-300 dark:text-brand/65'
                : 'text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-muted-foreground'
            }
          >
            {EYEBROWS[action.type]}
          </p>
          <h3 className="mt-1 text-lg font-semibold">{action.title}</h3>
          <p
            className={
              prominent
                ? 'mt-1 max-w-2xl text-sm leading-6 text-white/75 dark:text-brand/70'
                : 'mt-1 max-w-2xl text-sm leading-6 text-gray-600 dark:text-muted-foreground'
            }
          >
            {action.reason}
          </p>
        </div>
        {action.start ? (
          <Button
            size="sm"
            variant={prominent ? 'secondary' : 'default'}
            className="h-11 shrink-0 px-5"
            disabled={start.isPending}
            onClick={() =>
              start.mutate({
                ...action.start!,
                studentId: studentId ?? undefined,
              })
            }
          >
            {start.isPending ? 'Starting…' : START_LABEL[action.type]}
            {!start.isPending && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        ) : (
          <Button asChild size="sm" variant="secondary" className="h-11 shrink-0 px-5">
            <Link href={`${practicePath}#choose-subject`}>
              {START_LABEL[action.type]} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </article>
  );
}

// The platform chooses the next useful learning action from real attempt and
// topic data. Teacher support is deliberately separated and shown last.
export default function NextActions({
  studentId,
  actions: providedActions,
  isLoading: providedLoading = false,
}: {
  studentId: string | null;
  actions?: QuizNextAction[];
  isLoading?: boolean;
}) {
  const pathname = usePathname();
  const studentWorkspace = pathname.startsWith('/student');
  const practicePath = studentWorkspace ? '/student/practice' : '/family/quiz';
  const progressPath = studentWorkspace ? '/student/progress' : '/family/progress';
  const query = useQuery({
    queryKey: quizKeys.nextActions(studentId),
    queryFn: () => getQuizNextActions(studentId),
    staleTime: 60_000,
    enabled: providedActions === undefined,
  });

  if (providedLoading || (providedActions === undefined && query.isLoading)) {
    return <Skeleton className="mb-9 h-44 w-full" />;
  }

  const actions = providedActions ?? query.data?.actions ?? [];
  const learningActions = actions.filter((action) => action.type !== 'TUTOR');
  const supportActions = actions.filter((action) => action.type === 'TUTOR');
  if (actions.length === 0) return null;

  const [primary, ...secondary] = learningActions;

  return (
    <section className="mb-10" aria-labelledby="next-move-heading">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand dark:text-accent2-400">
            Based on your results
          </p>
          <h2 id="next-move-heading" className="mt-1 text-2xl font-semibold text-gray-950 dark:text-foreground">
            Your next move
          </h2>
        </div>
        <Link
          href={progressPath}
          className="hidden text-sm font-medium text-brand hover:underline dark:text-accent2-400 sm:inline"
        >
          View progress
        </Link>
      </div>

      <div className="overflow-hidden border border-gray-200 bg-white dark:border-border dark:bg-card">
        {primary && <StartAction action={primary} studentId={studentId} practicePath={practicePath} prominent />}
        {secondary.length > 0 && (
          <div className="px-5 sm:px-7">
            {secondary.map((action) => (
              <StartAction key={action.id} action={action} studentId={studentId} practicePath={practicePath} />
            ))}
          </div>
        )}
      </div>

      {supportActions.map((action) =>
        action.tutoring ? (
          <div key={action.id} className="mt-5 border-l-2 border-amber-400 pl-4 sm:pl-5">
            <div className="mb-3 flex items-start gap-3">
              <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-400">
                  After repeated practice
                </p>
                <h3 className="mt-1 font-semibold text-gray-950 dark:text-foreground">
                  {action.title}
                </h3>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600 dark:text-muted-foreground">
                  {action.reason}
                </p>
              </div>
            </div>
            <TutoringCta
              prefill={action.tutoring.prefill}
              weakTopics={action.tutoring.weakTopics}
            />
          </div>
        ) : null,
      )}
    </section>
  );
}
