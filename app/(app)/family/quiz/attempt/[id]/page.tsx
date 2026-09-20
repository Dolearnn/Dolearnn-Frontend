'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import QuizResults from '@/components/quiz/QuizResults';
import QuizRunner from '@/components/quiz/QuizRunner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api/client';
import { getQuizAttempt, isSubmittedView, quizKeys } from '@/lib/api/quiz';

export default function QuizAttemptPage() {
  const params = useParams<{ id: string }>();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: quizKeys.attempt(params.id),
    queryFn: () => getQuizAttempt(params.id),
    // The in-progress view is seeded by the start request and replaced by the
    // graded view on submit. Never refetch it underneath someone taking a quiz.
    staleTime: Infinity,
    retry: (count, err) =>
      !(err instanceof ApiError && [404, 410].includes(err.status)) && count < 1,
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (isError || !data) {
    const expired = error instanceof ApiError && error.status === 410;
    return (
      <div className="max-w-md mx-auto rounded-2xl border border-gray-200 dark:border-border bg-white dark:bg-card p-8 text-center">
        <p className="text-base font-semibold text-gray-900 dark:text-foreground">
          {expired ? 'This quiz has expired' : 'We could not open this quiz'}
        </p>
        <p className="text-sm text-gray-500 dark:text-muted-foreground mt-1 mb-5">
          {error instanceof Error ? error.message : 'Please try again.'}
        </p>
        <Button asChild className="h-10 px-5 rounded-xl">
          <Link href="/family/quiz">Back to quizzes</Link>
        </Button>
      </div>
    );
  }

  return isSubmittedView(data) ? (
    <QuizResults view={data} />
  ) : (
    <QuizRunner view={data} />
  );
}
