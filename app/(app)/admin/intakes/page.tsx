'use client';

import { useMemo, useState } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { ClipboardCheck, Search, Sparkles } from 'lucide-react';
import RecordPaymentDialog from '@/components/admin/RecordPaymentDialog';
import PageHeader from '@/components/dashboard/PageHeader';
import { PageShellSkeleton } from '@/components/dashboard/Skeletons';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  adminKeys,
  assignAdminTeacherToStudent,
  createAdminStudent,
  listAdminStudentsPage,
  listAdminTeachers,
  unassignAdminTeacherFromStudent,
} from '@/lib/api/admin';
import {
  listAdminLessonPackages,
  listAdminPaymentParents,
  paymentKeys,
} from '@/lib/api/payments';
import {
  displayGrade,
  displaySchedule,
  displaySubject,
  type BudgetTier,
  type Child,
  type CurrentLevel,
  type DayOfWeek,
  type GenderPreference,
  type GradeLevel,
  type IntakeForm,
  type LearningGoal,
  type StudentLessonPackage,
  type Teacher,
  type TimeBlock,
} from '@/lib/types';

type Filter = 'All' | 'Pending' | 'Matched';
const GRADES: GradeLevel[] = ['Primary', 'JSS', 'SSS', 'College Year 1', 'College Year 2', 'College Year 3', 'College Year 4', 'Other'];
const SUBJECTS = ['Maths', 'English', 'Science', 'Coding', 'Music', 'French', 'SAT', 'Other'];
const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_BLOCKS: TimeBlock[] = ['Morning', 'Afternoon', 'Evening'];
const LEARNING_GOALS: LearningGoal[] = [
  'Exam prep',
  'Catch up with school',
  'Learn a new skill',
  'General improvement',
];
const CURRENT_LEVELS: CurrentLevel[] = ['Struggling', 'Average', 'Above average'];
const GENDER_PREFS: GenderPreference[] = ['No preference', 'Female', 'Male'];
const BUDGETS: BudgetTier[] = ['Under $20', '$20–$35', '$35–$50', '$50+'];
const TIMEZONES = [
  'UTC',
  'Africa/Lagos',
  'Africa/Accra',
  'Europe/London',
  'America/New_York',
  'Asia/Dubai',
];

type StudentForm = {
  parentId: string;
  fullName: string;
  age: string;
  grade: GradeLevel;
  gradeOther: string;
  school: string;
  subjects: string[];
  subjectOther: string;
  learningGoal: LearningGoal;
  currentLevel: CurrentLevel;
  specificTopics: string;
  teacherGenderPref: GenderPreference;
  specialNotes: string;
  preferredSchedule: Partial<Record<DayOfWeek, TimeBlock>>;
  timezone: string;
  sessionsPerWeek: '1' | '2' | '3' | 'Flexible';
  budget: BudgetTier;
};

const emptyStudentForm: StudentForm = {
  parentId: '',
  fullName: '',
  age: '10',
  grade: 'Primary',
  gradeOther: '',
  school: '',
  subjects: [],
  subjectOther: '',
  learningGoal: 'Exam prep',
  currentLevel: 'Average',
  specificTopics: '',
  teacherGenderPref: 'No preference',
  specialNotes: '',
  preferredSchedule: {},
  timezone: 'Africa/Lagos',
  sessionsPerWeek: '1',
  budget: '$20–$35',
};

export default function AdminIntakesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = useState<Filter>('Pending');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<'10' | '20' | '50'>('20');
  const [addOpen, setAddOpen] = useState(false);
  const [studentForm, setStudentForm] =
    useState<StudentForm>(emptyStudentForm);
  const [paymentStudent, setPaymentStudent] = useState<Child | null>(null);

  const studentParams = useMemo(
    () => ({
      page,
      pageSize: Number(pageSize),
      search: query,
      hasIntake: true,
      assignmentStatus: filter,
    }),
    [filter, page, pageSize, query],
  );

  const studentsQuery = useQuery({
    queryKey: adminKeys.studentsPage(studentParams),
    queryFn: () => listAdminStudentsPage(studentParams),
    placeholderData: keepPreviousData,
  });
  const teachersQuery = useQuery({
    queryKey: adminKeys.teachers,
    queryFn: listAdminTeachers,
  });
  const parentsQuery = useQuery({
    queryKey: paymentKeys.adminParents,
    queryFn: listAdminPaymentParents,
  });
  const lessonPackagesQuery = useQuery({
    queryKey: paymentKeys.adminLessonPackages,
    queryFn: listAdminLessonPackages,
  });

  const children = studentsQuery.data?.students ?? [];
  const allTeachers = teachersQuery.data ?? [];
  const lessonPackages = lessonPackagesQuery.data ?? [];
  const paymentStudents = useMemo(() => {
    const students = studentsQuery.data?.students ?? [];
    if (!paymentStudent || students.some((child) => child.id === paymentStudent.id)) {
      return students;
    }
    return [paymentStudent, ...students];
  }, [paymentStudent, studentsQuery.data?.students]);

  const invalidateStudents = () => {
    queryClient.invalidateQueries({ queryKey: adminKeys.students });
  };

  const createStudentMutation = useMutation({
    mutationFn: createAdminStudent,
    onSuccess: async (student) => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.students });
      setAddOpen(false);
      setStudentForm(emptyStudentForm);
      setPaymentStudent(student);
      toast({
        title: 'Student created',
        description: 'Record parent payment is ready with this parent and student.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Could not create student',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

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

  const pendingCount = studentsQuery.data?.summary.pending ?? 0;
  const matchedCount = studentsQuery.data?.summary.matched ?? 0;
  const totalCount = studentsQuery.data?.summary.total ?? 0;
  const pagination = studentsQuery.data?.pagination;
  const isLoading =
    studentsQuery.isLoading ||
    teachersQuery.isLoading ||
    lessonPackagesQuery.isLoading;
  const error =
    studentsQuery.error ?? teachersQuery.error ?? lessonPackagesQuery.error;

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
        action={
          <Button
            className="rounded-full bg-brand hover:bg-brand-600"
            onClick={() => setAddOpen(true)}
          >
            Create student
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-2 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-full p-1 w-fit">
          {(['Pending', 'Matched', 'All'] as Filter[]).map((item) => (
            <button
              key={item}
              onClick={() => {
                setFilter(item);
                setPage(1);
              }}
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
                    : totalCount}
              </span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 dark:text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search name or subject"
            className="pl-9 rounded-full"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500 dark:text-muted-foreground">
          {pagination
            ? `Showing ${(pagination.page - 1) * pagination.pageSize + 1}-${Math.min(
                pagination.page * pagination.pageSize,
                pagination.total,
              )} of ${pagination.total}`
            : 'Loading students...'}
        </p>
        <Select
          value={pageSize}
          onValueChange={(value) => {
            setPageSize(value as '10' | '20' | '50');
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full rounded-full sm:w-40">
            <SelectValue placeholder="Rows" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 per page</SelectItem>
            <SelectItem value="20">20 per page</SelectItem>
            <SelectItem value="50">50 per page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {children.length === 0 ? (
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
          {children.map((child) => (
            <IntakeCard
              key={child.id}
              child={child}
              allTeachers={allTeachers}
              lessonPackages={lessonPackages}
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
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create student for parent</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <Select
              value={studentForm.parentId}
              onValueChange={(value) =>
                setStudentForm((form) => ({ ...form, parentId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent" />
              </SelectTrigger>
              <SelectContent>
                {(parentsQuery.data ?? []).map((parent) => (
                  <SelectItem key={parent.id} value={parent.id}>
                    {parent.name} - {parent.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={studentForm.fullName}
              onChange={(event) =>
                setStudentForm((form) => ({ ...form, fullName: event.target.value }))
              }
              placeholder="Student full name"
            />
            <div className="grid sm:grid-cols-2 gap-3">
              <Input
                value={studentForm.age}
                onChange={(event) =>
                  setStudentForm((form) => ({ ...form, age: event.target.value }))
                }
                type="number"
                min={3}
                placeholder="Age"
              />
              <Select
                value={studentForm.grade}
                onValueChange={(value) =>
                  setStudentForm((form) => ({
                    ...form,
                    grade: value as GradeLevel,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {studentForm.grade === 'Other' && (
              <Input
                value={studentForm.gradeOther}
                onChange={(event) =>
                  setStudentForm((form) => ({
                    ...form,
                    gradeOther: event.target.value,
                  }))
                }
                placeholder="Enter grade"
              />
            )}
            <Input
              value={studentForm.school}
              onChange={(event) =>
                setStudentForm((form) => ({ ...form, school: event.target.value }))
              }
              placeholder="School"
            />
            <div className="rounded-2xl border border-gray-200 dark:border-border p-4 space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-foreground">
                  Learning needs
                </p>
                <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                  Complete the intake now so the student is ready for matching.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Subjects</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SUBJECTS.map((subject) => {
                    const checked = studentForm.subjects.includes(subject);
                    return (
                      <label
                        key={subject}
                        className={cn(
                          'flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer text-sm',
                          checked
                            ? 'border-brand bg-accent2-50 text-brand'
                            : 'border-gray-200 dark:border-border',
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => {
                            setStudentForm((form) => {
                              const set = new Set(form.subjects);
                              if (value) set.add(subject);
                              else set.delete(subject);
                              return { ...form, subjects: Array.from(set) };
                            });
                          }}
                        />
                        {subject}
                      </label>
                    );
                  })}
                </div>
              </div>
              {studentForm.subjects.includes('Other') && (
                <Input
                  value={studentForm.subjectOther}
                  onChange={(event) =>
                    setStudentForm((form) => ({
                      ...form,
                      subjectOther: event.target.value,
                    }))
                  }
                  placeholder="Enter subject"
                />
              )}
              <div className="grid sm:grid-cols-3 gap-3">
                <Select
                  value={studentForm.learningGoal}
                  onValueChange={(value) =>
                    setStudentForm((form) => ({
                      ...form,
                      learningGoal: value as LearningGoal,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Learning goal" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEARNING_GOALS.map((goal) => (
                      <SelectItem key={goal} value={goal}>
                        {goal}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={studentForm.currentLevel}
                  onValueChange={(value) =>
                    setStudentForm((form) => ({
                      ...form,
                      currentLevel: value as CurrentLevel,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Current level" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENT_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={studentForm.teacherGenderPref}
                  onValueChange={(value) =>
                    setStudentForm((form) => ({
                      ...form,
                      teacherGenderPref: value as GenderPreference,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Teacher preference" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_PREFS.map((pref) => (
                      <SelectItem key={pref} value={pref}>
                        {pref}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                value={studentForm.specificTopics}
                onChange={(event) =>
                  setStudentForm((form) => ({
                    ...form,
                    specificTopics: event.target.value,
                  }))
                }
                placeholder="Specific topics or learning gaps"
                rows={3}
              />
              <Textarea
                value={studentForm.specialNotes}
                onChange={(event) =>
                  setStudentForm((form) => ({
                    ...form,
                    specialNotes: event.target.value,
                  }))
                }
                placeholder="Preferences or notes for matching"
                rows={3}
              />
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-border p-4 space-y-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-foreground">
                Availability and budget
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {DAYS.map((day) => {
                  const selected = studentForm.preferredSchedule[day];
                  return (
                    <div
                      key={day}
                      className="rounded-xl border border-gray-200 dark:border-border p-3 space-y-2"
                    >
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={!!selected}
                          onCheckedChange={(value) =>
                            setStudentForm((form) => {
                              const next = { ...form.preferredSchedule };
                              if (value) next[day] = next[day] ?? 'Evening';
                              else delete next[day];
                              return { ...form, preferredSchedule: next };
                            })
                          }
                        />
                        {day}
                      </label>
                      <Select
                        value={selected ?? ''}
                        disabled={!selected}
                        onValueChange={(value) =>
                          setStudentForm((form) => ({
                            ...form,
                            preferredSchedule: {
                              ...form.preferredSchedule,
                              [day]: value as TimeBlock,
                            },
                          }))
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Time block" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_BLOCKS.map((block) => (
                            <SelectItem key={block} value={block}>
                              {block}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <Select
                  value={studentForm.timezone}
                  onValueChange={(value) =>
                    setStudentForm((form) => ({ ...form, timezone: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((timezone) => (
                      <SelectItem key={timezone} value={timezone}>
                        {timezone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={studentForm.sessionsPerWeek}
                  onValueChange={(value) =>
                    setStudentForm((form) => ({
                      ...form,
                      sessionsPerWeek: value as StudentForm['sessionsPerWeek'],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sessions per week" />
                  </SelectTrigger>
                  <SelectContent>
                    {(['1', '2', '3', 'Flexible'] as const).map((count) => (
                      <SelectItem key={count} value={count}>
                        {count}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={studentForm.budget}
                  onValueChange={(value) =>
                    setStudentForm((form) => ({
                      ...form,
                      budget: value as BudgetTier,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Budget" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUDGETS.map((budget) => (
                      <SelectItem key={budget} value={budget}>
                        {budget}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-brand hover:bg-brand-600"
              disabled={
                !studentForm.parentId ||
                !studentForm.fullName.trim() ||
                studentForm.subjects.length === 0 ||
                (studentForm.subjects.includes('Other') &&
                  !studentForm.subjectOther.trim()) ||
                Object.keys(studentForm.preferredSchedule).length === 0 ||
                createStudentMutation.isPending
              }
              onClick={() =>
                createStudentMutation.mutate({
                  parentId: studentForm.parentId,
                  fullName: studentForm.fullName.trim(),
                  age: Number(studentForm.age) || 10,
                  grade: studentForm.grade,
                  gradeOther: studentForm.gradeOther.trim(),
                  school: studentForm.school.trim(),
                  intake: buildIntake(studentForm),
                })
              }
            >
              {createStudentMutation.isPending ? 'Creating...' : 'Create student'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <RecordPaymentDialog
        parents={parentsQuery.data ?? []}
        students={paymentStudents}
        initialParentId={paymentStudent?.parentId}
        initialStudentId={paymentStudent?.id}
        open={!!paymentStudent}
        onOpenChange={(open) => {
          if (!open) setPaymentStudent(null);
        }}
        showTrigger={false}
      />
    </div>
  );
}

function buildIntake(form: StudentForm): IntakeForm {
  const firstSubject =
    form.subjects[0] === 'Other' && form.subjectOther.trim()
      ? form.subjectOther.trim()
      : form.subjects[0];

  return {
    subject: firstSubject,
    subjects: form.subjects,
    subjectOther: form.subjectOther.trim(),
    learningGoal: form.learningGoal,
    currentLevel: form.currentLevel,
    specificTopics: form.specificTopics.trim(),
    teacherGenderPref: form.teacherGenderPref,
    specialNotes: form.specialNotes.trim(),
    preferredSchedule: form.preferredSchedule,
    preferredDays: Object.keys(form.preferredSchedule) as DayOfWeek[],
    preferredTime:
      Object.values(form.preferredSchedule)[0] ?? 'Evening',
    timezone: form.timezone,
    sessionsPerWeek:
      form.sessionsPerWeek === 'Flexible'
        ? 'Flexible'
        : (Number(form.sessionsPerWeek) as 1 | 2 | 3),
    budget: form.budget,
  };
}

function IntakeCard({
  child,
  allTeachers,
  lessonPackages,
  assigning,
  unassigning,
  onAssign,
  onUnassign,
}: {
  child: Child;
  allTeachers: Teacher[];
  lessonPackages: StudentLessonPackage[];
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
          const paymentSummary = paymentSummaryForSubject(
            lessonPackages,
            child.id,
            subject,
          );
          const assignedTeacher = assignment
            ? allTeachers.find((teacher) => teacher.id === assignment.teacherId)
            : null;
          const suggestions = teachersForSubject(allTeachers, subject);
          const preferredSuggestions = teachersForSubject(
            allTeachers,
            subject,
            intake.teacherGenderPref,
          );
          const visibleSuggestions =
            preferredSuggestions.length > 0 ? preferredSuggestions : suggestions;

          return (
            <div
              key={subject}
              className="rounded-xl border border-gray-200 dark:border-border p-3 space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-foreground">
                    {subject}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
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
                    <span
                      className={cn(
                        'text-[11px] font-medium px-2 py-0.5 rounded-full',
                        paymentSummary.isPaid
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700',
                      )}
                    >
                      {paymentSummary.label}
                    </span>
                  </div>
                </div>
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
              ) : visibleSuggestions.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-muted-foreground">
                  No active teacher currently covers {subject}.
                </p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2">
                  {visibleSuggestions.map((teacher) => (
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

function paymentSummaryForSubject(
  lessonPackages: StudentLessonPackage[],
  childId: string,
  subject: string,
) {
  const matchingPackages = lessonPackages.filter(
    (lessonPackage) =>
      lessonPackage.childId === childId &&
      lessonPackage.subject.toLowerCase() === subject.toLowerCase() &&
      lessonPackage.status !== 'Cancelled',
  );

  if (matchingPackages.length === 0) {
    return {
      isPaid: false,
      label: 'Payment pending',
    };
  }

  const paidSessions = matchingPackages.reduce(
    (sum, lessonPackage) => sum + lessonPackage.paidSessions,
    0,
  );
  const availableSessions = matchingPackages.reduce(
    (sum, lessonPackage) => sum + lessonPackage.availableSessions,
    0,
  );

  return {
    isPaid: true,
    label: `Paid: ${availableSessions}/${paidSessions} left`,
  };
}

function teachersForSubject(
  teachers: Teacher[],
  subject: string,
  genderPreference?: string,
) {
  return teachers.filter(
    (teacher) =>
      (teacher.status ?? 'Active') !== 'Terminated' &&
      (genderPreference === 'Female'
        ? teacher.gender === 'Female'
        : genderPreference === 'Male'
          ? teacher.gender === 'Male'
          : true) &&
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
