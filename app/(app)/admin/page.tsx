'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarClock,
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  ClipboardList,
  Flag,
  GraduationCap,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import StatTile from '@/components/dashboard/StatTile';
import { DashboardHomeSkeleton } from '@/components/dashboard/Skeletons';
import {
  adminKeys,
  listAdminBookingRequests,
  listAdminCancellationRequests,
  listAdminSessions,
  listAdminStudents,
  listAdminTeachers,
} from '@/lib/api/admin';
import { listAdminTeacherPayouts, paymentKeys } from '@/lib/api/payments';
import { listQuestionReports, reportKeys } from '@/lib/api/question-reports';
import { displayGrade, displaySubject, type Child, type Session, type Teacher } from '@/lib/types';
import { cn } from '@/lib/utils';
import { naira } from '@/lib/money';

const EMPTY_STUDENTS: Child[] = [];
const EMPTY_SESSIONS: Session[] = [];
const EMPTY_TEACHERS: Teacher[] = [];

type Task = {
  id: string;
  icon: LucideIcon;
  title: string;
  detail: string;
  href: string;
  cta: string;
};

function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

export default function AdminHome() {
  const month = new Date().toISOString().slice(0, 7);

  const studentsQuery = useQuery({ queryKey: adminKeys.students, queryFn: listAdminStudents });
  const sessionsQuery = useQuery({ queryKey: adminKeys.sessions, queryFn: listAdminSessions });
  const teachersQuery = useQuery({ queryKey: adminKeys.teachers, queryFn: listAdminTeachers });
  const bookingsQuery = useQuery({ queryKey: adminKeys.bookingRequests, queryFn: listAdminBookingRequests });
  const cancellationsQuery = useQuery({ queryKey: adminKeys.cancellations, queryFn: listAdminCancellationRequests });
  const payoutsQuery = useQuery({
    queryKey: paymentKeys.adminPayouts(month),
    queryFn: () => listAdminTeacherPayouts(month),
  });

  const reportsQuery = useQuery({ queryKey: reportKeys.open, queryFn: listQuestionReports });

  const students = studentsQuery.data ?? EMPTY_STUDENTS;
  const sessions = sessionsQuery.data ?? EMPTY_SESSIONS;
  const teachers = teachersQuery.data ?? EMPTY_TEACHERS;
  const isLoading = studentsQuery.isLoading || sessionsQuery.isLoading || teachersQuery.isLoading;
  const isError = studentsQuery.isError || sessionsQuery.isError || teachersQuery.isError;

  const pending = useMemo(
    () =>
      students.filter(
        (student) => student.intake && !student.assignedTeacherId && student.status !== 'Deactivated',
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
  const completed = sessions.filter((s) => s.status === 'Completed');
  const activeTeachers = teachers.filter((teacher) => teacher.status !== 'Terminated');
  const sessionValue = completed.reduce((sum, s) => sum + s.amount, 0);

  const bookings = (bookingsQuery.data ?? []).filter((request) => request.status === 'Pending');
  const cancellations = (cancellationsQuery.data ?? []).filter(
    (request) => request.status.toUpperCase() === 'PENDING',
  );
  const payoutsDue = (payoutsQuery.data ?? []).filter(
    (payout) => payout.amount > 0 && payout.status !== 'Paid',
  );

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

  const tasks: Task[] = [];
  if (pending.length > 0) {
    tasks.push({
      id: 'requests',
      icon: ClipboardList,
      title: `${plural(pending.length, 'tutor request')} waiting for a teacher`,
      detail: pending
        .slice(0, 2)
        .map((c) => `${c.fullName} · ${displayGrade(c)} · ${c.intake ? displaySubject(c.intake) : 'No subject'}`)
        .join('   |   '),
      href: '/admin/intakes',
      cta: 'Match teacher',
    });
  }
  if (bookings.length > 0) {
    tasks.push({
      id: 'bookings',
      icon: CalendarClock,
      title: `${plural(bookings.length, 'lesson booking')} to schedule`,
      detail: bookings
        .slice(0, 2)
        .map((b) => `${b.childName ?? 'Learner'} · ${b.subject}`)
        .join('   |   '),
      href: '/admin/sessions',
      cta: 'Schedule',
    });
  }
  if (cancellations.length > 0) {
    tasks.push({
      id: 'cancellations',
      icon: CalendarX2,
      title: `${plural(cancellations.length, 'cancellation request')} to review`,
      detail: 'A learner or teacher asked to cancel or move a lesson.',
      href: '/admin/sessions',
      cta: 'Review',
    });
  }
  if (payoutsDue.length > 0) {
    tasks.push({
      id: 'payouts',
      icon: Wallet,
      title: `${plural(payoutsDue.length, 'teacher')} to pay this month`,
      detail: `${naira(payoutsDue.reduce((sum, payout) => sum + payout.amount, 0))} due from verified lessons.`,
      href: '/admin/payments',
      cta: 'Pay',
    });
  }

  const reported = reportsQuery.data?.length ?? 0;
  if (reported > 0) {
    tasks.push({
      id: 'reports',
      icon: Flag,
      title: `${plural(reported, 'question')} reported by learners`,
      detail: 'Check whether the answer or wording needs fixing.',
      href: '/admin/questions',
      cta: 'Review',
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Overview" description="What needs you first, then how things are going." />

      <section aria-labelledby="todo-heading">
        <h2 id="todo-heading" className="mb-3 text-lg font-semibold text-gray-900 dark:text-foreground">
          Needs your attention
        </h2>
        {tasks.length === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl border border-accent2-200 bg-accent2-50 p-5 dark:border-accent2-500/30 dark:bg-accent2-500/10">
            <CheckCircle2 className="h-6 w-6 shrink-0 text-accent2-600 dark:text-accent2-400" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-foreground">You&apos;re all caught up</p>
              <p className="text-sm text-gray-600 dark:text-muted-foreground">
                No tutor requests, bookings, cancellations or payouts are waiting.
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:divide-border dark:border-border dark:bg-card">
            {tasks.map((task) => (
              <li key={task.id}>
                <Link
                  href={task.href}
                  className="group flex items-center gap-4 p-4 transition-colors hover:bg-accent2-50 dark:hover:bg-accent2-500/10 sm:px-5"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent2-100 text-brand dark:bg-accent2-500/20 dark:text-accent2-400">
                    <task.icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-gray-900 dark:text-foreground">{task.title}</span>
                    <span className="block truncate text-sm text-gray-500 dark:text-muted-foreground">
                      {task.detail}
                    </span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand dark:text-accent2-400">
                    <span className="hidden sm:inline">{task.cta}</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Key numbers" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={Users} label="Learners" value={students.length} sub={`${pending.length} waiting for a teacher`} />
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
          sub={`${completed.length} completed · ${upcoming.length} upcoming`}
        />
        <StatTile icon={Wallet} label="Session value" value={naira(sessionValue)} sub="completed classes" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionHeading title="Next sessions" href="/admin/sessions" link="View all" />
          <div className="space-y-3">
            {upcoming.slice(0, 4).map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-border dark:bg-card"
              >
                <p className="font-semibold text-gray-900 dark:text-foreground">
                  {s.subject} · {s.teacherName ?? 'Teacher'}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-muted-foreground">
                  {s.childName ?? 'Learner'} ·{' '}
                  {new Date(s.startsAt).toLocaleString(undefined, {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  · {s.durationMins} min
                </p>
              </div>
            ))}
            {upcoming.length === 0 && <EmptyCard text="No sessions are booked yet." />}
          </div>
        </section>

        <section>
          <SectionHeading title="Teachers" href="/admin/teachers" link="Manage" />
          <div className="space-y-3">
            {[...activeTeachers]
              .sort((a, b) => b.totalSessions - a.totalSessions)
              .slice(0, 4)
              .map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-border dark:bg-card"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
                    {t.name
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-foreground">{t.name}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-muted-foreground">
                      {t.subjects.join(' · ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        t.totalSessions > 0 ? 'text-accent2-600' : 'text-gray-700 dark:text-foreground',
                      )}
                    >
                      {t.totalSessions}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-muted-foreground">sessions</p>
                  </div>
                </div>
              ))}
            {activeTeachers.length === 0 && <EmptyCard text="No active teachers yet." />}
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionHeading({ title, href, link }: { title: string; href: string; link: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground">{title}</h2>
      <Link href={href} className="text-sm font-medium text-brand dark:text-accent2-400">
        {link}
      </Link>
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-border dark:text-muted-foreground">
      {text}
    </p>
  );
}
