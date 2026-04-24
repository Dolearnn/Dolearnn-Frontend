'use client';

import { useMemo, useState } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  AlertTriangle,
  Check,
  Mail,
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
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
  listAdminStudents,
  listAdminTeachersPage,
  terminateAdminTeacher,
  updateAdminTeacherRate,
} from '@/lib/api/admin';
import { cn } from '@/lib/utils';
import type { Child, Teacher } from '@/lib/types';

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
  gender: 'Male' | 'Female' | '';
  subjects: string[];
  qualifications: string;
  hourlyRate: string;
  defaultPassword: string;
};

const emptyTeacherForm: AddTeacherForm = {
  firstName: '',
  lastName: '',
  email: '',
  gender: '',
  subjects: [],
  qualifications: '',
  hourlyRate: '0',
  defaultPassword: 'Teacher12345',
};

export default function AdminTeachersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'All' | 'Active' | 'Terminated'>('All');
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [teacherForm, setTeacherForm] = useState<AddTeacherForm>(emptyTeacherForm);
  const [terminateTarget, setTerminateTarget] = useState<Teacher | null>(null);
  const [terminationReason, setTerminationReason] = useState('');
  const [rematchIds, setRematchIds] = useState<string[]>([]);

  const teachersQuery = useQuery({
    queryKey: adminKeys.teachersPage({
      page,
      pageSize: 12,
      search: query,
      status,
    }),
    queryFn: () =>
      listAdminTeachersPage({
        page,
        pageSize: 12,
        search: query,
        status,
      }),
    placeholderData: keepPreviousData,
  });
  const studentsQuery = useQuery({
    queryKey: adminKeys.students,
    queryFn: listAdminStudents,
  });

  const teachers = useMemo(
    () => teachersQuery.data?.teachers ?? [],
    [teachersQuery.data],
  );
  const summary = teachersQuery.data?.summary;
  const pagination = teachersQuery.data?.pagination;
  const children = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data]);

  const invalidateAdmin = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin', 'teachers'] });
    await queryClient.invalidateQueries({ queryKey: adminKeys.students });
  };

  const createMutation = useMutation({
    mutationFn: createAdminTeacher,
    onSuccess: async () => {
      await invalidateAdmin();
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
    onSuccess: async (_teacher, variables) => {
      const affectedChildIds = children
        .filter((child) => child.assignedTeacherId === variables.teacherId)
        .map((child) => child.id);
      setRematchIds((previous) =>
        Array.from(new Set([...previous, ...affectedChildIds])),
      );
      await invalidateAdmin();
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'teachers'] });
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
    onSuccess: async (_student, variables) => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.students });
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

  const canAddTeacher =
    teacherForm.firstName.trim() &&
    teacherForm.lastName.trim() &&
    teacherForm.email.trim() &&
    teacherForm.gender &&
    teacherForm.subjects.length > 0 &&
    teacherForm.qualifications.trim() &&
    teacherForm.defaultPassword.trim().length >= 8;

  const addTeacher = () => {
    if (!canAddTeacher) return;
    createMutation.mutate({
      firstName: teacherForm.firstName.trim(),
      lastName: teacherForm.lastName.trim(),
      email: teacherForm.email.trim(),
      gender: teacherForm.gender || 'Female',
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

  const isLoading = teachersQuery.isLoading || studentsQuery.isLoading;
  const error = teachersQuery.error ?? studentsQuery.error;

  if (isLoading && !teachersQuery.data) {
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
        description={`Managing ${summary?.total ?? 0} teachers across the DoLearn roster.`}
        action={
          <Button
            className="rounded-full bg-brand hover:bg-brand-600"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
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

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-4 md:grid-cols-3 lg:w-[520px]">
          <MiniMetric label="Total" value={String(summary?.total ?? 0)} />
          <MiniMetric label="Active" value={String(summary?.active ?? 0)} />
          <MiniMetric
            label="Terminated"
            value={String(summary?.terminated ?? 0)}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px] lg:w-[520px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search by name, email, or subject"
              className="rounded-full pl-9"
            />
          </div>

          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as typeof status);
              setPage(1);
            }}
          >
            <SelectTrigger className="rounded-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {teachers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-border dark:bg-card">
          <p className="text-sm text-gray-500 dark:text-muted-foreground">
            No teachers match that search.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {teachers.map((teacher) => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
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
          {pagination && pagination.totalPages > 1 ? (
            <div className="flex justify-end">
              <Pagination className="mx-0 w-auto justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        if (pagination.page > 1) setPage((current) => current - 1);
                      }}
                      className={cn(
                        pagination.page <= 1 && 'pointer-events-none opacity-50',
                      )}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <Button variant="ghost" size="sm" className="rounded-full px-4">
                      Page {pagination.page} of {pagination.totalPages}
                    </Button>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        if (pagination.page < pagination.totalPages) {
                          setPage((current) => current + 1);
                        }
                      }}
                      className={cn(
                        pagination.page >= pagination.totalPages &&
                          'pointer-events-none opacity-50',
                      )}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          ) : null}
        </>
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
            <div className="flex gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {terminateTarget?.name} currently has{' '}
              {terminateTarget?.studentCount ?? 0} assigned student(s).
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
  savingRate,
  onTerminate,
  onRateSave,
}: {
  teacher: Teacher;
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
        'space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-border dark:bg-card',
        isTerminated && 'opacity-75',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand font-semibold text-white">
          {teacher.name
            .split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-gray-900 dark:text-foreground">
              {teacher.name}
            </p>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-medium',
                status === 'Active' && 'bg-accent2-50 text-accent2-700',
                status === 'Terminated' && 'bg-red-50 text-red-700',
              )}
            >
              {status}
            </span>
          </div>
          <p className="text-xs leading-snug text-gray-500 dark:text-muted-foreground">
            {teacher.bio}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p
            className={cn(
              'flex items-center gap-1 text-sm font-semibold',
              teacher.rating >= 4.8 ? 'text-accent2-600' : 'text-gray-700',
            )}
          >
            <Star className="h-3 w-3 fill-current" />
            {teacher.rating ? teacher.rating.toFixed(1) : 'New'}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-muted-foreground">
            {teacher.totalSessions} total
          </p>
        </div>
      </div>

      <div className="grid gap-2 text-xs text-gray-600 dark:text-muted-foreground sm:grid-cols-2">
        {teacher.email && (
          <p className="flex min-w-0 items-center gap-2">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{teacher.email}</span>
          </p>
        )}
        {teacher.gender && <p>Gender: {teacher.gender}</p>}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {teacher.subjects.map((subject) => (
          <span
            key={subject}
            className="rounded-full bg-accent2-50 px-2 py-0.5 text-[11px] text-accent2-700"
          >
            {subject}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Students" value={teacher.studentCount ?? 0} />
        <Stat label="Upcoming" value={teacher.upcomingCount ?? 0} />
        <div className="rounded-xl bg-gray-50 p-2 dark:bg-background">
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
              className="h-7 w-16 px-1 text-center"
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
              <Check className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-1 border-t border-gray-100 pt-3 dark:border-border">
        <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-muted-foreground">
          Qualifications
        </p>
        <p className="text-xs text-gray-700 dark:text-foreground/90">
          {teacher.qualifications.join(' / ')}
        </p>
        {teacher.terminationReason && (
          <p className="pt-1 text-xs text-red-600">
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
            <UserX className="mr-1 h-3.5 w-3.5" />
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
          <div className="grid gap-3 sm:grid-cols-2">
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
          <Select
            value={form.gender}
            onValueChange={(value) =>
              patch({ gender: value as AddTeacherForm['gender'] })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Teacher gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Male">Male</SelectItem>
            </SelectContent>
          </Select>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-foreground">
              Subjects
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SUBJECTS.map((subject) => {
                const checked = form.subjects.includes(subject);
                return (
                  <label
                    key={subject}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm',
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
          <div className="grid gap-3 sm:grid-cols-2">
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
    <div className="space-y-3 rounded-2xl border border-amber-100 bg-amber-50 p-4">
      <div>
        <p className="font-semibold text-amber-900">
          Students needing a new teacher
        </p>
        <p className="text-xs text-amber-800">
          These assignments were ended after a teacher termination. Match each
          student with another active teacher.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {students.map((child) => (
          <div
            key={child.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-white p-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">
                {child.fullName}
              </p>
              <p className="truncate text-xs text-gray-500">
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
    <div className="rounded-xl bg-gray-50 p-2 dark:bg-background">
      <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-foreground">
        {value}
      </p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-border dark:bg-card">
      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-foreground">
        {value}
      </div>
    </div>
  );
}
