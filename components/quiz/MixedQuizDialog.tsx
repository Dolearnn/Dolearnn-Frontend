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
import { useStartQuiz } from './useStartQuiz';

const MAX_SUBJECTS = 6;
const PER_SUBJECT_CHOICES = [5, 10, 20, 40];

const modes: Array<{ value: QuizMode; title: string; hint: string }> = [
  { value: 'PRACTICE', title: 'Guided practice', hint: 'No timer. Review explanations after.' },
  { value: 'MOCK', title: 'Exam mode', hint: 'Full screen and timed, 1 minute per question.' },
];

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
  subjects: Array<{ subject: QuizCatalogSubject; available: number }>;
  exam: QuizCatalogExam | undefined;
  studentId: string | null;
  onClose: () => void;
}) {
  const start = useStartQuiz();
  const ready = subjects.filter((row) => row.available > 0);
  const [chosen, setChosen] = useState<string[]>([]);
  const [topics, setTopics] = useState<Record<string, string[]>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [perSubject, setPerSubject] = useState(10);
  const [mode, setMode] = useState<QuizMode>('PRACTICE');

  const byId = new Map(ready.map((row) => [row.subject.id, row]));
  const total = perSubject * chosen.length;
  const isJamb = /jamb|utme/i.test(exam?.name ?? '');

  const toggleSubject = (id: string) => {
    if (open === id) setOpen(null);
    setChosen((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length >= MAX_SUBJECTS
          ? current
          : [...current, id],
    );
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
    start.mutate({
      subjectIds: chosen,
      topicIds: chosen.flatMap((id) => topics[id] ?? []),
      examId: exam?.id,
      count: total,
      mode,
      studentId: studentId ?? undefined,
    });

  return (
    <Dialog open onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mix subjects</DialogTitle>
          <DialogDescription>
            {exam ? `${exam.name} · ` : ''}Pick up to {MAX_SUBJECTS} subjects. Questions are shared equally and grouped by subject.
            {isJamb ? ' JAMB UTME is English plus three subjects.' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-gray-900 dark:text-foreground">
              1. Subjects <span className="font-normal text-gray-500 dark:text-muted-foreground">({chosen.length} chosen)</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {ready.map(({ subject }) => {
                const on = chosen.includes(subject.id);
                const full = !on && chosen.length >= MAX_SUBJECTS;
                return (
                  <button
                    key={subject.id}
                    type="button"
                    aria-pressed={on}
                    disabled={full}
                    onClick={() => toggleSubject(subject.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                      on
                        ? 'border-brand bg-brand text-white dark:border-accent2-500 dark:bg-accent2-500 dark:text-brand'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-brand/50 disabled:opacity-40 dark:border-border dark:bg-card dark:text-foreground',
                    )}
                  >
                    {on && <Check className="h-3.5 w-3.5" />}
                    {subject.name}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {chosen.length > 0 && (
            <fieldset>
              <legend className="mb-1 text-sm font-medium text-gray-900 dark:text-foreground">2. Topics (optional)</legend>
              <p className="mb-2 text-xs text-gray-500 dark:text-muted-foreground">
                Every topic is included unless you narrow a subject down.
              </p>
              <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-border dark:border-border">
                {chosen.map((id) => {
                  const row = byId.get(id);
                  if (!row) return null;
                  const picked = topics[id] ?? [];
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
                          {row.subject.topics.map((topic) => (
                            <label
                              key={topic.id}
                              className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-border"
                            >
                              <Checkbox
                                checked={picked.includes(topic.id)}
                                onCheckedChange={() => toggleTopic(id, topic.id)}
                              />
                              <span className="text-gray-800 dark:text-foreground">{topic.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          )}

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-gray-900 dark:text-foreground">3. Questions per subject</legend>
            <div className="flex flex-wrap gap-2">
              {PER_SUBJECT_CHOICES.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => setPerSubject(choice)}
                  aria-pressed={perSubject === choice}
                  className={cn(
                    'h-10 min-w-14 rounded-xl border px-4 text-sm font-semibold transition-colors',
                    perSubject === choice
                      ? 'border-brand bg-brand text-white dark:border-accent2-500 dark:bg-accent2-500 dark:text-brand'
                      : 'border-gray-200 text-gray-700 hover:border-brand/50 dark:border-border dark:text-foreground',
                  )}
                >
                  {choice}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-gray-900 dark:text-foreground">4. Mode</legend>
            <div className="grid grid-cols-2 gap-2">
              {modes.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setMode(item.value)}
                  aria-pressed={mode === item.value}
                  className={cn(
                    'rounded-xl border p-3 text-left transition-colors',
                    mode === item.value
                      ? 'border-brand bg-accent2-50 dark:border-accent2-400 dark:bg-accent2-500/15'
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
        </div>

        <DialogFooter className="items-center gap-3 sm:justify-between">
          <p className="text-sm text-gray-600 dark:text-muted-foreground">
            {chosen.length < 2
              ? 'Choose at least 2 subjects.'
              : `${chosen.length} subjects · ${total} questions${mode === 'MOCK' ? ` · ${total} min` : ''}`}
          </p>
          <Button className="h-11 w-full rounded-xl px-6 sm:w-auto" disabled={chosen.length < 2 || start.isPending} onClick={begin}>
            <Play className="mr-2 h-4 w-4" />
            {start.isPending ? 'Starting…' : mode === 'MOCK' ? 'Start timed exam' : 'Start mixed quiz'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
