'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getQuizCatalog, quizKeys } from '@/lib/api/quiz';
import {
  getLearnerProfile,
  studentKeys,
  updateLearnerProfile,
  type LearnerStage,
} from '@/lib/api/student';
import { cn } from '@/lib/utils';

const STAGES: Array<{ value: LearnerStage; label: string }> = [
  { value: 'SS2', label: 'SS2 student' },
  { value: 'SS3', label: 'SS3 student' },
  { value: 'RECENT_SCHOOL_LEAVER', label: 'Recent school leaver' },
  { value: 'OTHER', label: 'Another stage' },
];

const COMMON_EXAMS = [
  'WAEC',
  'NECO',
  'JAMB UTME',
  'NABTEB',
  'GCE',
  'Cambridge IGCSE',
  'SAT',
  'IELTS',
];

export default function StudentOnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [stage, setStage] = useState<LearnerStage>('SS3');
  const [externalExams, setExternalExams] = useState<string[]>([]);
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [examDate, setExamDate] = useState('');
  const [customExam, setCustomExam] = useState('');
  const [error, setError] = useState('');

  const profileQuery = useQuery({ queryKey: studentKeys.profile, queryFn: getLearnerProfile });
  const catalogQuery = useQuery({ queryKey: quizKeys.catalog, queryFn: getQuizCatalog, staleTime: 5 * 60_000 });

  useEffect(() => {
    const profile = profileQuery.data;
    if (!profile) return;
    if (profile.stage) setStage(profile.stage);
    setExternalExams(profile.externalExams);
    setSubjectIds(profile.subjectIds);
    setExamDate(profile.examDate?.slice(0, 10) ?? '');
  }, [profileQuery.data]);

  const examOptions = useMemo(
    () => [...new Set([...(catalogQuery.data?.exams.map((exam) => exam.name) ?? []), ...COMMON_EXAMS])],
    [catalogQuery.data?.exams],
  );

  const save = useMutation({
    mutationFn: updateLearnerProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(studentKeys.profile, profile);
      router.replace('/student');
    },
    onError: (problem) => setError(problem instanceof Error ? problem.message : 'Could not save your learning plan.'),
  });

  const toggleExam = (name: string) =>
    setExternalExams((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    );

  const addCustomExam = () => {
    const value = customExam.trim();
    if (value.length < 2) return;
    setExternalExams((current) => (current.includes(value) ? current : [...current, value]));
    setCustomExam('');
  };

  const toggleSubject = (id: string) =>
    setSubjectIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

  const submit = () => {
    setError('');
    if (externalExams.length === 0) {
      setError('Choose or add at least one external examination.');
      return;
    }
    if (subjectIds.length === 0) {
      setError('Choose at least one subject.');
      return;
    }
    save.mutate({ stage, externalExams, subjectIds, examDate: examDate || null });
  };

  return (
    <div className="mx-auto max-w-4xl pb-10">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand dark:text-accent2-400">Set your direction</p>
      <h1 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-gray-950 dark:text-foreground sm:text-4xl">
        Tell DoLearnn what you are preparing for.
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 dark:text-muted-foreground">
        This sets your starting subjects and exam context. You can prepare for any external examination and change these choices later.
      </p>

      {profileQuery.data?.guestBaseline && (
        <div className="mt-7 border-l-4 border-accent2-500 bg-accent2-50 p-4 dark:bg-accent2-500/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand dark:text-accent2-400">Warm-up carried over</p>
          <p className="mt-1 text-sm text-gray-800 dark:text-foreground/90">
            {profileQuery.data.guestBaseline.correct} of {profileQuery.data.guestBaseline.total} correct
            {profileQuery.data.guestBaseline.weakTopics.length > 0
              ? ` · Start by checking ${profileQuery.data.guestBaseline.weakTopics.join(', ')}.`
              : ' · Your fuller assessment will find where to stretch next.'}
          </p>
        </div>
      )}

      <div className="mt-9 space-y-10">
        <fieldset>
          <legend className="text-lg font-semibold text-gray-950 dark:text-foreground">1. Where are you now?</legend>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STAGES.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={stage === item.value}
                onClick={() => setStage(item.value)}
                className={cn(
                  'min-h-14 border px-3 py-2 text-left text-sm font-medium transition-colors',
                  stage === item.value
                    ? 'border-brand bg-brand text-white dark:border-accent2-500 dark:bg-accent2-500 dark:text-brand'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-brand dark:border-border dark:bg-card dark:text-foreground',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-lg font-semibold text-gray-950 dark:text-foreground">2. Which external examinations?</legend>
          <p className="mt-1 text-sm text-gray-500 dark:text-muted-foreground">Choose any that apply, or add an examination that is not listed.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {examOptions.map((name) => {
              const selected = externalExams.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleExam(name)}
                  className={cn(
                    'inline-flex min-h-10 items-center gap-2 border px-3 text-sm transition-colors',
                    selected
                      ? 'border-brand bg-accent2-100 font-medium text-brand dark:border-accent2-400 dark:bg-accent2-500/15 dark:text-accent2-300'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-brand dark:border-border dark:bg-card dark:text-foreground',
                  )}
                >
                  {selected && <Check className="h-3.5 w-3.5" />} {name}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex max-w-md gap-2">
            <Input
              value={customExam}
              onChange={(event) => setCustomExam(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addCustomExam();
                }
              }}
              placeholder="Add another external examination"
              aria-label="External examination name"
            />
            <Button type="button" variant="outline" onClick={addCustomExam} aria-label="Add examination">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {externalExams.filter((name) => !examOptions.includes(name)).map((name) => (
            <button key={name} type="button" onClick={() => toggleExam(name)} className="mt-2 mr-2 inline-flex items-center gap-1 bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 dark:bg-white/10 dark:text-foreground">
              {name} <X className="h-3 w-3" />
            </button>
          ))}
        </fieldset>

        <fieldset>
          <legend className="text-lg font-semibold text-gray-950 dark:text-foreground">3. Which subjects matter first?</legend>
          <p className="mt-1 text-sm text-gray-500 dark:text-muted-foreground">Start focused. You can add subjects as the question bank expands.</p>
          <div className="mt-3 grid grid-cols-2 border-y border-gray-200 dark:border-border sm:grid-cols-3">
            {(catalogQuery.data?.subjects ?? []).map((subject) => {
              const selected = subjectIds.includes(subject.id);
              return (
                <button
                  key={subject.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleSubject(subject.id)}
                  className={cn(
                    'flex min-h-16 items-center justify-between border-b border-r border-gray-200 px-4 text-left text-sm font-medium dark:border-border',
                    selected
                      ? 'bg-brand text-white dark:bg-accent2-500 dark:text-brand'
                      : 'bg-white text-gray-800 hover:bg-accent2-50 dark:bg-card dark:text-foreground dark:hover:bg-accent2-500/10',
                  )}
                >
                  {subject.name} {selected && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="exam-date" className="text-lg font-semibold text-gray-950 dark:text-foreground">4. Nearest exam date <span className="text-sm font-normal text-gray-500">(optional)</span></label>
          <Input id="exam-date" type="date" value={examDate} onChange={(event) => setExamDate(event.target.value)} className="mt-3 max-w-xs" />
        </div>
      </div>

      {error && <p className="mt-6 text-sm font-medium text-red-600" role="alert">{error}</p>}

      <div className="mt-8 border-t border-gray-200 pt-6 dark:border-border">
        <Button type="button" onClick={submit} disabled={save.isPending || catalogQuery.isLoading} className="h-12 px-6">
          {save.isPending ? 'Saving your plan…' : 'Build my practice plan'}
          {!save.isPending && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
