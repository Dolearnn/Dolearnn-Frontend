'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Mail,
  Phone,
  Plus,
  Search,
  Star,
  UserX,
} from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  adminChildren,
  adminSessions,
  adminTeachers,
} from '@/lib/store/admin';
import { updateTeacherHourlyRate } from '@/lib/store/client';
import type { Child, Teacher } from '@/lib/types';
import { useMounted } from '@/lib/use-mounted';

const COUNTRY_CODES = [
  { value: '+234', label: 'Nigeria (+234)' },
  { value: '+44', label: 'United Kingdom (+44)' },
  { value: '+1', label: 'United States / Canada (+1)' },
  { value: '+233', label: 'Ghana (+233)' },
  { value: '+27', label: 'South Africa (+27)' },
  { value: '+91', label: 'India (+91)' },
  { value: '+971', label: 'UAE (+971)' },
];

const SUBJECTS = [
  'Maths',
  'English',
  'Science',
  'Coding',
  'Music',
  'French',
  'SAT',
  'Further Maths',
];

type AddTeacherForm = {
  firstName: string;
  lastName: string;
  email: string;
  phoneCountry: string;
  phoneNumber: string;
  subjects: string[];
  qualifications: string;
};

const emptyTeacherForm: AddTeacherForm = {
  firstName: '',
  lastName: '',
  email: '',
  phoneCountry: '+234',
  phoneNumber: '',
  subjects: [],
  qualifications: '',
};

export default function AdminTeachersPage() {
  const mounted = useMounted();
  const sessions = adminSessions();
  const [teachers, setTeachers] = useState<Teacher[]>(adminTeachers());
  const [children, setChildren] = useState<Child[]>(adminChildren());
  const [query, setQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [teacherForm, setTeacherForm] =
    useState<AddTeacherForm>(emptyTeacherForm);
  const [terminateTarget, setTerminateTarget] = useState<Teacher | null>(null);
  const [terminationReason, setTerminationReason] = useState('');
  const [rematchIds, setRematchIds] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.subjects.some((s) => s.toLowerCase().includes(q)),
    );
  }, [teachers, query]);

  const activeTeachers = useMemo(
    () => teachers.filter((t) => (t.status ?? 'Active') !== 'Terminated'),
    [teachers],
  );

  const needsRematch = useMemo(
    () =>
      children.filter(
        (c) =>
          rematchIds.includes(c.id) &&
          c.assignedTeacherId === undefined &&
          c.intake,
      ),
    [children, rematchIds],
  );

  const assignedByTeacher = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of children) {
      if (!c.assignedTeacherId) continue;
      map.set(c.assignedTeacherId, (map.get(c.assignedTeacherId) ?? 0) + 1);
    }
    return map;
  }, [children]);

  const upcomingByTeacher = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sessions) {
      if (s.status !== 'Upcoming') continue;
      const teacher = teachers.find((t) => t.id === s.teacherId);
      if (teacher?.status === 'Terminated') continue;
      map.set(s.teacherId, (map.get(s.teacherId) ?? 0) + 1);
    }
    return map;
  }, [sessions, teachers]);

  const canAddTeacher =
    teacherForm.firstName.trim() &&
    teacherForm.lastName.trim() &&
    teacherForm.email.trim() &&
    teacherForm.phoneNumber.trim() &&
    teacherForm.subjects.length > 0 &&
    teacherForm.qualifications.trim();

  const addTeacher = () => {
    if (!canAddTeacher) return;
    const firstName = teacherForm.firstName.trim();
    const lastName = teacherForm.lastName.trim();
    const qualifications = teacherForm.qualifications
      .split('\n')
      .map((q) => q.trim())
      .filter(Boolean);
    const teacher: Teacher = {
      id: `t_${Date.now()}`,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email: teacherForm.email.trim(),
      phoneCountry: teacherForm.phoneCountry,
      phoneNumber: teacherForm.phoneNumber.trim(),
      bio: `${teacherForm.subjects.join(', ')} teacher added by admin.`,
      subjects: teacherForm.subjects,
      qualifications,
      hourlyRate: 0,
      rating: 0,
      totalSessions: 0,
      joinedAt: new Date().toISOString(),
      status: 'Active',
    };
    setTeachers((prev) => [teacher, ...prev]);
    setTeacherForm(emptyTeacherForm);
    setAddOpen(false);
  };

  const terminateTeacher = () => {
    if (!terminateTarget || !terminationReason.trim()) return;
    const teacherId = terminateTarget.id;
    const affectedChildIds = children
      .filter((child) => child.assignedTeacherId === teacherId)
      .map((child) => child.id);
    setTeachers((prev) =>
      prev.map((teacher) =>
        teacher.id === teacherId
          ? {
              ...teacher,
              status: 'Terminated',
              terminationReason: terminationReason.trim(),
              terminatedAt: new Date().toISOString(),
            }
          : teacher,
      ),
    );
    setChildren((prev) =>
      prev.map((child) =>
        child.assignedTeacherId === teacherId
          ? { ...child, assignedTeacherId: undefined }
          : child,
      ),
    );
    setRematchIds((prev) => Array.from(new Set([...prev, ...affectedChildIds])));
    setTerminateTarget(null);
    setTerminationReason('');
  };

  const assignChild = (childId: string, teacherId: string) => {
    setChildren((prev) =>
      prev.map((child) =>
        child.id === childId ? { ...child, assignedTeacherId: teacherId } : child,
      ),
    );
    setRematchIds((prev) => prev.filter((id) => id !== childId));
  };

  const updateRate = (teacherId: string, hourlyRate: number) => {
    updateTeacherHourlyRate(teacherId, hourlyRate);
    setTeachers((prev) =>
      prev.map((teacher) =>
        teacher.id === teacherId ? { ...teacher, hourlyRate } : teacher,
      ),
    );
  };

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
        title="Teachers"
        description={`Managing ${teachers.length} teachers across the DoLearn roster.`}
        action={
          <Button
            className="bg-brand hover:bg-brand-600 rounded-full"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add teacher
          </Button>
        }
      />

      {needsRematch.length > 0 && (
        <RematchPanel
          students={needsRematch}
          teachers={activeTeachers}
          onAssign={assignChild}
        />
      )}

      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 text-gray-400 dark:text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, or subject"
          className="pl-9 rounded-full"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-card rounded-2xl border border-dashed border-gray-300 dark:border-border p-10 text-center">
          <p className="text-sm text-gray-500 dark:text-muted-foreground">
            No teachers match that search.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {filtered.map((t) => (
            <TeacherCard
              key={t.id}
              teacher={t}
              studentCount={assignedByTeacher.get(t.id) ?? 0}
              upcomingCount={upcomingByTeacher.get(t.id) ?? 0}
              onTerminate={() => setTerminateTarget(t)}
              onRateChange={(rate) => updateRate(t.id, rate)}
            />
          ))}
        </div>
      )}

      <AddTeacherDialog
        open={addOpen}
        form={teacherForm}
        canSubmit={!!canAddTeacher}
        onOpenChange={setAddOpen}
        onChange={setTeacherForm}
        onSubmit={addTeacher}
      />

      <Dialog
        open={!!terminateTarget}
        onOpenChange={(open) => {
          if (!open) {
            setTerminateTarget(null);
            setTerminationReason('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terminate teacher</DialogTitle>
            <DialogDescription>
              This ends the teacher assignment and moves their students into the
              rematch queue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-sm text-amber-800 flex gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              {terminateTarget?.name} currently has{' '}
              {terminateTarget
                ? assignedByTeacher.get(terminateTarget.id) ?? 0
                : 0}{' '}
              assigned student(s).
            </div>
            <Textarea
              value={terminationReason}
              onChange={(e) => setTerminationReason(e.target.value)}
              placeholder="Reason for termination, e.g. misconduct report details"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTerminateTarget(null)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              disabled={!terminationReason.trim()}
              onClick={terminateTeacher}
            >
              Terminate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TeacherCard({
  teacher,
  studentCount,
  upcomingCount,
  onTerminate,
  onRateChange,
}: {
  teacher: Teacher;
  studentCount: number;
  upcomingCount: number;
  onTerminate: () => void;
  onRateChange: (hourlyRate: number) => void;
}) {
  const status = teacher.status ?? 'Active';
  const isTerminated = status === 'Terminated';

  return (
    <div
      className={cn(
        'bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-5 space-y-4',
        isTerminated && 'opacity-75',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center font-semibold shrink-0">
          {teacher.name
            .split(' ')
            .map((p) => p[0])
            .join('')
            .slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 dark:text-foreground">
              {teacher.name}
            </p>
            <span
              className={cn(
                'text-[10px] font-medium px-2 py-0.5 rounded-full',
                status === 'Active' && 'bg-accent2-50 text-accent2-700',
                status === 'Terminated' && 'bg-red-50 text-red-700',
              )}
            >
              {status}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-muted-foreground leading-snug">
            {teacher.bio}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p
            className={cn(
              'text-sm font-semibold flex items-center gap-1',
              teacher.rating >= 4.8 ? 'text-accent2-600' : 'text-gray-700',
            )}
          >
            <Star className="w-3 h-3 fill-current" />
            {teacher.rating ? teacher.rating.toFixed(1) : 'New'}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-muted-foreground">
            {teacher.totalSessions} total
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-2 text-xs text-gray-600 dark:text-muted-foreground">
        {teacher.email && (
          <p className="flex items-center gap-2 min-w-0">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{teacher.email}</span>
          </p>
        )}
        {teacher.phoneNumber && (
          <p className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 shrink-0" />
            {teacher.phoneCountry} {teacher.phoneNumber}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {teacher.subjects.map((s) => (
          <span
            key={s}
            className="text-[11px] bg-accent2-50 text-accent2-700 px-2 py-0.5 rounded-full"
          >
            {s}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Students" value={studentCount} />
        <Stat label="Upcoming" value={upcomingCount} />
        <div className="bg-gray-50 dark:bg-background rounded-xl p-2">
          <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-muted-foreground">
            Rate
          </p>
          <div className="mt-1 flex items-center justify-center gap-1">
            <span className="text-xs text-gray-500">$</span>
            <Input
              type="number"
              min={0}
              value={teacher.hourlyRate}
              onChange={(e) => onRateChange(Number(e.target.value) || 0)}
              className="h-7 w-16 text-center px-1"
            />
            <span className="text-[10px] text-gray-500">/hr</span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-100 dark:border-border space-y-1">
        <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-muted-foreground">
          Qualifications
        </p>
        <p className="text-xs text-gray-700 dark:text-foreground/90">
          {teacher.qualifications.join(' / ')}
        </p>
        {teacher.terminationReason && (
          <p className="text-xs text-red-600 pt-1">
            Termination reason: {teacher.terminationReason}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 text-[11px] text-gray-400 dark:text-muted-foreground">
        <span>
          Joined{' '}
          {new Date(teacher.joinedAt).toLocaleDateString(undefined, {
            month: 'short',
            year: 'numeric',
          })}
        </span>
        {!isTerminated && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full text-red-600 hover:text-red-700"
            onClick={onTerminate}
          >
            <UserX className="w-3.5 h-3.5 mr-1" />
            Terminate
          </Button>
        )}
      </div>
    </div>
  );
}

function AddTeacherDialog({
  open,
  form,
  canSubmit,
  onOpenChange,
  onChange,
  onSubmit,
}: {
  open: boolean;
  form: AddTeacherForm;
  canSubmit: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (form: AddTeacherForm) => void;
  onSubmit: () => void;
}) {
  const patch = (next: Partial<AddTeacherForm>) => onChange({ ...form, ...next });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add teacher</DialogTitle>
          <DialogDescription>
            Enter the external teacher details your team has collected.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Input
              value={form.firstName}
              onChange={(e) => patch({ firstName: e.target.value })}
              placeholder="First name"
            />
            <Input
              value={form.lastName}
              onChange={(e) => patch({ lastName: e.target.value })}
              placeholder="Last name"
            />
          </div>
          <Input
            value={form.email}
            onChange={(e) => patch({ email: e.target.value })}
            placeholder="Email address"
            type="email"
          />
          <div className="grid sm:grid-cols-[220px_1fr] gap-3">
            <Select
              value={form.phoneCountry}
              onValueChange={(value) => patch({ phoneCountry: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRY_CODES.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={form.phoneNumber}
              onChange={(e) => patch({ phoneNumber: e.target.value })}
              placeholder="Phone number"
              inputMode="tel"
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-foreground">
              Subjects
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SUBJECTS.map((subject) => {
                const checked = form.subjects.includes(subject);
                return (
                  <label
                    key={subject}
                    className={cn(
                      'flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer text-sm',
                      checked
                        ? 'border-brand bg-accent2-50 text-brand'
                        : 'border-gray-200',
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => {
                        const set = new Set(form.subjects);
                        if (value) set.add(subject);
                        else set.delete(subject);
                        patch({ subjects: Array.from(set) });
                      }}
                    />
                    {subject}
                  </label>
                );
              })}
            </div>
          </div>
          <Textarea
            value={form.qualifications}
            onChange={(e) => patch({ qualifications: e.target.value })}
            placeholder="Qualifications, one per line"
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-brand hover:bg-brand-600"
            disabled={!canSubmit}
            onClick={onSubmit}
          >
            Add teacher
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RematchPanel({
  students,
  teachers,
  onAssign,
}: {
  students: Child[];
  teachers: Teacher[];
  onAssign: (childId: string, teacherId: string) => void;
}) {
  return (
    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-3">
      <div>
        <p className="font-semibold text-amber-900">Students needing a new teacher</p>
        <p className="text-xs text-amber-800">
          These assignments were ended after a teacher termination. Match each
          student with another active teacher.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {students.map((child) => (
          <div
            key={child.id}
            className="bg-white rounded-xl border border-amber-100 p-3 flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {child.fullName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {child.intake?.subject ?? 'No subject listed'}
              </p>
            </div>
            <Select onValueChange={(teacherId) => onAssign(child.id, teacherId)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Match teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-gray-50 dark:bg-background rounded-xl p-2">
      <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-900 dark:text-foreground mt-0.5">
        {value}
      </p>
    </div>
  );
}
