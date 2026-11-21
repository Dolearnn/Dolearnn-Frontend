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
  const tone = scoreTone(percent);
  const stroke = tone === 'good' ? 'stroke-accent2-400' : tone === 'fair' ? 'stroke-amber-400' : 'stroke-red-400';

  return (
    <div className="relative h-32 w-32 shrink-0" role="img" aria-label={`Score ${percent} percent`}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="10" className="stroke-white/15" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
          className={cn('transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none', stroke)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-[34px] font-extrabold tabular-nums text-white">
        {percent}
        <span className="text-lg">%</span>
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
    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-accent2-300">
      <ShieldCheck className="h-3.5 w-3.5" /> No warnings during this exam
    </p>
  ) : (
    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-medium text-amber-200">
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
    <div className="mx-auto max-w-3xl space-y-4">
      <section
        aria-labelledby="result-heading"
        className="relative overflow-hidden rounded-[28px] bg-brand p-5 text-white shadow-[0_18px_40px_-24px_rgba(4,66,114,0.9)] dark:bg-[hsl(208,70%,16%)] sm:p-7"
      >
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-accent2-400/25 blur-3xl" />
        <p className="relative text-sm text-white/70">
          {attempt.mode === 'MOCK' ? 'Exam mode' : 'Practice'}, {attempt.subject.name}
        </p>
        <div className="relative mt-4 flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <ScoreRing percent={result.scorePercent} />
          <div className="min-w-0">
            <h1 id="result-heading" className="font-display text-2xl font-extrabold">
              <span className="tabular-nums">{result.correctCount}</span> of{' '}
              <span className="tabular-nums">{result.totalQuestions}</span> correct
            </h1>
            <p className="mt-1 text-sm leading-6 text-white/75">{scoreMessage(result.scorePercent)}</p>
            {attempt.mode === 'MOCK' && <ExamIntegrity attemptId={attempt.id} />}
            {result.comparison && (
              <p
                className={cn(
                  'mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold tabular-nums',
                  result.comparison.changePoints > 0
                    ? 'bg-accent2-400 text-brand-700'
                    : result.comparison.changePoints < 0
                      ? 'bg-red-400/20 text-red-200'
                      : 'bg-white/10 text-white/80',
                )}
              >
                {result.comparison.changePoints > 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : result.comparison.changePoints < 0 ? (
                  <TrendingDown className="h-4 w-4" />
                ) : (
                  <Minus className="h-4 w-4" />
                )}
                {result.comparison.changePoints === 0
                  ? `Same as last time (${result.comparison.previousScorePercent}%)`
                  : `${result.comparison.changePoints > 0 ? '+' : ''}${result.comparison.changePoints} points vs last time (${result.comparison.previousScorePercent}%)`}
              </p>
            )}
            {result.timedOut && (
              <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-amber-200 sm:justify-start">
                <Clock className="h-3.5 w-3.5" /> This was submitted after the time limit.
              </p>
            )}
          </div>
        </div>

        {result.subjects && result.subjects.length > 1 && (
          <ul className="relative mt-5 grid gap-2 border-t border-white/15 pt-4 sm:grid-cols-2" aria-label="Score by subject">
            {result.subjects.map((subject) => (
              <li key={subject.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/10 px-3 py-2.5">
                <span className="truncate text-sm font-medium">{subject.name}</span>
                <span className="shrink-0 text-sm tabular-nums text-white/70">
                  {subject.correct}/{subject.attempted}{' '}
                  <strong className="ml-1 font-display text-base font-bold text-white">{subject.scorePercent}%</strong>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {missed > 0 && (
        <p className="flex items-center gap-2 px-1 text-sm text-gray-600 dark:text-muted-foreground">
          <CalendarClock className="h-4 w-4 shrink-0 text-brand dark:text-accent2-400" aria-hidden />
          The {missed === 1 ? 'question' : `${missed} questions`} you missed will be ready to try again tomorrow.
        </p>
      )}

      {isFirstResult && (
        <section className="rounded-3xl bg-accent2-100 p-5 text-brand-700 dark:bg-accent2-500/15 dark:text-foreground sm:p-7" aria-labelledby="start-here-heading">
          <p className="text-sm font-semibold text-brand dark:text-accent2-400">Start here</p>
          {startHere ? (
            <>
              <h2 id="start-here-heading" className="mt-1 font-display text-xl font-bold tracking-tight sm:text-2xl">
                Your weakest topic is {startHere.name}
              </h2>
              <p className="mt-2 leading-7 text-brand-700/80 dark:text-muted-foreground">
                You got {startHere.correct} of {startHere.attempted} right, so this is the best place to start.
              </p>
              <Button
                className="mt-5 h-12 w-full rounded-2xl px-6 text-[15px] sm:w-auto"
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
              <h2 id="start-here-heading" className="mt-1 font-display text-xl font-bold tracking-tight sm:text-2xl">
                Great start, no weak topics in this quiz
              </h2>
              <p className="mt-2 leading-7 text-brand-700/80 dark:text-muted-foreground">Try another subject to see where you need the most help.</p>
              <Button asChild className="mt-5 h-12 w-full rounded-2xl px-6 text-[15px] sm:w-auto">
                <Link href={practicePath}>Choose a subject</Link>
              </Button>
            </>
          )}
        </section>
      )}

      {result.retake && <RetakeComparison retake={result.retake} />}

      {!isFirstResult && <RewardsStrip studentId={attempt.studentId ?? null} />}

      <DiagnosisCard attemptId={attempt.id} />

      <section className="rounded-3xl border border-gray-200/80 bg-white p-5 dark:border-border dark:bg-card sm:p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-gray-950 dark:text-foreground">
          How you did by topic
        </h2>
        <ul className="space-y-4">
          {sortedTopics.map((topic) => {
            const tone = toneClasses[scoreTone(topic.accuracyPercent)];
            return (
              <li key={topic.topicId}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-medium text-gray-800 dark:text-foreground">{topic.name}</span>
                  <span className="shrink-0 tabular-nums text-gray-500 dark:text-muted-foreground">
                    {topic.correct}/{topic.attempted}{' '}
                    <strong className={cn('ml-1 font-display text-base font-bold', tone.text)}>{topic.accuracyPercent}%</strong>
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

      <section
        className="rounded-3xl border border-gray-200/80 bg-white p-5 dark:border-border dark:bg-card sm:p-6"
        aria-labelledby="result-next-step"
      >
        <h2 id="result-next-step" className="font-display text-lg font-bold text-gray-950 dark:text-foreground">
          {weakTopicIds.length > 0 ? 'Practise your weak topics' : 'Keep going'}
        </h2>
        <p className="mt-1 max-w-xl text-sm leading-6 text-gray-600 dark:text-muted-foreground">
          {weakTopicIds.length > 0
            ? 'Ten questions drawn from the topics that need the most work.'
            : 'Take another question set when you are ready and compare the result.'}
        </p>
        <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
          {weakTopicIds.length > 0 && (
            <Button
              className="h-12 rounded-2xl px-5 text-[15px]"
              disabled={start.isPending}
              onClick={() =>
                start.mutate({ ...base, topicIds: weakTopicIds, count: 10, mode: 'PRACTICE' })
              }
            >
              <Target className="mr-2 h-4 w-4" /> Practise weak topics
            </Button>
          )}
          <Button
            variant="outline"
            className="h-12 rounded-2xl px-5"
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
            className="h-12 rounded-2xl px-5"
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
          <Button asChild variant="ghost" className="h-12 rounded-2xl px-5">
            <Link href={practicePath}>Back to practice</Link>
          </Button>
        </div>
      </section>

      <QuizReview attemptId={attempt.id} review={review} />
    </div>
  );
}
