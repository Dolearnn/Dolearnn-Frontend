import { apiFetch } from '@/lib/api/client';
import { mapSession, mapStudent } from '@/lib/api/family';
import type {
  Child,
  Performance,
  Rating,
  Session,
  SessionNote,
  TimeBlock,
  Teacher,
} from '@/lib/types';

interface ApiTeacherProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  subjects: string[];
  qualifications: string[];
  hourlyRate: string | number;
  status: string;
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
}

interface ApiSessionNote {
  id: string;
  sessionId: string;
  covered: string;
  performance: string;
  rating: number;
  focusNext: string;
  concerns?: string | null;
  createdAt: string;
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
  attendance?: {
    teacherConfirmedAt?: string | null;
    familyConfirmedAt?: string | null;
  } | null;
  note?: ApiSessionNote | null;
  cancellations?: Array<{
    id: string;
    requestedBy: string;
    requestedAt: string;
    reason: string;
    status: string;
    resolvedAt?: string | null;
  }>;
}

export const teacherKeys = {
  profile: ['teacher', 'profile'] as const,
  students: ['teacher', 'students'] as const,
  sessions: ['teacher', 'sessions'] as const,
  notes: ['teacher', 'notes'] as const,
};

const timeToApi: Record<TimeBlock, string> = {
  Morning: 'MORNING',
  Afternoon: 'AFTERNOON',
  Evening: 'EVENING',
};

const performanceToApi: Record<Performance, string> = {
  Excellent: 'EXCELLENT',
  Good: 'GOOD',
  'Needs Work': 'NEEDS_WORK',
};

const performanceFromApi: Record<string, Performance> = {
  EXCELLENT: 'Excellent',
  GOOD: 'Good',
  NEEDS_WORK: 'Needs Work',
};

function asNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) return 0;
  return typeof value === 'number' ? value : Number(value);
}

function mapProfile(profile: ApiTeacherProfile): Teacher {
  return {
    id: profile.id,
    name: profile.name,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    bio: `${profile.subjects.join(', ')} teacher.`,
    subjects: profile.subjects,
    qualifications: profile.qualifications,
    hourlyRate: asNumber(profile.hourlyRate),
    rating: 0,
    totalSessions: 0,
    joinedAt: new Date().toISOString(),
    status: profile.status === 'TERMINATED' ? 'Terminated' : 'Active',
  };
}

function mapNote(note: ApiSessionNote): SessionNote {
  return {
    id: note.id,
    sessionId: note.sessionId,
    covered: note.covered,
    performance: performanceFromApi[note.performance] ?? 'Good',
    rating: Math.min(5, Math.max(1, note.rating)) as Rating,
    focusNext: note.focusNext,
    concerns: note.concerns ?? undefined,
    createdAt: note.createdAt,
  };
}

export interface CreateSessionProposalInput {
  studentId: string;
  subject: string;
  startsAt: string;
  durationMins: number;
  timeBlock: TimeBlock;
  note?: string;
}

export interface CreateSessionNoteInput {
  covered: string;
  performance: Performance;
  rating: Rating;
  focusNext: string;
  concerns?: string;
}

export async function getTeacherProfile() {
  const response = await apiFetch<{ profile: ApiTeacherProfile }>('/teacher/me');
  return mapProfile(response.profile);
}

export async function listTeacherStudents() {
  const response = await apiFetch<{ students: ApiStudent[] }>('/teacher/students');
  return response.students.map((student) => mapStudent(student as never));
}

export async function listTeacherSessions() {
  const response = await apiFetch<{ sessions: ApiSession[] }>('/teacher/sessions');
  return response.sessions.map((session) => mapSession(session as never));
}

export async function listTeacherNotes() {
  const response = await apiFetch<{ sessions: ApiSession[] }>('/teacher/sessions');
  return response.sessions
    .map((session) => session.note)
    .filter((note): note is ApiSessionNote => Boolean(note))
    .map(mapNote);
}

export async function createTeacherSessionProposal(
  input: CreateSessionProposalInput,
) {
  await apiFetch('/teacher/session-proposals', {
    method: 'POST',
    body: JSON.stringify({
      studentId: input.studentId,
      subject: input.subject,
      startsAt: input.startsAt,
      durationMins: input.durationMins,
      timeBlock: timeToApi[input.timeBlock],
      note: input.note,
    }),
  });
}

export async function confirmTeacherSessionAttendance(sessionId: string) {
  const response = await apiFetch<{ session: ApiSession }>(
    `/teacher/sessions/${sessionId}/attendance/confirm`,
    { method: 'POST' },
  );
  return mapSession(response.session as never);
}

export async function requestTeacherSessionCancellation(
  sessionId: string,
  reason: string,
) {
  await apiFetch(`/teacher/sessions/${sessionId}/cancellations`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function submitTeacherSessionNote(
  sessionId: string,
  input: CreateSessionNoteInput,
) {
  const response = await apiFetch<{ note: ApiSessionNote }>(
    `/teacher/sessions/${sessionId}/notes`,
    {
      method: 'POST',
      body: JSON.stringify({
        covered: input.covered,
        performance: performanceToApi[input.performance],
        rating: input.rating,
        focusNext: input.focusNext,
        concerns: input.concerns,
      }),
    },
  );
  return mapNote(response.note);
}
