'use client';

import { useMemo, useState } from 'react';
import { ClipboardCheck, Filter, Search, Sparkles } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  adminChildWithIntake,
  adminTeachers,
  adminTeachersForSubjects,
} from '@/lib/store/admin';
import {
  displayGrade,
  displaySchedule,
  displaySubject,
  type Child,
  type Teacher,
} from '@/lib/types';
import { useMounted } from '@/lib/use-mounted';

type Filter = 'All' | 'Pending' | 'Matched';

export default function AdminIntakesPage() {
  const mounted = useMounted();
  const initial = adminChildWithIntake();
  const allTeachers = adminTeachers();

  const [children, setChildren] = useState<Child[]>(initial);
  const [filter, setFilter] = useState<Filter>('Pending');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return children.filter((c) => {
      if (filter === 'Pending' && c.assignedTeacherId) return false;
      if (filter === 'Matched' && !c.assignedTeacherId) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        if (
          !c.fullName.toLowerCase().includes(q) &&
          !(c.intake && displaySubject(c.intake).toLowerCase().includes(q))
        )
          return false;
      }
      return true;
    });
  }, [children, filter, query]);

  const assign = (childId: string, teacherId: string) => {
    setChildren((prev) =>
      prev.map((c) =>
        c.id === childId ? { ...c, assignedTeacherId: teacherId } : c,
      ),
    );
  };

  const unassign = (childId: string) => {
    setChildren((prev) =>
      prev.map((c) =>
        c.id === childId ? { ...c, assignedTeacherId: undefined } : c,
      ),
    );
  };

  const pendingCount = children.filter((c) => !c.assignedTeacherId).length;
  const matchedCount = children.length - pendingCount;

  if (!mounted) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading…" description="" />
      </div>
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
          {(['Pending', 'Matched', 'All'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm transition',
                filter === f
                  ? 'bg-brand text-white'
                  : 'text-gray-600 dark:text-muted-foreground hover:text-gray-900',
              )}
            >
              {f}
              <span className="ml-2 text-xs opacity-70">
                {f === 'Pending'
                  ? pendingCount
                  : f === 'Matched'
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
            onChange={(e) => setQuery(e.target.value)}
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
              onAssign={(t) => assign(child.id, t)}
              onUnassign={() => unassign(child.id)}
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
  onAssign,
  onUnassign,
}: {
  child: Child;
  allTeachers: Teacher[];
  onAssign: (teacherId: string) => void;
  onUnassign: () => void;
}) {
  const intake = child.intake;
  if (!intake) return null;

  const selectedSubjects = intake.subjects?.length
    ? intake.subjects.map((subject) =>
        subject === 'Other' && intake.subjectOther?.trim()
          ? intake.subjectOther.trim()
          : subject,
      )
    : [displaySubject(intake)];
  const suggestions = adminTeachersForSubjects(selectedSubjects);
  const assigned = child.assignedTeacherId
    ? allTeachers.find((t) => t.id === child.assignedTeacherId)
    : null;

  return (
    <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-semibold text-gray-900 dark:text-foreground">
            {child.fullName}{' '}
            <span className="text-xs text-gray-500 dark:text-muted-foreground font-normal">
              · {displayGrade(child)} · Age {child.age}
            </span>
          </p>
          <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
            {child.school ?? 'No school listed'}
          </p>
        </div>
        <span
          className={cn(
            'text-[11px] font-medium px-2 py-0.5 rounded-full',
            assigned ? 'bg-accent2-50 text-accent2-700' : 'bg-amber-50 text-amber-700',
          )}
        >
          {assigned ? 'Matched' : 'Pending'}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
        <Row label="Subject" value={displaySubject(intake)} />
        <Row label="Goal" value={intake.learningGoal} />
        <Row label="Current level" value={intake.currentLevel} />
        <Row label="Teacher pref" value={intake.teacherGenderPref} />
        <Row
          label="Availability"
          value={displaySchedule(intake)}
        />
        <Row
          label="Frequency"
          value={`${intake.sessionsPerWeek}x / week · ${intake.budget}`}
        />
        {intake.specificTopics && (
          <Row label="Topics" value={intake.specificTopics} full />
        )}
        {intake.specialNotes && (
          <Row label="Notes" value={intake.specialNotes} full />
        )}
      </div>

      {assigned ? (
        <div className="bg-accent2-50 border border-accent2-100 rounded-xl p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center text-xs font-semibold shrink-0">
              {assigned.name
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-foreground truncate">
                {assigned.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-muted-foreground truncate">
                ★ {assigned.rating.toFixed(1)} ·{' '}
                {assigned.subjects.join(', ')}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="rounded-full text-xs"
            onClick={onUnassign}
          >
            Unassign
          </Button>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-brand" />
            <p className="text-xs font-semibold text-gray-700 dark:text-foreground/90">
              Suggested teachers
            </p>
          </div>
          {suggestions.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-muted-foreground">
              No teacher currently covers {displaySubject(intake)}. Try a different
              subject or add a teacher to the roster.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2">
              {suggestions.map((t) => (
                <SuggestionRow key={t.id} teacher={t} onAssign={onAssign} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SuggestionRow({
  teacher,
  onAssign,
}: {
  teacher: Teacher;
  onAssign: (teacherId: string) => void;
}) {
  return (
    <div className="bg-gray-50 dark:bg-background rounded-xl p-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-foreground truncate">
          {teacher.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-muted-foreground truncate">
          ★ {teacher.rating.toFixed(1)} · ${teacher.hourlyRate}/hr ·{' '}
          {teacher.totalSessions} sessions
        </p>
      </div>
      <Button
        size="sm"
        className="rounded-full bg-brand hover:bg-brand-600 shrink-0"
        onClick={() => onAssign(teacher.id)}
      >
        Assign
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
