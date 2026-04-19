'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Plus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/dashboard/PageHeader';
import { getChildren } from '@/lib/store/client';
import { displayGrade, displaySubject, type Child } from '@/lib/types';

export default function ChildrenList() {
  const [children, setChildren] = useState<Child[] | null>(null);

  useEffect(() => {
    setChildren(getChildren());
  }, []);

  return (
    <div>
      <PageHeader
        title="My Children"
        description="Manage every child under your account."
        action={
          <Link href="/family/children/new">
            <Button className="bg-brand hover:bg-brand-600 rounded-full">
              <Plus className="w-4 h-4 mr-2" /> Add child
            </Button>
          </Link>
        }
      />

      {children === null ? (
        <p className="text-sm text-gray-400 dark:text-muted-foreground">Loading…</p>
      ) : children.length === 0 ? (
        <div className="bg-white dark:bg-card border border-dashed border-gray-300 dark:border-border rounded-2xl p-10 text-center">
          <User className="w-8 h-8 mx-auto text-gray-400 dark:text-muted-foreground mb-2" />
          <p className="text-sm text-gray-700 dark:text-foreground/90 font-medium">No children yet</p>
          <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1 mb-4">
            Add your first child to get matched with a teacher.
          </p>
          <Link href="/family/children/new">
            <Button className="bg-brand hover:bg-brand-600 rounded-full">
              Add child
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map((c) => (
            <Link
              key={c.id}
              href={`/family/children/${c.id}`}
              className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-5 hover:border-brand transition"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-accent2-100 text-brand flex items-center justify-center font-semibold">
                  {c.fullName
                    .split(' ')
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>
                {c.status === 'Deactivated' && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                    Deactivated
                  </span>
                )}
              </div>
              <p className="font-semibold text-gray-900 dark:text-foreground">{c.fullName}</p>
              <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                Age {c.age} · {displayGrade(c)}
                {c.school ? ` · ${c.school}` : ''}
              </p>
              <p className="text-xs mt-3">
                {c.intake ? (
                  <span className="text-accent2-600 font-medium">
                    Intake submitted · {displaySubject(c.intake)}
                  </span>
                ) : (
                  <span className="text-amber-600 font-medium">
                    Intake pending
                  </span>
                )}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
