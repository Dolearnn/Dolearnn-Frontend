'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import ChildSwitcher from '@/components/dashboard/ChildSwitcher';
import FeedbackCard from '@/components/dashboard/FeedbackCard';
import PageHeader from '@/components/dashboard/PageHeader';
import SessionRow from '@/components/dashboard/SessionRow';
import StatTile from '@/components/dashboard/StatTile';
import { DashboardHomeSkeleton } from '@/components/dashboard/Skeletons';
import { Button } from '@/components/ui/button';
import { isSafeMeetingLink } from '@/lib/urls';
import { useToast } from '@/hooks/use-toast';
import {
  confirmFamilySessionAttendance,
  familyKeys,
  getFamilyProfile,
  listFamilySessions,
  listFamilyStudents,
  requestFamilySessionCancellation,
} from '@/lib/api/family';
import type { Child, Session } from '@/lib/types';

const EMPTY_CHILDREN: Child[] = [];
const EMPTY_SESSIONS: Session[] = [];
const ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? 'dolearnnn@gmail.com';

export default function FamilyHome() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: familyKeys.profile,
    queryFn: getFamilyProfile,
  });
  const childrenQuery = useQuery({
    queryKey: familyKeys.students,
    queryFn: listFamilyStudents,
  });
  const sessionsQuery = useQuery({
    queryKey: familyKeys.sessions,
    queryFn: listFamilySessions,
  });

  const parent = profileQuery.data;
  const children = childrenQuery.data ?? EMPTY_CHILDREN;
  const allSessions = sessionsQuery.data ?? EMPTY_SESSIONS;
  const isLoading =
    profileQuery.isLoading || childrenQuery.isLoading || sessionsQuery.isLoading;
  const isError =
    profileQuery.isError || childrenQuery.isError || sessionsQuery.isError;

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

  const attendanceMutation = useMutation({
    mutationFn: confirmFamilySessionAttendance,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: familyKeys.sessions });
      toast({
        title: 'Attendance confirmed',
        description: 'Admin can now include this class in the lesson record.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Could not confirm attendance',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const cancellationMutation = useMutation({
    mutationFn: ({
      sessionId,
      reason,
    }: {
      sessionId: string;
      reason: string;
    }) => requestFamilySessionCancellation(sessionId, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: familyKeys.sessions });
      toast({
        title: 'Cancellation requested',
        description: 'Admin will review the request.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Could not request cancellation',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return <DashboardHomeSkeleton />;
  }

  if (isError || !parent) {
    return (
      <div className="space-y-6">
        <PageHeader title="Family dashboard" description="" />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          We could not load your family dashboard right now. Please try again.
        </div>
      </div>
    );
  }

  if (!active) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={`Hi, ${parent.name.split(' ')[0]}`}
          description="Your family's learning at a glance."
          action={
            <a href={`mailto:${ADMIN_EMAIL}`}>
              <Button variant="outline" className="rounded-full">
                Contact admin
              </Button>
            </a>
          }
        />
        <section className="bg-accent2-50 border border-accent2-100 rounded-3xl p-6 lg:p-8 text-center">
          <p className="text-sm text-brand font-semibold">
            Waiting for your first student profile
          </p>
          <p className="text-xs text-gray-600 dark:text-muted-foreground mt-1">
            Admin creates student profiles after payment confirmation, then you
            can review and update the details here.
          </p>
        </section>
      </div>
    );
  }

  const upcoming = sessions
    .filter((s) => s.status === 'Upcoming')
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const completed = sessions.filter((s) => s.status === 'Completed');
  const nextSession = upcoming[0];
  const sessionsDone = completed.length;
  const totalSpent = completed.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hi, ${parent.name.split(' ')[0]}`}
        description="Your family's learning at a glance."
        action={
          <a href={`mailto:${ADMIN_EMAIL}`}>
            <Button variant="outline" className="rounded-full">
              Contact admin
            </Button>
          </a>
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

      {nextSession ? (
        <section className="bg-brand text-white rounded-3xl p-6 lg:p-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-28 bg-accent2-500/20" />
          <div className="relative z-10">
            <p className="text-xs uppercase tracking-wide text-accent2-400 font-semibold mb-2">
              Next session
            </p>
            <h2 className="text-2xl lg:text-3xl font-bold mb-1">
              {nextSession.subject} with{' '}
              {nextSession.teacherName ?? 'your teacher'}
            </h2>
            <p className="text-white/80 text-sm mb-6">
              {new Date(nextSession.startsAt).toLocaleString(undefined, {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              - {nextSession.durationMins} min
            </p>
            <div className="flex flex-wrap gap-3">
              {isSafeMeetingLink(nextSession.meetLink) ? (
                <Link
                  href={nextSession.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
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
          value={`$${totalSpent.toFixed(0)}`}
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
              <p className="text-xs text-gray-500 dark:text-muted-foreground">
                Nothing scheduled.
              </p>
            ) : (
              upcoming.slice(0, 3).map((s) => (
                <SessionRow
                  key={s.id}
                  session={s}
                  onConfirmHeld={async (sessionId) => {
                    await attendanceMutation.mutateAsync(sessionId);
                  }}
                  onRequestCancellation={async (sessionId, reason) => {
                    await cancellationMutation.mutateAsync({
                      sessionId,
                      reason,
                    });
                  }}
                />
              ))
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
                .filter((s) => s.note || s.noteId)
                .slice(0, 2)
                .map((s) => <FeedbackCard key={s.id} session={s} />)
            )}
            {completed.length > 0 &&
              completed.filter((s) => s.note || s.noteId).length === 0 && (
                <p className="text-xs text-gray-500 dark:text-muted-foreground">
                  Feedback is pending for completed sessions.
                </p>
              )}
          </div>
        </section>
      </div>

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
        <p className="text-sm font-semibold text-gray-900 dark:text-foreground">
          {label}
        </p>
        <p className="text-xs text-gray-500 dark:text-muted-foreground">{sub}</p>
      </div>
    </Link>
  );
}
