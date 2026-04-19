'use client';

import { useMemo, useState } from 'react';
import { ClipboardCheck, ClipboardList, PenLine } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
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
import { cn } from '@/lib/utils';
import { addSessionNote } from '@/lib/store/client';
import {
  teacherChild,
  teacherNotes,
  teacherSessions,
} from '@/lib/store/teacher';
import { useMounted } from '@/lib/use-mounted';
import type { Performance, Rating, Session, SessionNote } from '@/lib/types';

const PERFORMANCE_OPTIONS: Performance[] = ['Excellent', 'Good', 'Needs Work'];

type DraftMap = Record<string, DraftNote>;

interface DraftNote {
  covered: string;
  performance: Performance;
  rating: Rating;
  focusNext: string;
  concerns?: string;
}

export default function TeacherNotesPage() {
  const mounted = useMounted();
  const [sessions, setSessions] = useState<Session[]>(teacherSessions());
  const [notes, setNotes] = useState<SessionNote[]>(teacherNotes());
  const [drafts, setDrafts] = useState<DraftMap>({});

  const needsNotes = useMemo(
    () =>
      sessions
        .filter(
          (s) =>
            s.status === 'Completed' &&
            !notes.some((n) => n.sessionId === s.id),
        )
        .sort((a, b) => b.startsAt.localeCompare(a.startsAt)),
    [sessions, notes],
  );

  const submittedNotes = useMemo(() => {
    return notes
      .map((n) => ({
        note: n,
        session: sessions.find((s) => s.id === n.sessionId),
      }))
      .filter((x): x is { note: SessionNote; session: Session } =>
        Boolean(x.session),
      )
      .sort((a, b) => b.note.createdAt.localeCompare(a.note.createdAt));
  }, [notes, sessions]);

  const updateDraft = (sessionId: string, patch: Partial<DraftNote>) => {
    setDrafts((prev) => {
      const current: DraftNote = prev[sessionId] ?? {
        covered: '',
        performance: 'Good',
        rating: 4,
        focusNext: '',
      };
      return { ...prev, [sessionId]: { ...current, ...patch } };
    });
  };

  const submitDraft = (session: Session) => {
    const draft = drafts[session.id];
    if (!draft || !draft.covered.trim() || !draft.focusNext.trim() || !draft.rating) return;
    const newNote: SessionNote = {
      id: `n_${Math.random().toString(36).slice(2, 10)}`,
      sessionId: session.id,
      covered: draft.covered.trim(),
      performance: draft.performance,
      rating: draft.rating,
      focusNext: draft.focusNext.trim(),
      concerns: draft.concerns?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    setNotes((prev) => [...prev, newNote]);
    addSessionNote(newNote);
    setSessions((prev) =>
      prev.map((item) =>
        item.id === session.id ? { ...item, noteId: newNote.id } : item,
      ),
    );
    setDrafts((prev) => {
      const { [session.id]: _, ...rest } = prev;
      return rest;
    });
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading…" description="" />
      </div>
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
            <p className="text-sm font-semibold text-gray-700 dark:text-foreground/90">All caught up</p>
            <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
              No completed sessions are waiting on notes.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {needsNotes.map((s) => (
              <DraftCard
                key={s.id}
                session={s}
                draft={drafts[s.id]}
                onChange={(patch) => updateDraft(s.id, patch)}
                onSubmit={() => submitDraft(s)}
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
          <p className="text-xs text-gray-500 dark:text-muted-foreground">No notes submitted yet.</p>
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
  onChange,
  onSubmit,
}: {
  session: Session;
  draft?: DraftNote;
  onChange: (patch: Partial<DraftNote>) => void;
  onSubmit: () => void;
}) {
  const child = teacherChild(session.childId);
  const rating = draft?.rating ?? 0;
  const canSubmit =
    !!draft &&
    draft.covered.trim().length > 0 &&
    draft.focusNext.trim().length > 0 &&
    rating > 0;

  return (
    <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900 dark:text-foreground">
            {child?.fullName ?? 'Student'} · {session.subject}
          </p>
          <p className="text-xs text-gray-500 dark:text-muted-foreground">
            {new Date(session.startsAt).toLocaleString(undefined, {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            · {session.durationMins} min
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Overall rating</Label>
        <div className="flex items-center gap-3">
          <StarRating
            value={rating}
            size="lg"
            onChange={(v) => onChange({ rating: v as Rating })}
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
          onChange={(e) => onChange({ covered: e.target.value })}
          rows={2}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">Performance</Label>
          <Select
            value={draft?.performance ?? 'Good'}
            onValueChange={(v) => onChange({ performance: v as Performance })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERFORMANCE_OPTIONS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
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
            onChange={(e) => onChange({ focusNext: e.target.value })}
          />
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
          onChange={(e) => onChange({ concerns: e.target.value })}
          rows={2}
        />
      </div>

      <div className="flex justify-end">
        <p className="mr-auto text-xs text-gray-500 dark:text-muted-foreground">
          Parents will see this feedback after you submit it.
        </p>
        <Button
          className="bg-brand hover:bg-brand-600 rounded-full"
          disabled={!canSubmit}
          onClick={onSubmit}
        >
          Submit feedback
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
  const child = teacherChild(session.childId);
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
            {child?.fullName ?? 'Student'}
          </p>
          <p className="text-xs text-gray-500 dark:text-muted-foreground">
            {session.subject} ·{' '}
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
