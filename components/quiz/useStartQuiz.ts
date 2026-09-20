'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { quizKeys, startQuizAttempt } from '@/lib/api/quiz';

// Starts a quiz and opens it. The response already contains the questions, so
// it is placed straight into the cache and the attempt page needs no second request.
export function useStartQuiz() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: startQuizAttempt,
    onSuccess: (view) => {
      queryClient.setQueryData(quizKeys.attempt(view.attempt.id), view);
      router.push(`/family/quiz/attempt/${view.attempt.id}`);
    },
    onError: (error) => {
      toast({
        title: 'Could not start the quiz',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });
}
