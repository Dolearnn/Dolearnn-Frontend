'use client';

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck2, CalendarX2 } from 'lucide-react';
import ChildSwitcher from '@/components/dashboard/ChildSwitcher';
import FeedbackCard from '@/components/dashboard/FeedbackCard';
import PageHeader from '@/components/dashboard/PageHeader';
import SessionRow from '@/components/dashboard/SessionRow';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  acceptFamilySessionProposal,
  confirmFamilySessionAttendance,
  declineFamilySessionProposal,
  familyKeys,
  listFamilySessionProposals,
  listFamilySessions,
  listFamilyStudents,
  requestFamilySessionCancellation,
} from '@/lib/api/family';
import type { Session, SessionProposal, SessionStatus } from '@/lib/types';
import { useState } from 'react';

const TAB_ORDER: SessionStatus[] = ['Upcoming', 'Completed', 'Cancelled'];

export default function FamilySessionsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);

  const studentsQuery = useQuery({
    queryKey: familyKeys.students,
    queryFn: listFamilyStudents,
  });
  const sessionsQuery = useQuery({
    queryKey: familyKeys.sessions,
    queryFn: listFamilySessions,
  });
  const proposalsQuery = useQuery({
    queryKey: familyKeys.proposals,
    queryFn: listFamilySessionProposals,
  });

  const children = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data]);
  const active = useMemo(
    () =>
      children.find((child) => child.id === activeId) ??
      children[0] ??
      null,
    [children, activeId],
  );

  const invalidateSessions = () => {
    queryClient.invalidateQueries({ queryKey: familyKeys.sessions });
    queryClient.invalidateQueries({ queryKey: familyKeys.proposals });
  };

  const acceptMutation = useMutation({
    mutationFn: acceptFamilySessionProposal,
    onSuccess: () => {
      invalidateSessions();
      toast({ title: 'Session accepted' });
    },
    onError: (error) => {
      toast({
        title: 'Could not accept session',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const declineMutation = useMutation({
    mutationFn: declineFamilySessionProposal,
    onSuccess: () => {
      invalidateSessions();
      toast({ title: 'Session declined' });
    },
    onError: (error) => {
      toast({
        title: 'Could not decline session',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const attendanceMutation = useMutation({
    mutationFn: confirmFamilySessionAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.sessions });
      toast({ title: 'Attendance confirmed' });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.sessions });
      toast({ title: 'Cancellation requested' });
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

  const sessions = useMemo(() => {
    if (!active) return [];
    return (sessionsQuery.data ?? []).filter(
      (session) => session.childId === active.id,
    );
  }, [active, sessionsQuery.data]);

  const pendingProposals = useMemo(() => {
    if (!active) return [];
    return (proposalsQuery.data ?? []).filter(
      (proposal) =>
        proposal.childId === active.id && proposal.status === 'Pending',
    );
  }, [active, proposalsQuery.data]);

  const grouped = useMemo(() => {
    const bucket: Record<SessionStatus, Session[]> = {
      Upcoming: [],
      Completed: [],
      Cancelled: [],
    };
    for (const session of sessions) bucket[session.status].push(session);
    bucket.Upcoming.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    bucket.Completed.sort((a, b) => b.startsAt.localeCompare(a.startsAt));
    bucket.Cancelled.sort((a, b) => b.startsAt.localeCompare(a.startsAt));
    return bucket;
  }, [sessions]);

  const isLoading =
    studentsQuery.isLoading ||
    sessionsQuery.isLoading ||
    proposalsQuery.isLoading;
  const error =
    studentsQuery.error ?? sessionsQuery.error ?? proposalsQuery.error;

  if (isLoading) {
    return (
      <p className="text-sm text-gray-400 dark:text-muted-foreground">
        Loading...
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-600">
        {error instanceof Error ? error.message : 'Could not load sessions.'}
      </p>
    );
  }

  if (!active) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Sessions"
          description="Every lesson for your family - past, present and upcoming."
        />
        <EmptyState
          title="No students yet"
          hint="Add a student before sessions can be proposed."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sessions"
        description="Every lesson for your family - past, present and upcoming."
      />

      <ChildSwitcher
        students={children}
        activeId={active.id}
        onChange={setActiveId}
      />

      {pendingProposals.length > 0 && (
        <div className="space-y-3">
          {pendingProposals.map((proposal) => (
            <SessionProposalCard
              key={proposal.id}
              proposal={proposal}
              accepting={acceptMutation.isPending}
              declining={declineMutation.isPending}
              onAccept={() => acceptMutation.mutate(proposal.id)}
              onDecline={() => declineMutation.mutate(proposal.id)}
            />
          ))}
        </div>
      )}

      <Tabs defaultValue="Upcoming" className="space-y-4">
        <TabsList className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-full p-1 w-fit">
          {TAB_ORDER.map((status) => (
            <TabsTrigger
              key={status}
              value={status}
              className="rounded-full px-4 text-sm data-[state=active]:bg-brand data-[state=active]:text-white"
            >
              {status}
              <span className="ml-2 text-xs opacity-70">
                {grouped[status].length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="Upcoming" className="space-y-3">
          {grouped.Upcoming.length === 0 ? (
            <EmptyState
              title="Nothing scheduled"
              hint="New sessions will appear here once booked."
            />
          ) : (
            grouped.Upcoming.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                onConfirmHeld={async (sessionId) => {
                  await attendanceMutation.mutateAsync(sessionId);
                }}
                onRequestCancellation={(sessionId, reason) =>
                  cancellationMutation.mutateAsync({ sessionId, reason })
                }
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="Completed" className="space-y-4">
          {grouped.Completed.length === 0 ? (
            <EmptyState
              title="No completed sessions yet"
              hint="Feedback from teachers will appear here after each session."
            />
          ) : (
            grouped.Completed.map((session) => (
              <div key={session.id} className="space-y-3">
                <SessionRow
                  session={session}
                  onConfirmHeld={async (sessionId) => {
                    await attendanceMutation.mutateAsync(sessionId);
                  }}
                />
                <FeedbackCard session={session} />
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="Cancelled" className="space-y-3">
          {grouped.Cancelled.length === 0 ? (
            <EmptyState
              title="No cancellations"
              hint="Any cancelled sessions will appear here."
            />
          ) : (
            grouped.Cancelled.map((session) => (
              <SessionRow key={session.id} session={session} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SessionProposalCard({
  proposal,
  accepting,
  declining,
  onAccept,
  onDecline,
}: {
  proposal: SessionProposal;
  accepting: boolean;
  declining: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="bg-white dark:bg-card border border-brand/20 dark:border-accent2-400/30 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-brand/10 text-brand dark:bg-accent2-500/15 dark:text-accent2-400 flex items-center justify-center shrink-0">
        <CalendarCheck2 className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-xs font-medium text-brand dark:text-accent2-400 bg-brand/10 dark:bg-accent2-500/10 px-2 py-0.5 rounded-full">
            Proposed session
          </span>
          <span className="text-xs font-medium text-gray-600 dark:text-muted-foreground">
            {proposal.subject}
          </span>
        </div>
        <p className="font-semibold text-gray-900 dark:text-foreground">
          {proposal.teacherName ?? 'Teacher'}
        </p>
        <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
          {new Date(proposal.startsAt).toLocaleString(undefined, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}{' '}
          - {proposal.durationMins} min - {proposal.timeBlock}
        </p>
        {proposal.note && (
          <p className="text-xs text-gray-600 dark:text-foreground/80 mt-2">
            {proposal.note}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="rounded-full"
          disabled={accepting || declining}
          onClick={onDecline}
        >
          {declining ? 'Declining...' : 'Decline'}
        </Button>
        <Button
          className="rounded-full bg-brand hover:bg-brand-600"
          disabled={accepting || declining}
          onClick={onAccept}
        >
          {accepting ? 'Accepting...' : 'Accept'}
        </Button>
      </div>
    </div>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="bg-white dark:bg-card border border-dashed border-gray-300 dark:border-border rounded-2xl p-10 text-center">
      <CalendarX2 className="w-6 h-6 text-gray-400 dark:text-muted-foreground mx-auto mb-2" />
      <p className="text-sm font-semibold text-gray-700 dark:text-foreground/90">
        {title}
      </p>
      <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
        {hint}
      </p>
    </div>
  );
}
