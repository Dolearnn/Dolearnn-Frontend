'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Flag } from 'lucide-react';
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
import { REPORT_REASONS, reportQuestion, type ReportKind, type ReportReason } from '@/lib/api/question-reports';
import { cn } from '@/lib/utils';

/** A small "Report" link for any question: wrong answer, typo, unclear wording and so on. */
export default function ReportQuestion({ kind, questionId }: { kind: ReportKind; questionId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState('');
  const send = useMutation({
    mutationFn: () => reportQuestion({ kind, questionId, reason: reason!, note: note.trim() || undefined }),
  });

  if (send.isSuccess && !open) {
    return <p className="mt-2 text-xs text-gray-500 dark:text-muted-foreground">Thanks, we&apos;ll check this question.</p>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex items-center gap-1 py-1 text-xs font-medium text-gray-500 hover:text-brand dark:text-muted-foreground"
      >
        <Flag className="h-3.5 w-3.5" aria-hidden /> Report this question
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>What is wrong with this question?</DialogTitle>
            <DialogDescription>We review every report and fix the question if needed.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {REPORT_REASONS.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={reason === item.value}
                onClick={() => setReason(item.value)}
                className={cn(
                  'w-full rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors',
                  reason === item.value
                    ? 'border-brand bg-accent2-50 text-brand dark:border-accent2-400 dark:bg-accent2-500/15 dark:text-accent2-300'
                    : 'border-gray-200 text-gray-800 hover:border-brand/50 dark:border-border dark:text-foreground',
                )}
              >
                {item.label}
              </button>
            ))}
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Anything else we should know? (optional)"
            />
          </div>
          {send.isError && <p role="alert" className="text-sm text-red-600">Could not send that. Please try again.</p>}
          <DialogFooter>
            <Button
              className="rounded-full"
              disabled={!reason || send.isPending}
              onClick={() => send.mutate(undefined, { onSuccess: () => setOpen(false) })}
            >
              {send.isPending ? 'Sending…' : 'Send report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
