'use client';

import {
  children as mockChildren,
  payouts as mockPayouts,
  sessionNotes as mockSessionNotes,
  sessions as mockSessions,
  teachers as mockTeachers,
} from '@/lib/mock';
import {
  applySessionOverrides,
  applyTeacherOverrides,
  getChildren,
  getRoleNotifications,
  getStoredSessionNotes,
} from '@/lib/store/client';
import {
  isSessionPayoutEligible,
  type Child,
  type EarningEntry,
  type Notification,
  type Payout,
  type Session,
  type SessionNote,
  type Teacher,
} from '@/lib/types';
export function teacherMe(): Teacher {
  return applyTeacherOverrides(mockTeachers)[0];
}

export function teacherSessions(teacherId?: string): Session[] {
  const id = teacherId ?? teacherMe().id;
  return applySessionOverrides(mockSessions).filter((s) => s.teacherId === id);
}

export function teacherStudents(teacherId?: string): Child[] {
  const id = teacherId ?? teacherMe().id;
  const realChildren = getChildren();
  const realAssigned = realChildren.filter((c) => c.assignedTeacherId === id);
  if (realAssigned.length > 0) return realAssigned;
  const sessionChildIds = new Set(
    mockSessions.filter((s) => s.teacherId === id).map((s) => s.childId),
  );
  const assigned = mockChildren.filter(
    (c) => c.assignedTeacherId === id || sessionChildIds.has(c.id),
  );
  return assigned;
}

export function teacherChild(childId: string): Child | undefined {
  return mockChildren.find((c) => c.id === childId);
}

export function teacherNotes(teacherId?: string): SessionNote[] {
  const sessionIds = new Set(teacherSessions(teacherId).map((s) => s.id));
  return [...getStoredSessionNotes(), ...mockSessionNotes].filter((n) =>
    sessionIds.has(n.sessionId),
  );
}

export function teacherEarnings(): EarningEntry[] {
  const teacher = teacherMe();
  const childById = new Map(mockChildren.map((child) => [child.id, child]));
  const verified = teacherSessions(teacher.id).filter(
    (session) =>
      session.status === 'Completed' &&
      isSessionPayoutEligible(session.attendance),
  );

  return verified.map((session) => ({
    sessionId: session.id,
    date: session.startsAt,
    studentName: childById.get(session.childId)?.fullName ?? 'Student',
    subject: session.subject,
    durationMins: session.durationMins,
    amount: Math.round((session.durationMins / 60) * teacher.hourlyRate),
    status: 'Pending',
  }));
}

export function teacherPayouts(): Payout[] {
  return mockPayouts;
}

export function teacherNotifications(teacherId?: string): Notification[] {
  const id = teacherId ?? teacherMe().id;
  return getRoleNotifications('teacher', id);
}
