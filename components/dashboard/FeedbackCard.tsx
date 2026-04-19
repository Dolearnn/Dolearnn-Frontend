'use client';

import { motion } from 'framer-motion';
import { StarRating } from '@/components/ui/star-rating';
import { cn } from '@/lib/utils';
import { familySessionNote, familyTeacher } from '@/lib/store/family';
import type { Session } from '@/lib/types';

export default function FeedbackCard({ session }: { session: Session }) {
  const note = familySessionNote(session.noteId);
  const teacher = familyTeacher(session.teacherId);
  if (!note) {
    return (
      <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-4">
        <p className="text-xs text-gray-500 dark:text-muted-foreground">
          Feedback pending — teacher submits notes after the session.
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
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-5"
    >
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-foreground truncate">
            {teacher.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-muted-foreground">
            {session.subject} ·{' '}
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
      <div className="space-y-2 text-sm">
        <Row label="Covered" value={note.covered} />
        <Row label="Focus next" value={note.focusNext} />
        {note.concerns && <Row label="Concerns" value={note.concerns} />}
      </div>
    </motion.div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-gray-400 dark:text-muted-foreground">
        {label}
      </p>
      <p className="text-gray-700 dark:text-foreground/90">{value}</p>
    </div>
  );
}
