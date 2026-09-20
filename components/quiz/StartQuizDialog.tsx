'use client';

import { useState } from 'react';
import { Clock, Play } from 'lucide-react';
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
import type {
  QuizCatalogExam,
  QuizCatalogSubject,
  QuizMode,
} from '@/lib/api/quiz';
import { cn } from '@/lib/utils';
import { useStartQuiz } from './useStartQuiz';

const COUNT_CHOICES = [10, 20, 40];
const MIN_COUNT = 5;

const modes: Array<{ value: QuizMode; title: string; hint: string }> = [
  { value: 'PRACTICE', title: 'Practice', hint: 'No timer. See explanations after.' },
  { value: 'MOCK', title: 'Timed mock', hint: '1 minute per question, like the real exam.' },
];

// Mount this with a `key` of the subject id so its choices reset for each subject.
export default function StartQuizDialog({
  subject,
  exam,
  available,
  studentId,
  onClose,
}: {
  subject: QuizCatalogSubject;
  exam: QuizCatalogExam | undefined;
  available: number;
  studentId: string | null;
  onClose: () => void;
}) {
  const start = useStartQuiz();
  const countChoices = COUNT_CHOICES.filter((choice) => choice <= available);
  if (countChoices.length === 0) countChoices.push(Math.max(1, available));

  const [mode, setMode] = useState<QuizMode>('PRACTICE');
  const [count, setCount] = useState(countChoices[0] === 10 && available >= 20 ? 20 : countChoices[0]);
  const [topicIds, setTopicIds] = useState<string[]>([]);

  const toggleTopic = (topicId: string) =>
    setTopicIds((current) =>
      current.includes(topicId)
        ? current.filter((id) => id !== topicId)
        : [...current, topicId],
    );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{subject.name}</DialogTitle>
          <DialogDescription>
            {exam ? `${exam.name} · ` : ''}
            {available} questions available
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <fieldset>
            <legend className="text-sm font-medium text-gray-900 dark:text-foreground mb-2">
              Mode
            </legend>
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
                    {item.value === 'MOCK' && <Clock className="w-3.5 h-3.5" />}
                    {item.title}
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-muted-foreground mt-0.5">
                    {item.hint}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-gray-900 dark:text-foreground mb-2">
              Number of questions
            </legend>
            <div className="flex flex-wrap gap-2">
              {countChoices.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => setCount(choice)}
                  aria-pressed={count === choice}
                  className={cn(
                    'h-10 min-w-14 rounded-xl border px-4 text-sm font-semibold transition-colors',
                    count === choice
                      ? 'border-brand bg-brand text-white dark:border-accent2-500 dark:bg-accent2-500 dark:text-brand'
                      : 'border-gray-200 text-gray-700 hover:border-brand/50 dark:border-border dark:text-foreground',
                  )}
                >
                  {choice}
                </button>
              ))}
            </div>
          </fieldset>

          {subject.topics.length > 1 && (
            <fieldset>
              <legend className="text-sm font-medium text-gray-900 dark:text-foreground mb-1">
                Topics
              </legend>
              <p className="text-xs text-gray-500 dark:text-muted-foreground mb-2">
                {topicIds.length === 0
                  ? 'All topics. Tick some to focus on them.'
                  : `${topicIds.length} selected`}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {subject.topics.map((topic) => (
                  <label
                    key={topic.id}
                    className="flex items-center gap-2.5 rounded-lg border border-gray-200 dark:border-border px-3 py-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={topicIds.includes(topic.id)}
                      onCheckedChange={() => toggleTopic(topic.id)}
                    />
                    <span className="text-gray-800 dark:text-foreground">{topic.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </div>

        <DialogFooter>
          <Button
            className="h-11 px-6 rounded-xl w-full sm:w-auto"
            disabled={start.isPending}
            onClick={() =>
              start.mutate({
                subjectId: subject.id,
                examId: exam?.id,
                topicIds: topicIds.length ? topicIds : undefined,
                count: Math.max(MIN_COUNT, count),
                mode,
                studentId: studentId ?? undefined,
              })
            }
          >
            <Play className="w-4 h-4 mr-2" />
            {start.isPending ? 'Starting...' : 'Start quiz'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
