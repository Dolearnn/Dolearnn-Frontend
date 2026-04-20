'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/dashboard/PageHeader';
import IntakeWizard from '@/components/forms/IntakeWizard';
import { familyKeys, getFamilyStudent } from '@/lib/api/family';

export default function IntakePage() {
  const params = useParams<{ id: string }>();
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

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={`Intake for ${child.fullName}`}
        description="Tell us what they need - we'll pair them with the right teacher."
      />
      <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-6">
        <IntakeWizard childId={child.id} />
      </div>
    </div>
  );
}
