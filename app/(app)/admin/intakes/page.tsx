'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, Search, Sparkles } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import { PageShellSkeleton } from '@/components/dashboard/Skeletons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  adminKeys,
  assignAdminTeacherToStudent,
  listAdminStudents,
  listAdminTeachers,
  unassignAdminTeacherFromStudent,
} from '@/lib/api/admin';
import {
  displayGrade,
  displaySchedule,
  displaySubject,
  type Child,
  type Teacher,
} from '@/lib/types';

type Filter = 'All' | 'Pending' | 'Matched';

export default function AdminIntakesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = useState<Filter>('Pending');
  const [query, setQuery] = useState('');

  const studentsQuery = useQuery({
    queryKey: adminKeys.students,
    queryFn: listAdminStudents,
  });
  const teachersQuery = useQuery({
    queryKey: adminKeys.teachers,
    queryFn: listAdminTeachers,
  });

  const children = useMemo(
    () => (studentsQuery.data ?? []).filter((child) => !!child.intake),
    [studentsQuery.data],
  );
  const allTeachers = teachersQuery.data ?? [];

  const invalidateStudents = () => {
    queryClient.invalidateQueries({ queryKey: adminKeys.students });
  };

  const assignMutation = useMutation({
    mutationFn: ({
      childId,
      teacherId,
      subject,
    }: {
      childId: string;
      teacherId: string;
      subject: string;
    }) => assignAdminTeacherToStudent(childId, teacherId, subject),
    onSuccess: () => {
      invalidateStudents();
      toast({ title: 'Teacher assigned' });
    },
    onError: (error) => {
      toast({
        title: 'Could not assign teacher',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const unassignMutation = useMutation({
    mutationFn: ({
      childId,
      subject,
    }: {
      childId: string;
      subject: string;
    }) => unassignAdminTeacherFromStudent(childId, subject),
    onSuccess: () => {
      invalidateStudents();
      toast({ title: 'Teacher unassigned' });
    },
    onError: (error) => {
      toast({
        title: 'Could not unassign teacher',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const filtered = useMemo(() => {
    return children.filter((child) => {
      const subjects = subjectList(child);
      const matchedCount = subjects.filter((subject) =>
        child.subjectAssignments?.some(
          (assignment) =>
            assignment.subject.toLowerCase() === subject.toLowerCase(),
        ),
      ).length;
      const fullyMatched = subjects.length > 0 && matchedCount === subjects.length;
      if (filter === 'Pending' && fullyMatched) return false;
      if (filter === 'Matched' && !fullyMatched) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        if (
          !child.fullName.toLowerCase().includes(q) &&
          !(child.intake && displaySubject(child.intake).toLowerCase().includes(q))
        ) {
          return false;
        }
      }
      return true;
    });
  }, [children, filter, query]);

  const pendingCount = children.filter((child) => {
    const subjects = subjectList(child);
    return subjects.some(
      (subject) =>
        !child.subjectAssignments?.some(
          (assignment) =>
            assignment.subject.toLowerCase() === subject.toLowerCase(),
        ),
    );
  }).length;
  const matchedCount = children.length - pendingCount;
  const isLoading = studentsQuery.isLoading || teachersQuery.isLoading;
  const error = studentsQuery.error ?? teachersQuery.error;

  if (isLoading) {
    return <PageShellSkeleton />;
  }

  if (error) {
    return (
      <p className="text-sm text-red-600">
        {error instanceof Error ? error.message : 'Could not load intakes.'}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Intakes"
        description="Review new family enquiries and assign the right teacher."
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-2 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-full p-1 w-fit">
          {(['Pending', 'Matched', 'All'] as Filter[]).map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm transition',
                filter === item
                  ? 'bg-brand text-white'
                  : 'text-gray-600 dark:text-muted-foreground hover:text-gray-900',
              )}
            >
              {item}
              <span className="ml-2 text-xs opacity-70">
                {item === 'Pending'
                  ? pendingCount
                  : item === 'Matched'
                    ? matchedCount
                    : children.length}
              </span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 dark:text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name or subject"
            className="pl-9 rounded-full"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-card rounded-2xl border border-dashed border-gray-300 dark:border-border p-10 text-center">
          <ClipboardCheck className="w-6 h-6 text-accent2-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-700 dark:text-foreground/90">
            {filter === 'Pending'
              ? 'Every intake is matched'
              : 'No intakes match this filter'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((child) => (
            <IntakeCard
              key={child.id}
              child={child}
              allTeachers={allTeachers}
              assigning={assignMutation.isPending}
              unassigning={unassignMutation.isPending}
              onAssign={(subject, teacherId) =>
                assignMutation.mutate({ childId: child.id, subject, teacherId })
              }
              onUnassign={(subject) =>
                unassignMutation.mutate({ childId: child.id, subject })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function IntakeCard({
  child,
  allTeachers,
  assigning,
  unassigning,
  onAssign,
  onUnassign,
}: {
  child: Child;
  allTeachers: Teacher[];
  assigning: boolean;
  unassigning: boolean;
  onAssign: (subject: string, teacherId: string) => void;
  onUnassign: (subject: string) => void;
}) {
  const intake = child.intake;
  if (!intake) return null;

  const selectedSubjects = subjectList(child);
  const assignedCount = selectedSubjects.filter((subject) =>
    assignmentForSubject(child, subject),
  ).length;
  const fullyAssigned =
    selectedSubjects.length > 0 && assignedCount === selectedSubjects.length;

  return (
    <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-semibold text-gray-900 dark:text-foreground">
            {child.fullName}{' '}
            <span className="text-xs text-gray-500 dark:text-muted-foreground font-normal">
              - {displayGrade(child)} - Age {child.age}
            </span>
          </p>
          <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
            {child.school ?? 'No school listed'}
          </p>
        </div>
        <span
          className={cn(
            'text-[11px] font-medium px-2 py-0.5 rounded-full',
            fullyAssigned
              ? 'bg-accent2-50 text-accent2-700'
              : 'bg-amber-50 text-amber-700',
          )}
        >
          {fullyAssigned
            ? 'Matched'
            : `${assignedCount}/${selectedSubjects.length} matched`}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
        <Row label="Subject" value={displaySubject(intake)} />
        <Row label="Goal" value={intake.learningGoal} />
        <Row label="Current level" value={intake.currentLevel} />
        <Row label="Teacher pref" value={intake.teacherGenderPref} />
        <Row label="Availability" value={displaySchedule(intake)} />
        <Row
          label="Frequency"
          value={`${intake.sessionsPerWeek}x / week - ${intake.budget}`}
        />
        {intake.specificTopics && (
          <Row label="Topics" value={intake.specificTopics} full />
        )}
        {intake.specialNotes && (
          <Row label="Notes" value={intake.specialNotes} full />
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand" />
          <p className="text-xs font-semibold text-gray-700 dark:text-foreground/90">
            Subject matching
          </p>
        </div>
        {selectedSubjects.map((subject) => {
          const assignment = assignmentForSubject(child, subject);
          const assignedTeacher = assignment
            ? allTeachers.find((teacher) => teacher.id === assignment.teacherId)
            : null;
          const suggestions = teachersForSubject(allTeachers, subject);

          return (
            <div
              key={subject}
              className="rounded-xl border border-gray-200 dark:border-border p-3 space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-900 dark:text-foreground">
                  {subject}
                </p>
                <span
                  className={cn(
                    'text-[11px] font-medium px-2 py-0.5 rounded-full',
                    assignment
                      ? 'bg-accent2-50 text-accent2-700'
                      : 'bg-amber-50 text-amber-700',
                  )}
                >
                  {assignment ? 'Assigned' : 'Needs match'}
                </span>
              </div>

              {assignment ? (
                <div className="bg-accent2-50 border border-accent2-100 rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-foreground truncate">
                      {assignedTeacher?.name ?? assignment.teacherName ?? 'Teacher'}
                    </p>
                    {assignedTeacher && (
                      <p className="text-xs text-gray-500 dark:text-muted-foreground truncate">
                        Star {assignedTeacher.rating.toFixed(1)} -{' '}
                        {assignedTeacher.subjects.join(', ')}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-full text-xs"
                    disabled={unassigning}
                    onClick={() => onUnassign(subject)}
                  >
                    {unassigning ? 'Removing...' : 'Unassign'}
                  </Button>
                </div>
              ) : suggestions.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-muted-foreground">
                  No active teacher currently covers {subject}.
                </p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2">
                  {suggestions.map((teacher) => (
                    <SuggestionRow
                      key={teacher.id}
                      subject={subject}
                      teacher={teacher}
                      assigning={assigning}
                      onAssign={onAssign}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function subjectList(child: Child) {
  const intake = child.intake;
  if (!intake) return [];
  const subjects = intake.subjects?.length
    ? intake.subjects.map((subject) =>
        subject === 'Other' && intake.subjectOther?.trim()
          ? intake.subjectOther.trim()
          : subject,
      )
    : [displaySubject(intake)];
  return Array.from(new Set(subjects.filter(Boolean)));
}

function assignmentForSubject(child: Child, subject: string) {
  return child.subjectAssignments?.find(
    (assignment) =>
      assignment.subject.toLowerCase() === subject.toLowerCase(),
  );
}

function teachersForSubject(teachers: Teacher[], subject: string) {
  return teachers.filter(
    (teacher) =>
      (teacher.status ?? 'Active') !== 'Terminated' &&
      teacher.subjects.some((teacherSubject) => {
        const a = teacherSubject.toLowerCase();
        const b = subject.toLowerCase();
        return a.includes(b) || b.includes(a);
      }),
  );
}

function SuggestionRow({
  subject,
  teacher,
  assigning,
  onAssign,
}: {
  subject: string;
  teacher: Teacher;
  assigning: boolean;
  onAssign: (subject: string, teacherId: string) => void;
}) {
  return (
    <div className="bg-gray-50 dark:bg-background rounded-xl p-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-foreground truncate">
          {teacher.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-muted-foreground truncate">
          Star {teacher.rating.toFixed(1)} - ${teacher.hourlyRate}/hr -{' '}
          {teacher.totalSessions} sessions
        </p>
      </div>
      <Button
        size="sm"
        className="rounded-full bg-brand hover:bg-brand-600 shrink-0"
        disabled={assigning}
        onClick={() => onAssign(subject, teacher.id)}
      >
        {assigning ? 'Assigning...' : 'Assign'}
      </Button>
    </div>
  );
}

function Row({
  label,
  value,
  full,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={cn('flex gap-2', full && 'sm:col-span-2')}>
      <span className="text-gray-400 dark:text-muted-foreground uppercase tracking-wide text-[10px] w-20 shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-gray-700 dark:text-foreground/90">{value}</span>
    </div>
  );
}
