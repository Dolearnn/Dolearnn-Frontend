'use client';

import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { QuizTutoringPrefill } from '@/lib/api/quiz';
import { intakeHref } from '@/lib/quiz';

// Turns weak quiz topics into a tutoring request. The request form is
// pre-filled with the subject, the topics and a level based on the score.
export default function TutoringCta({
  prefill,
  weakTopics,
}: {
  prefill: QuizTutoringPrefill;
  weakTopics: Array<{ topicId: string; name: string; accuracyPercent: number }>;
}) {
  return (
    <div className="rounded-2xl border border-accent2-200 bg-accent2-50 dark:border-accent2-500/30 dark:bg-accent2-500/10 p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-brand text-white dark:bg-accent2-500 dark:text-brand flex items-center justify-center">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-gray-900 dark:text-foreground">
            Get a tutor for your weak spots
          </h3>
          <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1">
            A one-to-one tutor can go through{' '}
            <span className="font-medium text-gray-900 dark:text-foreground">
              {weakTopics.map((topic) => topic.name).join(', ')}
            </span>{' '}
            with you. We fill in your request from these results, so the tutor
            knows where to begin.
          </p>
          <Button asChild className="mt-4 h-10 px-5 rounded-xl">
            <Link href={intakeHref(prefill)}>Request a tutor</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
