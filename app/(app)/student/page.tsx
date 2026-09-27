'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, BookOpenCheck, CalendarDays, Target, TrendingUp } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import NextActions from '@/components/quiz/NextActions';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getQuizPracticeOverview, quizKeys } from '@/lib/api/quiz';
import { getLearnerProfile, studentKeys } from '@/lib/api/student';

function daysUntil(iso: string | null) {
  if (!iso) return null;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const profileQuery = useQuery({ queryKey: studentKeys.profile, queryFn: getLearnerProfile });
  const overviewQuery = useQuery({
    queryKey: quizKeys.overview(null),
    queryFn: () => getQuizPracticeOverview(null),
    enabled: profileQuery.data?.onboardingCompleted === true,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (profileQuery.data && !profileQuery.data.onboardingCompleted) {
      router.replace('/student/onboarding');
    }
  }, [profileQuery.data, router]);

  if (profileQuery.isLoading || (profileQuery.data && !profileQuery.data.onboardingCompleted)) {
    return <div className="max-w-5xl space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-48 w-full" /></div>;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return <p className="text-sm text-red-600">Could not load your learning plan.</p>;
  }

  const profile = profileQuery.data;
  const progress = overviewQuery.data?.progress;
  const examDays = daysUntil(profile.examDate);

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Today"
        description={`Your practice plan for ${profile.externalExams.join(', ')}.`}
        action={<Button asChild variant="outline"><Link href="/student/onboarding">Edit plan</Link></Button>}
      />

      <section className="mb-9 grid border-y border-gray-200 bg-white dark:border-border dark:bg-card sm:grid-cols-3" aria-label="Learning plan summary">
        <div className="border-b border-gray-200 p-5 dark:border-border sm:border-b-0 sm:border-r">
          <Target className="h-5 w-5 text-brand dark:text-accent2-400" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-muted-foreground">Preparing for</p>
          <p className="mt-1 font-semibold text-gray-950 dark:text-foreground">{profile.externalExams.join(' · ')}</p>
        </div>
        <div className="border-b border-gray-200 p-5 dark:border-border sm:border-b-0 sm:border-r">
          <BookOpenCheck className="h-5 w-5 text-brand dark:text-accent2-400" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-muted-foreground">Focus subjects</p>
          <p className="mt-1 font-semibold text-gray-950 dark:text-foreground">{profile.subjects.map((subject) => subject.name).join(' · ')}</p>
        </div>
        <div className="p-5">
          <CalendarDays className="h-5 w-5 text-brand dark:text-accent2-400" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-muted-foreground">Nearest exam</p>
          <p className="mt-1 font-semibold text-gray-950 dark:text-foreground">{examDays === null ? 'No date set' : examDays === 0 ? 'Today' : `${examDays} days away`}</p>
        </div>
      </section>

      {profile.guestBaseline && (progress?.totalAttempts ?? 0) === 0 && (
        <section className="mb-9 border-l-4 border-accent2-500 bg-accent2-50 p-5 dark:bg-accent2-500/10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand dark:text-accent2-400">Your warm-up signal</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-2xl font-semibold text-gray-950 dark:text-foreground">{profile.guestBaseline.score}%</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-muted-foreground">
                {profile.guestBaseline.weakTopics.length > 0
                  ? `Check ${profile.guestBaseline.weakTopics.join(', ')} in a full assessment.`
                  : 'Take a full assessment to create your topic map.'}
              </p>
            </div>
            <Button asChild><Link href="/student/practice">Take full assessment <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </section>
      )}

      <NextActions studentId={null} actions={overviewQuery.data?.actions ?? []} isLoading={overviewQuery.isLoading} />

      {(progress?.totalAttempts ?? 0) > 0 && (
        <section className="border-t border-gray-200 pt-6 dark:border-border">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-muted-foreground">Evidence of progress</p>
              <h2 className="mt-1 text-xl font-semibold text-gray-950 dark:text-foreground">{progress?.totalAttempts} completed practice {progress?.totalAttempts === 1 ? 'session' : 'sessions'}</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-muted-foreground">{progress?.summary.topicsImproved} topics have improved by at least ten points.</p>
            </div>
            <Button asChild variant="outline"><Link href="/student/progress"><TrendingUp className="mr-2 h-4 w-4" />View progress</Link></Button>
          </div>
        </section>
      )}
    </div>
  );
}
