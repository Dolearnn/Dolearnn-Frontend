'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import IntakeWizard from '@/components/forms/IntakeWizard';
import { getChildById } from '@/lib/store/client';
import type { Child } from '@/lib/types';

export default function IntakePage() {
  const params = useParams<{ id: string }>();
  const [child, setChild] = useState<Child | null | undefined>(undefined);

  useEffect(() => {
    setChild(getChildById(params.id) ?? null);
  }, [params.id]);

  if (child === undefined) {
    return <p className="text-sm text-gray-400 dark:text-muted-foreground">Loading…</p>;
  }
  if (child === null) {
    return <p className="text-sm text-gray-700 dark:text-foreground/90">Child not found.</p>;
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={`Intake for ${child.fullName}`}
        description="Tell us what they need — we&apos;ll pair them with the right teacher."
      />
      <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-6">
        <IntakeWizard childId={child.id} />
      </div>
    </div>
  );
}
