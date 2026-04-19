'use client';

import {
  children as mockChildren,
  parent as mockParent,
  payments as mockPayments,
  payouts as mockPayouts,
  sessions as mockSessions,
  teachers as mockTeachers,
} from '@/lib/mock';
import {
  applySessionOverrides,
  applyTeacherOverrides,
  getChildren,
  getRoleNotifications,
} from '@/lib/store/client';
import type {
  Child,
  Notification,
  Parent,
  Payment,
  Payout,
  Session,
  Teacher,
} from '@/lib/types';

export function adminParents(): Parent[] {
  return [mockParent];
}

export function adminChildren(): Child[] {
  const real = getChildren();
  return real.length > 0 ? real : mockChildren;
}

export function adminTeachers(): Teacher[] {
  return applyTeacherOverrides(mockTeachers);
}

export function adminSessions(): Session[] {
  return applySessionOverrides(mockSessions);
}

export function adminPayments(): Payment[] {
  return mockPayments;
}

export function adminPayouts(): Payout[] {
  return mockPayouts;
}

export function adminPendingIntakes(): Child[] {
  return adminChildren().filter((c) => !!c.intake && !c.assignedTeacherId);
}

export function adminChildWithIntake(): Child[] {
  return adminChildren().filter((c) => !!c.intake);
}

export function adminNotifications(): Notification[] {
  return getRoleNotifications('admin');
}

export function adminTeacherById(id: string): Teacher | undefined {
  return adminTeachers().find((t) => t.id === id);
}

export function adminChildById(id: string): Child | undefined {
  return mockChildren.find((c) => c.id === id);
}

export function adminParentForChild(childId: string): Parent | undefined {
  const child = adminChildById(childId);
  if (!child) return undefined;
  return mockParent.id === child.parentId ? mockParent : undefined;
}

export function adminTeachersForSubject(subject: string): Teacher[] {
  const normalized = subject.toLowerCase();
  return mockTeachers.filter((t) =>
    (t.status ?? 'Active') !== 'Terminated' &&
    t.subjects.some(
      (s) =>
        s.toLowerCase().includes(normalized) ||
        normalized.includes(s.toLowerCase()),
    ),
  );
}

export function adminTeachersForSubjects(subjects: string[]): Teacher[] {
  const normalized = subjects.map((subject) => subject.toLowerCase());
  return mockTeachers.filter(
    (t) =>
      (t.status ?? 'Active') !== 'Terminated' &&
      t.subjects.some((teacherSubject) =>
        normalized.some(
          (subject) =>
            teacherSubject.toLowerCase().includes(subject) ||
            subject.includes(teacherSubject.toLowerCase()),
        ),
      ),
  );
}
