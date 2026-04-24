import { apiFetch } from '@/lib/api/client';
import { mapSession, mapStudent } from '@/lib/api/family';
import type {
  Child,
  DayOfWeek,
  CurrentLevel,
  GenderPreference,
  GradeLevel,
  IntakeForm,
  LearningGoal,
  Session,
  SessionBookingRequest,
  Teacher,
  TimeBlock,
} from '@/lib/types';

interface ApiUser {
  name: string;
  email: string;
}

interface ApiTeacher {
  id: string;
  userId: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneCountry?: string | null;
  phoneNumber?: string | null;
  gender?: string | null;
  bio?: string | null;
  subjects: string[];
  qualifications: string[];
  hourlyRate: string | number;
  rating: string | number;
  totalSessions: number;
  studentCount?: number;
  upcomingCount?: number;
  status: string;
  terminationReason?: string | null;
  terminatedAt?: string | null;
  joinedAt: string;
}

interface ApiStudent {
  id: string;
  parentId: string;
  assignedTeacherId?: string | null;
  fullName: string;
  age: number;
  grade: string;
  gradeOther?: string | null;
  school?: string | null;
  status: string;
  deactivationReason?: string | null;
  deactivatedAt?: string | null;
  intake?: unknown;
  subjectAssignments?: unknown[];
}

interface ApiSession {
  id: string;
  studentId: string;
  teacherId: string;
  subject: string;
  startsAt: string;
  durationMins: number;
  meetLink?: string | null;
  status: string;
  amount?: string | number | null;
  student?: ApiStudent | null;
  teacher?: { id: string; user?: ApiUser } | null;
  attendance?: {
    teacherConfirmedAt?: string | null;
    familyConfirmedAt?: string | null;
  } | null;
  note?: { id: string } | null;
  cancellations?: Array<{
    id: string;
    requestedBy: string;
    requestedAt: string;
    reason: string;
    status: string;
    resolvedAt?: string | null;
  }>;
}

interface ApiCancellation {
  id: string;
  sessionId: string;
  status: string;
}

interface ApiBookingRequest {
  id: string;
  studentId: string;
  subject: string;
  day: string;
  timeBlock: string;
  startTime: string;
  startDate: string;
  sessionsRequested: number;
  status: string;
  createdAt: string;
  student?: {
    fullName?: string;
  } | null;
}

export const adminKeys = {
  teachers: ['admin', 'teachers'] as const,
  teachersPage: (params: ListAdminTeachersParams = {}) =>
    ['admin', 'teachers', params] as const,
  students: ['admin', 'students'] as const,
  studentsPage: (params: ListAdminStudentsParams = {}) =>
    ['admin', 'students', params] as const,
  sessions: ['admin', 'sessions'] as const,
  sessionsPage: (params: ListAdminSessionsParams = {}) =>
    ['admin', 'sessions', params] as const,
  bookingRequests: ['admin', 'sessions', 'booking-requests'] as const,
  cancellations: ['admin', 'sessions', 'cancellations'] as const,
};

const dayFromApi: Record<string, DayOfWeek> = {
  MON: 'Mon',
  TUE: 'Tue',
  WED: 'Wed',
  THU: 'Thu',
  FRI: 'Fri',
  SAT: 'Sat',
  SUN: 'Sun',
};

const timeFromApi: Record<string, TimeBlock> = {
  MORNING: 'Morning',
  AFTERNOON: 'Afternoon',
  EVENING: 'Evening',
};

const dayToApi: Record<DayOfWeek, string> = {
  Mon: 'MON',
  Tue: 'TUE',
  Wed: 'WED',
  Thu: 'THU',
  Fri: 'FRI',
  Sat: 'SAT',
  Sun: 'SUN',
};

const timeToApi: Record<TimeBlock, string> = {
  Morning: 'MORNING',
  Afternoon: 'AFTERNOON',
  Evening: 'EVENING',
};

const learningGoalToApi: Record<LearningGoal, string> = {
  'Exam prep': 'EXAM_PREP',
  'Catch up with school': 'CATCH_UP_WITH_SCHOOL',
  'Learn a new skill': 'LEARN_A_NEW_SKILL',
  'General improvement': 'GENERAL_IMPROVEMENT',
};

const currentLevelToApi: Record<CurrentLevel, string> = {
  Struggling: 'STRUGGLING',
  Average: 'AVERAGE',
  'Above average': 'ABOVE_AVERAGE',
};

const genderToApi: Record<GenderPreference, string> = {
  'No preference': 'NO_PREFERENCE',
  Male: 'MALE',
  Female: 'FEMALE',
};

const gradeToApi: Record<GradeLevel, string> = {
  Primary: 'PRIMARY',
  JSS: 'JSS',
  SSS: 'SSS',
  'College Year 1': 'COLLEGE_YEAR_1',
  'College Year 2': 'COLLEGE_YEAR_2',
  'College Year 3': 'COLLEGE_YEAR_3',
  'College Year 4': 'COLLEGE_YEAR_4',
  Other: 'OTHER',
};

function asNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) return 0;
  return typeof value === 'number' ? value : Number(value);
}

function mapTeacher(teacher: ApiTeacher): Teacher {
  return {
    id: teacher.id,
    name: teacher.name,
    firstName: teacher.firstName,
    lastName: teacher.lastName,
    email: teacher.email,
    phoneCountry: teacher.phoneCountry ?? undefined,
    phoneNumber: teacher.phoneNumber ?? undefined,
    gender:
      teacher.gender === 'MALE'
        ? 'Male'
        : teacher.gender === 'FEMALE'
          ? 'Female'
          : undefined,
    bio: teacher.bio ?? `${teacher.subjects.join(', ')} teacher.`,
    subjects: teacher.subjects,
    qualifications: teacher.qualifications,
    hourlyRate: asNumber(teacher.hourlyRate),
    rating: asNumber(teacher.rating),
    totalSessions: teacher.totalSessions,
    studentCount: teacher.studentCount ?? 0,
    upcomingCount: teacher.upcomingCount ?? 0,
    joinedAt: teacher.joinedAt,
    status: teacher.status === 'TERMINATED' ? 'Terminated' : 'Active',
    terminationReason: teacher.terminationReason ?? undefined,
    terminatedAt: teacher.terminatedAt ?? undefined,
  };
}

export interface CreateTeacherInput {
  firstName: string;
  lastName: string;
  email: string;
  phoneCountry?: string;
  phoneNumber?: string;
  gender: 'Male' | 'Female';
  bio?: string;
  subjects: string[];
  qualifications: string[];
  hourlyRate: number;
  defaultPassword: string;
}

export async function listAdminTeachers() {
  const response = await apiFetch<{
    teachers: ApiTeacher[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
    summary: {
      total: number;
      active: number;
      terminated: number;
    };
  }>('/admin/teachers?page=1&pageSize=100');
  return response.teachers.map(mapTeacher);
}

export interface ListAdminTeachersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: 'All' | Teacher['status'];
}

function teacherStatusToApi(status?: ListAdminTeachersParams['status']) {
  if (!status || status === 'All') return undefined;
  return status === 'Terminated' ? 'TERMINATED' : 'ACTIVE';
}

function buildTeachersQuery(params: ListAdminTeachersParams) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params.search?.trim()) searchParams.set('search', params.search.trim());
  const status = teacherStatusToApi(params.status);
  if (status) searchParams.set('status', status);
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function listAdminTeachersPage(
  params: ListAdminTeachersParams = {},
) {
  const response = await apiFetch<{
    teachers: ApiTeacher[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
    summary: {
      total: number;
      active: number;
      terminated: number;
    };
  }>(`/admin/teachers${buildTeachersQuery(params)}`);

  return {
    teachers: response.teachers.map(mapTeacher),
    pagination: response.pagination,
    summary: response.summary,
  };
}

export async function createAdminTeacher(input: CreateTeacherInput) {
  const response = await apiFetch<{ teacher: ApiTeacher }>('/admin/teachers', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      gender: input.gender === 'Male' ? 'MALE' : 'FEMALE',
    }),
  });
  return mapTeacher(response.teacher);
}

export async function updateAdminTeacherRate(
  teacherId: string,
  hourlyRate: number,
) {
  const response = await apiFetch<{ teacher: ApiTeacher }>(
    `/admin/teachers/${teacherId}/rate`,
    {
      method: 'PATCH',
      body: JSON.stringify({ hourlyRate }),
    },
  );
  return mapTeacher(response.teacher);
}

export async function terminateAdminTeacher(
  teacherId: string,
  reason: string,
) {
  const response = await apiFetch<{ teacher: ApiTeacher }>(
    `/admin/teachers/${teacherId}/terminate`,
    {
      method: 'POST',
      body: JSON.stringify({ reason }),
    },
  );
  return mapTeacher(response.teacher);
}

export async function listAdminStudents() {
  const response = await apiFetch<{
    students: ApiStudent[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
    summary: {
      total: number;
      pending: number;
      matched: number;
    };
  }>('/admin/students?page=1&pageSize=100&assignmentStatus=ALL');
  return response.students.map((student) => mapStudent(student as never));
}

export interface ListAdminStudentsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  hasIntake?: boolean;
  assignmentStatus?: 'All' | 'Pending' | 'Matched';
}

function buildStudentsQuery(params: ListAdminStudentsParams) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params.search?.trim()) searchParams.set('search', params.search.trim());
  if (params.hasIntake !== undefined) {
    searchParams.set('hasIntake', String(params.hasIntake));
  }
  if (params.assignmentStatus && params.assignmentStatus !== 'All') {
    searchParams.set('assignmentStatus', params.assignmentStatus.toUpperCase());
  }
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function listAdminStudentsPage(
  params: ListAdminStudentsParams = {},
) {
  const response = await apiFetch<{
    students: ApiStudent[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
    summary: {
      total: number;
      pending: number;
      matched: number;
    };
  }>(`/admin/students${buildStudentsQuery(params)}`);

  return {
    students: response.students.map((student) => mapStudent(student as never)),
    pagination: response.pagination,
    summary: response.summary,
  };
}

export async function createAdminStudent(input: {
  parentId: string;
  fullName: string;
  age: number;
  grade: GradeLevel;
  gradeOther?: string;
  school?: string;
  intake?: IntakeForm;
}) {
  const schedule = Object.entries(input.intake?.preferredSchedule ?? {}).map(
    ([day, time]) => ({
      day: dayToApi[day as DayOfWeek],
      time: timeToApi[time],
    }),
  );
  const response = await apiFetch<{ student: ApiStudent }>('/admin/students', {
    method: 'POST',
    body: JSON.stringify({
      parentId: input.parentId,
      fullName: input.fullName,
      age: input.age,
      grade: gradeToApi[input.grade],
      gradeOther: input.grade === 'Other' ? input.gradeOther : undefined,
      school: input.school,
      intake: input.intake
        ? {
            subject: input.intake.subject,
            subjects: input.intake.subjects?.length
              ? input.intake.subjects
              : [input.intake.subject],
            subjectOther: input.intake.subjectOther,
            learningGoal: learningGoalToApi[input.intake.learningGoal],
            currentLevel: currentLevelToApi[input.intake.currentLevel],
            specificTopics: input.intake.specificTopics,
            teacherGenderPref: genderToApi[input.intake.teacherGenderPref],
            specialNotes: input.intake.specialNotes,
            timezone: input.intake.timezone ?? 'UTC',
            sessionsPerWeek: String(input.intake.sessionsPerWeek),
            budget: input.intake.budget,
            schedule,
          }
        : undefined,
    }),
  });
  return mapStudent(response.student as never);
}

export async function assignAdminTeacherToStudent(
  studentId: string,
  teacherId: string,
  subject?: string,
  meetLink?: string,
) {
  const response = await apiFetch<{ student: ApiStudent }>(
    `/admin/students/${studentId}/assign-teacher`,
    {
      method: 'POST',
      body: JSON.stringify({ teacherId, subject, meetLink }),
    },
  );
  return mapStudent(response.student as never);
}

export async function unassignAdminTeacherFromStudent(
  studentId: string,
  subject?: string,
) {
  const response = await apiFetch<{ student: ApiStudent }>(
    `/admin/students/${studentId}/unassign-teacher`,
    {
      method: 'POST',
      body: JSON.stringify({ subject }),
    },
  );
  return mapStudent(response.student as never);
}

export async function listAdminSessions() {
  const response = await apiFetch<{ sessions: ApiSession[] }>(
    '/admin/sessions?page=1&pageSize=100',
  );
  return response.sessions.map((session) => mapSession(session as never));
}

export interface ListAdminSessionsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: 'All' | Session['status'];
}

function sessionStatusToApi(status?: ListAdminSessionsParams['status']) {
  if (!status || status === 'All') return undefined;
  switch (status) {
    case 'Completed':
      return 'COMPLETED';
    case 'Cancelled':
      return 'CANCELLED';
    default:
      return 'UPCOMING';
  }
}

function buildSessionsQuery(params: ListAdminSessionsParams) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params.search?.trim()) searchParams.set('search', params.search.trim());
  const status = sessionStatusToApi(params.status);
  if (status) searchParams.set('status', status);
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function listAdminSessionsPage(
  params: ListAdminSessionsParams = {},
) {
  const response = await apiFetch<{
    sessions: ApiSession[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
    summary: {
      total: number;
      upcoming: number;
      completed: number;
      cancelled: number;
    };
  }>(`/admin/sessions${buildSessionsQuery(params)}`);

  return {
    sessions: response.sessions.map((session) => mapSession(session as never)),
    pagination: response.pagination,
    summary: response.summary,
  };
}

export interface CreateAdminSessionInput {
  studentId: string;
  subject: string;
  startsAt: string;
  durationMins?: number;
  meetLink?: string;
}

export async function createAdminSession(input: CreateAdminSessionInput) {
  const response = await apiFetch<{ session: ApiSession }>('/admin/sessions', {
    method: 'POST',
    body: JSON.stringify({
      studentId: input.studentId,
      subject: input.subject,
      startsAt: input.startsAt,
      durationMins: input.durationMins ?? 60,
      meetLink: input.meetLink || undefined,
    }),
  });
  return mapSession(response.session as never);
}

function mapBookingRequest(request: ApiBookingRequest): SessionBookingRequest {
  return {
    id: request.id,
    childId: request.studentId,
    childName: request.student?.fullName,
    subject: request.subject,
    day: dayFromApi[request.day] ?? 'Mon',
    timeBlock: timeFromApi[request.timeBlock] ?? 'Evening',
    startTime: request.startTime,
    startDate: request.startDate,
    sessionsRequested: request.sessionsRequested,
    status:
      request.status === 'SCHEDULED'
        ? 'Scheduled'
        : request.status === 'CANCELLED'
          ? 'Cancelled'
          : 'Pending',
    createdAt: request.createdAt,
  };
}

export async function listAdminBookingRequests() {
  const response = await apiFetch<{ requests: ApiBookingRequest[] }>(
    '/admin/sessions/booking-requests',
  );
  return response.requests.map(mapBookingRequest);
}

export async function scheduleAdminBookingRequest(requestId: string) {
  await apiFetch(`/admin/sessions/booking-requests/${requestId}/schedule`, {
    method: 'POST',
  });
}

export async function updateAdminSessionMeetingLink(
  sessionId: string,
  meetLink: string,
) {
  const response = await apiFetch<{ session: ApiSession }>(
    `/admin/sessions/${sessionId}/meeting-link`,
    {
      method: 'PATCH',
      body: JSON.stringify({ meetLink }),
    },
  );
  return mapSession(response.session as never);
}

export async function listAdminCancellationRequests() {
  const response = await apiFetch<{ cancellations: ApiCancellation[] }>(
    '/admin/sessions/cancellations',
  );
  return response.cancellations;
}

export async function approveAdminCancellation(requestId: string) {
  await apiFetch(`/admin/sessions/cancellations/${requestId}/approve`, {
    method: 'POST',
  });
}

export async function rejectAdminCancellation(requestId: string) {
  await apiFetch(`/admin/sessions/cancellations/${requestId}/reject`, {
    method: 'POST',
  });
}
