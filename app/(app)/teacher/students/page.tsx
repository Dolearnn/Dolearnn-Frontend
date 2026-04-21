'use client';

import { useMemo, useState, type ComponentType } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Flame, Target, Users } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import { StarRating } from '@/components/ui/star-rating';
import {
  getTeacherProfile,
  listTeacherNotes,
  listTeacherSessions,
  listTeacherStudents,
  teacherKeys,
} from '@/lib/api/teacher';
import { cn } from '@/lib/utils';
import {
  displayGrade,
  displaySchedule,
  displaySubject,
  type Child,
  type Session,
  type SessionNote,
} from '@/lib/types';

const EMPTY_STUDENTS: Child[] = [];
const EMPTY_SESSIONS: Session[] = [];
const EMPTY_NOTES: SessionNote[] = [];

export default function TeacherStudentsPage() {
  const teacherQuery = useQuery({
    queryKey: teacherKeys.profile,
    queryFn: getTeacherProfile,
  });
  const studentsQuery = useQuery({
    queryKey: teacherKeys.students,
    queryFn: listTeacherStudents,
  });
  const sessionsQuery = useQuery({
    queryKey: teacherKeys.sessions,
    queryFn: listTeacherSessions,
  });
  const notesQuery = useQuery({
    queryKey: teacherKeys.notes,
    queryFn: listTeacherNotes,
  });

  const teacher = teacherQuery.data;
  const students = studentsQuery.data ?? EMPTY_STUDENTS;
  const sessions = sessionsQuery.data ?? EMPTY_SESSIONS;
  const notes = notesQuery.data ?? EMPTY_NOTES;
  const isLoading =
    teacherQuery.isLoading ||
    studentsQuery.isLoading ||
    sessionsQuery.isLoading ||
    notesQuery.isLoading;
  const isError =
    teacherQuery.isError ||
    studentsQuery.isError ||
    sessionsQuery.isError ||
    notesQuery.isError;

  const byStudent = useMemo(() => {
    const map = new Map<string, Session[]>();
    for (const s of sessions) {
      const arr = map.get(s.childId) ?? [];
      arr.push(s);
      map.set(s.childId, arr);
    }
    return map;
  }, [sessions]);

  const notesByStudent = useMemo(() => {
    const map = new Map<string, SessionNote[]>();
    for (const n of notes) {
      const sess = sessions.find((s) => s.id === n.sessionId);
      if (!sess) continue;
      const arr = map.get(sess.childId) ?? [];
      arr.push(n);
      map.set(sess.childId, arr);
    }
    map.forEach((arr) => {
      arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    });
    return map;
  }, [notes, sessions]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="My students" description="Loading..." />
      </div>
    );
  }

  if (isError || !teacher) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My students"
          description="Students you're currently assigned to."
        />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          We could not load your students right now. Please try again.
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My students"
          description="Students you're currently assigned to."
        />
        <div className="bg-white dark:bg-card rounded-2xl border border-dashed border-gray-300 dark:border-border p-10 text-center">
          <Users className="w-6 h-6 text-gray-400 dark:text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-700 dark:text-foreground/90">
            No students yet
          </p>
          <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
            New matches from the admin team will show up here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My students"
        description={`You're currently assigned to ${students.length} student${students.length === 1 ? '' : 's'}.`}
      />
      <div className="grid lg:grid-cols-2 gap-4">
        {students.map((s) => (
          <StudentCard
            key={s.id}
            student={s}
            sessions={byStudent.get(s.id) ?? []}
            notes={notesByStudent.get(s.id) ?? []}
          />
        ))}
      </div>
    </div>
  );
}

function StudentCard({
  student,
  sessions,
  notes,
}: {
  student: Child;
  sessions: Session[];
  notes: SessionNote[];
}) {
  const completed = sessions.filter((s) => s.status === 'Completed').length;
  const upcoming = sessions
    .filter((s) => s.status === 'Upcoming')
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
  const avgRating =
    notes.length > 0
      ? notes.reduce((sum, n) => sum + n.rating, 0) / notes.length
      : null;
  const latestNote = notes[0];

  return (
    <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center font-semibold">
          {student.fullName
            .split(' ')
            .map((p) => p[0])
            .join('')
            .slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 dark:text-foreground">
            {student.fullName}
          </p>
          <p className="text-xs text-gray-500 dark:text-muted-foreground">
            {displayGrade(student)} - Age {student.age}
            {student.school ? ` - ${student.school}` : ''}
          </p>
          {avgRating !== null && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <StarRating value={Math.round(avgRating)} readOnly size="sm" />
              <span className="text-[11px] text-gray-500 dark:text-muted-foreground">
                {avgRating.toFixed(1)} avg - {notes.length} note
                {notes.length === 1 ? '' : 's'}
              </span>
            </div>
          )}
        </div>
      </div>

      {student.goal && (
        <div className="bg-gray-50 dark:bg-background rounded-xl p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-brand" />
            <p className="text-xs font-semibold text-gray-700 dark:text-foreground/90">
              {student.goal.title}
            </p>
          </div>
          <div className="h-1.5 bg-white dark:bg-card rounded-full overflow-hidden">
            <div
              className="h-full bg-accent2-500"
              style={{ width: `${student.goal.progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat icon={BookOpen} label="Sessions" value={completed} />
        <Stat
          icon={Flame}
          label="Streak"
          value={`${student.streak.current}w`}
        />
        <Stat label="Badges" value={student.badges.length} />
      </div>

      {student.intake && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-border space-y-2 text-xs">
          <Row label="Focus" value={displaySubject(student.intake)} />
          <Row label="Goal" value={student.intake.learningGoal} />
          <Row label="Level" value={student.intake.currentLevel} />
          <Row label="Time" value={displaySchedule(student.intake)} />
          {student.intake.specialNotes && (
            <Row label="Notes" value={student.intake.specialNotes} />
          )}
        </div>
      )}

      {student.intake && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-border">
          <p className="text-xs font-semibold text-gray-900 dark:text-foreground">
            Scheduling handled by admin
          </p>
          <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
            Admin will create the 60-minute calendar sessions and assign the
            meeting link for this student.
          </p>
        </div>
      )}

      {latestNote && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] uppercase tracking-wide text-gray-400 dark:text-muted-foreground">
              Latest feedback
            </p>
            <StarRating value={latestNote.rating} readOnly size="sm" />
          </div>
          <p className="text-xs text-gray-700 dark:text-foreground/90 line-clamp-2">
            {latestNote.covered}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-muted-foreground mt-1">
            Next: {latestNote.focusNext}
          </p>
        </div>
      )}

      {upcoming && (
        <div
          className={cn(
            'mt-4 pt-4 border-t border-gray-100 dark:border-border text-xs text-gray-600 dark:text-muted-foreground',
          )}
        >
          Next session:{' '}
          <span className="font-medium text-gray-900 dark:text-foreground">
            {new Date(upcoming.startsAt).toLocaleString(undefined, {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>{' '}
          - {upcoming.subject}
        </div>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon?: ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
}) {
  return (
    <div className="bg-gray-50 dark:bg-background rounded-xl p-3">
      <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-muted-foreground mb-1">
        {Icon && <Icon className="w-3 h-3" />}
        <p className="text-[10px] uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-base font-semibold text-gray-900 dark:text-foreground">
        {value}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 dark:text-muted-foreground uppercase tracking-wide text-[10px] w-14 shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-gray-700 dark:text-foreground/90">{value}</span>
    </div>
  );
}
