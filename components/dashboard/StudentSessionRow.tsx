'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { isSafeMeetingLink } from '@/lib/urls';
import { cn } from '@/lib/utils';
import type { Session, SessionAttendance, SessionCancellation } from '@/lib/types';

function formatDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function StudentSessionRow({
  session,
  onConfirmHeld,
  onRequestCancellation,
}: {
  session: Session;
  onConfirmHeld?: (sessionId: string) => Promise<void> | void;
  onRequestCancellation?: (
    sessionId: string,
    reason: string,
  ) => Promise<void> | void;
}) {
  const [attendance, setAttendance] = useState<SessionAttendance | undefined>(
    session.attendance,
  );
  const [cancellation, setCancellation] = useState<
    SessionCancellation | undefined
  >(session.cancellation);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const canConfirm =
    session.status === 'Completed' ||
    (session.status === 'Upcoming' &&
      new Date(session.startsAt).getTime() < Date.now());
  const teacherConfirmed = !!attendance?.teacherConfirmedAt;
  const cancellationPending = cancellation?.status === 'Pending';
  const safeMeetingLink = isSafeMeetingLink(session.meetLink)
    ? session.meetLink
    : null;

  useEffect(() => {
    setAttendance(session.attendance);
    setCancellation(session.cancellation);
  }, [session.attendance, session.cancellation]);

  const confirmHeld = async () => {
    if (!onConfirmHeld) return;
    setIsConfirming(true);
    try {
      await onConfirmHeld(session.id);
      setAttendance((prev) => ({
        ...prev,
        teacherConfirmedAt: new Date().toISOString(),
      }));
    } finally {
      setIsConfirming(false);
    }
  };

  const requestCancel = async () => {
    if (!onRequestCancellation) return;
    await onRequestCancellation(session.id, cancelReason);
    setCancellation({
      requestedBy: 'teacher',
      requestedAt: new Date().toISOString(),
      reason: cancelReason,
      status: 'Pending',
    });
    setCancelReason('');
    setCancelOpen(false);
  };

  return (
    <>
      <div className="flex flex-col gap-4 rounded-3xl border border-gray-200/80 bg-white p-4 dark:border-border dark:bg-card sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {/* A clock tile: the start time in big numbers. */}
          <div
            aria-hidden
            className={cn(
              'flex h-14 w-16 shrink-0 flex-col items-center justify-center rounded-2xl',
              session.status === 'Upcoming'
                ? 'bg-brand text-white dark:bg-accent2-500 dark:text-brand'
                : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-muted-foreground',
            )}
          >
            <span className="font-display text-base font-extrabold leading-tight tabular-nums">
              {new Date(session.startsAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M$/i, '')}
            </span>
            <span className="text-[10px] font-semibold uppercase leading-none tracking-wide opacity-80">
              {new Date(session.startsAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-accent2-50 px-2 py-0.5 text-xs font-semibold text-accent2-700 dark:bg-accent2-500/10 dark:text-accent2-400">
                {session.subject}
              </span>
              <StatusBadge status={session.status} />
              {cancellationPending && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                  Reschedule pending
                </span>
              )}
            </div>
            <p className="truncate font-semibold text-gray-900 dark:text-foreground">
              {session.childName ?? 'Student'}
            </p>
            <p className="mt-0.5 text-xs tabular-nums text-gray-500 dark:text-muted-foreground">
              {formatDate(session.startsAt)}, {session.durationMins} min
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          {session.status === 'Upcoming' && safeMeetingLink && (
            <Button asChild className="h-11 flex-1 rounded-2xl px-5 sm:flex-none">
              <Link href={safeMeetingLink} target="_blank" rel="noopener noreferrer">
                <Video className="mr-1.5 h-4 w-4" />
                Start lesson
              </Link>
            </Button>
          )}
          {session.status === 'Upcoming' && !safeMeetingLink && (
            <Button variant="outline" className="h-11 flex-1 rounded-2xl sm:flex-none" disabled>
              Link coming soon
            </Button>
          )}
          {canConfirm && (
            <Button
              variant={teacherConfirmed ? 'outline' : 'default'}
              className="h-11 flex-1 rounded-2xl px-5 sm:flex-none"
              disabled={teacherConfirmed || !onConfirmHeld || isConfirming}
              onClick={confirmHeld}
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              {isConfirming
                ? 'Confirming…'
                : teacherConfirmed
                  ? 'Confirmed'
                  : 'Confirm it happened'}
            </Button>
          )}
          {session.status === 'Completed' && !session.noteId && (
            <Button asChild variant="outline" className="h-11 flex-1 rounded-2xl px-5 sm:flex-none">
              <Link href="/teacher/notes">Add notes</Link>
            </Button>
          )}
          {session.status === 'Upcoming' &&
            !cancellationPending &&
            onRequestCancellation && (
              <Button
                variant="ghost"
                className="h-11 w-11 shrink-0 rounded-2xl p-0 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/10"
                onClick={() => setCancelOpen(true)}
                aria-label="Request reschedule"
                title="Request reschedule"
              >
                <XCircle className="h-5 w-5" />
              </Button>
            )}
        </div>
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request reschedule</DialogTitle>
            <DialogDescription>
              Admin will review this and help decide the next step. The learner
              will only be contacted after admin reviews it.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            placeholder="Reason you need to change this class"
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              disabled={!cancelReason.trim()}
              onClick={requestCancel}
            >
              Send to admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StatusBadge({ status }: { status: Session['status'] }) {
  const styles: Record<Session['status'], string> = {
    Upcoming: 'bg-brand/10 text-brand dark:bg-accent2-500/15 dark:text-accent2-400',
    Completed:
      'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-muted-foreground',
    Cancelled:
      'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400',
  };
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-xs font-medium',
        styles[status],
      )}
    >
      {status}
    </span>
  );
}
