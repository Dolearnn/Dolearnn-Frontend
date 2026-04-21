import { apiFetch } from '@/lib/api/client';
import { mapSession, mapStudent } from '@/lib/api/family';
import type { Child, Session, Teacher } from '@/lib/types';

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
  bio?: string | null;
  subjects: string[];
  qualifications: string[];
  hourlyRate: string | number;
  rating: string | number;
  totalSessions: number;
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

export const adminKeys = {
  teachers: ['admin', 'teachers'] as const,
  students: ['admin', 'students'] as const,
  sessions: ['admin', 'sessions'] as const,
  cancellations: ['admin', 'sessions', 'cancellations'] as const,
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
    bio: teacher.bio ?? `${teacher.subjects.join(', ')} teacher.`,
    subjects: teacher.subjects,
    qualifications: teacher.qualifications,
    hourlyRate: asNumber(teacher.hourlyRate),
    rating: asNumber(teacher.rating),
    totalSessions: teacher.totalSessions,
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
  bio?: string;
  subjects: string[];
  qualifications: string[];
  hourlyRate: number;
  defaultPassword: string;
}

export async function listAdminTeachers() {
  const response = await apiFetch<{ teachers: ApiTeacher[] }>('/admin/teachers');
  return response.teachers.map(mapTeacher);
}

export async function createAdminTeacher(input: CreateTeacherInput) {
  const response = await apiFetch<{ teacher: ApiTeacher }>('/admin/teachers', {
    method: 'POST',
    body: JSON.stringify(input),
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
  const response = await apiFetch<{ students: ApiStudent[] }>('/admin/students');
  return response.students.map((student) => mapStudent(student as never));
}

export async function assignAdminTeacherToStudent(
  studentId: string,
  teacherId: string,
  subject?: string,
) {
  const response = await apiFetch<{ student: ApiStudent }>(
    `/admin/students/${studentId}/assign-teacher`,
    {
      method: 'POST',
      body: JSON.stringify({ teacherId, subject }),
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
  const response = await apiFetch<{ sessions: ApiSession[] }>('/admin/sessions');
  return response.sessions.map((session) => mapSession(session as never));
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
