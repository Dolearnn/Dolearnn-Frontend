'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, LinkIcon, Search, X } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import { PageShellSkeleton } from '@/components/dashboard/Skeletons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  adminKeys,
  approveAdminCancellation,
  listAdminSessions,
  rejectAdminCancellation,
  updateAdminSessionMeetingLink,
} from '@/lib/api/admin';
import { cn } from '@/lib/utils';
import {
  isSessionPayoutEligible,
  type Session,
  type SessionStatus,
} from '@/lib/types';

const TAB_ORDER: ('All' | SessionStatus)[] = [
  'All',
  'Upcoming',
  'Completed',
  'Cancelled',
];

export default function AdminSessionsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [query, setQuery] = useState('');

  const sessionsQuery = useQuery({
    queryKey: adminKeys.sessions,
    queryFn: listAdminSessions,
  });

  const sessions = useMemo(
    () => sessionsQuery.data ?? [],
    [sessionsQuery.data],
  );

  const invalidateSessions = () => {
    queryClient.invalidateQueries({ queryKey: adminKeys.sessions });
    queryClient.invalidateQueries({ queryKey: adminKeys.cancellations });
  };

  const meetingLinkMutation = useMutation({
    mutationFn: ({ sessionId, meetLink }: { sessionId: string; meetLink: string }) =>
      updateAdminSessionMeetingLink(sessionId, meetLink),
    onSuccess: () => {
      invalidateSessions();
      toast({ title: 'Meeting link saved' });
    },
    onError: (error) => {
      toast({
        title: 'Could not save meeting link',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: approveAdminCancellation,
    onSuccess: () => {
      invalidateSessions();
      toast({ title: 'Cancellation approved' });
    },
    onError: (error) => {
      toast({
        title: 'Could not approve cancellation',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectAdminCancellation,
    onSuccess: () => {
      invalidateSessions();
      toast({ title: 'Cancellation rejected' });
    },
    onError: (error) => {
      toast({
        title: 'Could not reject cancellation',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const sorted = useMemo(
    () => [...sessions].sort((a, b) => b.startsAt.localeCompare(a.startsAt)),
    [sessions],
  );

  const filter = (status: (typeof TAB_ORDER)[number]) => {
    const q = query.trim().toLowerCase();
    return sorted.filter((session) => {
      if (status !== 'All' && session.status !== status) return false;
      if (!q) return true;
      return (
        session.subject.toLowerCase().includes(q) ||
        (session.childName ?? '').toLowerCase().includes(q) ||
        (session.teacherName ?? '').toLowerCase().includes(q)
      );
    });
  };

  const counts = useMemo(
    () => ({
      All: sessions.length,
      Upcoming: sessions.filter((session) => session.status === 'Upcoming').length,
      Completed: sessions.filter((session) => session.status === 'Completed').length,
      Cancelled: sessions.filter((session) => session.status === 'Cancelled').length,
    }),
    [sessions],
  );

  if (sessionsQuery.isLoading) {
    return <PageShellSkeleton />;
  }

  if (sessionsQuery.error) {
    return (
      <p className="text-sm text-red-600">
        {sessionsQuery.error instanceof Error
          ? sessionsQuery.error.message
          : 'Could not load sessions.'}
      </p>
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
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search subject, student or teacher"
          className="pl-9 rounded-full"
        />
      </div>

      <Tabs defaultValue="All" className="space-y-4">
        <TabsList className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-full p-1 w-fit">
          {TAB_ORDER.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-full px-4 text-sm data-[state=active]:bg-brand data-[state=active]:text-white"
            >
              {tab}
              <span className="ml-2 text-xs opacity-70">{counts[tab]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {TAB_ORDER.map((tab) => {
          const rows = filter(tab);
          return (
            <TabsContent key={tab} value={tab}>
              {rows.length === 0 ? (
                <div className="bg-white dark:bg-card rounded-2xl border border-dashed border-gray-300 dark:border-border p-10 text-center">
                  <p className="text-sm text-gray-500 dark:text-muted-foreground">
                    No sessions match this filter.
                  </p>
                </div>
              ) : (
                <SessionTable
                  rows={rows}
                  savingLink={meetingLinkMutation.isPending}
                  resolvingCancellation={
                    approveMutation.isPending || rejectMutation.isPending
                  }
                  onUpdateMeetingLink={(sessionId, meetLink) =>
                    meetingLinkMutation.mutate({ sessionId, meetLink })
                  }
                  onResolveCancellation={(requestId, decision) => {
                    if (decision === 'Approved') {
                      approveMutation.mutate(requestId);
                    } else {
                      rejectMutation.mutate(requestId);
                    }
                  }}
                />
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
  savingLink,
  resolvingCancellation,
  onUpdateMeetingLink,
  onResolveCancellation,
}: {
  rows: Session[];
  savingLink: boolean;
  resolvingCancellation: boolean;
  onUpdateMeetingLink: (sessionId: string, meetLink: string) => void;
  onResolveCancellation: (
    requestId: string,
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
              <th className="text-left px-4 py-3 font-medium">Request</th>
              <th className="text-left px-4 py-3 font-medium">Teacher confirm</th>
              <th className="text-left px-4 py-3 font-medium">Family</th>
              <th className="text-left px-4 py-3 font-medium">Payout</th>
              <th className="text-right px-4 py-3 font-medium">Duration</th>
              <th className="text-right px-4 py-3 font-medium">Amount</th>
              <th className="text-right px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((session) => (
              <tr
                key={session.id}
                className="hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <td className="px-4 py-3 text-gray-700 dark:text-foreground/90 whitespace-nowrap">
                  {new Date(session.startsAt).toLocaleString(undefined, {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="px-4 py-3 text-gray-700 dark:text-foreground/90">
                  {session.childName ?? 'Student'}
                </td>
                <td className="px-4 py-3 text-gray-700 dark:text-foreground/90">
                  {session.teacherName ?? 'Teacher'}
                </td>
                <td className="px-4 py-3 text-gray-700 dark:text-foreground/90">
                  {session.subject}
                </td>
                <td className="px-4 py-3">
                  <MeetingLinkEditor
                    session={session}
                    value={drafts[session.id] ?? session.meetLink}
                    saving={savingLink}
                    onChange={(value) =>
                      setDrafts((previous) => ({
                        ...previous,
                        [session.id]: value,
                      }))
                    }
                    onSave={() => {
                      const link = drafts[session.id] ?? session.meetLink;
                      onUpdateMeetingLink(session.id, link);
                    }}
                  />
                </td>
                <td className="px-4 py-3">
                  <CancellationReview
                    session={session}
                    resolving={resolvingCancellation}
                    onResolve={onResolveCancellation}
                  />
                </td>
                <td className="px-4 py-3">
                  <ConfirmationBadge
                    confirmed={!!session.attendance?.teacherConfirmedAt}
                  />
                </td>
                <td className="px-4 py-3">
                  <ConfirmationBadge
                    confirmed={!!session.attendance?.familyConfirmedAt}
                  />
                </td>
                <td className="px-4 py-3">
                  <PayoutBadge
                    eligible={isSessionPayoutEligible(session.attendance)}
                  />
                </td>
                <td className="px-4 py-3 text-right text-gray-500 dark:text-muted-foreground">
                  {session.durationMins} min
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-foreground">
                  ${session.amount}
                </td>
                <td className="px-4 py-3 text-right">
                  <StatusBadge status={session.status} />
                </td>
              </tr>
            ))}
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
  resolving,
  onResolve,
}: {
  session: Session;
  resolving: boolean;
  onResolve: (requestId: string, decision: 'Approved' | 'Rejected') => void;
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
        {(() => {
          const requestLabel =
            cancellation.requestedBy === 'teacher'
              ? 'Reschedule'
              : 'Cancellation';
          return (
            <span
              className={cn(
                'text-[11px] font-medium px-2 py-0.5 rounded-full capitalize',
                cancellation.status === 'Pending' && 'bg-amber-50 text-amber-700',
                cancellation.status === 'Approved' && 'bg-red-50 text-red-600',
                cancellation.status === 'Rejected' &&
                  'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-muted-foreground',
              )}
            >
              {requestLabel} {cancellation.status.toLowerCase()} by{' '}
              {cancellation.requestedBy}
            </span>
          );
        })()}
        <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1 line-clamp-2">
          {cancellation.reason}
        </p>
      </div>
      {cancellation.status === 'Pending' && cancellation.id && (
        <div className="flex gap-2">
          <Button
            size="sm"
            className="h-8 rounded-full bg-red-600 hover:bg-red-700"
            disabled={resolving}
            onClick={() => onResolve(cancellation.id!, 'Approved')}
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-full"
            disabled={resolving}
            onClick={() => onResolve(cancellation.id!, 'Rejected')}
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
  saving,
  onChange,
  onSave,
}: {
  session: Session;
  value: string;
  saving: boolean;
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
          onChange={(event) => onChange(event.target.value)}
          placeholder="Paste class meeting link"
          className="h-9 pl-8 text-xs"
        />
      </div>
      <Button
        size="sm"
        variant={changed ? 'default' : 'outline'}
        className={cn('h-9 rounded-full', changed && 'bg-brand hover:bg-brand-600')}
        disabled={!changed || saving}
        onClick={onSave}
      >
        <Check className="w-3.5 h-3.5 mr-1" />
        {saving ? 'Saving' : 'Save'}
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
