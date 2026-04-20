'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Check,
  Mail,
  Phone,
  Plus,
  Search,
  Star,
  UserX,
} from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import { PageShellSkeleton } from '@/components/dashboard/Skeletons';
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
import { useToast } from '@/hooks/use-toast';
import {
  adminKeys,
  assignAdminTeacherToStudent,
  createAdminTeacher,
  listAdminSessions,
  listAdminStudents,
  listAdminTeachers,
  terminateAdminTeacher,
  updateAdminTeacherRate,
} from '@/lib/api/admin';
import { cn } from '@/lib/utils';
import type { Child, Teacher } from '@/lib/types';

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
  hourlyRate: string;
  defaultPassword: string;
};

const emptyTeacherForm: AddTeacherForm = {
  firstName: '',
  lastName: '',
  email: '',
  phoneCountry: '+234',
  phoneNumber: '',
  subjects: [],
  qualifications: '',
  hourlyRate: '0',
  defaultPassword: 'Teacher12345',
};

export default function AdminTeachersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [teacherForm, setTeacherForm] =
    useState<AddTeacherForm>(emptyTeacherForm);
  const [terminateTarget, setTerminateTarget] = useState<Teacher | null>(null);
  const [terminationReason, setTerminationReason] = useState('');
  const [rematchIds, setRematchIds] = useState<string[]>([]);

  const teachersQuery = useQuery({
    queryKey: adminKeys.teachers,
    queryFn: listAdminTeachers,
  });
  const studentsQuery = useQuery({
    queryKey: adminKeys.students,
    queryFn: listAdminStudents,
  });
  const sessionsQuery = useQuery({
    queryKey: adminKeys.sessions,
    queryFn: listAdminSessions,
  });

  const teachers = useMemo(() => teachersQuery.data ?? [], [teachersQuery.data]);
  const children = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data]);
  const sessions = useMemo(() => sessionsQuery.data ?? [], [sessionsQuery.data]);

  const invalidateAdmin = () => {
    queryClient.invalidateQueries({ queryKey: adminKeys.teachers });
    queryClient.invalidateQueries({ queryKey: adminKeys.students });
    queryClient.invalidateQueries({ queryKey: adminKeys.sessions });
  };

  const createMutation = useMutation({
    mutationFn: createAdminTeacher,
    onSuccess: () => {
      invalidateAdmin();
      setTeacherForm(emptyTeacherForm);
      setAddOpen(false);
      toast({ title: 'Teacher added' });
    },
    onError: (error) => {
      toast({
        title: 'Could not add teacher',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const terminateMutation = useMutation({
    mutationFn: ({ teacherId, reason }: { teacherId: string; reason: string }) =>
      terminateAdminTeacher(teacherId, reason),
    onSuccess: (_teacher, variables) => {
      const affectedChildIds = children
        .filter((child) => child.assignedTeacherId === variables.teacherId)
        .map((child) => child.id);
      setRematchIds((previous) =>
        Array.from(new Set([...previous, ...affectedChildIds])),
      );
      invalidateAdmin();
      setTerminateTarget(null);
      setTerminationReason('');
      toast({ title: 'Teacher terminated' });
    },
    onError: (error) => {
      toast({
        title: 'Could not terminate teacher',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const rateMutation = useMutation({
    mutationFn: ({
      teacherId,
      hourlyRate,
    }: {
      teacherId: string;
      hourlyRate: number;
    }) => updateAdminTeacherRate(teacherId, hourlyRate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.teachers });
      toast({ title: 'Rate updated' });
    },
    onError: (error) => {
      toast({
        title: 'Could not update rate',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ childId, teacherId }: { childId: string; teacherId: string }) =>
      assignAdminTeacherToStudent(childId, teacherId),
    onSuccess: (_student, variables) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.students });
      setRematchIds((previous) =>
        previous.filter((id) => id !== variables.childId),
      );
      toast({ title: 'Student rematched' });
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter(
      (teacher) =>
        teacher.name.toLowerCase().includes(q) ||
        teacher.email?.toLowerCase().includes(q) ||
        teacher.subjects.some((subject) => subject.toLowerCase().includes(q)),
    );
  }, [teachers, query]);

  const activeTeachers = useMemo(
    () =>
      teachers.filter((teacher) => (teacher.status ?? 'Active') !== 'Terminated'),
    [teachers],
  );

  const needsRematch = useMemo(
    () =>
      children.filter(
        (child) =>
          rematchIds.includes(child.id) &&
          child.assignedTeacherId === undefined &&
          child.intake,
      ),
    [children, rematchIds],
  );

  const assignedByTeacher = useMemo(() => {
    const map = new Map<string, number>();
    for (const child of children) {
      if (!child.assignedTeacherId) continue;
      map.set(
        child.assignedTeacherId,
        (map.get(child.assignedTeacherId) ?? 0) + 1,
      );
    }
    return map;
  }, [children]);

  const upcomingByTeacher = useMemo(() => {
    const map = new Map<string, number>();
    for (const session of sessions) {
      if (session.status !== 'Upcoming') continue;
      const teacher = teachers.find((item) => item.id === session.teacherId);
      if (teacher?.status === 'Terminated') continue;
      map.set(session.teacherId, (map.get(session.teacherId) ?? 0) + 1);
    }
    return map;
  }, [sessions, teachers]);

  const canAddTeacher =
    teacherForm.firstName.trim() &&
    teacherForm.lastName.trim() &&
    teacherForm.email.trim() &&
    teacherForm.phoneNumber.trim() &&
    teacherForm.subjects.length > 0 &&
    teacherForm.qualifications.trim() &&
    teacherForm.defaultPassword.trim().length >= 8;

  const addTeacher = () => {
    if (!canAddTeacher) return;
    createMutation.mutate({
      firstName: teacherForm.firstName.trim(),
      lastName: teacherForm.lastName.trim(),
      email: teacherForm.email.trim(),
      phoneCountry: teacherForm.phoneCountry,
      phoneNumber: teacherForm.phoneNumber.trim(),
      bio: `${teacherForm.subjects.join(', ')} teacher added by admin.`,
      subjects: teacherForm.subjects,
      qualifications: teacherForm.qualifications
        .split('\n')
        .map((qualification) => qualification.trim())
        .filter(Boolean),
      hourlyRate: Number(teacherForm.hourlyRate) || 0,
      defaultPassword: teacherForm.defaultPassword.trim(),
    });
  };

  const terminateTeacher = () => {
    if (!terminateTarget || !terminationReason.trim()) return;
    terminateMutation.mutate({
      teacherId: terminateTarget.id,
      reason: terminationReason.trim(),
    });
  };

  const isLoading =
    teachersQuery.isLoading || studentsQuery.isLoading || sessionsQuery.isLoading;
  const error = teachersQuery.error ?? studentsQuery.error ?? sessionsQuery.error;

  if (isLoading) {
    return <PageShellSkeleton />;
  }

  if (error) {
    return (
      <p className="text-sm text-red-600">
        {error instanceof Error ? error.message : 'Could not load teachers.'}
      </p>
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
          assigning={assignMutation.isPending}
          onAssign={(childId, teacherId) =>
            assignMutation.mutate({ childId, teacherId })
          }
        />
      )}

      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 text-gray-400 dark:text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
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
          {filtered.map((teacher) => (
            <TeacherCard
              key={teacher.id}
              teacher={teacher}
              studentCount={assignedByTeacher.get(teacher.id) ?? 0}
              upcomingCount={upcomingByTeacher.get(teacher.id) ?? 0}
              savingRate={rateMutation.isPending}
              onTerminate={() => setTerminateTarget(teacher)}
              onRateSave={(rate) =>
                rateMutation.mutate({
                  teacherId: teacher.id,
                  hourlyRate: rate,
                })
              }
            />
          ))}
        </div>
      )}

      <AddTeacherDialog
        open={addOpen}
        form={teacherForm}
        canSubmit={!!canAddTeacher}
        isSubmitting={createMutation.isPending}
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
              onChange={(event) => setTerminationReason(event.target.value)}
              placeholder="Reason for termination, e.g. misconduct report details"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTerminateTarget(null)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              disabled={!terminationReason.trim() || terminateMutation.isPending}
              onClick={terminateTeacher}
            >
              {terminateMutation.isPending ? 'Terminating...' : 'Terminate'}
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
  savingRate,
  onTerminate,
  onRateSave,
}: {
  teacher: Teacher;
  studentCount: number;
  upcomingCount: number;
  savingRate: boolean;
  onTerminate: () => void;
  onRateSave: (hourlyRate: number) => void;
}) {
  const [rate, setRate] = useState(String(teacher.hourlyRate));
  const status = teacher.status ?? 'Active';
  const isTerminated = status === 'Terminated';
  const rateChanged = Number(rate) !== teacher.hourlyRate;

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
            .map((part) => part[0])
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
        {teacher.subjects.map((subject) => (
          <span
            key={subject}
            className="text-[11px] bg-accent2-50 text-accent2-700 px-2 py-0.5 rounded-full"
          >
            {subject}
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
              value={rate}
              onChange={(event) => setRate(event.target.value)}
              className="h-7 w-16 text-center px-1"
            />
            <Button
              size="sm"
              variant={rateChanged ? 'default' : 'outline'}
              className={cn(
                'h-7 w-7 rounded-full p-0',
                rateChanged && 'bg-brand hover:bg-brand-600',
              )}
              disabled={!rateChanged || savingRate || isTerminated}
              onClick={() => onRateSave(Number(rate) || 0)}
            >
              <Check className="w-3.5 h-3.5" />
            </Button>
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
  isSubmitting,
  onOpenChange,
  onChange,
  onSubmit,
}: {
  open: boolean;
  form: AddTeacherForm;
  canSubmit: boolean;
  isSubmitting: boolean;
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
              onChange={(event) => patch({ firstName: event.target.value })}
              placeholder="First name"
            />
            <Input
              value={form.lastName}
              onChange={(event) => patch({ lastName: event.target.value })}
              placeholder="Last name"
            />
          </div>
          <Input
            value={form.email}
            onChange={(event) => patch({ email: event.target.value })}
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
              onChange={(event) => patch({ phoneNumber: event.target.value })}
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
            onChange={(event) => patch({ qualifications: event.target.value })}
            placeholder="Qualifications, one per line"
            rows={4}
          />
          <div className="grid sm:grid-cols-2 gap-3">
            <Input
              value={form.hourlyRate}
              onChange={(event) => patch({ hourlyRate: event.target.value })}
              placeholder="Hourly rate"
              type="number"
              min={0}
            />
            <Input
              value={form.defaultPassword}
              onChange={(event) =>
                patch({ defaultPassword: event.target.value })
              }
              placeholder="Default password"
              type="text"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-brand hover:bg-brand-600"
            disabled={!canSubmit || isSubmitting}
            onClick={onSubmit}
          >
            {isSubmitting ? 'Adding...' : 'Add teacher'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RematchPanel({
  students,
  teachers,
  assigning,
  onAssign,
}: {
  students: Child[];
  teachers: Teacher[];
  assigning: boolean;
  onAssign: (childId: string, teacherId: string) => void;
}) {
  return (
    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-3">
      <div>
        <p className="font-semibold text-amber-900">
          Students needing a new teacher
        </p>
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
            <Select
              disabled={assigning}
              onValueChange={(teacherId) => onAssign(child.id, teacherId)}
            >
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
