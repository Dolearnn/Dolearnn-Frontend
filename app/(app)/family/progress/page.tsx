'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import StatTile from '@/components/dashboard/StatTile';
import NextActions from '@/components/quiz/NextActions';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { familyKeys, listFamilyStudents } from '@/lib/api/family';
import {
  getQuizProgress,
  quizKeys,
  type QuizProgressSubject,
  type QuizProgressTopic,
} from '@/lib/api/quiz';
import { scoreTone, toneClasses } from '@/lib/quiz';
import { cn } from '@/lib/utils';

const SELF = 'self';

function ChangeChip({ points }: { points: number | null }) {
  if (points === null) {
    return (
      <span className="rounded-full bg-gray-100 dark:bg-white/10 px-3 py-1 text-xs font-medium text-gray-600 dark:text-muted-foreground">
        Take it again to compare
      </span>
    );
  }

  const Icon = points > 0 ? TrendingUp : points < 0 ? TrendingDown : Minus;
  const tone =
    points > 0 ? toneClasses.good.soft : points < 0 ? toneClasses.weak.soft : toneClasses.fair.soft;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold tabular-nums',
        tone,
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {points > 0 ? '+' : ''}
      {points} points
    </span>
  );
}

// Scores over time, oldest to newest. Axis is fixed at 0-100 so a flat line
// cannot be mistaken for a big swing.
function Sparkline({ scores }: { scores: number[] }) {
  if (scores.length < 2) return null;

  const width = 160;
  const height = 44;
  const pad = 4;
  const step = (width - pad * 2) / (scores.length - 1);
  const points = scores.map((score, index) => {
    const x = pad + index * step;
    const y = pad + (1 - score / 100) * (height - pad * 2);
    return [x, y] as const;
  });
  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-11 w-40 text-brand dark:text-accent2-400"
      role="img"
      aria-label={`Scores over the last ${scores.length} attempts: ${scores.join(', ')} percent`}
    >
      <polyline
        points={points.map(([x, y]) => `${x},${y}`).join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill="currentColor" />
    </svg>
  );
}

function TopicRow({ topic }: { topic: QuizProgressTopic }) {
  const Icon =
    topic.change === 'improved' ? TrendingUp : topic.change === 'declined' ? TrendingDown : Minus;
  const tone =
    topic.change === 'improved'
      ? toneClasses.good.text
      : topic.change === 'declined'
        ? toneClasses.weak.text
        : 'text-gray-500 dark:text-muted-foreground';

  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-foreground truncate">
          {topic.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-muted-foreground">
          {topic.attempts} attempts
        </p>
      </div>
      <div className={cn('flex items-center gap-2 shrink-0 text-sm tabular-nums', tone)}>
        <span className="text-gray-500 dark:text-muted-foreground">{topic.baselinePercent}%</span>
        <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="font-semibold">{topic.latestPercent}%</span>
        <Icon className="w-4 h-4" />
      </div>
    </li>
  );
}

function SubjectCard({ subject }: { subject: QuizProgressSubject }) {
  const latestTone = toneClasses[scoreTone(subject.latestPercent)];
  const shownTopics = subject.topics.slice(0, 8);

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-border bg-white dark:bg-card overflow-hidden">
      <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground">
            {subject.subject.name}
          </h2>
          <p className="text-xs text-gray-500 dark:text-muted-foreground mt-0.5">
            {subject.attempts} {subject.attempts === 1 ? 'quiz' : 'quizzes'} taken
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="flex items-baseline gap-2 tabular-nums">
              <span className="text-sm text-gray-500 dark:text-muted-foreground">
                {subject.baselinePercent}%
              </span>
              <ArrowRight className="w-4 h-4 text-gray-400 self-center" />
              <span className={cn('text-3xl font-bold', latestTone.text)}>
                {subject.latestPercent}%
              </span>
            </div>
            <ChangeChip points={subject.changePoints} />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-muted-foreground">
            First quiz → latest quiz
          </p>
        </div>
        <Sparkline scores={subject.trend.map((point) => point.scorePercent)} />
      </div>

      {shownTopics.length > 0 && (
        <div className="border-t border-gray-100 dark:border-border">
          <p className="px-4 pt-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-muted-foreground">
            Topics practised more than once
          </p>
          <ul className="divide-y divide-gray-100 dark:divide-border">
            {shownTopics.map((topic) => (
              <TopicRow key={topic.topicId} topic={topic} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default function FamilyProgressPage() {
  const [learner, setLearner] = useState<string>(SELF);
  const studentId = learner === SELF ? null : learner;

  const studentsQuery = useQuery({
    queryKey: familyKeys.students,
    queryFn: listFamilyStudents,
  });
  const progressQuery = useQuery({
    queryKey: quizKeys.progress(studentId),
    queryFn: () => getQuizProgress(studentId),
  });

  const children = studentsQuery.data ?? [];
  const progress = progressQuery.data;

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Progress"
        description="See whether practice is paying off: your first quiz compared with your latest, by subject and topic."
        action={
          children.length > 0 ? (
            <div className="w-full sm:w-56">
              <Select value={learner} onValueChange={setLearner}>
                <SelectTrigger aria-label="Whose progress" className="bg-white dark:bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELF}>Myself</SelectItem>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : undefined
        }
      />

      {progressQuery.isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : progressQuery.isError || !progress ? (
        <p className="text-sm text-red-600">
          {progressQuery.error instanceof Error
            ? progressQuery.error.message
            : 'Could not load progress.'}
        </p>
      ) : progress.totalAttempts === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-border bg-white dark:bg-card p-10 text-center">
          <TrendingUp className="w-8 h-8 mx-auto text-gray-400 dark:text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-gray-700 dark:text-foreground/90">
            No quizzes yet
          </p>
          <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1 mb-4">
            Take a quiz, then take another later. Your progress shows up here.
          </p>
          <Button asChild className="h-10 px-5 rounded-xl">
            <Link href="/family/quiz">Start a quiz</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatTile icon={TrendingUp} label="Quizzes taken" value={progress.totalAttempts} />
            <StatTile
              icon={TrendingUp}
              label="Subjects improved"
              value={`${progress.summary.subjectsImproved} of ${progress.summary.subjectsCompared}`}
              sub={
                progress.summary.subjectsCompared === 0
                  ? 'Needs two quizzes in a subject'
                  : 'Latest score above first score'
              }
              accent
            />
            <StatTile
              icon={TrendingUp}
              label="Topics improved"
              value={progress.summary.topicsImproved}
              sub="Up 10+ points since first time"
            />
          </div>

          <NextActions studentId={studentId} />

          {progress.subjects.map((subject) => (
            <SubjectCard key={subject.subject.id} subject={subject} />
          ))}

          <p className="text-xs text-gray-500 dark:text-muted-foreground">
            Scores come from different question sets each time, so small changes can be luck.
            Look for a steady direction over several quizzes.
          </p>
        </div>
      )}
    </div>
  );
}
