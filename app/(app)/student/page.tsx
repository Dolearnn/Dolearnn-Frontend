'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrendingUp } from 'lucide-react';
import ExamCountdown from '@/components/quiz/ExamCountdown';
import FirstQuizCard from '@/components/quiz/FirstQuizCard';
import NextActions from '@/components/quiz/NextActions';
import RewardsStrip from '@/components/quiz/RewardsStrip';
import AchievementsPanel from '@/components/quiz/AchievementsPanel';
import DailyCard from '@/components/daily/DailyCard';
import { Skeleton } from '@/components/ui/skeleton';
import { getAuthUser } from '@/lib/api/auth-storage';
import { getQuizPracticeOverview, quizKeys } from '@/lib/api/quiz';
import { getLearnerProfile, studentKeys } from '@/lib/api/student';

function daysUntil(iso: string | null) {
  if (!iso) return null;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

function greeting(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
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
  // Set on the client so the greeting matches the learner's own clock.
  const [hello, setHello] = useState('Welcome back');
  const [firstName, setFirstName] = useState('');
  useEffect(() => {
    setHello(greeting(new Date().getHours()));
    setFirstName(getAuthUser()?.name?.split(' ')[0] ?? '');
  }, []);

  useEffect(() => {
    if (profileQuery.data && !profileQuery.data.onboardingCompleted) {
      router.replace('/student/onboarding');
    }
  }, [profileQuery.data, router]);

  if (profileQuery.isLoading || (profileQuery.data && !profileQuery.data.onboardingCompleted)) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Skeleton className="h-10 w-2/3 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-[28px]" />
        <Skeleton className="h-[104px] w-full rounded-3xl" />
      </div>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return <p className="text-sm text-red-600">Could not load your learning plan. Check your connection and refresh the page.</p>;
  }

  const profile = profileQuery.data;
  const progress = overviewQuery.data?.progress;
  const examDays = daysUntil(profile.examDate);
  const examName = profile.externalExams.join(' and ') || 'Your exam';
  const sessions = progress?.totalAttempts ?? 0;
  // A new learner sees one clear step instead of empty rewards and leaderboards.
  const isNewLearner = overviewQuery.isSuccess && sessions === 0;
  // The learner's biggest measured gain: proof the practice is working.
  const biggestGain = (progress?.subjects ?? [])
    .flatMap((item) => item.topics)
    .filter((topic) => topic.change === 'improved')
    .sort((a, b) => b.changePoints - a.changePoints)[0];

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-5">
        <h1 className="font-display text-[26px] font-bold leading-tight tracking-tight text-gray-950 dark:text-foreground sm:text-3xl">
          {hello}{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-muted-foreground">
          {sessions > 0
            ? `${sessions} practice ${sessions === 1 ? 'session' : 'sessions'} so far. Here is what to do next.`
            : 'Welcome to DoLearnn. Your first step is below.'}
        </p>
      </header>

      {isNewLearner && overviewQuery.data ? (
        <div className="space-y-4">
          <FirstQuizCard
            catalog={overviewQuery.data.catalog}
            warmUpTopics={profile.guestBaseline?.weakTopics ?? []}
          />
          {examDays !== null && (
            <p className="text-sm text-gray-600 dark:text-muted-foreground">
              <strong className="font-display font-bold tabular-nums text-gray-950 dark:text-foreground">{examDays}</strong>{' '}
              {examDays === 1 ? 'day' : 'days'} to {examName}.{' '}
              <Link href="/student/onboarding" className="font-medium text-brand underline underline-offset-2 dark:text-accent2-400">
                Edit plan
              </Link>
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr] xl:items-start">
            {overviewQuery.isLoading ? (
              <Skeleton className="h-64 w-full rounded-[28px]" />
            ) : (
              <ExamCountdown examName={examName} daysLeft={examDays} plan={overviewQuery.data?.examPlan} />
            )}
            <div className="space-y-4">
              <RewardsStrip studentId={null} />
              {biggestGain && (
                <p className="flex items-start gap-3 rounded-3xl bg-accent2-50 p-4 text-sm leading-6 text-gray-800 dark:bg-accent2-500/10 dark:text-foreground/90">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent2-400 text-brand-700">
                    <TrendingUp className="h-4 w-4" aria-hidden />
                  </span>
                  <span>
                    <strong className="font-semibold">It&apos;s working.</strong> {biggestGain.name} went from{' '}
                    <strong className="font-display font-bold tabular-nums">{biggestGain.baselinePercent}%</strong> to{' '}
                    <strong className="font-display font-bold tabular-nums text-accent2-700 dark:text-accent2-400">
                      {biggestGain.latestPercent}%
                    </strong>{' '}
                    since you started.
                  </span>
                </p>
              )}
              <DailyCard />
            </div>
          </div>

          <div className="mt-9">
            <NextActions
              studentId={null}
              actions={overviewQuery.data?.actions ?? []}
              isLoading={overviewQuery.isLoading}
              readyTomorrow={overviewQuery.data?.mistakes?.tomorrow ?? 0}
            />
          </div>
          <AchievementsPanel studentId={null} />
        </>
      )}
    </div>
  );
}
