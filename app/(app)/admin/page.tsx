'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Users,
  Wallet,
} from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import StatTile from '@/components/dashboard/StatTile';
import { Button } from '@/components/ui/button';
import { displayGrade, displaySubject } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useMounted } from '@/lib/use-mounted';
import {
  adminPayments,
  adminPayouts,
  adminPendingIntakes,
  adminSessions,
  adminTeacherById,
  adminTeachers,
} from '@/lib/store/admin';

export default function AdminHome() {
  const mounted = useMounted();
  const pending = adminPendingIntakes();
  const sessions = adminSessions();
  const teachers = adminTeachers();
  const payments = adminPayments();
  const payouts = adminPayouts();

  const upcoming = useMemo(
    () =>
      sessions
        .filter((s) => s.status === 'Upcoming')
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [sessions],
  );

  const revenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const paidOut = payouts.reduce((sum, p) => sum + p.amount, 0);
  const completed = sessions.filter((s) => s.status === 'Completed').length;

  if (!mounted) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading…" description="" />
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
          value={teachers.length}
          sub="active roster"
        />
        <StatTile
          icon={CalendarDays}
          label="Sessions"
          value={sessions.length}
          sub={`${completed} completed · ${upcoming.length} upcoming`}
        />
        <StatTile
          icon={Wallet}
          label="Revenue"
          value={`$${revenue}`}
          sub={`$${paidOut} paid to teachers`}
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
                  <p className="font-semibold text-gray-900 dark:text-foreground">{c.fullName}</p>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground">
                    {displayGrade(c)} · {c.intake ? displaySubject(c.intake) : ''} · {c.intake?.learningGoal}
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
            {upcoming.slice(0, 4).map((s) => {
              const teacher = adminTeacherById(s.teacherId);
              return (
                <div
                  key={s.id}
                  className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900 dark:text-foreground">
                      {s.subject} · {teacher?.name ?? 'Teacher'}
                    </p>
                    <span className="text-[11px] text-brand bg-brand/10 px-2 py-0.5 rounded-full font-medium">
                      {s.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
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
              );
            })}
            {upcoming.length === 0 && (
              <p className="text-xs text-gray-500 dark:text-muted-foreground">No upcoming sessions.</p>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90">Top teachers</h2>
            <Link
              href="/admin/teachers"
              className="text-xs text-brand font-medium"
            >
              Manage roster
            </Link>
          </div>
          <div className="space-y-3">
            {[...teachers]
              .sort((a, b) => b.rating - a.rating)
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
                      {t.subjects.join(' · ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        t.rating >= 4.8 ? 'text-accent2-600' : 'text-gray-700',
                      )}
                    >
                      ★ {t.rating.toFixed(1)}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-muted-foreground">
                      {t.totalSessions} sessions
                    </p>
                  </div>
                </div>
              ))}
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
          sub="Roster, ratings and subjects"
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
        <p className="text-sm font-semibold text-gray-900 dark:text-foreground">{label}</p>
        <p className="text-xs text-gray-500 dark:text-muted-foreground">{sub}</p>
      </div>
    </Link>
  );
}
