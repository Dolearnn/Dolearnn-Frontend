'use client';

import { useMemo, useState } from 'react';
import { Check, LinkIcon, Search, X } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  adminChildById,
  adminSessions,
  adminTeacherById,
} from '@/lib/store/admin';
import {
  resolveSessionCancellation,
  updateSessionMeetingLink,
} from '@/lib/store/client';
import {
  isSessionPayoutEligible,
  type Session,
  type SessionStatus,
} from '@/lib/types';
import { useMounted } from '@/lib/use-mounted';

const TAB_ORDER: ('All' | SessionStatus)[] = [
  'All',
  'Upcoming',
  'Completed',
  'Cancelled',
];

export default function AdminSessionsPage() {
  const mounted = useMounted();
  const [sessions, setSessions] = useState<Session[]>(() => adminSessions());
  const [query, setQuery] = useState('');

  const sorted = useMemo(
    () => [...sessions].sort((a, b) => b.startsAt.localeCompare(a.startsAt)),
    [sessions],
  );

  const filter = (status: (typeof TAB_ORDER)[number]) => {
    const q = query.trim().toLowerCase();
    return sorted.filter((s) => {
      if (status !== 'All' && s.status !== status) return false;
      if (!q) return true;
      const child = adminChildById(s.childId);
      const teacher = adminTeacherById(s.teacherId);
      return (
        s.subject.toLowerCase().includes(q) ||
        (child?.fullName ?? '').toLowerCase().includes(q) ||
        (teacher?.name ?? '').toLowerCase().includes(q)
      );
    });
  };

  const counts = useMemo(
    () => ({
      All: sessions.length,
      Upcoming: sessions.filter((s) => s.status === 'Upcoming').length,
      Completed: sessions.filter((s) => s.status === 'Completed').length,
      Cancelled: sessions.filter((s) => s.status === 'Cancelled').length,
    }),
    [sessions],
  );

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
        title="Sessions"
        description="Every session across the platform, at a glance."
      />

      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 text-gray-400 dark:text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search subject, student or teacher"
          className="pl-9 rounded-full"
        />
      </div>

      <Tabs defaultValue="All" className="space-y-4">
        <TabsList className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-full p-1 w-fit">
          {TAB_ORDER.map((t) => (
            <TabsTrigger
              key={t}
              value={t}
              className="rounded-full px-4 text-sm data-[state=active]:bg-brand data-[state=active]:text-white"
            >
              {t}
              <span className="ml-2 text-xs opacity-70">{counts[t]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {TAB_ORDER.map((t) => {
          const rows = filter(t);
          return (
            <TabsContent key={t} value={t}>
              {rows.length === 0 ? (
                <div className="bg-white dark:bg-card rounded-2xl border border-dashed border-gray-300 dark:border-border p-10 text-center">
                  <p className="text-sm text-gray-500 dark:text-muted-foreground">
                    No sessions match this filter.
                  </p>
                </div>
              ) : (
                <SessionTable rows={rows} onUpdateMeetingLink={(id, link) => {
                  updateSessionMeetingLink(id, link);
                  setSessions((prev) =>
                    prev.map((session) =>
                      session.id === id
                        ? { ...session, meetLink: link.trim() }
                      : session,
                    ),
                  );
                }} onResolveCancellation={(id, decision) => {
                  resolveSessionCancellation(id, decision);
                  setSessions((prev) =>
                    prev.map((session) =>
                      session.id === id
                        ? {
                            ...session,
                            status:
                              decision === 'Approved'
                                ? 'Cancelled'
                                : 'Upcoming',
                            cancellation: session.cancellation
                              ? {
                                  ...session.cancellation,
                                  status: decision,
                                  resolvedAt: new Date().toISOString(),
                                }
                              : undefined,
                          }
                        : session,
                    ),
                  );
                }} />
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

function SessionTable({
  rows,
  onUpdateMeetingLink,
  onResolveCancellation,
}: {
  rows: Session[];
  onUpdateMeetingLink: (sessionId: string, meetLink: string) => void;
  onResolveCancellation: (
    sessionId: string,
    decision: 'Approved' | 'Rejected',
  ) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  return (
    <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-gray-50 dark:bg-background text-xs text-gray-500 dark:text-muted-foreground uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3 font-medium">When</th>
              <th className="text-left px-4 py-3 font-medium">Student</th>
              <th className="text-left px-4 py-3 font-medium">Teacher</th>
              <th className="text-left px-4 py-3 font-medium">Subject</th>
              <th className="text-left px-4 py-3 font-medium">Meeting link</th>
              <th className="text-left px-4 py-3 font-medium">Cancellation</th>
              <th className="text-left px-4 py-3 font-medium">Teacher confirm</th>
              <th className="text-left px-4 py-3 font-medium">Family</th>
              <th className="text-left px-4 py-3 font-medium">Payout</th>
              <th className="text-right px-4 py-3 font-medium">Duration</th>
              <th className="text-right px-4 py-3 font-medium">Amount</th>
              <th className="text-right px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((s) => {
              const child = adminChildById(s.childId);
              const teacher = adminTeacherById(s.teacherId);
              return (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                  <td className="px-4 py-3 text-gray-700 dark:text-foreground/90 whitespace-nowrap">
                    {new Date(s.startsAt).toLocaleString(undefined, {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-foreground/90">
                    {child?.fullName ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-foreground/90">
                    {teacher?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-foreground/90">{s.subject}</td>
                  <td className="px-4 py-3">
                    <MeetingLinkEditor
                      session={s}
                      value={drafts[s.id] ?? s.meetLink}
                      onChange={(value) =>
                        setDrafts((prev) => ({ ...prev, [s.id]: value }))
                      }
                      onSave={() => {
                        const link = drafts[s.id] ?? s.meetLink;
                        onUpdateMeetingLink(s.id, link);
                      }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <CancellationReview
                      session={s}
                      onResolve={(decision) =>
                        onResolveCancellation(s.id, decision)
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <ConfirmationBadge confirmed={!!s.attendance?.teacherConfirmedAt} />
                  </td>
                  <td className="px-4 py-3">
                    <ConfirmationBadge confirmed={!!s.attendance?.familyConfirmedAt} />
                  </td>
                  <td className="px-4 py-3">
                    <PayoutBadge eligible={isSessionPayoutEligible(s.attendance)} />
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 dark:text-muted-foreground">
                    {s.durationMins} min
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-foreground">
                    ${s.amount}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <StatusBadge status={s.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ConfirmationBadge({ confirmed }: { confirmed: boolean }) {
  return (
    <span
      className={cn(
        'text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap',
        confirmed
          ? 'bg-accent2-50 text-accent2-700'
          : 'bg-amber-50 text-amber-700',
      )}
    >
      {confirmed ? 'Confirmed' : 'Pending'}
    </span>
  );
}

function PayoutBadge({ eligible }: { eligible: boolean }) {
  return (
    <span
      className={cn(
        'text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap',
        eligible
          ? 'bg-brand/10 text-brand'
          : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-muted-foreground',
      )}
    >
      {eligible ? 'Eligible' : 'Not eligible'}
    </span>
  );
}

function CancellationReview({
  session,
  onResolve,
}: {
  session: Session;
  onResolve: (decision: 'Approved' | 'Rejected') => void;
}) {
  const cancellation = session.cancellation;
  if (!cancellation) {
    return (
      <span className="text-[11px] text-gray-400 whitespace-nowrap">
        No request
      </span>
    );
  }

  return (
    <div className="min-w-[240px] space-y-2">
      <div>
        <span
          className={cn(
            'text-[11px] font-medium px-2 py-0.5 rounded-full capitalize',
            cancellation.status === 'Pending' && 'bg-amber-50 text-amber-700',
            cancellation.status === 'Approved' && 'bg-red-50 text-red-600',
            cancellation.status === 'Rejected' &&
              'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-muted-foreground',
          )}
        >
          {cancellation.status} by {cancellation.requestedBy}
        </span>
        <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1 line-clamp-2">
          {cancellation.reason}
        </p>
      </div>
      {cancellation.status === 'Pending' && (
        <div className="flex gap-2">
          <Button
            size="sm"
            className="h-8 rounded-full bg-red-600 hover:bg-red-700"
            onClick={() => onResolve('Approved')}
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-full"
            onClick={() => onResolve('Rejected')}
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}

function MeetingLinkEditor({
  session,
  value,
  onChange,
  onSave,
}: {
  session: Session;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
}) {
  const changed = value.trim() !== session.meetLink;
  return (
    <div className="flex items-center gap-2 min-w-[260px]">
      <div className="relative flex-1">
        <LinkIcon className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste class meeting link"
          className="h-9 pl-8 text-xs"
        />
      </div>
      <Button
        size="sm"
        variant={changed ? 'default' : 'outline'}
        className={cn('h-9 rounded-full', changed && 'bg-brand hover:bg-brand-600')}
        disabled={!changed}
        onClick={onSave}
      >
        <Check className="w-3.5 h-3.5 mr-1" />
        Save
      </Button>
    </div>
  );
}

function StatusBadge({ status }: { status: SessionStatus }) {
  const styles: Record<SessionStatus, string> = {
    Upcoming: 'bg-brand/10 text-brand',
    Completed: 'bg-accent2-50 text-accent2-700',
    Cancelled: 'bg-red-50 text-red-600',
  };
  return (
    <span
      className={cn(
        'text-[11px] font-medium px-2 py-0.5 rounded-full',
        styles[status],
      )}
    >
      {status}
    </span>
  );
}
