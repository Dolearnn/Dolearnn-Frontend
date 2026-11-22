'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Calculator, ChevronLeft, ChevronRight, Clock, LayoutGrid, Send, X } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { ExamGate, ExamWarning, MAX_WARNINGS, exitFullscreen, useExamLockdown } from './ExamLockdown';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  getQuizCatalog,
  quizKeys,
  submitQuizAttempt,
  type QuizInProgressView,
} from '@/lib/api/quiz';
import { formatClock } from '@/lib/quiz';
import { cn } from '@/lib/utils';
import ReportQuestion from './ReportQuestion';
import CbtCalculator from './CbtCalculator';

interface SavedProgress {
  answers?: Record<string, string>;
  index?: number;
}

export default function QuizRunner({ view }: { view: QuizInProgressView }) {
  const { attempt, questions } = view;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const storageKey = `dolearn.quiz.${attempt.id}`;

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [restored, setRestored] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Exam mode only: the calculator and, on phones, the question grid sheet.
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [gridOpen, setGridOpen] = useState(false);

  const total = questions.length;
  const question = questions[index];
  const answeredCount = useMemo(
    () => questions.filter((item) => answers[item.id]).length,
    [answers, questions],
  );

  // Answers live on this device while the quiz is open, so a refresh or a
  // dropped connection never loses work.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as SavedProgress;
        const valid: Record<string, string> = {};
        for (const item of questions) {
          const choice = saved.answers?.[item.id];
          if (choice && item.options.some((option) => option.id === choice)) {
            valid[item.id] = choice;
          }
        }
        setAnswers(valid);
        if (
          typeof saved.index === 'number' &&
          saved.index >= 0 &&
          saved.index < questions.length
        ) {
          setIndex(saved.index);
        }
      }
    } catch {
      // Storage can be unavailable (private mode); the quiz still works.
    }
    setRestored(true);
  }, [storageKey, questions]);

  useEffect(() => {
    if (!restored) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ answers, index }));
    } catch {
      // ignore
    }
  }, [answers, index, restored, storageKey]);

  const submit = useMutation({
    mutationFn: () => submitQuizAttempt(attempt.id, answers),
    onSuccess: (data) => {
      exitFullscreen();
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
      queryClient.setQueryData(quizKeys.attempt(attempt.id), data);
      void queryClient.invalidateQueries({ queryKey: quizKeys.history });
      void queryClient.invalidateQueries({ queryKey: ['quiz', 'weak-topics'] });
      void queryClient.invalidateQueries({ queryKey: ['quiz', 'overview'] });
      void queryClient.invalidateQueries({ queryKey: ['quiz', 'progress'] });
      void queryClient.invalidateQueries({ queryKey: ['quiz', 'next-actions'] });
      void queryClient.invalidateQueries({ queryKey: ['quiz', 'rewards'] });
      void queryClient.invalidateQueries({ queryKey: ['quiz', 'leaderboard'] });
      void queryClient.invalidateQueries({ queryKey: ['quiz', 'achievements'] });
      window.scrollTo({ top: 0 });
    },
    onError: (error) => {
      toast({
        title: 'Could not submit your quiz',
        description: `${
          error instanceof Error ? error.message : 'Something went wrong.'
        } Your answers are saved on this device, so please try again.`,
        variant: 'destructive',
      });
    },
  });

  // Countdown for timed mock exams.
  const deadline = attempt.expiresAt ? new Date(attempt.expiresAt).getTime() : null;
  const [remaining, setRemaining] = useState<number | null>(null);
  const autoSubmitted = useRef(false);

  useEffect(() => {
    if (deadline === null) return;
    const tick = () =>
      setRemaining(Math.max(0, Math.round((deadline - Date.now()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [deadline]);

  useEffect(() => {
    if (remaining !== 0 || !restored || autoSubmitted.current) return;
    autoSubmitted.current = true;
    toast({ title: "Time's up", description: 'Submitting your answers now.' });
    submit.mutate();
  }, [remaining, restored, submit, toast]);

  // Exam mode: timed mocks run full screen with anti-cheating measures.
  const exam = attempt.mode === 'MOCK';
  // The attempt carries only the exam id; the (cached) catalog gives its name, e.g. "JAMB UTME".
  const catalogQuery = useQuery({
    queryKey: quizKeys.catalog,
    queryFn: getQuizCatalog,
    enabled: Boolean(attempt.examId) || (attempt.subjects?.length ?? 0) > 1,
    staleTime: 5 * 60_000,
  });
  const examName = catalogQuery.data?.exams.find((item) => item.id === attempt.examId)?.name ?? null;

  // A mixed exam is laid out in subject sections; tabs jump to each one.
  const sections = useMemo(() => {
    const subjects = attempt.subjects ?? [];
    if (subjects.length <= 1 || !catalogQuery.data) return [];
    const subjectOfTopic = new Map(
      catalogQuery.data.subjects.flatMap((subject) => subject.topics.map((topic) => [topic.id, subject.id] as const)),
    );
    return subjects
      .map((subject) => {
        const indexes = questions.flatMap((item, i) => (subjectOfTopic.get(item.topicId) === subject.id ? [i] : []));
        return { ...subject, first: indexes[0] ?? -1, last: indexes[indexes.length - 1] ?? -1, count: indexes.length };
      })
      .filter((section) => section.count > 0);
  }, [attempt.subjects, catalogQuery.data, questions]);
  const currentSection = sections.find((section) => index >= section.first && index <= section.last);
  const onLimitReached = useCallback(() => {
    toast({
      title: 'Exam submitted',
      description: `You reached ${MAX_WARNINGS} warnings, so your answers were submitted.`,
      variant: 'destructive',
    });
    submit.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const lockdown = useExamLockdown({
    attemptId: attempt.id,
    active: exam && !submit.isSuccess,
    onLimitReached,
  });

  const select = (optionId: string) => {
    setAnswers((current) => ({ ...current, [question.id]: optionId }));
  };
  const go = (next: number) => setIndex(Math.min(total - 1, Math.max(0, next)));

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (confirmOpen || submit.isPending) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      const key = event.key.toUpperCase();
      if (event.key === 'ArrowRight' || (exam && key === 'N')) {
        setIndex((current) => Math.min(total - 1, current + 1));
      } else if (event.key === 'ArrowLeft' || (exam && key === 'P')) {
        setIndex((current) => Math.max(0, current - 1));
      } else if (exam && key === 'S') {
        setConfirmOpen(true);
      } else {
        const option = question?.options.find(
          (item) => item.id.toUpperCase() === event.key.toUpperCase(),
        );
        if (option) select(option.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmOpen, submit.isPending, question, total, exam]);

  if (!question) return null;

  if (exam && restored && !lockdown.record.started) {
    return (
      <ExamGate
        examName={examName}
        subject={attempt.subject.name}
        questions={total}
        minutes={attempt.timeLimitSecs ? Math.round(attempt.timeLimitSecs / 60) : null}
        onStart={() => void lockdown.start()}
      />
    );
  }

  const unanswered = total - answeredCount;
  const lowTime = remaining !== null && remaining <= 60;

  const confirmDialog = (
    <>
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          {/* Above the full-screen exam layer (z-60). */}
          <AlertDialogContent className="z-[80]">
            <AlertDialogHeader>
              <AlertDialogTitle>Submit your quiz?</AlertDialogTitle>
              <AlertDialogDescription>
                {unanswered > 0
                  ? `You have ${unanswered} unanswered ${
                      unanswered === 1 ? 'question' : 'questions'
                    }. Unanswered questions count as wrong.`
                  : 'You have answered every question.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep going</AlertDialogCancel>
              <AlertDialogAction onClick={() => submit.mutate()}>
                Submit now
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </>
  );

  const content = (
    <div className="mx-auto max-w-3xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs text-gray-500 dark:text-muted-foreground">
            {examName ? `${examName}, ` : ''}
            {exam ? 'exam mode' : 'practice'}
          </p>
          <h1 className="truncate font-display text-lg font-bold text-gray-950 dark:text-foreground">
            {attempt.subject.name}
          </h1>
        </div>
        {remaining !== null && (
          <div
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 font-display text-base font-bold tabular-nums',
              lowTime
                ? 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300'
                : 'bg-brand text-white dark:bg-accent2-500 dark:text-brand',
            )}
            role="timer"
            aria-label="Time remaining"
          >
            <Clock className="h-4 w-4" />
            {formatClock(remaining)}
          </div>
        )}
      </div>

      <div className="mb-5 flex items-center gap-3">
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10"
          role="progressbar"
          aria-label="Questions answered"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={answeredCount}
        >
          <div
            className="h-full rounded-full bg-accent2-500 transition-[width] duration-300"
            style={{ width: `${(answeredCount / total) * 100}%` }}
          />
        </div>
        <span className="text-xs tabular-nums text-gray-500 dark:text-muted-foreground">
          <strong className="font-semibold text-gray-900 dark:text-foreground">{answeredCount}</strong>/{total} answered
        </span>
      </div>

      {sections.length > 1 && (
        <div
          className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Subjects"
        >
          {sections.map((section) => {
            const active = section.id === currentSection?.id;
            const done = questions
              .slice(section.first, section.last + 1)
              .filter((item) => answers[item.id] !== undefined).length;
            return (
              <button
                key={section.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setIndex(section.first)}
                className={cn(
                  'min-h-10 shrink-0 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active
                    ? 'bg-brand text-white dark:bg-accent2-500 dark:text-brand'
                    : 'border border-gray-200 bg-white text-gray-700 hover:border-brand/50 dark:border-border dark:bg-card dark:text-foreground',
                )}
              >
                {section.name}{' '}
                <span className={cn('tabular-nums', active ? 'opacity-80' : 'text-gray-400 dark:text-muted-foreground')}>
                  {done}/{section.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="rounded-3xl border border-gray-200/80 bg-white p-5 dark:border-border dark:bg-card sm:p-7">
        <p className="flex items-baseline gap-1.5 text-gray-500 dark:text-muted-foreground">
          <span className="font-display text-2xl font-extrabold tabular-nums text-brand dark:text-accent2-400">{index + 1}</span>
          <span className="text-sm tabular-nums">of {total}</span>
          {currentSection && <span className="ml-1 truncate text-sm">in {currentSection.name}</span>}
        </p>
        <p className="mt-3 whitespace-pre-line text-[17px] font-medium leading-relaxed text-gray-950 dark:text-foreground sm:text-lg">
          {question.text}
        </p>
        {question.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={question.imageUrl}
            alt="Diagram for this question"
            className="mt-4 max-h-64 rounded-xl border border-gray-200 dark:border-border"
          />
        )}

        <div role="radiogroup" aria-label="Answer options" className="mt-5 space-y-2.5">
          {question.options.map((option) => {
            const selected = answers[question.id] === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => select(option.id)}
                className={cn(
                  'flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-left transition-[border-color,background-color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99]',
                  selected
                    ? 'border-brand bg-brand-50 dark:border-accent2-400 dark:bg-accent2-500/15'
                    : 'border-gray-200/80 hover:border-brand/40 hover:bg-gray-50 dark:border-border dark:hover:bg-white/5',
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-display text-sm font-bold transition-colors',
                    selected
                      ? 'bg-brand text-white dark:bg-accent2-500 dark:text-brand'
                      : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-muted-foreground',
                  )}
                >
                  {option.id}
                </span>
                <span className="text-[15px] leading-snug text-gray-900 dark:text-foreground sm:text-base">{option.text}</span>
              </button>
            );
          })}
        </div>

        {/* Not during exam mode: nothing should interrupt a timed paper. */}
        {!exam && <ReportQuestion key={question.id} kind="bank" questionId={question.id} />}
      </div>

      <div className="mt-4 grid grid-cols-[auto_1fr] gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-2xl px-4"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label="Previous question"
        >
          <ChevronLeft className="h-5 w-5 sm:mr-1" /> <span className="hidden sm:inline">Previous</span>
        </Button>
        {index < total - 1 ? (
          <Button type="button" className="h-12 rounded-2xl text-[15px]" onClick={() => go(index + 1)}>
            Next <ChevronRight className="ml-1 h-5 w-5" />
          </Button>
        ) : (
          <Button
            type="button"
            className="h-12 rounded-2xl bg-accent2-500 text-[15px] text-brand-700 hover:bg-accent2-400"
            onClick={() => setConfirmOpen(true)}
            disabled={submit.isPending}
          >
            <Send className="mr-2 h-4 w-4" /> Finish
          </Button>
        )}
      </div>

      <div className="mt-6 rounded-3xl border border-gray-200/80 bg-white p-4 dark:border-border dark:bg-card sm:p-5">
        <p className="text-sm font-semibold text-gray-900 dark:text-foreground">Jump to a question</p>
        <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-2">
          {questions.map((item, i) => {
            const isAnswered = Boolean(answers[item.id]);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Question ${i + 1}${isAnswered ? ', answered' : ', not answered'}`}
                aria-current={i === index ? 'true' : undefined}
                className={cn(
                  'h-10 rounded-xl text-sm font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isAnswered
                    ? 'bg-brand text-white dark:bg-accent2-500 dark:text-brand'
                    : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-muted-foreground',
                  i === index && 'ring-2 ring-accent2-400 ring-offset-2 dark:ring-offset-card',
                )}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        <Button
          type="button"
          variant="outline"
          className="mt-4 h-11 w-full rounded-2xl"
          onClick={() => setConfirmOpen(true)}
          disabled={submit.isPending}
        >
          {submit.isPending ? 'Submitting…' : 'Submit quiz'}
        </Button>
        <p className="mt-3 hidden text-xs text-gray-500 dark:text-muted-foreground sm:block">
          Tip: press A, B, C or D to answer, and the arrow keys to move between questions.
        </p>
      </div>

      {confirmDialog}
    </div>
  );

  if (!exam) return content;

  // Exam mode covers the whole app, laid out like a CBT centre screen: timer and
  // calculator on top, subject tabs, the question, and a numbered question grid.
  const sectionFirst = currentSection?.first ?? 0;
  const sectionLast = currentSection?.last ?? total - 1;
  const sectionSize = sectionLast - sectionFirst + 1;
  const sectionNumber = index - sectionFirst + 1;
  const sectionDone = questions
    .slice(sectionFirst, sectionLast + 1)
    .filter((item) => answers[item.id] !== undefined).length;
  const timeTone =
    remaining === null ? '' : remaining <= 60 ? 'bg-red-500 text-white' : remaining <= 300 ? 'bg-amber-400 text-gray-950' : 'bg-white/15 text-white';

  const questionGrid = (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-1.5">
      {questions.slice(sectionFirst, sectionLast + 1).map((item, offset) => {
        const i = sectionFirst + offset;
        const isAnswered = Boolean(answers[item.id]);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              go(i);
              setGridOpen(false);
            }}
            aria-label={`Question ${offset + 1}${isAnswered ? ', answered' : ', not answered'}`}
            aria-current={i === index ? 'true' : undefined}
            className={cn(
              'h-10 rounded-lg text-sm font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isAnswered
                ? 'bg-accent2-500 text-white dark:text-brand'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/10 dark:text-muted-foreground',
              i === index && 'ring-2 ring-brand ring-offset-2 dark:ring-accent2-400 dark:ring-offset-card',
            )}
          >
            {offset + 1}
          </button>
        );
      })}
    </div>
  );

  const gridLegend = (
    <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-muted-foreground">
      <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-accent2-500" aria-hidden /> Answered</span>
      <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-gray-200 dark:bg-white/10" aria-hidden /> Not answered</span>
    </p>
  );

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-gray-50 dark:bg-background">
      <header className="flex items-center gap-2 bg-brand px-3 py-2.5 text-white dark:bg-[hsl(208,70%,14%)] sm:gap-3 sm:px-6">
        <span className="hidden sm:block"><Logo tone="light" size="sm" /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-white/70">{examName ? `${examName}, exam mode` : 'Exam mode'}</p>
          <p className="truncate font-display text-sm font-bold sm:text-base">
            {(attempt.subjects?.length ?? 0) > 1 ? `${attempt.subjects!.length} subjects` : attempt.subject.name}
          </p>
        </div>
        <span
          className={cn(
            'hidden shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold sm:inline-flex',
            lockdown.record.warnings > 0 ? 'bg-amber-400 text-gray-950' : 'bg-white/10 text-white/80',
          )}
        >
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
          {lockdown.record.warnings}/{MAX_WARNINGS}
        </span>
        <button
          type="button"
          onClick={() => setCalculatorOpen((open) => !open)}
          aria-pressed={calculatorOpen}
          aria-label="Calculator"
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent2-300',
            calculatorOpen ? 'bg-accent2-400 text-brand-700' : 'bg-white/10 text-white hover:bg-white/20',
          )}
        >
          <Calculator className="h-5 w-5" />
        </button>
        {remaining !== null && (
          <span
            role="timer"
            aria-label="Time remaining"
            className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-display text-lg font-extrabold tabular-nums', timeTone)}
          >
            <Clock className="h-4 w-4" aria-hidden />
            {formatClock(remaining)}
          </span>
        )}
      </header>

      {sections.length > 1 && (
        <nav
          aria-label="Subjects"
          className="flex gap-1 overflow-x-auto border-b border-gray-200 bg-white px-2 [scrollbar-width:none] dark:border-border dark:bg-card sm:px-4 [&::-webkit-scrollbar]:hidden"
        >
          {sections.map((section) => {
            const active = section.id === currentSection?.id;
            const done = questions
              .slice(section.first, section.last + 1)
              .filter((item) => answers[item.id] !== undefined).length;
            return (
              <button
                key={section.id}
                type="button"
                aria-current={active ? 'true' : undefined}
                onClick={() => setIndex(section.first)}
                className={cn(
                  'flex min-h-12 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-semibold transition-colors',
                  active
                    ? 'border-brand text-brand dark:border-accent2-400 dark:text-accent2-400'
                    : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-muted-foreground dark:hover:text-foreground',
                )}
              >
                {section.name}
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs tabular-nums text-gray-600 dark:bg-white/10 dark:text-muted-foreground">
                  {done}/{section.count}
                </span>
              </button>
            );
          })}
        </nav>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto grid max-w-6xl gap-4 p-3 sm:p-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <section aria-label="Question" className="rounded-3xl border border-gray-200/80 bg-white p-5 dark:border-border dark:bg-card sm:p-7">
            <p className="flex items-baseline gap-1.5 text-gray-500 dark:text-muted-foreground">
              <span className="text-sm">Question</span>
              <span className="font-display text-2xl font-extrabold tabular-nums text-brand dark:text-accent2-400">{sectionNumber}</span>
              <span className="text-sm tabular-nums">of {sectionSize}</span>
              {currentSection && <span className="ml-1 truncate text-sm">in {currentSection.name}</span>}
            </p>
            <p className="mt-3 whitespace-pre-line text-[17px] font-medium leading-relaxed text-gray-950 dark:text-foreground sm:text-lg">
              {question.text}
            </p>
            {question.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={question.imageUrl}
                alt="Diagram for this question"
                className="mt-4 max-h-64 rounded-xl border border-gray-200 dark:border-border"
              />
            )}
            <div role="radiogroup" aria-label="Answer options" className="mt-5 space-y-2.5">
              {question.options.map((option) => {
                const selected = answers[question.id] === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => select(option.id)}
                    className={cn(
                      'flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-left transition-[border-color,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      selected
                        ? 'border-brand bg-brand-50 dark:border-accent2-400 dark:bg-accent2-500/15'
                        : 'border-gray-200/80 hover:border-brand/40 hover:bg-gray-50 dark:border-border dark:hover:bg-white/5',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 font-display text-sm font-bold',
                        selected
                          ? 'border-brand bg-brand text-white dark:border-accent2-500 dark:bg-accent2-500 dark:text-brand'
                          : 'border-gray-300 text-gray-600 dark:border-border dark:text-muted-foreground',
                      )}
                    >
                      {option.id}
                    </span>
                    <span className="text-[15px] leading-snug text-gray-900 dark:text-foreground sm:text-base">{option.text}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 hidden items-center justify-between gap-3 lg:flex">
              <Button type="button" variant="outline" className="h-12 rounded-2xl px-5" onClick={() => go(index - 1)} disabled={index === 0}>
                <ChevronLeft className="mr-1 h-5 w-5" /> Previous
              </Button>
              <p className="hidden text-xs text-gray-500 dark:text-muted-foreground xl:block">
                Keys: A–D to answer, N next, P previous, S submit
              </p>
              <Button type="button" className="h-12 rounded-2xl px-6" onClick={() => go(index + 1)} disabled={index === total - 1}>
                Next <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
            </div>
          </section>

          <aside className="hidden space-y-4 rounded-3xl border border-gray-200/80 bg-white p-5 dark:border-border dark:bg-card lg:sticky lg:top-6 lg:block">
            <div className="flex items-baseline justify-between">
              <p className="font-display text-base font-bold text-gray-950 dark:text-foreground">
                {currentSection ? currentSection.name : 'Questions'}
              </p>
              <p className="text-xs tabular-nums text-gray-500 dark:text-muted-foreground">
                {sectionDone}/{sectionSize} answered
              </p>
            </div>
            {questionGrid}
            {gridLegend}
            <Button
              type="button"
              className="h-12 w-full rounded-2xl bg-accent2-500 text-[15px] text-brand-700 hover:bg-accent2-400"
              onClick={() => setConfirmOpen(true)}
              disabled={submit.isPending}
            >
              <Send className="mr-2 h-4 w-4" /> {submit.isPending ? 'Submitting…' : 'Submit exam'}
            </Button>
            <p className="text-center text-xs tabular-nums text-gray-500 dark:text-muted-foreground">
              {answeredCount} of {total} answered in all
            </p>
          </aside>
        </div>
      </div>

      {/* Phones: navigation stays under the thumb. */}
      <footer className="grid grid-cols-[auto_1fr_auto] items-center gap-2 border-t border-gray-200 bg-white px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 dark:border-border dark:bg-card lg:hidden">
        <Button type="button" variant="outline" className="h-12 w-12 rounded-2xl p-0" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous question">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button type="button" variant="outline" className="h-12 rounded-2xl" onClick={() => setGridOpen(true)}>
          <LayoutGrid className="mr-2 h-4 w-4" />
          <span className="tabular-nums">{sectionDone}/{sectionSize} answered</span>
        </Button>
        {index < total - 1 ? (
          <Button type="button" className="h-12 rounded-2xl px-5" onClick={() => go(index + 1)}>
            Next <ChevronRight className="ml-1 h-5 w-5" />
          </Button>
        ) : (
          <Button type="button" className="h-12 rounded-2xl bg-accent2-500 px-5 text-brand-700 hover:bg-accent2-400" onClick={() => setConfirmOpen(true)}>
            Submit
          </Button>
        )}
      </footer>

      {gridOpen && (
        <div className="fixed inset-0 z-[70] flex items-end bg-black/40 lg:hidden" onClick={() => setGridOpen(false)}>
          <div
            role="dialog"
            aria-label="Question grid"
            className="max-h-[80vh] w-full overflow-y-auto rounded-t-[28px] bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] dark:bg-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-lg font-bold text-gray-950 dark:text-foreground">
                {currentSection ? currentSection.name : 'Questions'}
              </p>
              <button
                type="button"
                onClick={() => setGridOpen(false)}
                aria-label="Close question grid"
                className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {questionGrid}
            <div className="mt-3">{gridLegend}</div>
            <Button
              type="button"
              className="mt-5 h-12 w-full rounded-2xl bg-accent2-500 text-[15px] text-brand-700 hover:bg-accent2-400"
              onClick={() => {
                setGridOpen(false);
                setConfirmOpen(true);
              }}
              disabled={submit.isPending}
            >
              <Send className="mr-2 h-4 w-4" /> Submit exam ({answeredCount} of {total} answered)
            </Button>
          </div>
        </div>
      )}

      {calculatorOpen && <CbtCalculator onClose={() => setCalculatorOpen(false)} />}
      {confirmDialog}
      {lockdown.notice && !submit.isPending && (
        <ExamWarning
          kind={lockdown.notice}
          warnings={lockdown.record.warnings}
          onResume={() => void lockdown.resume()}
        />
      )}
    </div>
  );
}
