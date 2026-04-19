'use client';

import { useMemo, useState, type ComponentType } from 'react';
import { BookOpen, CalendarPlus, Flame, Target, Users } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StarRating } from '@/components/ui/star-rating';
import { Textarea } from '@/components/ui/textarea';
import { createSessionProposal } from '@/lib/store/client';
import { cn } from '@/lib/utils';
import { useMounted } from '@/lib/use-mounted';
import {
  teacherMe,
  teacherNotes,
  teacherSessions,
  teacherStudents,
} from '@/lib/store/teacher';
import {
  displayGrade,
  displaySchedule,
  displaySubject,
  scheduleEntries,
  type Child,
  type DayOfWeek,
  type Session,
  type SessionNote,
  type TimeBlock,
} from '@/lib/types';

export default function TeacherStudentsPage() {
  const mounted = useMounted();
  const teacher = teacherMe();
  const students = teacherStudents();
  const sessions = teacherSessions();
  const notes = teacherNotes();

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

  if (!mounted) {
    return (
      <div className="space-y-6">
        <PageHeader title="My students" description="Loading…" />
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
            teacherId={teacher.id}
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
  teacherId,
  sessions,
  notes,
}: {
  student: Child;
  teacherId: string;
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
          <p className="font-semibold text-gray-900 dark:text-foreground">{student.fullName}</p>
          <p className="text-xs text-gray-500 dark:text-muted-foreground">
            {displayGrade(student)} · Age {student.age}
            {student.school ? ` · ${student.school}` : ''}
          </p>
          {avgRating !== null && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <StarRating value={Math.round(avgRating)} readOnly size="sm" />
              <span className="text-[11px] text-gray-500 dark:text-muted-foreground">
                {avgRating.toFixed(1)} avg · {notes.length} note{notes.length === 1 ? '' : 's'}
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
        <ScheduleProposalForm student={student} teacherId={teacherId} />
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
          · {upcoming.subject}
        </div>
      )}
    </div>
  );
}

const TIME_BLOCK_RANGES: Record<
  TimeBlock,
  { start: string; end: string; label: string }
> = {
  Morning: { start: '06:00', end: '12:00', label: '06:00 - 12:00' },
  Afternoon: { start: '12:00', end: '17:00', label: '12:00 - 17:00' },
  Evening: { start: '17:00', end: '22:00', label: '17:00 - 22:00' },
};

const DATE_DAY: Record<number, DayOfWeek> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
};

function dayForDate(dateValue: string): DayOfWeek | null {
  if (!dateValue) return null;
  const date = new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return DATE_DAY[date.getDay()];
}

function timeIsInBlock(time: string, block: TimeBlock) {
  const range = TIME_BLOCK_RANGES[block];
  return time >= range.start && time < range.end;
}

function intakeSchedule(student: Child) {
  const intake = student.intake;
  if (!intake) return [];
  const fromSchedule = scheduleEntries(intake.preferredSchedule ?? {});
  if (fromSchedule.length > 0) return fromSchedule;
  return intake.preferredDays.map((day) => ({
    day,
    time: intake.preferredTime,
  }));
}

function subjectOptions(student: Child) {
  const intake = student.intake;
  if (!intake) return ['General lesson'];
  const subjects =
    intake.subjects && intake.subjects.length > 0
      ? intake.subjects.map((subject) =>
          subject === 'Other' && intake.subjectOther?.trim()
            ? intake.subjectOther.trim()
            : subject,
        )
      : [displaySubject(intake)];
  return Array.from(new Set(subjects.filter(Boolean)));
}

function ScheduleProposalForm({
  student,
  teacherId,
}: {
  student: Child;
  teacherId: string;
}) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const entries = intakeSchedule(student);
  const subjects = subjectOptions(student);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(
    entries[0]?.day ?? 'Mon',
  );
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [subject, setSubject] = useState(subjects[0] ?? 'General lesson');
  const [note, setNote] = useState('');
  const selectedEntry = entries.find((entry) => entry.day === selectedDay);
  const selectedBlock = selectedEntry?.time;
  const dateDay = dayForDate(date);
  const dateMatchesDay = !dateDay || dateDay === selectedDay;
  const timeMatchesBlock = selectedBlock ? !time || timeIsInBlock(time, selectedBlock) : false;
  const canSubmit =
    !!selectedBlock &&
    !!date &&
    !!time &&
    !!subject &&
    dateMatchesDay &&
    timeMatchesBlock;

  const submitProposal = () => {
    if (!canSubmit || !selectedBlock) return;
    createSessionProposal({
      childId: student.id,
      teacherId: student.assignedTeacherId ?? teacherId,
      subject,
      startsAt: new Date(`${date}T${time}:00`).toISOString(),
      durationMins: Number(duration),
      timeBlock: selectedBlock,
      note: note.trim() || undefined,
    });
    setSent(true);
    setOpen(false);
    setDate('');
    setTime('');
    setNote('');
  };

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-border">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-gray-900 dark:text-foreground">
            Student availability
          </p>
          <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
            {displaySchedule(student.intake!)}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full bg-brand hover:bg-brand-600">
              <CalendarPlus className="w-4 h-4 mr-2" />
              Propose session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Propose a session</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Subject</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Available day</Label>
                <Select
                  value={selectedDay}
                  onValueChange={(value) => setSelectedDay(value as DayOfWeek)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {entries.map((entry) => (
                      <SelectItem key={entry.day} value={entry.day}>
                        {entry.day} - {entry.time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Start time</Label>
                  <Input
                    type="time"
                    value={time}
                    onChange={(event) => setTime(event.target.value)}
                  />
                </div>
              </div>
              {selectedBlock && (
                <p className="text-xs text-gray-500 dark:text-muted-foreground">
                  {selectedDay} is inside {selectedBlock.toLowerCase()} ({TIME_BLOCK_RANGES[selectedBlock].label}) in{' '}
                  {student.intake?.timezone ?? 'the student timezone'}.
                </p>
              )}
              {!dateMatchesDay && (
                <p className="text-xs font-medium text-red-600">
                  Choose a date that falls on {selectedDay}.
                </p>
              )}
              {!timeMatchesBlock && time && selectedBlock && (
                <p className="text-xs font-medium text-red-600">
                  Choose a time inside the {selectedBlock.toLowerCase()} session.
                </p>
              )}
              <div className="grid gap-2">
                <Label>Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Note</Label>
                <Textarea
                  rows={3}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Optional message for the family"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-brand hover:bg-brand-600"
                disabled={!canSubmit}
                onClick={submitProposal}
              >
                Send proposal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {sent && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
          Proposal sent to the family.
        </p>
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
      <p className="text-base font-semibold text-gray-900 dark:text-foreground">{value}</p>
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
