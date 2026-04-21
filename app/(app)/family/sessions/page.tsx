'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck2, CalendarX2 } from 'lucide-react';
import ChildSwitcher from '@/components/dashboard/ChildSwitcher';
import FeedbackCard from '@/components/dashboard/FeedbackCard';
import PageHeader from '@/components/dashboard/PageHeader';
import SessionRow from '@/components/dashboard/SessionRow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
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
import type {
  Child,
  DayOfWeek,
  Session,
  SessionProposal,
  SessionStatus,
  TimeBlock,
} from '@/lib/types';

const TAB_ORDER: SessionStatus[] = ['Upcoming', 'Completed', 'Cancelled'];

const TIME_BLOCK_RANGES: Record<TimeBlock, { start: number; end: number }> = {
  Morning: { start: 6 * 60, end: 12 * 60 },
  Afternoon: { start: 12 * 60, end: 17 * 60 },
  Evening: { start: 17 * 60, end: 22 * 60 },
};

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function timeIsInBlock(time: string, block: TimeBlock) {
  const range = TIME_BLOCK_RANGES[block];
  const minutes = timeToMinutes(time);
  return minutes >= range.start && minutes < range.end;
}

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
    mutationFn: ({
      proposalId,
      reason,
      preferredAlternative,
      preferredAlternativeExactTime,
    }: {
      proposalId: string;
      reason: string;
      preferredAlternative?: {
        day: DayOfWeek;
        time: TimeBlock;
      };
      preferredAlternativeExactTime?: string;
    }) =>
      declineFamilySessionProposal(proposalId, {
        reason,
        preferredAlternative,
        preferredAlternativeExactTime,
      }),
    onSuccess: () => {
      invalidateSessions();
      toast({
        title: 'Different time requested',
        description: 'The teacher will propose another time for this lesson.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Could not request different time',
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
              child={active}
              accepting={
                acceptMutation.isPending &&
                acceptMutation.variables === proposal.id
              }
              declining={
                declineMutation.isPending &&
                declineMutation.variables?.proposalId === proposal.id
              }
              onAccept={() => acceptMutation.mutate(proposal.id)}
              onDecline={(input) =>
                declineMutation.mutate({
                  proposalId: proposal.id,
                  ...input,
                })
              }
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
  child,
  accepting,
  declining,
  onAccept,
  onDecline,
}: {
  proposal: SessionProposal;
  child: Child;
  accepting: boolean;
  declining: boolean;
  onAccept: () => void;
  onDecline: (input: {
    reason: string;
    preferredAlternative?: {
      day: DayOfWeek;
      time: TimeBlock;
    };
    preferredAlternativeExactTime?: string;
  }) => void;
}) {
  const [declineOpen, setDeclineOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [preferredSlot, setPreferredSlot] = useState('none');
  const [preferredExactTime, setPreferredExactTime] = useState('');
  const availability = Object.entries(child.intake?.preferredSchedule ?? {}) as Array<
    [DayOfWeek, TimeBlock]
  >;
  const hasAvailability = availability.length > 0;
  const selectedAvailability =
    preferredSlot === 'none'
      ? undefined
      : (preferredSlot.split(':') as [DayOfWeek, TimeBlock]);
  const selectedTimeBlock = selectedAvailability?.[1];
  const exactTimeInvalid =
    !!preferredExactTime &&
    !!selectedTimeBlock &&
    !timeIsInBlock(preferredExactTime, selectedTimeBlock);

  function submitDecline() {
    const [day, time] =
      preferredSlot === 'none'
        ? []
        : (preferredSlot.split(':') as [DayOfWeek, TimeBlock]);

    onDecline({
      reason,
      preferredAlternative: day && time ? { day, time } : undefined,
      preferredAlternativeExactTime:
        day && time && preferredExactTime ? preferredExactTime : undefined,
    });
    setDeclineOpen(false);
    setReason('');
    setPreferredSlot('none');
    setPreferredExactTime('');
  }

  return (
    <>
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
            onClick={() => setDeclineOpen(true)}
          >
            {declining ? 'Sending...' : 'Request different time'}
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

      <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a different time</DialogTitle>
            <DialogDescription>
              This does not cancel the lesson. It tells the teacher this time
              does not work and asks them to propose another saved slot.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`decline-reason-${proposal.id}`}>
                Reason
              </Label>
              <Textarea
                id={`decline-reason-${proposal.id}`}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Example: We still want this lesson, but this time clashes with school pickup."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Preferred alternative</Label>
              {hasAvailability ? (
                <Select
                  value={preferredSlot}
                  onValueChange={(value) => {
                    setPreferredSlot(value);
                    if (value === 'none') setPreferredExactTime('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pick from saved availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Let teacher choose another time</SelectItem>
                    {availability.map(([day, time]) => (
                      <SelectItem key={`${day}:${time}`} value={`${day}:${time}`}>
                        {day} - {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3">
                  This student has no saved availability yet.
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-muted-foreground">
                If the time you want is not listed, update the child&apos;s
                availability first.
              </p>
              {selectedTimeBlock && (
                <div className="space-y-2">
                  <Label htmlFor={`exact-time-${proposal.id}`}>
                    Preferred exact time
                  </Label>
                  <Input
                    id={`exact-time-${proposal.id}`}
                    type="time"
                    value={preferredExactTime}
                    onChange={(event) =>
                      setPreferredExactTime(event.target.value)
                    }
                  />
                  <p
                    className={
                      exactTimeInvalid
                        ? 'text-xs text-red-600'
                        : 'text-xs text-gray-500 dark:text-muted-foreground'
                    }
                  >
                    Pick a time inside the selected {selectedTimeBlock} block.
                  </p>
                </div>
              )}
              <Link
                href={`/family/children/${child.id}/intake`}
                className="text-xs font-semibold text-brand"
              >
                Update availability
              </Link>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              disabled={
                reason.trim().length < 5 || exactTimeInvalid || declining
              }
              onClick={submitDecline}
            >
              {declining ? 'Sending...' : 'Send request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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
