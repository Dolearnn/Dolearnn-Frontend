'use client';

import type {
  Child,
  IntakeForm,
  Notification,
  Parent,
  Role,
  Session,
  SessionNote,
  SessionProposal,
} from '@/lib/types';

const KEYS = {
  parent: 'dolearn.parent',
  children: 'dolearn.children',
  notifications: 'dolearn.notifications',
  sessionNotes: 'dolearn.sessionNotes',
  sessionOverrides: 'dolearn.sessionOverrides',
  sessionProposals: 'dolearn.sessionProposals',
  teacherOverrides: 'dolearn.teacherOverrides',
} as const;

function read<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function remove(key: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(key);
}

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getParent(): Parent | null {
  return read<Parent>(KEYS.parent);
}

export function saveParent(input: {
  name: string;
  email: string;
  whatsapp: string;
}): Parent {
  const parent: Parent = {
    id: id('p'),
    name: input.name,
    email: input.email,
    whatsapp: input.whatsapp,
    createdAt: new Date().toISOString(),
    childrenIds: [],
  };
  write(KEYS.parent, parent);
  return parent;
}

export function clearSession() {
  remove(KEYS.parent);
  remove(KEYS.children);
}

export function getChildren(): Child[] {
  return read<Child[]>(KEYS.children) ?? [];
}

export function getChildById(childId: string): Child | undefined {
  return getChildren().find((c) => c.id === childId);
}

export function addChild(
  input: Pick<Child, 'fullName' | 'age' | 'grade' | 'gradeOther' | 'school'>,
): Child {
  const parent = getParent();
  if (!parent) throw new Error('No parent session');
  const child: Child = {
    id: id('c'),
    parentId: parent.id,
    fullName: input.fullName,
    age: input.age,
    grade: input.grade,
    gradeOther: input.gradeOther,
    school: input.school,
    streak: { current: 0, longest: 0, lastActiveAt: new Date().toISOString() },
    badges: [],
  };
  const next = [...getChildren(), child];
  write(KEYS.children, next);
  write(KEYS.parent, { ...parent, childrenIds: next.map((c) => c.id) });
  return child;
}

export function updateChild(childId: string, patch: Partial<Child>): Child | null {
  const list = getChildren();
  const idx = list.findIndex((c) => c.id === childId);
  if (idx === -1) return null;
  const updated: Child = { ...list[idx], ...patch };
  list[idx] = updated;
  write(KEYS.children, list);
  return updated;
}

export function saveIntake(childId: string, intake: IntakeForm): Child | null {
  return updateChild(childId, { intake });
}

export type SessionOverrides = Record<
  string,
  Partial<
    Pick<
      Session,
      'attendance' | 'cancellation' | 'meetLink' | 'noteId' | 'status'
    >
  >
>;

export function getSessionOverrides(): SessionOverrides {
  return read<SessionOverrides>(KEYS.sessionOverrides) ?? {};
}

export function applySessionOverrides(sessions: Session[]): Session[] {
  const overrides = getSessionOverrides();
  const proposalSessions = acceptedProposalSessions();
  const knownIds = new Set(sessions.map((session) => session.id));
  const merged = [
    ...sessions,
    ...proposalSessions.filter((session) => !knownIds.has(session.id)),
  ];
  return merged.map((session) => ({
    ...session,
    ...(overrides[session.id] ?? {}),
  }));
}

function proposalSessionId(proposalId: string) {
  return `proposal_session_${proposalId}`;
}

function acceptedProposalSessions(): Session[] {
  return getSessionProposals()
    .filter((proposal) => proposal.status === 'Accepted')
    .map((proposal) => ({
      id: proposalSessionId(proposal.id),
      childId: proposal.childId,
      teacherId: proposal.teacherId,
      subject: proposal.subject,
      startsAt: proposal.startsAt,
      durationMins: proposal.durationMins,
      meetLink: '',
      status: 'Upcoming',
      amount: 0,
    }));
}

export function getSessionProposals(): SessionProposal[] {
  return read<SessionProposal[]>(KEYS.sessionProposals) ?? [];
}

export function createSessionProposal(
  input: Omit<SessionProposal, 'id' | 'status' | 'createdAt'>,
): SessionProposal {
  const createdAt = new Date().toISOString();
  const proposal: SessionProposal = {
    ...input,
    id: id('sp'),
    status: 'Pending',
    createdAt,
  };
  write(KEYS.sessionProposals, [proposal, ...getSessionProposals()]);

  addNotifications([
    {
      id: `nt_${Date.now()}_proposal_parent`,
      userId: getParent()?.id ?? 'parent',
      role: 'parent',
      title: 'New session proposal',
      body: `A teacher proposed ${proposal.subject} for ${new Date(
        proposal.startsAt,
      ).toLocaleString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })}.`,
      createdAt,
      read: false,
      childId: proposal.childId,
      teacherId: proposal.teacherId,
    },
  ]);

  return proposal;
}

export function updateSessionProposalStatus(
  proposalId: string,
  status: 'Accepted' | 'Declined',
): SessionProposal | null {
  const proposals = getSessionProposals();
  const idx = proposals.findIndex((proposal) => proposal.id === proposalId);
  if (idx === -1) return null;

  const resolvedAt = new Date().toISOString();
  const updated: SessionProposal = {
    ...proposals[idx],
    status,
    resolvedAt,
  };
  proposals[idx] = updated;
  write(KEYS.sessionProposals, proposals);

  addNotifications([
    {
      id: `nt_${Date.now()}_proposal_teacher`,
      userId: updated.teacherId,
      role: 'teacher',
      title: `Session proposal ${status.toLowerCase()}`,
      body:
        status === 'Accepted'
          ? `The family accepted your ${updated.subject} session proposal. Admin can now assign the meeting link.`
          : `The family declined your ${updated.subject} session proposal.`,
      createdAt: resolvedAt,
      read: false,
      childId: updated.childId,
      teacherId: updated.teacherId,
    },
  ]);

  return updated;
}

export type TeacherOverrides = Record<string, { hourlyRate?: number }>;

export function getTeacherOverrides(): TeacherOverrides {
  return read<TeacherOverrides>(KEYS.teacherOverrides) ?? {};
}

export function applyTeacherOverrides<T extends { id: string; hourlyRate: number }>(
  teachers: T[],
): T[] {
  const overrides = getTeacherOverrides();
  return teachers.map((teacher) => ({
    ...teacher,
    ...(overrides[teacher.id] ?? {}),
  }));
}

export function updateTeacherHourlyRate(
  teacherId: string,
  hourlyRate: number,
): TeacherOverrides {
  const overrides = getTeacherOverrides();
  const next: TeacherOverrides = {
    ...overrides,
    [teacherId]: {
      ...(overrides[teacherId] ?? {}),
      hourlyRate,
    },
  };
  write(KEYS.teacherOverrides, next);
  return next;
}

export function updateSessionMeetingLink(
  sessionId: string,
  meetLink: string,
): SessionOverrides {
  const overrides = getSessionOverrides();
  const next: SessionOverrides = {
    ...overrides,
    [sessionId]: {
      ...(overrides[sessionId] ?? {}),
      meetLink: meetLink.trim(),
    },
  };
  write(KEYS.sessionOverrides, next);
  return next;
}

export function getStoredSessionNotes(): SessionNote[] {
  return read<SessionNote[]>(KEYS.sessionNotes) ?? [];
}

export function addSessionNote(note: SessionNote): SessionOverrides {
  const notes = getStoredSessionNotes();
  write(KEYS.sessionNotes, [note, ...notes]);

  const overrides = getSessionOverrides();
  const current = overrides[note.sessionId] ?? {};
  const next: SessionOverrides = {
    ...overrides,
    [note.sessionId]: {
      ...current,
      noteId: note.id,
    },
  };
  write(KEYS.sessionOverrides, next);
  return next;
}

export function confirmSessionAttendance(
  sessionId: string,
  confirmer: 'family' | 'teacher',
): SessionOverrides {
  const overrides = getSessionOverrides();
  const current = overrides[sessionId] ?? {};
  const attendance = current.attendance ?? {};
  const confirmedAt = new Date().toISOString();
  const nextAttendance =
    confirmer === 'teacher'
      ? { ...attendance, teacherConfirmedAt: confirmedAt }
      : { ...attendance, familyConfirmedAt: confirmedAt };
  const next: SessionOverrides = {
    ...overrides,
    [sessionId]: {
      ...current,
      attendance: nextAttendance,
    },
  };
  write(KEYS.sessionOverrides, next);
  return next;
}

export function requestSessionCancellation(input: {
  session: Session;
  requestedBy: 'family' | 'teacher';
  reason: string;
  studentName?: string;
  teacherName?: string;
}): SessionOverrides | null {
  const cleanReason = input.reason.trim();
  if (!cleanReason) return null;

  const overrides = getSessionOverrides();
  const current = overrides[input.session.id] ?? {};
  const requestedAt = new Date().toISOString();
  const next: SessionOverrides = {
    ...overrides,
    [input.session.id]: {
      ...current,
      cancellation: {
        requestedBy: input.requestedBy,
        requestedAt,
        reason: cleanReason,
        status: 'Pending',
      },
    },
  };
  write(KEYS.sessionOverrides, next);

  const actor = input.requestedBy === 'family' ? 'Family' : 'Teacher';
  const student = input.studentName ?? 'the student';
  const teacher = input.teacherName ?? 'the teacher';
  const title = `${actor} requested session cancellation`;
  const body = `${actor} requested cancellation for ${input.session.subject} with ${student} and ${teacher}. Reason: ${cleanReason}`;
  const notifications: Notification[] = [
    {
      id: `nt_${Date.now()}_cancel_admin`,
      userId: 'admin',
      role: 'admin',
      title,
      body,
      createdAt: requestedAt,
      read: false,
      childId: input.session.childId,
      teacherId: input.session.teacherId,
    },
  ];

  if (input.requestedBy === 'family') {
    notifications.push({
      id: `nt_${Date.now()}_cancel_teacher`,
      userId: input.session.teacherId,
      role: 'teacher',
      title: 'Family requested cancellation',
      body,
      createdAt: requestedAt,
      read: false,
      childId: input.session.childId,
      teacherId: input.session.teacherId,
    });
  } else {
    const parent = getParent();
    notifications.push({
      id: `nt_${Date.now()}_cancel_parent`,
      userId: parent?.id ?? 'parent',
      role: 'parent',
      title: 'Teacher requested cancellation',
      body,
      createdAt: requestedAt,
      read: false,
      childId: input.session.childId,
      teacherId: input.session.teacherId,
    });
  }

  addNotifications(notifications);
  return next;
}

export function resolveSessionCancellation(
  sessionId: string,
  decision: 'Approved' | 'Rejected',
): SessionOverrides {
  const overrides = getSessionOverrides();
  const current = overrides[sessionId] ?? {};
  const cancellation = current.cancellation;
  const next: SessionOverrides = {
    ...overrides,
    [sessionId]: {
      ...current,
      status: decision === 'Approved' ? 'Cancelled' : 'Upcoming',
      cancellation: cancellation
        ? {
            ...cancellation,
            status: decision,
            resolvedAt: new Date().toISOString(),
          }
        : undefined,
    },
  };
  write(KEYS.sessionOverrides, next);
  return next;
}

export function getRoleNotifications(
  role: Role,
  userId?: string,
): Notification[] {
  const notifications = read<Notification[]>(KEYS.notifications) ?? [];
  return notifications
    .filter((notification) => {
      if (notification.role !== role) return false;
      return userId ? notification.userId === userId : true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addNotifications(notifications: Notification[]) {
  const next = [...notifications, ...(read<Notification[]>(KEYS.notifications) ?? [])];
  write(KEYS.notifications, next);
}

export function deactivateChild(childId: string, reason: string): Child | null {
  const cleanReason = reason.trim();
  if (!cleanReason) return null;

  const child = getChildById(childId);
  if (!child) return null;

  const deactivatedAt = new Date().toISOString();
  const updated = updateChild(childId, {
    status: 'Deactivated',
    deactivationReason: cleanReason,
    deactivatedAt,
  });

  const parent = getParent();
  const parentName = parent?.name ?? 'A family';
  const baseNotification = {
    childId,
    createdAt: deactivatedAt,
    read: false,
  };
  const notifications: Notification[] = [
    {
      ...baseNotification,
      id: `nt_${Date.now()}_admin`,
      userId: 'admin',
      role: 'admin',
      title: `${child.fullName} was deactivated`,
      body: `${parentName} paused lessons for ${child.fullName}. Reason: ${cleanReason}`,
      teacherId: child.assignedTeacherId,
    },
  ];

  if (child.assignedTeacherId) {
    notifications.push({
      ...baseNotification,
      id: `nt_${Date.now()}_teacher`,
      userId: child.assignedTeacherId,
      role: 'teacher',
      title: `${child.fullName} lessons paused`,
      body: `${parentName} deactivated ${child.fullName}. Reason: ${cleanReason}`,
      teacherId: child.assignedTeacherId,
    });
  }

  addNotifications(notifications);
  return updated;
}

export function activateChild(childId: string): Child | null {
  return updateChild(childId, {
    status: 'Active',
    deactivationReason: undefined,
    deactivatedAt: undefined,
  });
}
