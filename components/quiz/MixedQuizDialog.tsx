'use client';

import { useState } from 'react';
import { Check, ChevronDown, Clock, Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { QuizCatalogExam, QuizCatalogSubject, QuizMode } from '@/lib/api/quiz';
import { cn } from '@/lib/utils';
import { idlePill, selectedPill, sheetContent, stickyFooter } from './pills';
import { useStartQuiz } from './useStartQuiz';

const MAX_SUBJECTS = 6;
const PER_SUBJECT_CHOICES = [5, 10, 20, 40];

// A full JAMB UTME paper, as the server builds it (see quiz.schemas.ts).
const UTME_ENGLISH_SLUG = 'use-of-english';
const UTME_ENGLISH_QUESTIONS = 60;
const UTME_SUBJECT_QUESTIONS = 40;
const UTME_SUBJECTS = 4;
const UTME_MINUTES = 120;

const modes: Array<{ value: QuizMode; title: string; hint: string }> = [
  { value: 'PRACTICE', title: 'Guided practice', hint: 'No timer. Review explanations after.' },
  { value: 'MOCK', title: 'Exam mode', hint: 'Full screen and timed, 1 minute per question.' },
];

export type MixedQuizSubject = {
  subject: QuizCatalogSubject;
  // Published questions for the chosen exam, in total and per topic.
  available: number;
  byTopic: Record<string, number>;
};

/**
 * Build one exam from several subjects (e.g. JAMB: English + three subjects),
 * optionally narrowing any subject to chosen topics. Questions are shared
 * evenly and grouped by subject.
 */
export default function MixedQuizDialog({
  subjects,
  exam,
  studentId,
  onClose,
}: {
  subjects: MixedQuizSubject[];
  exam: QuizCatalogExam | undefined;
  studentId: string | null;
  onClose: () => void;
}) {
  const start = useStartQuiz();
  const ready = subjects.filter((row) => row.available > 0);
  const isJamb = /jamb|utme/i.test(exam?.name ?? '');
  const english = ready.find((row) => row.subject.slug === UTME_ENGLISH_SLUG);
  // JAMB learners start on the full paper, with English already chosen.
  const [chosen, setChosen] = useState<string[]>(() => (isJamb && english ? [english.subject.id] : []));
  const [topics, setTopics] = useState<Record<string, string[]>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [perSubject, setPerSubject] = useState(10);
  const [mode, setMode] = useState<QuizMode>('PRACTICE');
  const [utme, setUtme] = useState(isJamb && Boolean(english));

  const byId = new Map(ready.map((row) => [row.subject.id, row]));
  // The catalog can refetch while the dialog is open. A subject or topic that
  // lost its questions in the meantime drops out of the selection.
  const selected = chosen.filter((id) => byId.has(id));
  const pickedTopics = (id: string) =>
    (topics[id] ?? []).filter((topicId) => (byId.get(id)?.byTopic[topicId] ?? 0) > 0);

  // How many questions a subject can contribute after any topic narrowing.
  const availableFor = (id: string) => {
    const row = byId.get(id);
    if (!row) return 0;
    const picked = pickedTopics(id);
    return picked.length === 0
      ? row.available
      : picked.reduce((sum, topicId) => sum + (row.byTopic[topicId] ?? 0), 0);
  };
  const requested = perSubject * selected.length;
  const availableTotal = selected.reduce((sum, id) => sum + availableFor(id), 0);
  // The server hands a thin subject's share to the others, so the attempt only
  // comes up short when the whole mix runs out of questions.
  const total = Math.min(requested, availableTotal);
  const short = selected.length >= 2 && total < requested;
  const utmeReady =
    utme && selected.length === UTME_SUBJECTS && Boolean(english && selected.includes(english.subject.id));
  // Questions the full paper will have: fewer only if a subject is short.
  const utmeTotal = selected.reduce(
    (sum, id) =>
      sum +
      Math.min(
        byId.get(id)?.subject.slug === UTME_ENGLISH_SLUG ? UTME_ENGLISH_QUESTIONS : UTME_SUBJECT_QUESTIONS,
        byId.get(id)?.available ?? 0,
      ),
    0,
  );

  const toggleSubject = (id: string) => {
    if (open === id) setOpen(null);
    if (selected.includes(id)) {
      // Forget the topic narrowing so re-adding the subject starts from "All topics".
      setTopics((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    }
    setChosen((current) => {
      const kept = current.filter((item) => byId.has(item));
      if (kept.includes(id)) return kept.filter((item) => item !== id);
      return kept.length >= (utme ? UTME_SUBJECTS : MAX_SUBJECTS) ? kept : [...kept, id];
    });
  };

  const toggleTopic = (subjectId: string, topicId: string) =>
    setTopics((current) => {
      const list = current[subjectId] ?? [];
      return {
        ...current,
        [subjectId]: list.includes(topicId) ? list.filter((id) => id !== topicId) : [...list, topicId],
      };
    });

  const begin = () =>
    utme
      ? start.mutate({
          subjectIds: selected,
          examId: exam?.id,
          count: utmeTotal,
          mode: 'MOCK',
          utme: true,
          studentId: studentId ?? undefined,
        })
      : start.mutate({
          subjectIds: selected,
          topicIds: selected.flatMap(pickedTopics),
          examId: exam?.id,
          count: total,
          mode,
          studentId: studentId ?? undefined,
        });

  return (
    <Dialog open onOpenChange={(value) => !value && onClose()}>
      <DialogContent className={cn("max-h-[90vh] max-w-2xl overflow-y-auto", sheetContent)}>
        <DialogHeader>
          <DialogTitle>{utme ? 'Full UTME paper' : 'Mix subjects'}</DialogTitle>
          <DialogDescription>
            {utme
              ? `Use of English (${UTME_ENGLISH_QUESTIONS} questions) plus three subjects (${UTME_SUBJECT_QUESTIONS} each), ${UTME_MINUTES / 60} hours, in exam mode.`
              : `${exam ? `${exam.name}. ` : ''}Pick up to ${MAX_SUBJECTS} subjects. Questions are shared equally and grouped by subject.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {isJamb && english && (
            <div className="grid grid-cols-2 gap-1 rounded-2xl bg-gray-100 p-1 dark:bg-white/5" role="radiogroup" aria-label="Paper type">
              {([
                [true, 'Full UTME paper'],
                [false, 'Custom mix'],
              ] as const).map(([value, label]) => (
                <button
                  key={label}
                  type="button"
                  role="radio"
                  aria-checked={utme === value}
                  onClick={() => {
                    setUtme(value);
                    if (value) {
                      setTopics({});
                      setOpen(null);
                      // English is always part of the UTME, so it starts selected.
                      setChosen((current) => {
                        const rest = current.filter((id) => id !== english.subject.id && byId.has(id));
                        return [english.subject.id, ...rest].slice(0, UTME_SUBJECTS);
                      });
                    }
                  }}
                  className={cn(
                    'min-h-11 rounded-xl text-sm font-semibold transition-colors',
                    utme === value ? 'bg-white text-gray-950 shadow-sm dark:bg-card dark:text-foreground' : 'text-gray-600 dark:text-muted-foreground',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-gray-900 dark:text-foreground">
              {utme ? 'English plus three subjects' : 'Subjects'}{' '}
              <span className="font-normal text-gray-500 dark:text-muted-foreground">
                ({selected.length}{utme ? ` of ${UTME_SUBJECTS}` : ''} chosen)
              </span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {ready.map(({ subject }) => {
                const on = selected.includes(subject.id);
                const full = !on && selected.length >= (utme ? UTME_SUBJECTS : MAX_SUBJECTS);
                // English can't be removed from a UTME paper.
                const locked = utme && on && subject.slug === UTME_ENGLISH_SLUG;
                return (
                  <button
                    key={subject.id}
                    type="button"
                    aria-pressed={on}
                    disabled={full || locked}
                    onClick={() => toggleSubject(subject.id)}
                    className={cn(
                      'inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors disabled:opacity-40',
                      locked && 'disabled:opacity-100',
                      on ? selectedPill : idlePill,
                    )}
                  >
                    {on && <Check className="h-3.5 w-3.5" />}
                    {subject.name}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {!utme && selected.length > 0 && (
            <fieldset>
              <legend className="mb-1 text-sm font-medium text-gray-900 dark:text-foreground">Topics (optional)</legend>
              <p className="mb-2 text-xs text-gray-500 dark:text-muted-foreground">
                Every topic is included unless you narrow a subject down.
              </p>
              <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-border dark:border-border">
                {selected.map((id) => {
                  const row = byId.get(id)!;
                  const picked = pickedTopics(id);
                  const expanded = open === id;
                  return (
                    <li key={id}>
                      <div className="flex items-center gap-2 px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => setOpen(expanded ? null : id)}
                          aria-expanded={expanded}
                          className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
                        >
                          <span className="truncate text-sm font-medium text-gray-900 dark:text-foreground">{row.subject.name}</span>
                          <span className="flex shrink-0 items-center gap-1 text-xs text-gray-500 dark:text-muted-foreground">
                            {picked.length === 0 ? 'All topics' : `${picked.length} topic${picked.length === 1 ? '' : 's'}`}
                            {` · ${availableFor(id)} available`}
                            <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSubject(id)}
                          aria-label={`Remove ${row.subject.name}`}
                          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      {expanded && (
                        <div className="grid grid-cols-1 gap-2 px-3 pb-3 sm:grid-cols-2">
                          {row.subject.topics.map((topic) => {
                            const count = row.byTopic[topic.id] ?? 0;
                            return (
                              <label
                                key={topic.id}
                                className={cn(
                                  'flex min-h-11 items-center gap-2.5 rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-border',
                                  count === 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                                )}
                              >
                                <Checkbox
                                  checked={picked.includes(topic.id)}
                                  disabled={count === 0}
                                  onCheckedChange={() => toggleTopic(id, topic.id)}
                                />
                                <span className="min-w-0 flex-1 truncate text-gray-800 dark:text-foreground">{topic.name}</span>
                                <span className="shrink-0 text-xs text-gray-500 dark:text-muted-foreground">
                                  {count === 0 ? 'None yet' : count}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          )}

          {!utme && (
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-gray-900 dark:text-foreground">Questions per subject</legend>
              <div className="flex flex-wrap gap-2">
                {PER_SUBJECT_CHOICES.map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => setPerSubject(choice)}
                    aria-pressed={perSubject === choice}
                    className={cn(
                      'h-11 min-w-14 rounded-xl border px-4 font-display text-sm font-bold tabular-nums transition-colors',
                      perSubject === choice ? selectedPill : idlePill,
                    )}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {!utme && (
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-gray-900 dark:text-foreground">Mode</legend>
              <div className="grid grid-cols-2 gap-2">
                {modes.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setMode(item.value)}
                    aria-pressed={mode === item.value}
                    className={cn(
                      'min-h-16 rounded-2xl border-2 p-3 text-left transition-colors',
                      mode === item.value
                        ? 'border-brand bg-brand-50 dark:border-accent2-400 dark:bg-accent2-500/15'
                        : 'border-gray-200 hover:border-brand/50 dark:border-border',
                    )}
                  >
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-foreground">
                      {item.value === 'MOCK' && <Clock className="h-3.5 w-3.5" />}
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-gray-500 dark:text-muted-foreground">{item.hint}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          )}
        </div>

        <DialogFooter className={cn("items-center gap-3 sm:justify-between", stickyFooter)}>
          <p className="text-sm text-gray-600 dark:text-muted-foreground">
            {utme
              ? utmeReady
                ? `${utmeTotal} questions, ${UTME_MINUTES / 60} hours`
                : `Choose ${UTME_SUBJECTS - selected.length} more ${UTME_SUBJECTS - selected.length === 1 ? 'subject' : 'subjects'}.`
              : selected.length < 2
                ? 'Choose at least 2 subjects.'
                : `${selected.length} subjects, ${total} questions${mode === 'MOCK' ? `, ${total} min` : ''}`}
            {!utme && short && (
              <span className="block text-xs">Only {availableTotal} questions are available for this mix.</span>
            )}
          </p>
          <Button
            className="h-12 w-full rounded-2xl px-6 text-[15px] sm:w-auto"
            disabled={(utme ? !utmeReady || utmeTotal === 0 : selected.length < 2 || total === 0) || start.isPending}
            onClick={begin}
          >
            <Play className="mr-2 h-4 w-4" />
            {start.isPending ? 'Starting…' : utme ? 'Start UTME paper' : mode === 'MOCK' ? 'Start timed exam' : 'Start mixed quiz'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
