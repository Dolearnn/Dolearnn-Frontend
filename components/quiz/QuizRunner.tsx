'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Clock, Send } from 'lucide-react';
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
  quizKeys,
  submitQuizAttempt,
  type QuizInProgressView,
} from '@/lib/api/quiz';
import { formatClock } from '@/lib/quiz';
import { cn } from '@/lib/utils';

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
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
      queryClient.setQueryData(quizKeys.attempt(attempt.id), data);
      void queryClient.invalidateQueries({ queryKey: quizKeys.history });
      void queryClient.invalidateQueries({ queryKey: ['quiz', 'weak-topics'] });
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

      if (event.key === 'ArrowRight') {
        setIndex((current) => Math.min(total - 1, current + 1));
      } else if (event.key === 'ArrowLeft') {
        setIndex((current) => Math.max(0, current - 1));
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
  }, [confirmOpen, submit.isPending, question, total]);

  if (!question) return null;

  const unanswered = total - answeredCount;
  const lowTime = remaining !== null && remaining <= 60;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-muted-foreground">
            {attempt.mode === 'MOCK' ? 'Timed mock' : 'Practice'}
          </p>
          <h1 className="text-lg font-bold text-brand dark:text-accent2-400 truncate">
            {attempt.subject.name}
          </h1>
        </div>
        {remaining !== null && (
          <div
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold tabular-nums',
              lowTime
                ? 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300'
                : 'bg-accent2-100 text-brand dark:bg-accent2-500/20 dark:text-accent2-400',
            )}
            role="timer"
            aria-label="Time remaining"
          >
            <Clock className="w-4 h-4" />
            {formatClock(remaining)}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
          <div
            className="h-full bg-brand dark:bg-accent2-500 transition-all"
            style={{ width: `${(answeredCount / total) * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 dark:text-muted-foreground tabular-nums">
          {answeredCount}/{total} answered
        </span>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-border bg-white dark:bg-card p-5 sm:p-6">
        <p className="text-xs font-medium text-gray-500 dark:text-muted-foreground mb-2">
          Question {index + 1} of {total}
        </p>
        <p className="text-base sm:text-lg font-medium text-gray-900 dark:text-foreground whitespace-pre-line">
          {question.text}
        </p>
        {question.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={question.imageUrl}
            alt="Diagram for this question"
            className="mt-4 max-h-64 rounded-lg border border-gray-200 dark:border-border"
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
                  'w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors',
                  selected
                    ? 'border-brand bg-accent2-50 dark:border-accent2-400 dark:bg-accent2-500/15'
                    : 'border-gray-200 hover:border-brand/50 hover:bg-gray-50 dark:border-border dark:hover:bg-white/5',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                    selected
                      ? 'bg-brand text-white dark:bg-accent2-500 dark:text-brand'
                      : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-muted-foreground',
                  )}
                >
                  {option.id}
                </span>
                <span className="text-sm sm:text-base text-gray-800 dark:text-foreground">
                  {option.text}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mt-4">
        <Button
          type="button"
          variant="outline"
          className="h-10 px-4 rounded-xl"
          onClick={() => go(index - 1)}
          disabled={index === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Previous
        </Button>
        {index < total - 1 ? (
          <Button
            type="button"
            className="h-10 px-5 rounded-xl"
            onClick={() => go(index + 1)}
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            type="button"
            className="h-10 px-5 rounded-xl"
            onClick={() => setConfirmOpen(true)}
            disabled={submit.isPending}
          >
            <Send className="w-4 h-4 mr-2" /> Finish
          </Button>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 dark:border-border bg-white dark:bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-900 dark:text-foreground">
            Jump to question
          </p>
          <Button
            type="button"
            variant="outline"
            className="h-9 px-4 rounded-xl"
            onClick={() => setConfirmOpen(true)}
            disabled={submit.isPending}
          >
            {submit.isPending ? 'Submitting...' : 'Submit quiz'}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
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
                  'h-9 w-9 rounded-lg text-xs font-semibold transition-colors',
                  isAnswered
                    ? 'bg-brand text-white dark:bg-accent2-500 dark:text-brand'
                    : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-muted-foreground',
                  i === index && 'ring-2 ring-offset-2 ring-brand dark:ring-accent2-400 dark:ring-offset-card',
                )}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-gray-500 dark:text-muted-foreground">
          Tip: press A, B, C or D to answer, and the arrow keys to move between questions.
        </p>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
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
    </div>
  );
}
