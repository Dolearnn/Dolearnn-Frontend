'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { GraduationCap, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { familyKeys, listFamilyStudents } from '@/lib/api/family';
import type { QuizTutoringPrefill } from '@/lib/api/quiz';
import { adminRequestMessage, intakeHref } from '@/lib/quiz';

const ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? 'dolearnnn@gmail.com';

// Turns weak quiz topics into a tutoring request. The intake form is pre-filled
// with the subject, the topics and a level based on the score.
export default function TutoringCta({
  prefill,
  weakTopics,
}: {
  prefill: QuizTutoringPrefill;
  weakTopics: Array<{ topicId: string; name: string; accuracyPercent: number }>;
}) {
  const studentsQuery = useQuery({
    queryKey: familyKeys.students,
    queryFn: listFamilyStudents,
  });
  const [chosenId, setChosenId] = useState<string | null>(null);

  const children = studentsQuery.data ?? [];
  const targetId =
    prefill.studentId ??
    chosenId ??
    (children.length === 1 ? children[0].id : null);
  const target = children.find((child) => child.id === targetId);

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
            with you. We will fill in your request from these results.
          </p>

          <div className="mt-4">
            {studentsQuery.isLoading ? (
              <p className="text-xs text-gray-500 dark:text-muted-foreground">
                Loading...
              </p>
            ) : children.length === 0 ? (
              <div>
                <p className="text-xs text-gray-600 dark:text-muted-foreground mb-3">
                  DoLearn sets up a learner profile for you first. Email us and
                  we will start straight away.
                </p>
                <Button asChild className="h-10 px-5 rounded-xl">
                  <a
                    href={`mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(
                      `Tutor request: ${prefill.subject}`,
                    )}&body=${encodeURIComponent(adminRequestMessage(prefill))}`}
                  >
                    <Mail className="w-4 h-4 mr-2" /> Request a tutor
                  </a>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {!prefill.studentId && children.length > 1 && (
                  <Select
                    value={targetId ?? undefined}
                    onValueChange={(value) => setChosenId(value)}
                  >
                    <SelectTrigger className="sm:w-56 bg-white dark:bg-card">
                      <SelectValue placeholder="Who is it for?" />
                    </SelectTrigger>
                    <SelectContent>
                      {children.map((child) => (
                        <SelectItem key={child.id} value={child.id}>
                          {child.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {targetId ? (
                  <Button asChild className="h-10 px-5 rounded-xl">
                    <Link href={intakeHref(targetId, prefill)}>
                      Request a tutor{target ? ` for ${target.fullName.split(' ')[0]}` : ''}
                    </Link>
                  </Button>
                ) : (
                  <Button disabled className="h-10 px-5 rounded-xl">
                    Choose who it is for
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
