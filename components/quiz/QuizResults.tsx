'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { AlertTriangle, BadgeCheck, CalendarClock, Clock, Minus, RotateCcw, ShieldCheck, Target, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getQuizProgress, quizKeys, type QuizSubmittedView } from '@/lib/api/quiz';
import { scoreMessage, scoreTone, toneClasses } from '@/lib/quiz';
import { cn } from '@/lib/utils';
import DiagnosisCard from './DiagnosisCard';
import { readExamRecord, type ExamRecord } from './ExamLockdown';
import QuizReview from './QuizReview';
import RetakeComparison from './RetakeComparison';
import RewardsStrip from './RewardsStrip';
import { useStartQuiz } from './useStartQuiz';

const WEAK_BELOW_PERCENT = 60;

function ScoreRing({ percent }: { percent: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const tone = toneClasses[scoreTone(percent)];

  return (
    <div className="relative h-32 w-32 shrink-0" role="img" aria-label={`Score ${percent} percent`}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="10" className="stroke-gray-200 dark:stroke-white/10" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
          className={cn('transition-all duration-700', tone.text, 'stroke-current')}
        />
      </svg>
      <span className={cn('absolute inset-0 flex items-center justify-center text-3xl font-bold', tone.text)}>
        {percent}%
      </span>
    </div>
  );
}

// The exam-mode integrity record for this attempt, as kept on this device.
function ExamIntegrity({ attemptId }: { attemptId: string }) {
  const [record, setRecord] = useState<ExamRecord | null>(null);
  useEffect(() => setRecord(readExamRecord(attemptId)), [attemptId]);
  if (!record?.started) return null;

  const counts = record.events.reduce<Record<string, number>>((acc, event) => {
    acc[event.type] = (acc[event.type] ?? 0) + 1;
    return acc;
  }, {});
  const labels: Record<string, string> = {
    'left-tab': 'left the exam',
    'left-fullscreen': 'left full screen',
    reloaded: 'reloaded the page',
  };
  const detail = Object.entries(counts)
    .map(([type, count]) => `${labels[type] ?? type} ×${count}`)
    .join(', ');

  return record.warnings === 0 ? (
    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent2-100 px-3 py-1 text-xs font-medium text-brand dark:bg-accent2-500/20 dark:text-accent2-300">
      <ShieldCheck className="h-3.5 w-3.5" /> No warnings during this exam
    </p>
  ) : (
    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
      <AlertTriangle className="h-3.5 w-3.5" /> {record.warnings} {record.warnings === 1 ? 'warning' : 'warnings'}: {detail}
    </p>
  );
}

export default function QuizResults({ view }: { view: QuizSubmittedView }) {
  const { attempt, result, review } = view;
  const start = useStartQuiz();
  const pathname = usePathname();
  const practicePath = '/student/practice';

  const weakTopicIds = result.topics
    .filter((topic) => topic.accuracyPercent < WEAK_BELOW_PERCENT)
    .map((topic) => topic.topicId);
  const sortedTopics = [...result.topics].sort(
    (a, b) => a.accuracyPercent - b.accuracyPercent,
  );

  // Only the learner's very first result gets the "start here" treatment.
  const progressQuery = useQuery({
    queryKey: quizKeys.progress(attempt.studentId ?? null),
    queryFn: () => getQuizProgress(attempt.studentId ?? null),
  });
  const isFirstResult = progressQuery.data?.totalAttempts === 1;
  const startHere = [...result.topics]
    .filter((topic) => topic.accuracyPercent < WEAK_BELOW_PERCENT)
    .sort((a, b) => a.accuracyPercent - b.accuracyPercent || b.attempted - a.attempted)[0];

  const missed = review.filter((question) => question.yourAnswer && !question.isCorrect).length;

  const mixed = (attempt.subjects?.length ?? 0) > 1;
  const base = {
    subjectId: attempt.subject.id,
    subjectIds: mixed ? attempt.subjects!.map((subject) => subject.id) : undefined,
    examId: attempt.examId ?? undefined,
    studentId: attempt.studentId ?? undefined,
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="rounded-2xl border border-gray-200 dark:border-border bg-white dark:bg-card p-5 sm:p-6">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-muted-foreground">
          {attempt.mode === 'MOCK' ? 'Exam mode' : 'Practice'} · {attempt.subject.name}
        </p>
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-5">
          <ScoreRing percent={result.scorePercent} />
          <div>
            <h1 className="text-2xl font-bold text-brand dark:text-accent2-400">
              {result.correctCount} of {result.totalQuestions} correct
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-muted-foreground">
              {scoreMessage(result.scorePercent)}
            </p>
            {attempt.mode === 'MOCK' && <ExamIntegrity attemptId={attempt.id} />}
            {result.comparison && (
              <p
                className={cn(
                  'mt-2 inline-flex items-center gap-1.5 text-sm font-medium',
                  result.comparison.changePoints > 0
                    ? toneClasses.good.text
                    : result.comparison.changePoints < 0
                      ? toneClasses.weak.text
                      : 'text-gray-600 dark:text-muted-foreground',
                )}
              >
                {result.comparison.changePoints > 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : result.comparison.changePoints < 0 ? (
                  <TrendingDown className="w-4 h-4" />
                ) : (
                  <Minus className="w-4 h-4" />
                )}
                {result.comparison.changePoints === 0
                  ? `Same as last time (${result.comparison.previousScorePercent}%)`
                  : `${result.comparison.changePoints > 0 ? '+' : ''}${result.comparison.changePoints} points vs last time (${result.comparison.previousScorePercent}%)`}
              </p>
            )}
            {result.timedOut && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                <Clock className="w-3.5 h-3.5" /> This was submitted after the time limit.
              </p>
            )}
          </div>
        </div>

        {result.subjects && result.subjects.length > 1 && (
          <ul className="mt-5 grid gap-2 border-t border-gray-100 pt-4 dark:border-border sm:grid-cols-2" aria-label="Score by subject">
            {result.subjects.map((subject) => (
              <li key={subject.id} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/5">
                <span className="truncate text-sm font-medium text-gray-900 dark:text-foreground">{subject.name}</span>
                <span className={cn('shrink-0 text-sm font-semibold tabular-nums', toneClasses[scoreTone(subject.scorePercent)].text)}>
                  {subject.correct}/{subject.attempted} · {subject.scorePercent}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {missed > 0 && (
        <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-muted-foreground">
          <CalendarClock className="h-4 w-4 shrink-0 text-brand dark:text-accent2-400" aria-hidden />
          The {missed === 1 ? 'question' : `${missed} questions`} you missed will be ready to try again tomorrow.
        </p>
      )}

      {isFirstResult && (
        <section className="rounded-3xl bg-brand p-6 text-white sm:p-8" aria-labelledby="start-here-heading">
          <p className="text-sm font-semibold text-accent2-300">Start here</p>
          {startHere ? (
            <>
              <h2 id="start-here-heading" className="mt-1 text-2xl font-bold tracking-tight">
                Your weakest topic is {startHere.name}
              </h2>
              <p className="mt-2 leading-7 text-white/80">
                You got {startHere.correct} of {startHere.attempted} right, so this is the best place to start.
              </p>
              <Button
                variant="secondary"
                className="mt-5 h-12 px-6 text-base"
                disabled={start.isPending}
                onClick={() =>
                  start.mutate({
                    subjectId: startHere.subjectId ?? attempt.subject.id,
                    examId: attempt.examId ?? undefined,
                    studentId: attempt.studentId ?? undefined,
                    topicIds: [startHere.topicId],
                    count: 10,
                    mode: 'PRACTICE',
                  })
                }
              >
                <Target className="mr-2 h-4 w-4" />
                {start.isPending ? 'Starting…' : `Practise ${startHere.name}`}
              </Button>
            </>
          ) : (
            <>
              <h2 id="start-here-heading" className="mt-1 text-2xl font-bold tracking-tight">
                Great start, no weak topics in this quiz
              </h2>
              <p className="mt-2 leading-7 text-white/80">Try another subject to see where you need the most help.</p>
              <Button asChild variant="secondary" className="mt-5 h-12 px-6 text-base">
                <Link href={practicePath}>Choose a subject</Link>
              </Button>
            </>
          )}
        </section>
      )}

      {result.retake && <RetakeComparison retake={result.retake} />}

      {!isFirstResult && <RewardsStrip studentId={attempt.studentId ?? null} />}

      <DiagnosisCard attemptId={attempt.id} />

      <section className="rounded-2xl border border-gray-200 dark:border-border bg-white dark:bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-4">
          How you did by topic
        </h2>
        <ul className="space-y-3">
          {sortedTopics.map((topic) => {
            const tone = toneClasses[scoreTone(topic.accuracyPercent)];
            return (
              <li key={topic.topicId}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-gray-800 dark:text-foreground">{topic.name}</span>
                  <span className={cn('tabular-nums font-semibold', tone.text)}>
                    {topic.correct}/{topic.attempted} · {topic.accuracyPercent}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', tone.bar)}
                    style={{ width: `${topic.accuracyPercent}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="bg-brand p-5 text-white dark:bg-accent2-500 dark:text-brand sm:p-6" aria-labelledby="result-next-step">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent2-300 dark:text-brand/65">
          Practise
        </p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="result-next-step" className="text-xl font-semibold">
              {weakTopicIds.length > 0 ? 'Practise your weak topics' : 'Keep going'}
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-white/75 dark:text-brand/70">
              {weakTopicIds.length > 0
                ? 'Practise ten questions drawn from the topics that need the most work.'
                : 'Take another question set when you are ready and compare the result.'}
            </p>
          </div>
          {weakTopicIds.length > 0 && (
            <Button
              variant="secondary"
              className="h-11 shrink-0 px-5"
              disabled={start.isPending}
              onClick={() =>
                start.mutate({ ...base, topicIds: weakTopicIds, count: 10, mode: 'PRACTICE' })
              }
            >
              <Target className="mr-2 h-4 w-4" /> Practise weak topics
            </Button>
          )}
        </div>
        <div className="mt-5 flex flex-wrap gap-2 border-t border-white/15 pt-4 dark:border-brand/15">
          <Button
            variant="outline"
            className="h-10 border-white/30 bg-transparent px-4 text-white hover:bg-white/10 hover:text-white dark:border-brand/30 dark:text-brand dark:hover:bg-brand/10 dark:hover:text-brand"
            disabled={start.isPending}
            title="New questions on the same topics, compared with this result"
            onClick={() =>
              start.mutate({
                ...base,
                count: attempt.totalQuestions,
                mode: 'PRACTICE',
                retakeOfAttemptId: attempt.id,
              })
            }
          >
            <BadgeCheck className="mr-2 h-4 w-4" />
            {weakTopicIds.length > 0 ? 'Test your weak topics again' : 'Test yourself again'}
          </Button>
          <Button
            variant="outline"
            className="h-10 border-white/30 bg-transparent px-4 text-white hover:bg-white/10 hover:text-white dark:border-brand/30 dark:text-brand dark:hover:bg-brand/10 dark:hover:text-brand"
            disabled={start.isPending}
            onClick={() =>
              start.mutate({
                ...base,
                count: Math.max(5, attempt.totalQuestions),
                mode: attempt.mode,
              })
            }
          >
            <RotateCcw className="mr-2 h-4 w-4" /> {mixed ? 'Take this mix again' : 'Test this subject again'}
          </Button>
          <Button asChild variant="ghost" className="h-10 px-4 text-white hover:bg-white/10 hover:text-white dark:text-brand dark:hover:bg-brand/10 dark:hover:text-brand">
            <Link href={practicePath}>Back to practice</Link>
          </Button>
        </div>
      </section>

      <QuizReview attemptId={attempt.id} review={review} />
    </div>
  );
}
