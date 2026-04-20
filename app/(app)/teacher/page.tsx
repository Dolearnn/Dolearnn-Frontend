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
import { useToast } from '@/hooks/use-toast';
import {
  confirmTeacherSessionAttendance,
  getTeacherProfile,
  listTeacherSessions,
  listTeacherStudents,
  requestTeacherSessionCancellation,
  teacherKeys,
} from '@/lib/api/teacher';
import type { Session } from '@/lib/types';

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
  const estimatedPay = me
    ? completed.reduce(
        (sum, session) =>
          sum + (session.durationMins / 60) * (me.hourlyRate ?? 0),
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
    <div className="space-y-6">
      <PageHeader
        title={`Hi, ${me.name.split(' ')[0]}`}
        description="Today's sessions, your students, and your earnings."
      />

      {nextSession ? (
        <section className="bg-brand text-white rounded-3xl p-6 lg:p-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-28 bg-accent2-500/20" />
          <div className="relative z-10">
            <p className="text-xs uppercase tracking-wide text-accent2-400 font-semibold mb-2">
              {isSameDay(new Date(nextSession.startsAt), today)
                ? 'Next up today'
                : 'Next session'}
            </p>
            <h2 className="text-2xl lg:text-3xl font-bold mb-1">
              {nextSession.subject} -{' '}
              {new Date(nextSession.startsAt).toLocaleString(undefined, {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </h2>
            <p className="text-white/80 text-sm mb-6">
              {nextSession.durationMins} min -{' '}
              {nextSession.childName ?? 'Student'}
            </p>
            <div className="flex flex-wrap gap-3">
              {nextSession.meetLink ? (
                <Link
                  href={nextSession.meetLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button className="bg-accent2-500 text-brand hover:bg-accent2-400 rounded-full">
                    <Video className="w-4 h-4 mr-2" />
                    Start session
                  </Button>
                </Link>
              ) : (
                <Button
                  className="bg-accent2-500 text-brand rounded-full"
                  disabled
                >
                  Awaiting admin link
                </Button>
              )}
              <Link href="/teacher/schedule">
                <Button
                  variant="outline"
                  className="rounded-full border-white/30 text-white bg-transparent hover:bg-white/10"
                >
                  View schedule
                </Button>
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-accent2-50 border border-accent2-100 rounded-3xl p-6 lg:p-8 text-center">
          <p className="text-sm text-brand font-semibold">
            No upcoming sessions
          </p>
          <p className="text-xs text-gray-600 dark:text-muted-foreground mt-1">
            Your next booking will show up here.
          </p>
        </section>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          icon={CalendarDays}
          label="Sessions taught"
          value={completed.length}
          sub="from backend records"
        />
        <StatTile icon={Users} label="Active students" value={students.length} />
        <StatTile
          icon={Wallet}
          label="Estimated pay"
          value={`$${estimatedPay.toFixed(0)}`}
          sub={`${me.hourlyRate}/hr`}
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
            <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90">
              Today
            </h2>
            <Link
              href="/teacher/schedule"
              className="text-xs text-brand font-medium"
            >
              Full schedule
            </Link>
          </div>
          <div className="space-y-3">
            {todays.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-muted-foreground">
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
            <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90">
              Coming up
            </h2>
            <Link
              href="/teacher/students"
              className="text-xs text-brand font-medium"
            >
              My students
            </Link>
          </div>
          <div className="space-y-3">
            {upcoming.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-muted-foreground">
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
