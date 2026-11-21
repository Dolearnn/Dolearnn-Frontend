'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ListChecks } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import IntakeWizard from '@/components/forms/IntakeWizard';
import { TUTORING_SUBJECTS, tutoringSubjectFor } from '@/lib/catalog';
import { familyKeys, listFamilyStudents } from '@/lib/api/family';

const WIZARD_SUBJECTS = TUTORING_SUBJECTS;
type WizardSubject = (typeof WIZARD_SUBJECTS)[number];

const LEVELS = ['Struggling', 'Average', 'Above average'] as const;

function isWizardSubject(value: string | null): value is WizardSubject {
  return WIZARD_SUBJECTS.includes(value as WizardSubject);
}

// Your tutoring request. Your account has one learner profile, created for you
// automatically the first time you open this page.
function IntakePageContent() {
  const search = useSearchParams();
  const { data: profiles, isLoading, isError, error } = useQuery({
    queryKey: familyKeys.students,
    queryFn: listFamilyStudents,
  });
  const child = profiles?.[0];

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
        {error instanceof Error ? error.message : 'Could not load your profile.'}
      </p>
    );
  }

  if (!child) {
    return (
      <p className="text-sm text-gray-700 dark:text-foreground/90">
        We could not set up your tutoring profile. Please refresh the page.
      </p>
    );
  }

  // Suggestions handed over from a practice quiz. Every value is checked
  // against what the form accepts, so a hand-edited link cannot break it.
  const quizSubject = tutoringSubjectFor(search.get('subject'));
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
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Get a tutor"
        description="Tell us what you need and we'll pair you with the right teacher."
      />
      {/* What happens after the request, and what it costs. */}
      <ol className="mb-5 divide-y divide-gray-100 rounded-3xl border border-gray-200/80 bg-white text-sm dark:divide-border dark:border-border dark:bg-card sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {[
          ['1', 'Tell us your gaps', 'Subjects, weak topics and when you are free.'],
          ['2', 'We match a tutor', 'A qualified tutor who sees your practice results.'],
          ['3', 'Plan your lessons', '₦10,000 per 60-minute session.'],
        ].map(([step, title, text]) => (
          <li key={step} className="flex gap-3 p-4">
            <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-accent2-100 font-display text-xs font-bold text-brand dark:bg-accent2-500/20 dark:text-accent2-400">
              {step}
            </span>
            <span>
              <span className="block font-semibold text-gray-900 dark:text-foreground">{title}</span>
              <span className="mt-0.5 block text-xs leading-5 text-gray-500 dark:text-muted-foreground">{text}</span>
            </span>
          </li>
        ))}
      </ol>
      {prefill && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl bg-accent2-50 px-4 py-3 dark:bg-accent2-500/10">
          <ListChecks className="w-4 h-4 mt-0.5 shrink-0 text-brand dark:text-accent2-400" />
          <p className="text-sm text-gray-700 dark:text-foreground/90">
            We filled this in from your practice quiz results. Check it over and
            change anything that is not right.
          </p>
        </div>
      )}
      <div className="rounded-3xl border border-gray-200/80 bg-white p-4 dark:border-border dark:bg-card sm:p-6">
        <IntakeWizard childId={child.id} initial={child.intake} prefill={prefill} />
      </div>
    </div>
  );
}

export default function TutorPage() {
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
