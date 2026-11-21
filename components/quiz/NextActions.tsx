'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowRight,
  CalendarClock,
  ClipboardCheck,
  GraduationCap,
  ListChecks,
  RotateCcw,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getQuizNextActions, quizKeys, type QuizNextAction } from '@/lib/api/quiz';
import TutoringCta from './TutoringCta';
import { useStartQuiz } from './useStartQuiz';

const ICONS = {
  DIAGNOSTIC: ListChecks,
  FIX_MISTAKES: RotateCcw,
  PRACTISE_TOPIC: Target,
  TUTOR: GraduationCap,
  REASSESS: ClipboardCheck,
} as const;

const EYEBROWS: Record<QuizNextAction['type'], string> = {
  DIAGNOSTIC: 'Start here',
  FIX_MISTAKES: 'Fix my mistakes',
  PRACTISE_TOPIC: 'Practise next',
  TUTOR: 'Extra help',
  REASSESS: 'See if you improved',
};

const START_LABEL: Record<QuizNextAction['type'], string> = {
  DIAGNOSTIC: 'Choose a subject',
  FIX_MISTAKES: 'Try them again',
  PRACTISE_TOPIC: 'Practise',
  TUTOR: '',
  REASSESS: 'Test again',
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

  const run = () =>
    action.start &&
    start.mutate({
      ...action.start,
      studentId: studentId ?? undefined,
    });
  const label = start.isPending ? 'Starting…' : START_LABEL[action.type];

  if (!prominent) {
    // A compact row: the plan stays short on a phone screen.
    return (
      <article className="flex items-center gap-3 border-t border-gray-100 py-3.5 dark:border-border">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent2-100 text-brand dark:bg-accent2-500/15 dark:text-accent2-400">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-semibold text-gray-950 dark:text-foreground">{action.title}</h3>
          <p className="line-clamp-2 text-xs leading-5 text-gray-500 dark:text-muted-foreground">{action.reason}</p>
        </div>
        {action.start ? (
          <Button
            size="sm"
            variant="outline"
            className="h-10 shrink-0 rounded-full px-4"
            disabled={start.isPending}
            onClick={run}
          >
            {label}
          </Button>
        ) : (
          <Button asChild size="sm" variant="outline" className="h-10 shrink-0 rounded-full px-4">
            <Link href={`${practicePath}#choose-subject`}>{label}</Link>
          </Button>
        )}
      </article>
    );
  }

  return (
    <article className="pb-5 pt-1">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand text-accent2-300 dark:bg-accent2-500 dark:text-brand">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-brand dark:text-accent2-400">{EYEBROWS[action.type]}</p>
          <h3 className="mt-0.5 font-display text-lg font-bold leading-snug text-gray-950 dark:text-foreground">{action.title}</h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600 dark:text-muted-foreground">{action.reason}</p>
        </div>
      </div>
      {action.start ? (
        <Button
          className="mt-4 h-12 w-full rounded-2xl text-[15px] sm:w-auto sm:px-6"
          disabled={start.isPending}
          onClick={run}
        >
          {label}
          {!start.isPending && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      ) : (
        <Button asChild className="mt-4 h-12 w-full rounded-2xl text-[15px] sm:w-auto sm:px-6">
          <Link href={`${practicePath}#choose-subject`}>
            {label} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      )}
    </article>
  );
}

// The platform chooses the next useful learning action from real attempt and
// topic data. Teacher support is deliberately separated and shown last.
export default function NextActions({
  studentId,
  actions: providedActions,
  isLoading: providedLoading = false,
  readyTomorrow = 0,
}: {
  studentId: string | null;
  actions?: QuizNextAction[];
  isLoading?: boolean;
  // Questions missed today, which come back tomorrow.
  readyTomorrow?: number;
}) {
  const pathname = usePathname();
  const studentWorkspace = pathname.startsWith('/student');
  const practicePath = '/student/practice';
  const progressPath = '/student/progress';
  const query = useQuery({
    queryKey: quizKeys.nextActions(studentId),
    queryFn: () => getQuizNextActions(studentId),
    staleTime: 60_000,
    enabled: providedActions === undefined,
  });

  if (providedLoading || (providedActions === undefined && query.isLoading)) {
    return <Skeleton className="mb-9 h-56 w-full rounded-3xl" />;
  }

  const actions = providedActions ?? query.data?.actions ?? [];
  const learningActions = actions.filter((action) => action.type !== 'TUTOR');
  const supportActions = actions.filter((action) => action.type === 'TUTOR');
  if (actions.length === 0) return null;

  // A short plan: three steps at most, so it never feels like a long to-do list.
  const [primary, ...secondary] = learningActions.slice(0, 3);

  return (
    <section className="mb-10" aria-labelledby="next-move-heading">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 id="next-move-heading" className="font-display text-xl font-bold text-gray-950 dark:text-foreground sm:text-2xl">
            Today&apos;s plan
          </h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-muted-foreground">Picked from your latest results</p>
        </div>
        <Link
          href={progressPath}
          className="hidden text-sm font-medium text-brand hover:underline dark:text-accent2-400 sm:inline"
        >
          View progress
        </Link>
      </div>

      <div className="rounded-3xl border border-gray-200/80 bg-white px-4 pt-4 dark:border-border dark:bg-card sm:px-6 sm:pt-5">
        {primary && <StartAction action={primary} studentId={studentId} practicePath={practicePath} prominent />}
        {secondary.map((action) => (
          <StartAction key={action.id} action={action} studentId={studentId} practicePath={practicePath} />
        ))}
        {secondary.length > 0 && <div className="h-1" />}
      </div>

      {readyTomorrow > 0 && (
        <p className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-muted-foreground">
          <CalendarClock className="h-4 w-4 shrink-0 text-brand dark:text-accent2-400" aria-hidden />
          Come back tomorrow: {readyTomorrow} {readyTomorrow === 1 ? 'question' : 'questions'} you missed today will be ready to try again.
        </p>
      )}

      {/* One tutor card: why it is suggested, plus the pre-filled request. */}
      {supportActions.map((action) =>
        action.tutoring ? (
          <div key={action.id} className="mt-5">
            <TutoringCta
              title={action.title}
              reason={action.reason}
              prefill={action.tutoring.prefill}
              weakTopics={action.tutoring.weakTopics}
            />
          </div>
        ) : null,
      )}
    </section>
  );
}
