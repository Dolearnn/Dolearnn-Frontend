'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck2, CalendarX2 } from 'lucide-react';
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
import { cn } from '@/lib/utils';
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
  confirmFamilySessionAttendance,
  createFamilyBookingRequest,
  familyKeys,
  getFamilySessionCredits,
  listFamilyBookingRequests,
  listFamilySessions,
  listFamilyStudents,
  requestFamilySessionCancellation,
} from '@/lib/api/family';
import type {
  Child,
  DayOfWeek,
  Session,
  SessionBookingRequest,
  SessionCreditSummary,
  SessionStatus,
  TimeBlock,
} from '@/lib/types';

const TAB_ORDER: SessionStatus[] = ['Upcoming', 'Completed', 'Cancelled'];
const ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? 'dolearnnn@gmail.com';

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

export default function SessionsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const studentsQuery = useQuery({
    queryKey: familyKeys.students,
    queryFn: listFamilyStudents,
  });
  const sessionsQuery = useQuery({
    queryKey: familyKeys.sessions,
    queryFn: listFamilySessions,
  });
  const creditsQuery = useQuery({
    queryKey: familyKeys.credits,
    queryFn: getFamilySessionCredits,
  });
  const bookingRequestsQuery = useQuery({
    queryKey: familyKeys.bookingRequests,
    queryFn: listFamilyBookingRequests,
  });

  // A learner account has exactly one tutoring profile: their own.
  const active = studentsQuery.data?.[0] ?? null;

  const invalidateSessions = () => {
    queryClient.invalidateQueries({ queryKey: familyKeys.sessions });
    queryClient.invalidateQueries({ queryKey: familyKeys.credits });
    queryClient.invalidateQueries({ queryKey: familyKeys.bookingRequests });
  };

  const bookingMutation = useMutation({
    mutationFn: createFamilyBookingRequest,
    onSuccess: () => {
      invalidateSessions();
      toast({
        title: 'Calendar request sent',
        description: 'Admin will review and schedule the sessions.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Could not send calendar request',
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
    sessionsQuery.isLoading;
  const error =
    studentsQuery.error ?? sessionsQuery.error;

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
          description="All your lessons - past, present and upcoming."
        />
        <EmptyState
          title="Your tutoring profile is not ready"
          hint="Request a tutor first; your lessons will then be planned here."
        />
        <a href={`mailto:${ADMIN_EMAIL}`} className="text-sm font-medium text-brand">
          Contact us if this does not clear
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Sessions"
        description="All your lessons: upcoming, completed and cancelled."
      />

      <CalendarRequestPanel
        child={active}
        credits={creditsQuery.data}
        requests={(bookingRequestsQuery.data ?? []).filter(
          (request) => request.childId === active.id,
        )}
        submitting={bookingMutation.isPending}
        onSubmit={(input) => bookingMutation.mutate(input)}
      />

      <Tabs defaultValue="Upcoming" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-3 rounded-full border border-gray-200/80 bg-white p-1 dark:border-border dark:bg-card sm:inline-grid sm:w-auto">
          {TAB_ORDER.map((status) => (
            <TabsTrigger
              key={status}
              value={status}
              className="min-h-10 rounded-full px-3 text-sm data-[state=active]:bg-brand data-[state=active]:text-white dark:data-[state=active]:bg-accent2-500 dark:data-[state=active]:text-brand sm:px-4"
            >
              {status}
              <span className="ml-1.5 text-xs tabular-nums opacity-70">
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

function CalendarRequestPanel({
  child,
  credits,
  requests,
  submitting,
  onSubmit,
}: {
  child: Child;
  credits?: SessionCreditSummary;
  requests: SessionBookingRequest[];
  submitting: boolean;
  onSubmit: (input: {
    studentId: string;
    subject: string;
    day: DayOfWeek;
    timeBlock: TimeBlock;
    startTime: string;
    startDate: string;
    sessionsRequested: number;
  }) => void;
}) {
  const assignments = child.subjectAssignments ?? [];
  const availability = Object.entries(child.intake?.preferredSchedule ?? {}) as Array<
    [DayOfWeek, TimeBlock]
  >;
  const [subject, setSubject] = useState(assignments[0]?.subject ?? '');
  const [slot, setSlot] = useState(
    availability[0] ? `${availability[0][0]}:${availability[0][1]}` : '',
  );
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  // One lesson per request for now; the field that changed it was always locked.
  const [sessionsRequested] = useState('1');
  const [day, timeBlock] = slot
    ? (slot.split(':') as [DayOfWeek, TimeBlock])
    : [undefined, undefined];
  const exactTimeInvalid =
    !!startTime && !!timeBlock && !timeIsInBlock(startTime, timeBlock);
  const subjectCredits = (credits?.packages ?? [])
    .filter(
      (lessonPackage) =>
        lessonPackage.childId === child.id &&
        lessonPackage.subject.toLowerCase() === subject.toLowerCase() &&
        lessonPackage.status === 'Active',
    )
    .reduce((sum, lessonPackage) => sum + lessonPackage.availableSessions, 0);
  const pendingSubjectRequests = requests
    .filter(
      (request) =>
        request.status === 'Pending' &&
        request.subject.toLowerCase() === subject.toLowerCase(),
    )
    .reduce((sum, request) => sum + request.sessionsRequested, 0);
  const availableSessions = Math.max(
    0,
    subjectCredits - pendingSubjectRequests,
  );
  const requestedCount = Number(sessionsRequested) || 0;
  const canSubmit =
    !!subject &&
    !!day &&
    !!timeBlock &&
    !!startDate &&
    !!startTime &&
    requestedCount > 0 &&
    requestedCount <= availableSessions &&
    !exactTimeInvalid;

  return (
    <section
      aria-labelledby="plan-lessons-heading"
      className="space-y-4 rounded-3xl border border-gray-200/80 bg-white p-4 dark:border-border dark:bg-card sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="plan-lessons-heading" className="font-display text-lg font-bold text-gray-950 dark:text-foreground">
            Plan your lessons
          </h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-muted-foreground">
            Pick a regular weekly 60-minute slot for the sessions you have paid for.
          </p>
        </div>
        <p className="shrink-0 rounded-2xl bg-accent2-100 px-3 py-2 text-center text-brand dark:bg-accent2-500/15 dark:text-accent2-400">
          <span className="block font-display text-xl font-extrabold leading-none tabular-nums">{availableSessions}</span>
          <span className="mt-0.5 block text-[11px] font-medium">{availableSessions === 1 ? 'session' : 'sessions'} left</span>
        </p>
      </div>

      {assignments.length === 0 ? (
        child.intake ? (
          <p className="rounded-2xl bg-amber-50 p-3.5 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            We are matching you with a tutor for your subjects. Once you are matched, you can plan
            your lessons here.
          </p>
        ) : (
          <div className="flex flex-col gap-3 rounded-2xl bg-accent2-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:bg-accent2-500/10">
            <p className="text-sm text-gray-700 dark:text-foreground/90">
              Tell us what you need help with and we will match you with a tutor.
            </p>
            <Link
              href="/student/tutor"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-2xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-600"
            >
              Request a tutor
            </Link>
          </div>
        )
      ) : availability.length === 0 ? (
        <p className="rounded-2xl bg-amber-50 p-3.5 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          Add your available days and times in your tutor request before picking lesson days.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="plan-subject">Subject</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger id="plan-subject" className="h-11 rounded-xl">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                {assignments.map((assignment) => (
                  <SelectItem key={assignment.id} value={assignment.subject}>
                    {assignment.subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan-slot">Weekly slot</Label>
            <Select value={slot} onValueChange={setSlot}>
              <SelectTrigger id="plan-slot" className="h-11 rounded-xl">
                <SelectValue placeholder="Weekly slot" />
              </SelectTrigger>
              <SelectContent>
                {availability.map(([itemDay, itemTime]) => (
                  <SelectItem key={`${itemDay}:${itemTime}`} value={`${itemDay}:${itemTime}`}>
                    {itemDay}, {itemTime.toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan-start-date">First lesson</Label>
            <Input
              id="plan-start-date"
              type="date"
              className="h-11 rounded-xl"
              min={new Date().toISOString().slice(0, 10)}
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan-start-time">Start time</Label>
            <Input
              id="plan-start-time"
              type="time"
              className="h-11 rounded-xl"
              value={startTime}
              aria-invalid={exactTimeInvalid}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between lg:col-span-4">
            <p className={cn('text-xs', exactTimeInvalid ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-muted-foreground')}>
              {exactTimeInvalid && timeBlock
                ? `Start time must be inside the ${timeBlock.toLowerCase()} block.`
                : 'An admin reviews this request and adds the sessions to your calendar.'}
            </p>
            <Button
              className="h-12 shrink-0 rounded-2xl px-6 text-[15px]"
              disabled={!canSubmit || submitting}
              onClick={() => {
                if (!day || !timeBlock) return;
                onSubmit({
                  studentId: child.id,
                  subject,
                  day,
                  timeBlock,
                  startDate,
                  startTime,
                  sessionsRequested: requestedCount,
                });
              }}
            >
              {submitting ? 'Sending…' : 'Send calendar request'}
            </Button>
          </div>
        </div>
      )}

      {requests.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-foreground">
            Your lesson requests
          </p>
          <p className="text-xs text-gray-500 dark:text-muted-foreground">
            An admin confirms every lesson and adds the meeting link.
          </p>
          {requests.slice(0, 3).map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-gray-50 px-3.5 py-2.5 text-xs dark:bg-white/5"
            >
              <span>
                {request.sessionsRequested}x {request.subject} on {request.day}s at{' '}
                {request.startTime}
              </span>
              <span className="text-right">
                <span className="block font-semibold text-brand dark:text-accent2-400">
                  {request.status === 'Pending' ? 'Waiting for admin' : request.status === 'Scheduled' ? 'Approved' : 'Declined'}
                </span>
                {request.declineReason && (
                  <span className="block text-gray-600 dark:text-muted-foreground">{request.declineReason}</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-center dark:border-border dark:bg-card">
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
