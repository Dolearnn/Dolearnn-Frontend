'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Users,
  Wallet,
} from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import StatTile from '@/components/dashboard/StatTile';
import { DashboardHomeSkeleton } from '@/components/dashboard/Skeletons';
import { Button } from '@/components/ui/button';
import {
  adminKeys,
  listAdminSessions,
  listAdminStudents,
  listAdminTeachers,
} from '@/lib/api/admin';
import { displayGrade, displaySubject, type Child, type Session, type Teacher } from '@/lib/types';
import { cn } from '@/lib/utils';

const EMPTY_STUDENTS: Child[] = [];
const EMPTY_SESSIONS: Session[] = [];
const EMPTY_TEACHERS: Teacher[] = [];

export default function AdminHome() {
  const studentsQuery = useQuery({
    queryKey: adminKeys.students,
    queryFn: listAdminStudents,
  });
  const sessionsQuery = useQuery({
    queryKey: adminKeys.sessions,
    queryFn: listAdminSessions,
  });
  const teachersQuery = useQuery({
    queryKey: adminKeys.teachers,
    queryFn: listAdminTeachers,
  });

  const students = studentsQuery.data ?? EMPTY_STUDENTS;
  const sessions = sessionsQuery.data ?? EMPTY_SESSIONS;
  const teachers = teachersQuery.data ?? EMPTY_TEACHERS;
  const isLoading =
    studentsQuery.isLoading || sessionsQuery.isLoading || teachersQuery.isLoading;
  const isError =
    studentsQuery.isError || sessionsQuery.isError || teachersQuery.isError;

  const pending = useMemo(
    () =>
      students.filter(
        (student) =>
          student.intake &&
          !student.assignedTeacherId &&
          student.status !== 'Deactivated',
      ),
    [students],
  );
  const upcoming = useMemo(
    () =>
      sessions
        .filter((s) => s.status === 'Upcoming')
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [sessions],
  );
  const completed = sessions.filter((s) => s.status === 'Completed').length;
  const activeTeachers = teachers.filter((teacher) => teacher.status !== 'Terminated');
  const sessionValue = sessions
    .filter((s) => s.status === 'Completed')
    .reduce((sum, s) => sum + s.amount, 0);

  if (isLoading) {
    return <DashboardHomeSkeleton />;
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Overview" description="" />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          We could not load the admin dashboard right now. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Match intakes to teachers, keep sessions on track, watch the numbers."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          icon={ClipboardList}
          label="Pending intakes"
          value={pending.length}
          sub="awaiting teacher match"
          accent={pending.length > 0}
        />
        <StatTile
          icon={GraduationCap}
          label="Teachers"
          value={activeTeachers.length}
          sub={`${teachers.length - activeTeachers.length} terminated`}
        />
        <StatTile
          icon={CalendarDays}
          label="Sessions"
          value={sessions.length}
          sub={`${completed} completed - ${upcoming.length} upcoming`}
        />
        <StatTile
          icon={Wallet}
          label="Session value"
          value={`$${sessionValue.toFixed(0)}`}
          sub="completed classes"
        />
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90">
            Intakes waiting for a match
          </h2>
          <Link
            href="/admin/intakes"
            className="text-xs text-brand font-medium"
          >
            Review all
          </Link>
        </div>
        {pending.length === 0 ? (
          <div className="bg-white dark:bg-card rounded-2xl border border-dashed border-gray-300 dark:border-border p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-muted-foreground">
              Every intake has been matched. Nice work.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.slice(0, 3).map((c) => (
              <div
                key={c.id}
                className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-foreground">
                    {c.fullName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground">
                    {displayGrade(c)} -{' '}
                    {c.intake ? displaySubject(c.intake) : 'No subject'} -{' '}
                    {c.intake?.learningGoal ?? 'No goal yet'}
                  </p>
                </div>
                <Link href={`/admin/intakes?child=${c.id}`}>
                  <Button
                    variant="outline"
                    className="rounded-full border-brand text-brand hover:bg-brand hover:text-white"
                  >
                    Match teacher
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid lg:grid-cols-2 gap-4">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90">
              Next sessions
            </h2>
            <Link
              href="/admin/sessions"
              className="text-xs text-brand font-medium"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {upcoming.slice(0, 4).map((s) => (
              <div
                key={s.id}
                className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-gray-900 dark:text-foreground">
                    {s.subject} - {s.teacherName ?? 'Teacher'}
                  </p>
                  <span className="text-[11px] text-brand bg-brand/10 px-2 py-0.5 rounded-full font-medium">
                    {s.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                  {s.childName ?? 'Student'} -{' '}
                  {new Date(s.startsAt).toLocaleString(undefined, {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  - {s.durationMins} min
                </p>
              </div>
            ))}
            {upcoming.length === 0 && (
              <p className="text-xs text-gray-500 dark:text-muted-foreground">
                No upcoming sessions.
              </p>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90">
              Teacher roster
            </h2>
            <Link
              href="/admin/teachers"
              className="text-xs text-brand font-medium"
            >
              Manage roster
            </Link>
          </div>
          <div className="space-y-3">
            {[...activeTeachers]
              .sort((a, b) => b.totalSessions - a.totalSessions)
              .slice(0, 4)
              .map((t) => (
                <div
                  key={t.id}
                  className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-4 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center text-sm font-semibold">
                    {t.name
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-foreground text-sm truncate">
                      {t.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-muted-foreground truncate">
                      {t.subjects.join(' - ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        t.totalSessions > 0
                          ? 'text-accent2-600'
                          : 'text-gray-700',
                      )}
                    >
                      {t.totalSessions}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-muted-foreground">
                      sessions
                    </p>
                  </div>
                </div>
              ))}
            {activeTeachers.length === 0 && (
              <p className="text-xs text-gray-500 dark:text-muted-foreground">
                No active teachers yet.
              </p>
            )}
          </div>
        </section>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <QuickLink
          href="/admin/intakes"
          icon={ClipboardList}
          label="Intakes"
          sub="Assign teachers to new enquiries"
        />
        <QuickLink
          href="/admin/teachers"
          icon={Users}
          label="Teachers"
          sub="Roster, rates and subjects"
        />
        <QuickLink
          href="/admin/payments"
          icon={Wallet}
          label="Payments"
          sub="Revenue, payouts and plans"
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
