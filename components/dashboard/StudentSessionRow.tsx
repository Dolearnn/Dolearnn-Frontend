'use client';

import Link from 'next/link';
import { CheckCircle2, XCircle, Video } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
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
import { cn } from '@/lib/utils';
import {
  confirmSessionAttendance,
  requestSessionCancellation,
} from '@/lib/store/client';
import { teacherChild } from '@/lib/store/teacher';
import type { Session, SessionAttendance, SessionCancellation } from '@/lib/types';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function StudentSessionRow({ session }: { session: Session }) {
  const child = teacherChild(session.childId);
  const [attendance, setAttendance] = useState<SessionAttendance | undefined>(
    session.attendance,
  );
  const [cancellation, setCancellation] = useState<
    SessionCancellation | undefined
  >(session.cancellation);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const canConfirm =
    session.status === 'Completed' ||
    (session.status === 'Upcoming' &&
      new Date(session.startsAt).getTime() < Date.now());
  const teacherConfirmed = !!attendance?.teacherConfirmedAt;
  const cancellationPending = cancellation?.status === 'Pending';

  const confirmHeld = () => {
    confirmSessionAttendance(session.id, 'teacher');
    setAttendance((prev) => ({
      ...prev,
      teacherConfirmedAt: new Date().toISOString(),
    }));
  };

  const requestCancel = () => {
    const next = requestSessionCancellation({
      session,
      requestedBy: 'teacher',
      reason: cancelReason,
      studentName: child?.fullName,
    });
    if (!next) return;
    setCancellation(next[session.id]?.cancellation);
    setCancelReason('');
    setCancelOpen(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-brand/40 dark:hover:border-accent2-400/40 transition-colors"
      >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-accent2-600 dark:text-accent2-400 bg-accent2-50 dark:bg-accent2-500/10 px-2 py-0.5 rounded-full">
            {session.subject}
          </span>
          <StatusBadge status={session.status} />
          {cancellationPending && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
              Cancellation pending
            </span>
          )}
        </div>
        <p className="font-semibold text-gray-900 dark:text-foreground">
          {child?.fullName ?? 'Student'}
        </p>
        <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
          {formatDate(session.startsAt)} · {session.durationMins} min
        </p>
      </div>
      <div className="flex items-center gap-2">
        {session.status === 'Upcoming' && session.meetLink && (
          <Link href={session.meetLink} target="_blank" rel="noreferrer">
            <Button className="bg-brand hover:bg-brand-600 dark:bg-accent2-500 dark:hover:bg-accent2-400 dark:text-brand rounded-full">
              <Video className="w-4 h-4 mr-2" />
              Start
            </Button>
          </Link>
        )}
        {session.status === 'Upcoming' && !session.meetLink && (
          <Button variant="outline" className="rounded-full" disabled>
            Awaiting admin link
          </Button>
        )}
        {canConfirm && (
          <Button
            variant={teacherConfirmed ? 'outline' : 'default'}
            className={cn(
              'rounded-full',
              !teacherConfirmed && 'bg-brand hover:bg-brand-600',
            )}
            disabled={teacherConfirmed}
            onClick={confirmHeld}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {teacherConfirmed ? 'Confirmed held' : 'Confirm class held'}
          </Button>
        )}
        {session.status === 'Completed' && !session.noteId && (
          <Link href="/teacher/notes">
            <Button variant="outline" className="rounded-full">
              Add notes
            </Button>
          </Link>
        )}
        {session.status === 'Upcoming' && !cancellationPending && (
          <Button
            variant="outline"
            className="rounded-full text-red-600 hover:text-red-700"
            onClick={() => setCancelOpen(true)}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Request cancellation
          </Button>
        )}
      </div>
      </motion.div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request cancellation</DialogTitle>
            <DialogDescription>
              Admin will review this request before the session is cancelled.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Reason for cancelling this class"
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
              Submit request
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
        'text-[11px] font-medium px-2 py-0.5 rounded-full',
        styles[status],
      )}
    >
      {status}
    </span>
  );
}
