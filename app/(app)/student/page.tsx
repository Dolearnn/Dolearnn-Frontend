'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpenCheck, CalendarDays, Pencil, Target } from 'lucide-react';
import FirstQuizCard from '@/components/quiz/FirstQuizCard';
import NextActions from '@/components/quiz/NextActions';
import RewardsStrip from '@/components/quiz/RewardsStrip';
import AchievementsPanel from '@/components/quiz/AchievementsPanel';
import WeeklyLeaderboard from '@/components/quiz/WeeklyLeaderboard';
import { Button } from '@/components/ui/button';
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

function Chip({ icon: Icon, children }: { icon: typeof Target; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 dark:border-border dark:bg-card dark:text-foreground/90">
      <Icon className="h-3.5 w-3.5 text-brand dark:text-accent2-400" aria-hidden />
      {children}
    </span>
  );
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
    return <div className="max-w-5xl space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-48 w-full" /></div>;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return <p className="text-sm text-red-600">Could not load your learning plan.</p>;
  }

  const profile = profileQuery.data;
  const progress = overviewQuery.data?.progress;
  const examDays = daysUntil(profile.examDate);
  const sessions = progress?.totalAttempts ?? 0;
  // A new learner sees one clear step instead of empty rewards and leaderboards.
  const isNewLearner = overviewQuery.isSuccess && sessions === 0;

  return (
    <div className="max-w-5xl">
      {/* Greeting and plan at a glance. */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand dark:text-accent2-400">
            {hello}{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-muted-foreground">
            {sessions > 0
              ? `${sessions} practice ${sessions === 1 ? 'session' : 'sessions'} so far. Here is what to do next.`
              : 'Welcome to DoLearnn. Your first step is below.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip icon={Target}>{profile.externalExams.join(' · ') || 'No exam chosen'}</Chip>
            <Chip icon={CalendarDays}>
              {examDays === null ? 'No exam date' : examDays === 0 ? 'Exam today' : `${examDays} days to your exam`}
            </Chip>
            {profile.subjects.length > 0 && (
              <Chip icon={BookOpenCheck}>{profile.subjects.map((subject) => subject.name).join(' · ')}</Chip>
            )}
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="self-start rounded-full sm:self-auto">
          <Link href="/student/onboarding"><Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit plan</Link>
        </Button>
      </header>

      {isNewLearner && overviewQuery.data ? (
        <FirstQuizCard
          catalog={overviewQuery.data.catalog}
          warmUpTopics={profile.guestBaseline?.weakTopics ?? []}
        />
      ) : (
        <>
          <RewardsStrip studentId={null} className="mb-8" />
          <NextActions studentId={null} actions={overviewQuery.data?.actions ?? []} isLoading={overviewQuery.isLoading} />
          <AchievementsPanel studentId={null} className="mt-2" />
          <WeeklyLeaderboard studentId={null} className="mt-8" />
        </>
      )}
    </div>
  );
}
