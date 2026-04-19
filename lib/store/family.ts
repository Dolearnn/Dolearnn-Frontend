'use client';

import {
  badges as mockBadges,
  children as mockChildren,
  earnings as mockEarnings,
  getBadge as mockGetBadge,
  notifications as mockNotifications,
  parent as mockParent,
  payments as mockPayments,
  sessionNotes as mockSessionNotes,
  sessions as mockSessions,
  teachers as mockTeachers,
} from '@/lib/mock';
import {
  applySessionOverrides,
  getChildren,
  getParent,
  getRoleNotifications,
  getStoredSessionNotes,
} from '@/lib/store/client';
import type { Child, Parent } from '@/lib/types';

export function familyParent(): Parent {
  return getParent() ?? mockParent;
}

export function familyChildren(): Child[] {
  const real = getChildren();
  return real.length > 0 ? withMockEnrichment(real) : mockChildren;
}

function withMockEnrichment(children: Child[]): Child[] {
  return children.map((c, i) => {
    const mockTemplate = mockChildren[i % mockChildren.length];
    return {
      ...c,
      assignedTeacherId: c.assignedTeacherId ?? mockTemplate.assignedTeacherId,
      streak: c.streak.current > 0 ? c.streak : mockTemplate.streak,
      badges: c.badges.length > 0 ? c.badges : mockTemplate.badges,
      goal: c.goal ?? mockTemplate.goal,
    };
  });
}

export function familySessionsForChild(childId: string) {
  const sessions = applySessionOverrides(mockSessions);
  const owned = sessions.filter((s) => s.childId === childId);
  if (owned.length > 0) return owned;
  const fallbackChild = mockChildren[0];
  return sessions
    .filter((s) => s.childId === fallbackChild.id)
    .map((s) => ({ ...s, childId }));
}

export function familyAllSessions(): ReturnType<typeof mockSessions.filter> {
  const children = familyChildren();
  return children.flatMap((c) => familySessionsForChild(c.id));
}

export function familyTeacher(teacherId?: string) {
  if (!teacherId) return mockTeachers[0];
  return mockTeachers.find((t) => t.id === teacherId) ?? mockTeachers[0];
}

export function familySessionNote(noteId?: string) {
  if (!noteId) return undefined;
  return [...getStoredSessionNotes(), ...mockSessionNotes].find(
    (n) => n.id === noteId,
  );
}

export function familyBadges() {
  return mockBadges;
}

export function familyGetBadge(id: string) {
  return mockGetBadge(id);
}

export function familyPayments() {
  return mockPayments;
}

export function familyEarnings() {
  return mockEarnings;
}

export function familyNotifications() {
  const parent = familyParent();
  return [...getRoleNotifications('parent', parent.id), ...mockNotifications];
}
