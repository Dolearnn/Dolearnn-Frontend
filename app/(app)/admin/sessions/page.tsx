'use client';

import { useState } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { CalendarPlus, Check, LinkIcon, Search, X } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import { PageShellSkeleton } from '@/components/dashboard/Skeletons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  adminKeys,
  approveAdminCancellation,
  createAdminSession,
  listAdminBookingRequests,
  listAdminSessionsPage,
  listAdminStudents,
  rejectAdminCancellation,
  scheduleAdminBookingRequest,
  updateAdminSessionMeetingLink,
} from '@/lib/api/admin';
import { cn } from '@/lib/utils';
import {
  isSessionPayoutEligible,
  type Child,
  type Session,
  type SessionBookingRequest,
  type SessionStatus,
} from '@/lib/types';

const TAB_ORDER: Array<'All' | SessionStatus> = [
  'All',
  'Upcoming',
  'Completed',
  'Cancelled',
];

export default function AdminSessionsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'All' | SessionStatus>('All');
  const [page, setPage] = useState(1);
  const [savingMeetingSessionId, setSavingMeetingSessionId] = useState<string | null>(
    null,
  );

  const sessionsQuery = useQuery({
    queryKey: adminKeys.sessionsPage({
      page,
      pageSize: 20,
      search: query,
      status,
    }),
    queryFn: () =>
      listAdminSessionsPage({
        page,
        pageSize: 20,
        search: query,
        status,
      }),
    placeholderData: keepPreviousData,
  });
  const bookingRequestsQuery = useQuery({
    queryKey: adminKeys.bookingRequests,
    queryFn: listAdminBookingRequests,
  });
  const studentsQuery = useQuery({
    queryKey: adminKeys.students,
    queryFn: listAdminStudents,
  });

  const sessions = sessionsQuery.data?.sessions ?? [];
  const summary = sessionsQuery.data?.summary;
  const pagination = sessionsQuery.data?.pagination;

  const invalidateSessions = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] });
    await queryClient.invalidateQueries({ queryKey: adminKeys.bookingRequests });
    await queryClient.invalidateQueries({ queryKey: adminKeys.cancellations });
  };

  const scheduleRequestMutation = useMutation({
    mutationFn: scheduleAdminBookingRequest,
    onSuccess: async () => {
      await invalidateSessions();
      toast({ title: 'Calendar sessions created' });
    },
    onError: (error) => {
      toast({
        title: 'Could not create sessions',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const meetingLinkMutation = useMutation({
    mutationFn: ({ sessionId, meetLink }: { sessionId: string; meetLink: string }) =>
      updateAdminSessionMeetingLink(sessionId, meetLink),
    onSuccess: async () => {
      await invalidateSessions();
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
    onSettled: () => setSavingMeetingSessionId(null),
  });

  const approveMutation = useMutation({
    mutationFn: approveAdminCancellation,
    onSuccess: async () => {
      await invalidateSessions();
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
    onSuccess: async () => {
      await invalidateSessions();
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

  const counts = {
    All: summary?.total ?? 0,
    Upcoming: summary?.upcoming ?? 0,
    Completed: summary?.completed ?? 0,
    Cancelled: summary?.cancelled ?? 0,
  };

  if (sessionsQuery.isLoading && !sessionsQuery.data) {
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

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search subject, student or teacher"
            className="rounded-full pl-9"
          />
        </div>
        <ScheduleSessionDialog students={studentsQuery.data ?? []} />
      </div>

      <BookingRequestsPanel
        requests={bookingRequestsQuery.data ?? []}
        scheduling={scheduleRequestMutation.isPending}
        onSchedule={(requestId) => scheduleRequestMutation.mutate(requestId)}
      />

      <div className="flex flex-wrap items-center gap-2 rounded-full border border-gray-200 bg-white p-1 dark:border-border dark:bg-card w-fit">
        {TAB_ORDER.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setStatus(tab);
              setPage(1);
            }}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm transition',
              status === tab
                ? 'bg-brand text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-muted-foreground dark:hover:text-foreground',
            )}
          >
            {tab}
            <span className="ml-2 text-xs opacity-70">{counts[tab]}</span>
          </button>
        ))}
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-border dark:bg-card">
          <p className="text-sm text-gray-500 dark:text-muted-foreground">
            No sessions match this filter.
          </p>
        </div>
      ) : (
        <>
          <SessionTable
            rows={sessions}
            savingLinkId={savingMeetingSessionId}
            resolvingCancellation={
              approveMutation.isPending || rejectMutation.isPending
            }
            onUpdateMeetingLink={(sessionId, meetLink) => {
              setSavingMeetingSessionId(sessionId);
              meetingLinkMutation.mutate({ sessionId, meetLink });
            }}
            onResolveCancellation={(requestId, decision) => {
              if (decision === 'Approved') {
                approveMutation.mutate(requestId);
              } else {
                rejectMutation.mutate(requestId);
              }
            }}
          />

          {pagination && pagination.totalPages > 1 ? (
            <div className="flex justify-end">
              <Pagination className="mx-0 w-auto justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        if (pagination.page > 1) setPage((current) => current - 1);
                      }}
                      className={cn(
                        pagination.page <= 1 && 'pointer-events-none opacity-50',
                      )}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <Button variant="ghost" size="sm" className="rounded-full px-4">
                      Page {pagination.page} of {pagination.totalPages}
                    </Button>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        if (pagination.page < pagination.totalPages) {
                          setPage((current) => current + 1);
                        }
                      }}
                      className={cn(
                        pagination.page >= pagination.totalPages &&
                          'pointer-events-none opacity-50',
                      )}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function BookingRequestsPanel({
  requests,
  scheduling,
  onSchedule,
}: {
  requests: SessionBookingRequest[];
  scheduling: boolean;
  onSchedule: (requestId: string) => void;
}) {
  const pending = requests.filter((request) => request.status === 'Pending');

  if (pending.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-200 p-4 space-y-3 bg-white dark:bg-card dark:border-amber-500/30">
      <div>
        <p className="font-semibold text-gray-900 dark:text-foreground">
          Calendar requests
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-muted-foreground">
          Families picked consistent paid slots. Review and create the 60-minute
          sessions.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {pending.map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-500/10"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-foreground">
                {request.childName ?? 'Student'} - {request.subject}
              </p>
              <p className="text-xs text-gray-600 dark:text-muted-foreground">
                {request.sessionsRequested}x {request.day}s at {request.startTime}
              </p>
            </div>
            <Button
              size="sm"
              className="rounded-full bg-brand hover:bg-brand-600 shrink-0"
              disabled={scheduling}
              onClick={() => onSchedule(request.id)}
            >
              {scheduling ? 'Creating...' : 'Create sessions'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SessionTable({
  rows,
  savingLinkId,
  resolvingCancellation,
  onUpdateMeetingLink,
  onResolveCancellation,
}: {
  rows: Session[];
  savingLinkId: string | null;
  resolvingCancellation: boolean;
  onUpdateMeetingLink: (sessionId: string, meetLink: string) => void;
  onResolveCancellation: (
    requestId: string,
    decision: 'Approved' | 'Rejected',
  ) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-border dark:bg-card">
      <div className="overflow-x-auto">
        <table className="min-w-[720px] w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-background dark:text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">When</th>
              <th className="px-4 py-3 text-left font-medium">Student</th>
              <th className="px-4 py-3 text-left font-medium">Teacher</th>
              <th className="px-4 py-3 text-left font-medium">Subject</th>
              <th className="px-4 py-3 text-left font-medium">Meeting link</th>
              <th className="px-4 py-3 text-left font-medium">Request</th>
              <th className="px-4 py-3 text-left font-medium">Teacher confirm</th>
              <th className="px-4 py-3 text-left font-medium">Family</th>
              <th className="px-4 py-3 text-left font-medium">Payout</th>
              <th className="px-4 py-3 text-right font-medium">Duration</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
              <th className="px-4 py-3 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-border">
            {rows.map((session) => (
              <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-foreground/90">
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
                    saving={savingLinkId === session.id}
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

function ScheduleSessionDialog({ students }: { students: Child[] }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [subject, setSubject] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [meetLink, setMeetLink] = useState('');

  const selectedStudent = students.find((child) => child.id === studentId);
  const subjects = Array.from(
    new Set(
      selectedStudent?.subjectAssignments?.map((assignment) => assignment.subject) ??
        [],
    ),
  );

  const mutation = useMutation({
    mutationFn: createAdminSession,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] });
      toast({ title: 'Session scheduled' });
      setOpen(false);
      setStudentId('');
      setSubject('');
      setStartsAt('');
      setMeetLink('');
    },
    onError: (error) => {
      toast({
        title: 'Could not schedule session',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const submit = () => {
    if (!studentId || !subject || !startsAt) return;
    mutation.mutate({
      studentId,
      subject,
      startsAt: new Date(startsAt).toISOString(),
      durationMins: 60,
      meetLink: meetLink || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full bg-brand hover:bg-brand-600">
          <CalendarPlus className="mr-2 h-4 w-4" />
          Schedule session
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule a session</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Student</Label>
            <Select
              value={studentId}
              onValueChange={(value) => {
                setStudentId(value);
                const child = students.find((item) => item.id === value);
                setSubject(child?.subjectAssignments?.[0]?.subject ?? '');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Subject</Label>
            {subjects.length > 0 ? (
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-xs text-amber-600">
                {studentId
                  ? 'Assign a teacher to this student before scheduling a session.'
                  : 'Pick a student to see their assigned subjects.'}
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Start</Label>
              <Input
                type="datetime-local"
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Duration</Label>
              <div className="flex h-10 items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 dark:border-border dark:bg-background dark:text-foreground/90">
                60 minutes
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Meeting link (optional)</Label>
            <Input
              value={meetLink}
              onChange={(event) => setMeetLink(event.target.value)}
              placeholder="https://meet.google.com/..."
            />
            <p className="text-[11px] text-gray-500 dark:text-muted-foreground">
              Leave empty to reuse the teacher-student assignment link.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={submit}
            disabled={
              !studentId ||
              !subject ||
              !startsAt ||
              subjects.length === 0 ||
              mutation.isPending
            }
            className="rounded-full bg-brand hover:bg-brand-600"
          >
            {mutation.isPending ? 'Scheduling...' : 'Schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmationBadge({ confirmed }: { confirmed: boolean }) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
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
        'rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
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
      <span className="text-[11px] whitespace-nowrap text-gray-400">No request</span>
    );
  }

  return (
    <div className="min-w-[240px] space-y-2">
      <div>
        {(() => {
          const requestLabel =
            cancellation.requestedBy === 'teacher' ? 'Reschedule' : 'Cancellation';
          return (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-medium capitalize',
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
        <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-muted-foreground">
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
            <Check className="mr-1 h-3.5 w-3.5" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-full"
            disabled={resolving}
            onClick={() => onResolve(cancellation.id!, 'Rejected')}
          >
            <X className="mr-1 h-3.5 w-3.5" />
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
    <div className="flex min-w-[260px] items-center gap-2">
      <div className="relative flex-1">
        <LinkIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
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
        <Check className="mr-1 h-3.5 w-3.5" />
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
      className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', styles[status])}
    >
      {status}
    </span>
  );
}
