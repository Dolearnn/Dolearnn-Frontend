'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, ClipboardList, PenLine } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import { PageShellSkeleton } from '@/components/dashboard/Skeletons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StarRating } from '@/components/ui/star-rating';
import { useToast } from '@/hooks/use-toast';
import {
  listTeacherNotes,
  listTeacherSessions,
  reportTeacherContactAttempt,
  submitTeacherSessionNote,
  teacherKeys,
} from '@/lib/api/teacher';
import { cn } from '@/lib/utils';
import type { Performance, Rating, Session, SessionNote } from '@/lib/types';

const PERFORMANCE_OPTIONS: Performance[] = ['Excellent', 'Good', 'Needs Work'];
const PHONE_NUMBER_MESSAGE =
  'Do not include phone numbers. This has been reported to admin.';

type DraftMap = Record<string, DraftNote>;

interface DraftNote {
  covered: string;
  performance: Performance;
  rating: Rating;
  focusNext: string;
  concerns?: string;
}

function containsPhoneNumber(value?: string) {
  if (!value) return false;
  const candidates = value.match(/\+?\d[\d\s().-]{5,}\d/g) ?? [];
  return candidates.some((candidate) => candidate.replace(/\D/g, '').length >= 7);
}

function notePhoneFields(draft?: DraftNote) {
  if (!draft) return [];
  return [
    ['covered', draft.covered] as const,
    ['focusNext', draft.focusNext] as const,
    ['concerns', draft.concerns] as const,
  ]
    .filter(([, value]) => containsPhoneNumber(value))
    .map(([field]) => field);
}

type NoteField = 'covered' | 'focusNext' | 'concerns';

export default function TeacherNotesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<DraftMap>({});
  const [reportedAttempts, setReportedAttempts] = useState<Set<string>>(
    () => new Set(),
  );

  const sessionsQuery = useQuery({
    queryKey: teacherKeys.sessions,
    queryFn: listTeacherSessions,
  });
  const notesQuery = useQuery({
    queryKey: teacherKeys.notes,
    queryFn: listTeacherNotes,
  });

  const sessions = useMemo(
    () => sessionsQuery.data ?? [],
    [sessionsQuery.data],
  );
  const notes = useMemo(() => notesQuery.data ?? [], [notesQuery.data]);

  const noteMutation = useMutation({
    mutationFn: ({ session, draft }: { session: Session; draft: DraftNote }) =>
      submitTeacherSessionNote(session.id, draft),
    onSuccess: (_note, variables) => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.sessions });
      queryClient.invalidateQueries({ queryKey: teacherKeys.notes });
      setDrafts((previous) => {
        const { [variables.session.id]: _removed, ...rest } = previous;
        return rest;
      });
      toast({ title: 'Session note submitted' });
    },
    onError: (error) => {
      toast({
        title: 'Could not submit note',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const reportMutation = useMutation({
    mutationFn: ({
      sessionId,
      field,
      value,
    }: {
      sessionId: string;
      field: NoteField;
      value: string;
    }) => reportTeacherContactAttempt(sessionId, field, value),
    onSuccess: (_result, variables) => {
      setReportedAttempts((previous) => {
        const next = new Set(previous);
        next.add(`${variables.sessionId}:${variables.field}`);
        return next;
      });
      toast({
        title: 'Reported to admin',
        description:
          'Phone numbers are not allowed in feedback. Admin has been notified.',
        variant: 'destructive',
      });
    },
  });

  const needsNotes = useMemo(
    () =>
      sessions
        .filter(
          (session) =>
            session.status === 'Completed' &&
            !notes.some((note) => note.sessionId === session.id),
        )
        .sort((a, b) => b.startsAt.localeCompare(a.startsAt)),
    [sessions, notes],
  );

  const submittedNotes = useMemo(() => {
    return notes
      .map((note) => ({
        note,
        session: sessions.find((session) => session.id === note.sessionId),
      }))
      .filter((item): item is { note: SessionNote; session: Session } =>
        Boolean(item.session),
      )
      .sort((a, b) => b.note.createdAt.localeCompare(a.note.createdAt));
  }, [notes, sessions]);

  const updateDraft = (sessionId: string, patch: Partial<DraftNote>) => {
    for (const [field, value] of Object.entries(patch) as Array<
      [NoteField, string | Performance | Rating | undefined]
    >) {
      if (
        (field === 'covered' || field === 'focusNext' || field === 'concerns') &&
        typeof value === 'string' &&
        containsPhoneNumber(value) &&
        !reportedAttempts.has(`${sessionId}:${field}`) &&
        !reportMutation.isPending
      ) {
        reportMutation.mutate({ sessionId, field, value });
      }
    }

    setDrafts((previous) => {
      const current: DraftNote = previous[sessionId] ?? {
        covered: '',
        performance: 'Good',
        rating: 4,
        focusNext: '',
      };
      return { ...previous, [sessionId]: { ...current, ...patch } };
    });
  };

  const submitDraft = (session: Session) => {
    const draft = drafts[session.id];
    if (!draft || !draft.covered.trim() || !draft.focusNext.trim() || !draft.rating) {
      return;
    }
    if (notePhoneFields(draft).length > 0) {
      toast({
        title: 'Remove phone numbers',
        description: PHONE_NUMBER_MESSAGE,
        variant: 'destructive',
      });
      return;
    }
    noteMutation.mutate({ session, draft });
  };

  const isLoading = sessionsQuery.isLoading || notesQuery.isLoading;
  const error = sessionsQuery.error ?? notesQuery.error;

  if (isLoading) {
    return <PageShellSkeleton />;
  }

  if (error) {
    return (
      <p className="text-sm text-red-600">
        {error instanceof Error ? error.message : 'Could not load notes.'}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Session notes"
        description="Share what was covered, how the student did, and what's next."
      />

      <section>
        <div className="flex items-center gap-2 mb-3">
          <PenLine className="w-4 h-4 text-brand" />
          <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90">
            Pending notes ({needsNotes.length})
          </h2>
        </div>
        {needsNotes.length === 0 ? (
          <div className="bg-white dark:bg-card rounded-2xl border border-dashed border-gray-300 dark:border-border p-8 text-center">
            <ClipboardCheck className="w-6 h-6 text-accent2-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700 dark:text-foreground/90">
              All caught up
            </p>
            <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
              No completed sessions are waiting on notes.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {needsNotes.map((session) => (
              <DraftCard
                key={session.id}
                session={session}
                draft={drafts[session.id]}
                submitting={noteMutation.isPending}
                reportedFields={Array.from(reportedAttempts)
                  .filter((key) => key.startsWith(`${session.id}:`))
                  .map((key) => key.split(':')[1] as NoteField)}
                onChange={(patch) => updateDraft(session.id, patch)}
                onSubmit={() => submitDraft(session)}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="w-4 h-4 text-brand" />
          <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90">
            Submitted ({submittedNotes.length})
          </h2>
        </div>
        {submittedNotes.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-muted-foreground">
            No notes submitted yet.
          </p>
        ) : (
          <div className="space-y-3">
            {submittedNotes.map(({ note, session }) => (
              <SubmittedCard key={note.id} note={note} session={session} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function DraftCard({
  session,
  draft,
  submitting,
  reportedFields,
  onChange,
  onSubmit,
}: {
  session: Session;
  draft?: DraftNote;
  submitting: boolean;
  reportedFields: NoteField[];
  onChange: (patch: Partial<DraftNote>) => void;
  onSubmit: () => void;
}) {
  const rating = draft?.rating ?? 0;
  const blockedFields = notePhoneFields(draft);
  const hasPhoneNumber = blockedFields.length > 0;
  const canSubmit =
    !!draft &&
    draft.covered.trim().length > 0 &&
    draft.focusNext.trim().length > 0 &&
    rating > 0 &&
    !hasPhoneNumber;
  const warningText = (field: NoteField) =>
    reportedFields.includes(field)
      ? PHONE_NUMBER_MESSAGE
      : 'Phone numbers are not allowed in feedback.';

  return (
    <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900 dark:text-foreground">
            {session.childName ?? 'Student'} - {session.subject}
          </p>
          <p className="text-xs text-gray-500 dark:text-muted-foreground">
            {new Date(session.startsAt).toLocaleString(undefined, {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            - {session.durationMins} min
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Overall rating</Label>
        <div className="flex items-center gap-3">
          <StarRating
            value={rating}
            size="lg"
            onChange={(value) => onChange({ rating: value as Rating })}
          />
          <span className="text-xs text-gray-500 dark:text-muted-foreground">
            {rating > 0 ? `${rating} of 5` : 'Tap to rate this session'}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`covered-${session.id}`} className="text-xs">
          What was covered
        </Label>
        <Textarea
          id={`covered-${session.id}`}
          placeholder="e.g. Quadratic equations, factorisation basics"
          value={draft?.covered ?? ''}
          onChange={(event) => onChange({ covered: event.target.value })}
          rows={2}
          className={cn(
            blockedFields.includes('covered') && 'border-red-300 focus-visible:ring-red-500',
          )}
        />
        {blockedFields.includes('covered') && (
          <p className="text-xs text-red-600">{warningText('covered')}</p>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">Performance</Label>
          <Select
            value={draft?.performance ?? 'Good'}
            onValueChange={(value) =>
              onChange({ performance: value as Performance })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERFORMANCE_OPTIONS.map((performance) => (
                <SelectItem key={performance} value={performance}>
                  {performance}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`focus-${session.id}`} className="text-xs">
            Focus next time
          </Label>
          <Input
            id={`focus-${session.id}`}
            placeholder="e.g. Word problems with fractions"
            value={draft?.focusNext ?? ''}
            onChange={(event) => onChange({ focusNext: event.target.value })}
            className={cn(
              blockedFields.includes('focusNext') &&
                'border-red-300 focus-visible:ring-red-500',
            )}
          />
          {blockedFields.includes('focusNext') && (
            <p className="text-xs text-red-600">{warningText('focusNext')}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`concerns-${session.id}`} className="text-xs">
          Concerns (optional)
        </Label>
        <Textarea
          id={`concerns-${session.id}`}
          placeholder="Anything the parent should know"
          value={draft?.concerns ?? ''}
          onChange={(event) => onChange({ concerns: event.target.value })}
          rows={2}
          className={cn(
            blockedFields.includes('concerns') && 'border-red-300 focus-visible:ring-red-500',
          )}
        />
        {blockedFields.includes('concerns') && (
          <p className="text-xs text-red-600">{warningText('concerns')}</p>
        )}
      </div>

      <div className="flex justify-end">
        <p className="mr-auto text-xs text-gray-500 dark:text-muted-foreground">
          Parents will see this feedback after you submit it.
        </p>
        <Button
          className="bg-brand hover:bg-brand-600 rounded-full"
          disabled={!canSubmit || submitting}
          onClick={onSubmit}
        >
          {submitting ? 'Submitting...' : 'Submit feedback'}
        </Button>
      </div>
    </div>
  );
}

function SubmittedCard({
  note,
  session,
}: {
  note: SessionNote;
  session: Session;
}) {
  const perfColor =
    note.performance === 'Excellent'
      ? 'bg-accent2-100 text-accent2-700'
      : note.performance === 'Good'
        ? 'bg-brand/10 text-brand'
        : 'bg-amber-50 text-amber-700';
  return (
    <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-5">
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-foreground truncate">
            {session.childName ?? 'Student'}
          </p>
          <p className="text-xs text-gray-500 dark:text-muted-foreground">
            {session.subject} -{' '}
            {new Date(session.startsAt).toLocaleDateString(undefined, {
              day: 'numeric',
              month: 'short',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StarRating value={note.rating} readOnly size="sm" />
          <span
            className={cn(
              'text-xs font-semibold px-2 py-1 rounded-full',
              perfColor,
            )}
          >
            {note.performance}
          </span>
        </div>
      </div>
      <div className="space-y-2 text-sm">
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
      <p className="text-[11px] uppercase tracking-wide text-gray-400 dark:text-muted-foreground">
        {label}
      </p>
      <p className="text-gray-700 dark:text-foreground/90">{value}</p>
    </div>
  );
}
