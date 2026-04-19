'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CreditCard,
  Flame,
  Plus,
  Video,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChildSwitcher from '@/components/dashboard/ChildSwitcher';
import FeedbackCard from '@/components/dashboard/FeedbackCard';
import PageHeader from '@/components/dashboard/PageHeader';
import SessionRow from '@/components/dashboard/SessionRow';
import StatTile from '@/components/dashboard/StatTile';
import {
  familyChildren,
  familyParent,
  familySessionsForChild,
  familyTeacher,
} from '@/lib/store/family';
import type { Child, Parent, Session } from '@/lib/types';

export default function FamilyHome() {
  const [parent, setParent] = useState<Parent | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setParent(familyParent());
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
  const upcoming = sessions
    .filter((s) => s.status === 'Upcoming')
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const completed = sessions.filter((s) => s.status === 'Completed');
  const nextSession = upcoming[0];
  const teacher = nextSession ? familyTeacher(nextSession.teacherId) : null;

  if (!parent || !active) {
    return <p className="text-sm text-gray-400 dark:text-muted-foreground">Loading…</p>;
  }

  const sessionsDone = completed.length;
  const totalSpent = sessions
    .filter((s) => s.status === 'Completed')
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hi, ${parent.name.split(' ')[0]}`}
        description="Your family&apos;s learning at a glance."
        action={
          <Link href="/family/children/new">
            <Button variant="outline" className="rounded-full">
              <Plus className="w-4 h-4 mr-2" />
              Add child
            </Button>
          </Link>
        }
      />

      <ChildSwitcher
        students={children}
        activeId={active.id}
        onChange={setActiveId}
      />

      {active.status === 'Deactivated' && (
        <Link
          href={`/family/children/${active.id}`}
          className="block rounded-2xl border border-amber-100 bg-amber-50 p-4 transition hover:border-amber-200"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                {active.fullName.split(' ')[0]}&apos;s lessons are paused
              </p>
              <p className="text-xs text-amber-800 mt-1">
                Click to review the reason or activate this student again.
              </p>
            </div>
          </div>
        </Link>
      )}

      {/* Next session hero card */}
      {nextSession && teacher ? (
        <section className="bg-brand text-white rounded-3xl p-6 lg:p-8 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-accent2-500/20" />
          <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-white/5" />
          <div className="relative z-10">
            <p className="text-xs uppercase tracking-wide text-accent2-400 font-semibold mb-2">
              Next session
            </p>
            <h2 className="text-2xl lg:text-3xl font-bold mb-1">
              {nextSession.subject} with {teacher.name}
            </h2>
            <p className="text-white/80 text-sm mb-6">
              {new Date(nextSession.startsAt).toLocaleString(undefined, {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              · {nextSession.durationMins} min · Live on Google Meet
            </p>
            <div className="flex flex-wrap gap-3">
              {nextSession.meetLink ? (
              <Link href={nextSession.meetLink} target="_blank" rel="noreferrer">
                <Button className="bg-accent2-500 text-brand hover:bg-accent2-400 rounded-full">
                  <Video className="w-4 h-4 mr-2" />
                  Join session
                </Button>
              </Link>
              ) : (
                <Button
                  className="bg-white/10 text-white rounded-full"
                  disabled
                >
                  Awaiting admin link
                </Button>
              )}
              <Link href="/family/sessions">
                <Button
                  variant="outline"
                  className="rounded-full border-white/30 text-white bg-transparent hover:bg-white/10"
                >
                  View all sessions
                </Button>
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-accent2-50 border border-accent2-100 rounded-3xl p-6 lg:p-8 text-center">
          <p className="text-sm text-brand font-semibold">
            No sessions scheduled yet
          </p>
          <p className="text-xs text-gray-600 dark:text-muted-foreground mt-1">
            Once intake is reviewed, our team will assign a teacher and book
            your first session.
          </p>
        </section>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          icon={CalendarDays}
          label="Sessions done"
          value={sessionsDone}
          sub={`for ${active.fullName.split(' ')[0]}`}
        />
        <StatTile
          icon={Wallet}
          label="Spent"
          value={`$${totalSpent}`}
          sub="on completed sessions"
        />
        <StatTile
          icon={Flame}
          label="Streak"
          value={`${active.streak.current}w`}
          sub={`longest ${active.streak.longest}w`}
        />
        <StatTile
          icon={BookOpen}
          label="Badges"
          value={active.badges.length}
          sub="earned so far"
        />
      </div>

      {/* Upcoming + feedback */}
      <div className="grid lg:grid-cols-2 gap-4">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90">
              Upcoming sessions
            </h2>
            <Link
              href="/family/sessions"
              className="text-xs text-brand font-medium"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {upcoming.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-muted-foreground">Nothing scheduled.</p>
            ) : (
              upcoming.slice(0, 3).map((s) => <SessionRow key={s.id} session={s} />)
            )}
          </div>
        </section>
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90">
              Latest feedback
            </h2>
            <Link
              href="/family/sessions"
              className="text-xs text-brand font-medium"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {completed.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-muted-foreground">
                Feedback will appear after the first session.
              </p>
            ) : (
              completed
                .slice(0, 2)
                .map((s) => <FeedbackCard key={s.id} session={s} />)
            )}
          </div>
        </section>
      </div>

      {/* Quick links */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <QuickLink
          href="/family/learning"
          icon={BookOpen}
          label="Learning journey"
          sub="Badges, goals and progress"
        />
        <QuickLink
          href="/family/payments"
          icon={CreditCard}
          label="Payments"
          sub="Plans and receipts"
        />
        <QuickLink
          href="/family/children"
          icon={Plus}
          label="Manage children"
          sub="Profiles and intake forms"
        />
      </section>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
  sub,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-4 hover:border-brand transition flex items-center gap-3"
    >
      <div className="w-10 h-10 rounded-lg bg-accent2-100 text-brand flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-foreground">{label}</p>
        <p className="text-xs text-gray-500 dark:text-muted-foreground">{sub}</p>
      </div>
    </Link>
  );
}
