'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  dailyKeys,
  deleteDailyQuestion,
  getDailyStats,
  listDailyPool,
  saveDailyQuestion,
  type DailyCategory,
  type DailyPoolQuestion,
} from '@/lib/api/daily';
import { cn } from '@/lib/utils';

const CATEGORIES: Array<{ value: DailyCategory; label: string }> = [
  { value: 'english', label: 'English' },
  { value: 'maths', label: 'Maths' },
  { value: 'history', label: 'History' },
];
const label = (value: string) => CATEGORIES.find((item) => item.value === value)?.label ?? value;
const today = () => new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 10);

type Draft = {
  id?: string;
  usedOn?: string | null;
  category: DailyCategory;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

const EMPTY: Draft = { category: 'english', text: '', options: ['', '', '', ''], correctIndex: 0, explanation: '' };

function toDraft(question: DailyPoolQuestion): Draft {
  return {
    id: question.id,
    usedOn: question.usedOn,
    category: question.category,
    text: question.text,
    options: question.options.map((option) => option.text),
    correctIndex: Math.max(0, question.options.findIndex((option) => option.id === question.correctOptionId)),
    explanation: question.explanation ?? '',
  };
}

function Editor({ draft, onChange, onClose }: { draft: Draft; onChange: (draft: Draft) => void; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const save = useMutation({
    mutationFn: () =>
      saveDailyQuestion(draft.id, {
        category: draft.category,
        text: draft.text,
        options: draft.options,
        correctIndex: draft.correctIndex,
        explanation: draft.explanation,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dailyKeys.pool });
      toast({ title: draft.id ? 'Question updated' : 'Question added' });
      onClose();
    },
    onError: (error) =>
      toast({
        title: 'Could not save',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      }),
  });

  const ready =
    draft.text.trim().length >= 5 && draft.options.every((option) => option.trim()) && draft.explanation.trim().length >= 3;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{draft.id ? 'Edit question' : 'Add a Daily question'}</DialogTitle>
          <DialogDescription>Tick the circle beside the correct answer.</DialogDescription>
        </DialogHeader>
        {draft.usedOn === today() && (
          <p role="status" className="rounded-lg bg-amber-50 p-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            This question is in today&apos;s quiz. A change only affects people who answer it from now on.
          </p>
        )}
        <div className="space-y-4">
          <div className="flex gap-2">
            {CATEGORIES.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={draft.category === item.value}
                onClick={() => onChange({ ...draft, category: item.value })}
                className={cn(
                  'rounded-full border px-4 py-1.5 text-sm font-medium',
                  draft.category === item.value
                    ? 'border-brand bg-brand text-white dark:border-accent2-500 dark:bg-accent2-500 dark:text-brand'
                    : 'border-gray-200 text-gray-700 dark:border-border dark:text-foreground',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <Textarea aria-label="Question" rows={3} placeholder="The question" value={draft.text} onChange={(event) => onChange({ ...draft, text: event.target.value })} />
          <div className="space-y-2">
            {draft.options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct-option"
                  aria-label={`Option ${index + 1} is correct`}
                  checked={draft.correctIndex === index}
                  onChange={() => onChange({ ...draft, correctIndex: index })}
                  className="h-5 w-5 shrink-0 accent-[#044272]"
                />
                <Input
                  aria-label={`Option ${index + 1}`}
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(event) => onChange({ ...draft, options: draft.options.map((item, i) => (i === index ? event.target.value : item)) })}
                />
              </div>
            ))}
          </div>
          <Textarea aria-label="Explanation" rows={2} placeholder="Short explanation of the answer" value={draft.explanation} onChange={(event) => onChange({ ...draft, explanation: event.target.value })} />
        </div>
        <DialogFooter>
          <Button className="rounded-full" disabled={!ready || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? 'Saving…' : 'Save question'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminDailyPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [category, setCategory] = useState<DailyCategory | undefined>();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState<Draft | null>(null);
  // Set when arriving from a report, to open that one question.
  const [linkedId, setLinkedId] = useState<string | undefined>();

  useEffect(() => {
    setLinkedId(new URLSearchParams(window.location.search).get('edit') ?? undefined);
  }, []);

  const params = { category, search: search.trim() || undefined, page, id: linkedId };
  const query = useQuery({ queryKey: [...dailyKeys.pool, params], queryFn: () => listDailyPool(params) });

  useEffect(() => {
    if (linkedId && query.data?.questions[0]) setDraft(toDraft(query.data.questions[0]));
  }, [linkedId, query.data]);

  const remove = useMutation({
    mutationFn: deleteDailyQuestion,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dailyKeys.pool });
      toast({ title: 'Question removed' });
    },
    onError: (error) =>
      toast({
        title: 'Could not remove',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      }),
  });

  const statsQuery = useQuery({ queryKey: dailyKeys.stats, queryFn: getDailyStats, staleTime: 30_000 });
  const stats = statsQuery.data ?? [];

  const data = query.data;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily quiz"
        description="Each day's quiz is built automatically from these questions. Keep the pool topped up."
        action={
          <Button className="rounded-full bg-brand hover:bg-brand-600" onClick={() => setDraft({ ...EMPTY, options: ['', '', '', ''] })}>
            <Plus className="mr-1 h-4 w-4" /> Add question
          </Button>
        }
      />

      {data && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Questions left">
          <div className={cn('rounded-2xl p-4', data.summary.daysLeft <= 7 ? 'bg-amber-100 text-amber-900' : 'bg-brand text-white')}>
            <p className="text-sm font-medium">New quizzes left</p>
            <p className="mt-1 text-3xl font-bold">{data.summary.daysLeft} {data.summary.daysLeft === 1 ? 'day' : 'days'}</p>
            <p className="mt-1 text-xs opacity-80">After this, older questions repeat.</p>
          </div>
          {data.summary.categories.map((item) => (
            <div key={item.category} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-border dark:bg-card">
              <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">{label(item.category)}</p>
              <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-foreground">{item.unused}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-muted-foreground">
                unused of {item.total} · {item.perDay} a day
              </p>
            </div>
          ))}
        </section>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white dark:border-border dark:bg-card" aria-labelledby="played-title">
        <div className="p-4">
          <h2 id="played-title" className="font-semibold text-gray-900 dark:text-foreground">Who played</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-muted-foreground">
            {stats[0] ? `${stats[0].played} ${stats[0].played === 1 ? 'person has' : 'people have'} finished today's quiz so far.` : 'No quiz has been played yet.'}
          </p>
        </div>
        {stats.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-border dark:text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Day</th>
                  <th className="px-4 py-2 text-right font-medium">Played</th>
                  <th className="px-4 py-2 text-right font-medium">Members</th>
                  <th className="px-4 py-2 text-right font-medium">Visitors</th>
                  <th className="px-4 py-2 text-right font-medium">Did not finish</th>
                  <th className="px-4 py-2 text-right font-medium">Average /10</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((row) => (
                  <tr key={row.day} className="border-t border-gray-100 text-gray-800 dark:border-border dark:text-foreground/90">
                    <td className="whitespace-nowrap px-4 py-2">#{row.number} · {row.day}</td>
                    <td className="px-4 py-2 text-right font-semibold tabular-nums">{row.played}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{row.members}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{row.guests}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{row.dropped}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{row.averageScore ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
          <Input
            aria-label="Search questions"
            className="rounded-full pl-9"
            placeholder="Search questions"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
              setLinkedId(undefined);
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {[{ value: undefined, label: 'All' }, ...CATEGORIES].map((item) => (
            <button
              key={item.label}
              type="button"
              aria-pressed={category === item.value}
              onClick={() => {
                setCategory(item.value as DailyCategory | undefined);
                setPage(1);
                setLinkedId(undefined);
              }}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium',
                category === item.value
                  ? 'border-brand bg-brand text-white dark:border-accent2-500 dark:bg-accent2-500 dark:text-brand'
                  : 'border-gray-200 bg-white text-gray-700 dark:border-border dark:bg-card dark:text-foreground',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {query.isLoading ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : query.isError || !data ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p>The questions could not load.</p>
          <button type="button" className="mt-2 font-semibold underline" onClick={() => query.refetch()}>Try again</button>
        </div>
      ) : data.questions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-border">No questions found.</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white dark:divide-border dark:border-border dark:bg-card">
          {data.questions.map((question) => (
            <li key={question.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 dark:text-foreground">{question.text}</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-muted-foreground">
                  Answer: {question.options.find((option) => option.id === question.correctOptionId)?.text}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-muted-foreground">
                  {label(question.category)} · {question.usedOn ? `Used ${question.usedOn}` : 'Not used yet'}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => setDraft(toDraft(question))}>Edit</Button>
                {!question.usedOn && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full text-red-600"
                    disabled={remove.isPending}
                    onClick={() => {
                      if (window.confirm('Remove this question from the pool?')) remove.mutate(question.id);
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <Button size="sm" variant="outline" className="rounded-full" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-gray-600 dark:text-muted-foreground">Page {page} of {pages}</span>
          <Button size="sm" variant="outline" className="rounded-full" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      {draft && (
        <Editor
          draft={draft}
          onChange={setDraft}
          onClose={() => {
            setDraft(null);
            setLinkedId(undefined);
          }}
        />
      )}
    </div>
  );
}
