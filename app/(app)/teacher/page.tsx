'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  ClipboardList,
  Star,
  Users,
  Video,
  Wallet,
} from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import StatTile from '@/components/dashboard/StatTile';
import StudentSessionRow from '@/components/dashboard/StudentSessionRow';
import { DashboardHomeSkeleton } from '@/components/dashboard/Skeletons';
import { Button } from '@/components/ui/button';
import { isSafeMeetingLink } from '@/lib/urls';
import { useToast } from '@/hooks/use-toast';
import {
  confirmTeacherSessionAttendance,
  getTeacherProfile,
  listTeacherSessions,
  listTeacherStudents,
  requestTeacherSessionCancellation,
  teacherKeys,
} from '@/lib/api/teacher';
import { isSessionPayable, type Session } from '@/lib/types';
import { naira } from '@/lib/money';

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function TeacherHome() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const today = useMemo(() => new Date(), []);
  const profileQuery = useQuery({
    queryKey: teacherKeys.profile,
    queryFn: getTeacherProfile,
  });
  const sessionsQuery = useQuery({
    queryKey: teacherKeys.sessions,
    queryFn: listTeacherSessions,
  });
  const studentsQuery = useQuery({
    queryKey: teacherKeys.students,
    queryFn: listTeacherStudents,
  });

  const me = profileQuery.data;
  const sessions = sessionsQuery.data ?? EMPTY_SESSIONS;
  const students = studentsQuery.data ?? EMPTY_STUDENTS;
  const isLoading =
    profileQuery.isLoading || sessionsQuery.isLoading || studentsQuery.isLoading;
  const isError =
    profileQuery.isError || sessionsQuery.isError || studentsQuery.isError;

  const attendanceMutation = useMutation({
    mutationFn: confirmTeacherSessionAttendance,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: teacherKeys.sessions });
      toast({
        title: 'Attendance confirmed',
        description: 'Admin can now include this in payment review.',
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
    }) => requestTeacherSessionCancellation(sessionId, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: teacherKeys.sessions });
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

  const todays = useMemo(
    () =>
      sessions
        .filter((s) => isSameDay(new Date(s.startsAt), today))
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [sessions, today],
  );
  const upcoming = useMemo(
    () =>
      sessions
        .filter(
          (s) =>
            s.status === 'Upcoming' && !isSameDay(new Date(s.startsAt), today),
        )
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [sessions, today],
  );
  const nextSession: Session | undefined = todays[0] ?? upcoming[0];
  const completed = sessions.filter((s) => s.status === 'Completed');
  // Only sessions that are confirmed and have their note count towards pay.
  const estimatedPay = me
    ? completed.filter(isSessionPayable).reduce(
        (sum, session) =>
          sum + (me.hourlyRate ?? 0),
        0,
      )
    : 0;

  if (isLoading) {
    return <DashboardHomeSkeleton />;
  }

  if (isError || !me) {
    return (
      <div className="space-y-6">
        <PageHeader title="Teacher dashboard" description="" />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          We could not load your dashboard right now. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title={`Hi, ${firstName(me.name)}`}
        description="Today's sessions, your students, and your earnings."
      />

      {nextSession ? (
        <section className="relative overflow-hidden rounded-[28px] bg-brand p-5 text-white shadow-[0_18px_40px_-24px_rgba(4,66,114,0.9)] dark:bg-[hsl(208,70%,16%)] sm:p-7">
          <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-accent2-400/25 blur-3xl" />
          <div className="relative">
            <p className="text-sm font-medium text-accent2-300">
              {isSameDay(new Date(nextSession.startsAt), today) ? 'Next up today' : 'Next session'}
            </p>
            <p className="mt-2 font-display text-[52px] font-extrabold leading-none tracking-tight tabular-nums">
              {new Date(nextSession.startsAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
            </p>
            <p className="mt-2 text-white/80">
              {new Date(nextSession.startsAt).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}
            </p>
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/10 p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent2-400 font-display font-bold text-brand-700">
                {(nextSession.childName ?? 'S').trim().charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold">{nextSession.childName ?? 'Student'}</p>
                <p className="truncate text-sm text-white/70">
                  {nextSession.subject}, {nextSession.durationMins} min
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-2 sm:flex">
              {isSafeMeetingLink(nextSession.meetLink) ? (
                <Button asChild className="h-12 rounded-2xl bg-accent2-400 px-6 text-[15px] font-semibold text-brand-700 hover:bg-accent2-300">
                  <Link href={nextSession.meetLink} target="_blank" rel="noopener noreferrer">
                    <Video className="mr-2 h-4 w-4" />
                    Start session
                  </Link>
                </Button>
              ) : (
                <Button className="h-12 rounded-2xl bg-white/15 px-6 text-white" disabled>
                  Waiting for the meeting link
                </Button>
              )}
              <Button asChild variant="outline" className="h-12 rounded-2xl border-white/30 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white">
                <Link href="/teacher/schedule">View schedule</Link>
              </Button>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-3xl bg-accent2-50 p-6 text-center dark:bg-accent2-500/10 lg:p-8">
          <p className="font-display text-base font-bold text-brand dark:text-accent2-400">No upcoming sessions</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-muted-foreground">Your next booking will show up here.</p>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon={CalendarDays}
          label="Sessions taught"
          value={completed.length}
          sub="completed lessons"
        />
        <StatTile icon={Users} label="Active students" value={students.length} />
        <StatTile
          icon={Wallet}
          label="Estimated pay"
          value={naira(estimatedPay)}
          sub={`${naira(me.hourlyRate)} per session`}
        />
        <StatTile
          icon={Star}
          label="Rating"
          value={me.rating.toFixed(1)}
          sub="across all sessions"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold text-gray-950 dark:text-foreground">
              Today
            </h2>
            <Link
              href="/teacher/schedule"
              className="-my-2 inline-flex min-h-10 items-center text-sm font-medium text-brand dark:text-accent2-400"
            >
              Full schedule
            </Link>
          </div>
          <div className="space-y-3">
            {todays.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-gray-300 bg-white p-5 text-center text-sm text-gray-500 dark:border-border dark:bg-card dark:text-muted-foreground">
                Nothing scheduled today.
              </p>
            ) : (
              todays.map((s) => (
                <StudentSessionRow
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
            <h2 className="font-display text-lg font-bold text-gray-950 dark:text-foreground">
              Coming up
            </h2>
            <Link
              href="/teacher/students"
              className="-my-2 inline-flex min-h-10 items-center text-sm font-medium text-brand dark:text-accent2-400"
            >
              My students
            </Link>
          </div>
          <div className="space-y-3">
            {upcoming.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-gray-300 bg-white p-5 text-center text-sm text-gray-500 dark:border-border dark:bg-card dark:text-muted-foreground">
                Nothing else scheduled.
              </p>
            ) : (
              upcoming.slice(0, 3).map((s) => (
                <StudentSessionRow
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
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <QuickLink
          href="/teacher/notes"
          icon={ClipboardList}
          label="Session notes"
          sub="Submit feedback for completed sessions"
        />
        <QuickLink
          href="/teacher/earnings"
          icon={Wallet}
          label="Earnings"
          sub="Payouts and upcoming balance"
        />
        <QuickLink
          href="/teacher/profile"
          icon={Users}
          label="Profile"
          sub="Subjects, bio, and availability"
        />
      </section>
    </div>
  );
}

const EMPTY_SESSIONS: Session[] = [];
const EMPTY_STUDENTS: unknown[] = [];

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
      className="flex min-h-16 items-center gap-3 rounded-3xl border border-gray-200/80 bg-white p-4 transition-[border-color,transform] hover:border-brand/40 active:scale-[0.98] dark:border-border dark:bg-card"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent2-100 text-brand dark:bg-accent2-500/15 dark:text-accent2-400">
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

// "Mrs Bisi Ade" greets as "Bisi", not "Mrs".
function firstName(name: string) {
  const words = name.trim().split(/\s+/);
  const rest = words.filter((word) => !/^(mr|mrs|ms|miss|dr|prof)\.?$/i.test(word));
  return (rest[0] ?? words[0] ?? '').trim();
}
