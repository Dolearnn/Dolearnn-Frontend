'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { BookOpen, ChevronDown, Pencil, Plus, Search } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import { PageShellSkeleton } from '@/components/dashboard/Skeletons';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  adminQuizKeys,
  getAdminQuizOverview,
  importAdminQuestions,
  listAdminQuestions,
  setAdminQuestionStatus,
  updateAdminQuestion,
  type AdminQuestion,
  type AdminQuestionDifficulty,
  type AdminQuestionStatus,
  type AdminQuizOverview,
} from '@/lib/api/admin-quiz';
import { cn } from '@/lib/utils';

const ALL = 'all';
const PAGE_SIZE = 50;
const STATUSES: AdminQuestionStatus[] = ['PUBLISHED', 'DRAFT', 'ARCHIVED'];
const DIFFICULTIES: AdminQuestionDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];

const STATUS_LABEL: Record<AdminQuestionStatus, string> = {
  PUBLISHED: 'Published',
  DRAFT: 'Draft',
  ARCHIVED: 'Archived',
};

const STATUS_STYLES: Record<AdminQuestionStatus, string> = {
  PUBLISHED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DRAFT: 'bg-amber-50 text-amber-700 border-amber-200',
  ARCHIVED: 'bg-slate-100 text-slate-700 border-slate-200',
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Please try again.';
}

export default function AdminQuestionBankPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [subjectId, setSubjectId] = useState(ALL);
  const [topicId, setTopicId] = useState(ALL);
  const [status, setStatus] = useState<string>(ALL);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<AdminQuestion | null>(null);
  const [creating, setCreating] = useState(false);

  // Wait for the admin to stop typing before searching.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const overviewQuery = useQuery({
    queryKey: adminQuizKeys.overview,
    queryFn: getAdminQuizOverview,
  });

  const filters = useMemo(
    () => ({
      subjectId: subjectId === ALL ? undefined : subjectId,
      topicId: topicId === ALL ? undefined : topicId,
      status: status === ALL ? undefined : (status as AdminQuestionStatus),
      search: search.length >= 2 ? search : undefined,
    }),
    [subjectId, topicId, status, search],
  );

  const questionsQuery = useInfiniteQuery({
    queryKey: adminQuizKeys.questions(filters),
    queryFn: ({ pageParam }) =>
      listAdminQuestions({ ...filters, cursor: pageParam, limit: PAGE_SIZE }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  // A new filter is a new list, so clear the selection.
  useEffect(() => {
    setSelected(new Set());
  }, [filters]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'quiz'] });
  };

  const bulkMutation = useMutation({
    mutationFn: ({ ids, next }: { ids: string[]; next: AdminQuestionStatus }) =>
      setAdminQuestionStatus(ids, next),
    onSuccess: (result, { next }) => {
      setSelected(new Set());
      refresh();
      toast({ title: `${result.updated} question${result.updated === 1 ? '' : 's'} set to ${STATUS_LABEL[next].toLowerCase()}` });
    },
    onError: (error) =>
      toast({ title: 'Could not update questions', description: errorMessage(error), variant: 'destructive' }),
  });

  const overview = overviewQuery.data;
  const subjects = overview?.subjects ?? [];
  const topics = subjects.find((subject) => subject.id === subjectId)?.topics ?? [];
  const questions = questionsQuery.data?.pages.flatMap((page) => page.questions) ?? [];

  if (overviewQuery.isLoading && !overview) {
    return <PageShellSkeleton />;
  }

  if (overviewQuery.isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Question bank" />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {errorMessage(overviewQuery.error)}
        </div>
      </div>
    );
  }

  const byStatus = overview?.quality.byStatus ?? {};
  const total = STATUSES.reduce((sum, key) => sum + (byStatus[key] ?? 0), 0);
  const allLoadedSelected = questions.length > 0 && questions.every((q) => selected.has(q.id));

  const toggle = (set: Set<string>, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Question bank"
        description="Review, edit and publish the practice questions students see."
        action={
          <Button className="rounded-full" onClick={() => setCreating(true)}>
            <Plus className="mr-1 h-4 w-4" /> Add question
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Total questions" value={total} />
        <MetricCard label="Published" value={byStatus.PUBLISHED ?? 0} />
        <MetricCard label="Draft" value={byStatus.DRAFT ?? 0} />
        <MetricCard label="Archived" value={byStatus.ARCHIVED ?? 0} />
        <MetricCard label="Missing explanation" value={overview?.quality.missingExplanations ?? 0} />
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_200px_200px_160px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search question text"
            className="rounded-full pl-9"
          />
        </div>
        <Select
          value={subjectId}
          onValueChange={(value) => {
            setSubjectId(value);
            setTopicId(ALL);
          }}
        >
          <SelectTrigger className="rounded-full">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All subjects</SelectItem>
            {subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                {subject.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={topicId} onValueChange={setTopicId} disabled={subjectId === ALL}>
          <SelectTrigger className="rounded-full">
            <SelectValue placeholder="Topic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All topics</SelectItem>
            {topics.map((topic) => (
              <SelectItem key={topic.id} value={topic.id}>
                {topic.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="rounded-full">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {STATUSES.map((key) => (
              <SelectItem key={key} value={key}>
                {STATUS_LABEL[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm">
          <span className="mr-2 font-medium text-gray-800 dark:text-foreground">
            {selected.size} selected
          </span>
          {STATUSES.map((key) => (
            <Button
              key={key}
              size="sm"
              variant="outline"
              className="rounded-full"
              disabled={bulkMutation.isPending}
              onClick={() => bulkMutation.mutate({ ids: [...selected], next: key })}
            >
              {key === 'PUBLISHED' ? 'Publish' : key === 'DRAFT' ? 'Move to draft' : 'Archive'}
            </Button>
          ))}
          <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {questionsQuery.isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {errorMessage(questionsQuery.error)}
        </div>
      ) : questionsQuery.isLoading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 dark:border-border dark:bg-card">
          Loading questions...
        </div>
      ) : questions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-border dark:bg-card">
          <BookOpen className="mx-auto mb-2 h-6 w-6 text-gray-400 dark:text-muted-foreground" />
          <p className="text-sm font-semibold text-gray-700 dark:text-foreground/90">No questions found</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-muted-foreground">
            Try another filter, or add a question.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-border dark:bg-card">
          <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3 text-xs uppercase tracking-wide text-gray-500 dark:border-border dark:bg-background dark:text-muted-foreground">
            <Checkbox
              checked={allLoadedSelected}
              onCheckedChange={(checked) =>
                setSelected(checked ? new Set(questions.map((q) => q.id)) : new Set())
              }
              aria-label="Select all loaded questions"
            />
            <span>Question</span>
          </div>
          <ul className="divide-y divide-gray-100 dark:divide-border">
            {questions.map((question) => (
              <QuestionRow
                key={question.id}
                question={question}
                selected={selected.has(question.id)}
                expanded={expanded.has(question.id)}
                onSelect={() => setSelected((current) => toggle(current, question.id))}
                onExpand={() => setExpanded((current) => toggle(current, question.id))}
                onEdit={() => setEditing(question)}
              />
            ))}
          </ul>
          <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-4 text-sm text-gray-500 dark:border-border dark:text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>Showing {questions.length} question{questions.length === 1 ? '' : 's'}</span>
            {questionsQuery.hasNextPage && (
              <Button
                variant="outline"
                className="rounded-full"
                disabled={questionsQuery.isFetchingNextPage}
                onClick={() => void questionsQuery.fetchNextPage()}
              >
                {questionsQuery.isFetchingNextPage ? 'Loading...' : 'Load more'}
              </Button>
            )}
          </div>
        </div>
      )}

      {editing && (
        <QuestionEditor
          mode="edit"
          question={editing}
          overview={overview}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}
      {creating && overview && (
        <QuestionEditor
          mode="create"
          overview={overview}
          defaultSubjectId={subjectId === ALL ? undefined : subjectId}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function QuestionRow({
  question,
  selected,
  expanded,
  onSelect,
  onExpand,
  onEdit,
}: {
  question: AdminQuestion;
  selected: boolean;
  expanded: boolean;
  onSelect: () => void;
  onExpand: () => void;
  onEdit: () => void;
}) {
  return (
    <li className={cn('px-4 py-3', selected && 'bg-brand/5')}>
      <div className="flex items-start gap-3">
        <Checkbox checked={selected} onCheckedChange={onSelect} className="mt-1" aria-label="Select question" />
        <button type="button" onClick={onExpand} className="min-w-0 flex-1 text-left">
          <p className="text-sm text-gray-900 dark:text-foreground">{question.text}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-muted-foreground">
            <span className={cn('rounded-full border px-2 py-0.5 font-medium', STATUS_STYLES[question.status])}>
              {STATUS_LABEL[question.status]}
            </span>
            <span>{question.subject.name}</span>
            <span aria-hidden>·</span>
            <span>{question.topic.name}</span>
            <span aria-hidden>·</span>
            <span className="capitalize">{question.difficulty.toLowerCase()}</span>
            {question.exam && (
              <>
                <span aria-hidden>·</span>
                <span>{question.exam.name}</span>
              </>
            )}
            {!question.explanation?.trim() && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 font-medium text-red-700">No explanation</span>
            )}
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <Button size="icon" variant="ghost" onClick={onEdit} aria-label="Edit question">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onExpand} aria-label={expanded ? 'Hide answer' : 'Show answer'}>
            <ChevronDown className={cn('h-4 w-4 transition', expanded && 'rotate-180')} />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="ml-7 mt-3 space-y-3">
          <ul className="grid gap-2 sm:grid-cols-2">
            {question.options.map((option) => {
              const correct = option.id === question.correctOptionId;
              return (
                <li
                  key={option.id}
                  className={cn(
                    'rounded-xl border px-3 py-2 text-sm',
                    correct
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                      : 'border-gray-200 text-gray-700 dark:border-border dark:text-foreground/90',
                  )}
                >
                  <span className="mr-2 font-semibold">{option.id}.</span>
                  {option.text}
                  {correct && <span className="ml-2 text-xs font-medium">(correct)</span>}
                </li>
              );
            })}
          </ul>
          <p className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-background dark:text-foreground/90">
            <span className="font-medium">Explanation: </span>
            {question.explanation?.trim() || 'None yet.'}
          </p>
        </div>
      )}
    </li>
  );
}

const DEFAULT_OPTIONS = ['A', 'B', 'C', 'D'].map((id) => ({ id, text: '' }));

function QuestionEditor({
  mode,
  question,
  overview,
  defaultSubjectId,
  onClose,
  onSaved,
}: {
  mode: 'edit' | 'create';
  question?: AdminQuestion;
  overview?: AdminQuizOverview;
  defaultSubjectId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const subjects = overview?.subjects ?? [];
  const exams = overview?.exams ?? [];

  const [subjectId, setSubjectId] = useState(question?.subject.id ?? defaultSubjectId ?? subjects[0]?.id ?? '');
  const [topicId, setTopicId] = useState(question?.topic.id ?? '');
  const [examId, setExamId] = useState(question?.exam?.id ?? exams[0]?.id ?? '');
  const [text, setText] = useState(question?.text ?? '');
  const [options, setOptions] = useState(question?.options ?? DEFAULT_OPTIONS);
  const [correctOptionId, setCorrectOptionId] = useState(question?.correctOptionId ?? 'A');
  const [explanation, setExplanation] = useState(question?.explanation ?? '');
  const [difficulty, setDifficulty] = useState<AdminQuestionDifficulty>(question?.difficulty ?? 'MEDIUM');
  const [status, setStatus] = useState<AdminQuestionStatus>(question?.status ?? 'DRAFT');

  const subject = subjects.find((item) => item.id === subjectId);
  const topics = subject?.topics ?? [];

  const validationError = (() => {
    if (text.trim().length < 5) return 'Write the question (at least 5 characters).';
    if (options.some((option) => !option.text.trim())) return 'Fill in every option.';
    if (new Set(options.map((option) => option.text.trim().toLowerCase())).size !== options.length) {
      return 'Options must all be different.';
    }
    if (mode === 'create' && (!subjectId || !topicId)) return 'Choose a subject and topic.';
    if (status === 'PUBLISHED' && !explanation.trim()) return 'Add an explanation before publishing.';
    return null;
  })();

  const saveMutation = useMutation({
    mutationFn: async () => {
      const cleanOptions = options.map((option) => ({ id: option.id, text: option.text.trim() }));
      if (mode === 'edit' && question) {
        await updateAdminQuestion(question.id, {
          text: text.trim(),
          options: cleanOptions,
          correctOptionId,
          explanation: explanation.trim() || null,
          difficulty,
          status,
        });
        return;
      }
      const topic = topics.find((item) => item.id === topicId);
      const exam = exams.find((item) => item.id === examId);
      const result = await importAdminQuestions([
        {
          examSlug: exam?.slug,
          subjectSlug: subject?.slug,
          topicSlug: topic?.slug,
          text: text.trim(),
          options: cleanOptions,
          correctOptionId,
          explanation: explanation.trim() || undefined,
          difficulty,
          status,
        },
      ]);
      if (result.errors.length > 0) throw new Error(result.errors[0].message);
      if (result.inserted === 0) throw new Error('This question already exists.');
    },
    onSuccess: () => {
      toast({ title: mode === 'edit' ? 'Question saved' : 'Question added' });
      onSaved();
    },
    onError: (error) =>
      toast({ title: 'Could not save question', description: errorMessage(error), variant: 'destructive' }),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit question' : 'Add question'}</DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? `${question?.subject.name} · ${question?.topic.name}`
              : 'New questions start as drafts unless you publish them.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {mode === 'create' && (
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Exam">
                <Select value={examId} onValueChange={setExamId}>
                  <SelectTrigger><SelectValue placeholder="Exam" /></SelectTrigger>
                  <SelectContent>
                    {exams.map((exam) => (
                      <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Subject">
                <Select
                  value={subjectId}
                  onValueChange={(value) => {
                    setSubjectId(value);
                    setTopicId('');
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Topic">
                <Select value={topicId} onValueChange={setTopicId}>
                  <SelectTrigger><SelectValue placeholder="Topic" /></SelectTrigger>
                  <SelectContent>
                    {topics.map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          )}

          <Field label="Question">
            <Textarea value={text} onChange={(event) => setText(event.target.value)} rows={3} />
          </Field>

          <div className="space-y-2">
            <Label>Options (tick the correct answer)</Label>
            {options.map((option, index) => (
              <div key={option.id} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct-option"
                  checked={correctOptionId === option.id}
                  onChange={() => setCorrectOptionId(option.id)}
                  aria-label={`Option ${option.id} is correct`}
                  className="h-4 w-4 accent-emerald-600"
                />
                <span className="w-5 text-sm font-semibold">{option.id}</span>
                <Input
                  value={option.text}
                  onChange={(event) =>
                    setOptions((current) =>
                      current.map((item, i) => (i === index ? { ...item, text: event.target.value } : item)),
                    )
                  }
                />
              </div>
            ))}
          </div>

          <Field label="Explanation (shown to students after they submit)">
            <Textarea value={explanation} onChange={(event) => setExplanation(event.target.value)} rows={3} />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Difficulty">
              <Select value={difficulty} onValueChange={(value) => setDifficulty(value as AdminQuestionDifficulty)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((key) => (
                    <SelectItem key={key} value={key} className="capitalize">{key.toLowerCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={status} onValueChange={(value) => setStatus(value as AdminQuestionStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((key) => (
                    <SelectItem key={key} value={key}>{STATUS_LABEL[key]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {validationError && <p className="text-sm text-amber-700">{validationError}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!!validationError || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            {saveMutation.isPending ? 'Saving...' : mode === 'edit' ? 'Save changes' : 'Add question'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-border dark:bg-card">
      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-foreground">{value}</div>
    </div>
  );
}
