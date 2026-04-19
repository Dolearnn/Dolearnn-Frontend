'use client';

import { useEffect, useMemo, useState } from 'react';
import BadgeTile from '@/components/dashboard/BadgeTile';
import ChildSwitcher from '@/components/dashboard/ChildSwitcher';
import GoalCard from '@/components/dashboard/GoalCard';
import JourneyMap from '@/components/dashboard/JourneyMap';
import PageHeader from '@/components/dashboard/PageHeader';
import SkillsRadarChart from '@/components/dashboard/SkillsRadarChart';
import StreakCard from '@/components/dashboard/StreakCard';
import {
  familyBadges,
  familyChildren,
  familySessionsForChild,
} from '@/lib/store/family';
import type { Child, Session } from '@/lib/types';

const DEFAULT_SUBJECTS = ['Maths', 'English', 'Science', 'Reading', 'Problem Solving'];

export default function FamilyLearningPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const list = familyChildren();
    setChildren(list);
    setActiveId(list[0]?.id ?? null);
  }, []);

  const active = useMemo(
    () => children.find((c) => c.id === activeId) ?? children[0],
    [children, activeId],
  );

  const sessions: Session[] = useMemo(
    () => (active ? familySessionsForChild(active.id) : []),
    [active],
  );

  const completed = sessions.filter((s) => s.status === 'Completed');
  const sessionsDone = completed.length;
  const allBadges = familyBadges();

  const radarData = useMemo(() => {
    const bySubject = new Map<string, number>();
    for (const subj of DEFAULT_SUBJECTS) bySubject.set(subj, 2);
    for (const s of completed) {
      const current = bySubject.get(s.subject) ?? 2;
      bySubject.set(s.subject, Math.min(10, current + 2));
    }
    return Array.from(bySubject, ([subject, level]) => ({ subject, level }));
  }, [completed]);

  if (!active) {
    return <p className="text-sm text-gray-400 dark:text-muted-foreground">Loading…</p>;
  }

  const earnedIds = new Set(active.badges);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learning journey"
        description={`How ${active.fullName.split(' ')[0]} is growing — goals, streaks, strengths and badges.`}
      />

      <ChildSwitcher
        students={children}
        activeId={active.id}
        onChange={setActiveId}
      />

      <JourneyMap sessionsCompleted={sessionsDone} />

      <div className="grid lg:grid-cols-2 gap-4">
        <GoalCard goal={active.goal} />
        <StreakCard streak={active.streak} />
      </div>

      <SkillsRadarChart data={radarData} />

      <section>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90 mb-3">Badges</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {allBadges.map((b) => (
            <BadgeTile key={b.id} badge={b} earned={earnedIds.has(b.id)} />
          ))}
        </div>
      </section>
    </div>
  );
}
