'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import BadgeTile from '@/components/dashboard/BadgeTile';
import ChildSwitcher from '@/components/dashboard/ChildSwitcher';
import GoalCard from '@/components/dashboard/GoalCard';
import JourneyMap from '@/components/dashboard/JourneyMap';
import PageHeader from '@/components/dashboard/PageHeader';
import SkillsRadarChart from '@/components/dashboard/SkillsRadarChart';
import StreakCard from '@/components/dashboard/StreakCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  familyKeys,
  listFamilySessions,
  listFamilyStudents,
  saveFamilyStudentGoal,
} from '@/lib/api/family';
import type { Badge, Child, Session, Streak } from '@/lib/types';

const EMPTY_CHILDREN: Child[] = [];
const EMPTY_SESSIONS: Session[] = [];
const DEFAULT_SUBJECTS = ['Maths', 'English', 'Science', 'Reading', 'Problem Solving'];

const BADGE_TEMPLATES: Badge[] = [
  {
    id: 'b_first_step',
    name: 'First Step',
    description: 'Completed the first session',
    icon: '1',
  },
  {
    id: 'b_five_sessions',
    name: 'Five Sessions',
    description: 'Completed five sessions',
    icon: '5',
  },
  {
    id: 'b_consistent',
    name: 'Consistent',
    description: 'Built a 3-week streak',
    icon: 'S',
  },
  {
    id: 'b_subject_star',
    name: 'Subject Star',
    description: 'Five sessions in one subject',
    icon: '*',
  },
  {
    id: 'b_feedback_ready',
    name: 'Feedback Ready',
    description: 'Teacher submitted a note',
    icon: 'N',
  },
  {
    id: 'b_champion',
    name: 'Champion',
    description: 'Completed twenty sessions',
    icon: '20',
  },
];

export default function FamilyLearningPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);

  const studentsQuery = useQuery({
    queryKey: familyKeys.students,
    queryFn: listFamilyStudents,
  });
  const sessionsQuery = useQuery({
    queryKey: familyKeys.sessions,
    queryFn: listFamilySessions,
  });

  const children = studentsQuery.data ?? EMPTY_CHILDREN;
  const allSessions = sessionsQuery.data ?? EMPTY_SESSIONS;

  useEffect(() => {
    if (activeId || children.length === 0) return;
    setActiveId(children[0].id);
  }, [activeId, children]);

  const active = useMemo(
    () => children.find((c) => c.id === activeId) ?? children[0],
    [children, activeId],
  );

  const sessions = useMemo(
    () => (active ? allSessions.filter((s) => s.childId === active.id) : []),
    [active, allSessions],
  );

  const completed = useMemo(
    () =>
      sessions
        .filter((s) => s.status === 'Completed')
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [sessions],
  );
  const sessionsDone = completed.length;
  const streak = useMemo(() => deriveWeeklyStreak(completed), [completed]);
  const badgeState = useMemo(
    () => deriveBadges(completed, streak),
    [completed, streak],
  );

  const radarData = useMemo(() => {
    const subjects = [
      ...(active?.intake?.subjects ?? []),
      active?.intake?.subject,
      ...DEFAULT_SUBJECTS,
    ].filter(Boolean) as string[];
    const bySubject = new Map<string, number>();

    for (const subject of subjects) {
      if (!bySubject.has(subject)) bySubject.set(subject, 2);
    }

    for (const session of completed) {
      const current = bySubject.get(session.subject) ?? 2;
      bySubject.set(session.subject, Math.min(10, current + 2));
    }

    return Array.from(bySubject, ([subject, level]) => ({ subject, level })).slice(
      0,
      6,
    );
  }, [active, completed]);

  const goalMutation = useMutation({
    mutationFn: ({
      studentId,
      title,
      targetDate,
      progress,
    }: {
      studentId: string;
      title: string;
      targetDate?: string;
      progress?: number;
    }) => saveFamilyStudentGoal(studentId, { title, targetDate, progress }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: familyKeys.students });
      toast({
        title: 'Goal saved',
        description: 'The learning goal has been updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Could not save goal',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  if (studentsQuery.isLoading || sessionsQuery.isLoading) {
    return <p className="text-sm text-gray-400 dark:text-muted-foreground">Loading...</p>;
  }

  if (studentsQuery.isError || sessionsQuery.isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Learning journey" description="" />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          We could not load the learning journey right now. Please try again.
        </div>
      </div>
    );
  }

  if (!active) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Learning journey"
          description="Goals, streaks, strengths and badges will appear after a child is added."
        />
        <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500 dark:bg-card dark:border-border dark:text-muted-foreground">
          No student profile has been created yet.
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learning journey"
        description={`How ${active.fullName.split(' ')[0]} is growing - goals, streaks, strengths and badges.`}
      />

      <ChildSwitcher
        students={children}
        activeId={active.id}
        onChange={setActiveId}
      />

      <JourneyMap sessionsCompleted={sessionsDone} />

      <div className="grid lg:grid-cols-2 gap-4">
        <GoalCard goal={active.goal} />
        <StreakCard streak={streak} />
      </div>

      <GoalEditor
        child={active}
        isSaving={goalMutation.isPending}
        onSubmit={async (input) => {
          await goalMutation.mutateAsync({
            studentId: active.id,
            ...input,
          });
        }}
      />

      <SkillsRadarChart data={radarData} />

      <section>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90 mb-3">
          Badges
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {badgeState.badges.map((badge) => (
            <BadgeTile
              key={badge.id}
              badge={badge}
              earned={badgeState.earnedIds.has(badge.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function GoalEditor({
  child,
  isSaving,
  onSubmit,
}: {
  child: Child;
  isSaving: boolean;
  onSubmit: (input: {
    title: string;
    targetDate?: string;
    progress?: number;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState(child.goal?.title ?? '');
  const [targetDate, setTargetDate] = useState(
    child.goal?.targetDate ? child.goal.targetDate.slice(0, 10) : '',
  );
  const [progress, setProgress] = useState(child.goal?.progress ?? 0);

  useEffect(() => {
    setTitle(child.goal?.title ?? '');
    setTargetDate(child.goal?.targetDate ? child.goal.targetDate.slice(0, 10) : '');
    setProgress(child.goal?.progress ?? 0);
  }, [child.goal, child.id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      title,
      targetDate: targetDate || undefined,
      progress,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-5 space-y-4"
    >
      <div>
        <p className="text-xs text-gray-500 dark:text-muted-foreground">
          Learning goal
        </p>
        <p className="font-semibold text-gray-900 dark:text-foreground">
          Set what {child.fullName.split(' ')[0]} is working towards
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_180px_160px]">
        <div className="space-y-2">
          <Label htmlFor="goal-title">Goal title</Label>
          <Input
            id="goal-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Pass Maths with an A"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="goal-date">Target date</Label>
          <Input
            id="goal-date"
            type="date"
            value={targetDate}
            onChange={(event) => setTargetDate(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="goal-progress">Progress</Label>
          <Input
            id="goal-progress"
            type="number"
            min={0}
            max={100}
            value={progress}
            onChange={(event) => setProgress(Number(event.target.value))}
          />
        </div>
      </div>

      <Button type="submit" disabled={isSaving} className="rounded-full">
        {isSaving ? 'Saving...' : 'Save goal'}
      </Button>
    </form>
  );
}

function deriveWeeklyStreak(completed: Session[]): Streak {
  if (completed.length === 0) {
    return { current: 0, longest: 0, lastActiveAt: new Date().toISOString() };
  }

  const weekIndexes = Array.from(
    new Set(completed.map((session) => weekIndex(session.startsAt))),
  ).sort((a, b) => a - b);
  let longest = 1;
  let running = 1;

  for (let index = 1; index < weekIndexes.length; index += 1) {
    if (weekIndexes[index] === weekIndexes[index - 1] + 1) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 1;
    }
  }

  return {
    current: running,
    longest,
    lastActiveAt: completed[completed.length - 1].startsAt,
  };
}

function weekIndex(value: string) {
  const date = new Date(value);
  const day = date.getUTCDay() || 7;
  const monday = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() - day + 1,
  );
  return Math.floor(monday / (7 * 24 * 60 * 60 * 1000));
}

function deriveBadges(completed: Session[], streak: Streak) {
  const earnedDates = new Map<string, string>();
  const subjectCounts = new Map<string, Session[]>();

  for (const session of completed) {
    const subjectSessions = subjectCounts.get(session.subject) ?? [];
    subjectSessions.push(session);
    subjectCounts.set(session.subject, subjectSessions);
  }

  if (completed[0]) earnedDates.set('b_first_step', completed[0].startsAt);
  if (completed[4]) earnedDates.set('b_five_sessions', completed[4].startsAt);
  if (completed[19]) earnedDates.set('b_champion', completed[19].startsAt);
  if (streak.longest >= 3) {
    earnedDates.set('b_consistent', streak.lastActiveAt);
  }
  if (completed.some((session) => session.note || session.noteId)) {
    earnedDates.set(
      'b_feedback_ready',
      completed.find((session) => session.note || session.noteId)?.startsAt ??
        streak.lastActiveAt,
    );
  }

  const subjectStar = Array.from(subjectCounts.values()).find(
    (subjectSessions) => subjectSessions.length >= 5,
  );
  if (subjectStar) {
    earnedDates.set('b_subject_star', subjectStar[4].startsAt);
  }

  const badges = BADGE_TEMPLATES.map((badge) => ({
    ...badge,
    earnedAt: earnedDates.get(badge.id),
  }));

  return {
    badges,
    earnedIds: new Set(earnedDates.keys()),
  };
}
