'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Mail, User } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import { familyKeys, listFamilyStudents } from '@/lib/api/family';
import { displayGrade, displaySubject } from '@/lib/types';

const ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? 'hello@dolearnn.com';

export default function ChildrenList() {
  const {
    data: children = [],
    isError,
    isLoading,
    error,
  } = useQuery({
    queryKey: familyKeys.students,
    queryFn: listFamilyStudents,
  });

  return (
    <div>
      <PageHeader
        title="My Children"
        description="View and update the student profiles created by admin."
      />

      <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-2xl p-5 mb-6">
        <p className="text-sm font-semibold text-gray-900 dark:text-foreground">
          Need help? Contact admin
        </p>
        <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1 mb-3">
          Scheduling, payments, and changes to your child&apos;s teacher are
          handled offline by admin.
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={`mailto:${ADMIN_EMAIL}`}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent2-50 text-accent2-700 text-xs font-medium hover:bg-accent2-100"
          >
            <Mail className="w-3.5 h-3.5" />
            {ADMIN_EMAIL}
          </a>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400 dark:text-muted-foreground">
          Loading...
        </p>
      ) : isError ? (
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : 'Could not load children.'}
        </p>
      ) : children.length === 0 ? (
        <div className="bg-white dark:bg-card border border-dashed border-gray-300 dark:border-border rounded-2xl p-10 text-center">
          <User className="w-8 h-8 mx-auto text-gray-400 dark:text-muted-foreground mb-2" />
          <p className="text-sm text-gray-700 dark:text-foreground/90 font-medium">
            No children yet
          </p>
          <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1 mb-4">
            Admin will create student profiles after confirming the family
            details offline.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map((child) => (
            <div
              key={child.id}
              className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-5 hover:border-brand transition flex flex-col"
            >
              <Link href={`/family/children/${child.id}`} className="block">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-accent2-100 text-brand flex items-center justify-center font-semibold">
                    {child.fullName
                      .split(' ')
                      .map((word) => word[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                  {child.status === 'Deactivated' && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                      Deactivated
                    </span>
                  )}
                </div>
                <p className="font-semibold text-gray-900 dark:text-foreground">
                  {child.fullName}
                </p>
                <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                  Age {child.age} - {displayGrade(child)}
                  {child.school ? ` - ${child.school}` : ''}
                </p>
                <p className="text-xs mt-3">
                  {child.intake ? (
                    <span className="text-accent2-600 font-medium">
                      Intake submitted - {displaySubject(child.intake)}
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium">
                      Intake pending
                    </span>
                  )}
                </p>
              </Link>

              {child.subjectAssignments && child.subjectAssignments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-border">
                  <p className="text-[11px] font-semibold text-gray-500 dark:text-muted-foreground uppercase tracking-wide mb-2">
                    Teachers
                  </p>
                  <div className="space-y-2">
                    {child.subjectAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="text-xs text-gray-700 dark:text-foreground/80"
                      >
                        <p className="font-medium">
                          {assignment.teacherName ?? 'Teacher'}
                          <span className="text-gray-400 dark:text-muted-foreground font-normal">
                            {' '}
                            - {assignment.subject}
                          </span>
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-muted-foreground mt-1">
                          Communication stays inside the web app.
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
