'use client';

import { StarRating } from '@/components/ui/star-rating';
import { cn } from '@/lib/utils';
import type { Session } from '@/lib/types';

export default function FeedbackCard({ session }: { session: Session }) {
  const note = session.note;

  if (!note) {
    return (
      <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-4 dark:border-border dark:bg-card">
        <p className="text-sm text-gray-500 dark:text-muted-foreground">
          Your teacher&apos;s notes will appear here after the lesson.
        </p>
      </div>
    );
  }

  const perfColor =
    note.performance === 'Excellent'
      ? 'bg-accent2-100 text-accent2-700 dark:bg-accent2-500/20 dark:text-accent2-300'
      : note.performance === 'Good'
        ? 'bg-brand/10 text-brand dark:bg-accent2-500/15 dark:text-accent2-400'
        : 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300';

  return (
    <div className="rounded-3xl bg-accent2-50/60 p-4 dark:bg-accent2-500/5 sm:p-5">
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-foreground truncate">
            {session.teacherName ?? 'Teacher'}
          </p>
          <p className="text-xs text-gray-500 dark:text-muted-foreground">
            {session.subject},{' '}
            {new Date(session.startsAt).toLocaleDateString(undefined, {
              day: 'numeric',
              month: 'short',
            })}
          </p>
          <div className="mt-1.5">
            <StarRating value={note.rating} readOnly size="sm" />
          </div>
        </div>
        <span
          className={cn(
            'text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0',
            perfColor,
          )}
        >
          {note.performance}
        </span>
      </div>
      <div className="space-y-3 text-sm">
        <Row label="Covered" value={note.covered} />
        <Row label="Focus next" value={note.focusNext} />
        {note.concerns && <Row label="Concerns" value={note.concerns} />}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 dark:text-muted-foreground">{label}</p>
      <p className="mt-0.5 leading-6 text-gray-800 dark:text-foreground/90">{value}</p>
    </div>
  );
}
