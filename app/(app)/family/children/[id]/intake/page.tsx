'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ListChecks } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import IntakeWizard from '@/components/forms/IntakeWizard';
import { familyKeys, getFamilyStudent } from '@/lib/api/family';

const WIZARD_SUBJECTS = [
  'Maths',
  'English',
  'Science',
  'Coding',
  'Music',
  'French',
  'SAT',
  'Other',
] as const;
type WizardSubject = (typeof WIZARD_SUBJECTS)[number];

const LEVELS = ['Struggling', 'Average', 'Above average'] as const;

function isWizardSubject(value: string | null): value is WizardSubject {
  return WIZARD_SUBJECTS.includes(value as WizardSubject);
}

function IntakePageContent() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const { data: child, isLoading, isError, error } = useQuery({
    queryKey: familyKeys.student(params.id),
    queryFn: () => getFamilyStudent(params.id),
  });

  if (isLoading) {
    return (
      <p className="text-sm text-gray-400 dark:text-muted-foreground">
        Loading...
      </p>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-red-600">
        {error instanceof Error ? error.message : 'Could not load student.'}
      </p>
    );
  }

  if (!child) {
    return (
      <p className="text-sm text-gray-700 dark:text-foreground/90">
        Child not found.
      </p>
    );
  }

  // Suggestions handed over from a practice quiz. Every value is checked
  // against what the form accepts, so a hand-edited link cannot break it.
  const quizSubject = search.get('subject');
  const quizLevel = search.get('level');
  const fromQuiz = search.get('from') === 'quiz' && isWizardSubject(quizSubject);

  const prefill =
    fromQuiz && isWizardSubject(quizSubject)
      ? {
          subjects: Array.from(
            new Set<WizardSubject>([
              ...(child.intake?.subjects ?? []).filter(isWizardSubject),
              quizSubject,
            ]),
          ),
          subjectOther:
            quizSubject === 'Other'
              ? (search.get('other') ?? '').slice(0, 80)
              : undefined,
          learningGoal: 'Exam prep' as const,
          currentLevel: LEVELS.find((level) => level === quizLevel),
          specificTopics: (search.get('topics') ?? '').slice(0, 300),
        }
      : undefined;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={`Intake for ${child.fullName}`}
        description="Tell us what they need - we'll pair them with the right teacher."
      />
      {prefill && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-accent2-200 bg-accent2-50 dark:border-accent2-500/30 dark:bg-accent2-500/10 px-4 py-3">
          <ListChecks className="w-4 h-4 mt-0.5 shrink-0 text-brand dark:text-accent2-400" />
          <p className="text-sm text-gray-700 dark:text-foreground/90">
            We filled this in from your practice quiz results. Check it over and
            change anything that is not right.
          </p>
        </div>
      )}
      <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-6">
        <IntakeWizard childId={child.id} initial={child.intake} prefill={prefill} />
      </div>
    </div>
  );
}

export default function IntakePage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-gray-400 dark:text-muted-foreground">
          Loading...
        </p>
      }
    >
      <IntakePageContent />
    </Suspense>
  );
}
