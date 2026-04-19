import type {
  Badge,
  Child,
  EarningEntry,
  Notification,
  Parent,
  Payment,
  Payout,
  Session,
  SessionNote,
  Teacher,
} from '@/lib/types';

export const parent: Parent = {
  id: 'p_001',
  name: 'Amara Okafor',
  email: 'amara.okafor@example.com',
  whatsapp: '+44 7700 900123',
  createdAt: '2026-03-12T09:00:00Z',
  childrenIds: ['c_001', 'c_002', 'c_003'],
};

export const children: Child[] = [
  {
    id: 'c_001',
    parentId: 'p_001',
    fullName: 'Zara Okafor',
    age: 14,
    grade: 'JSS',
    school: 'Bright Future Academy',
    assignedTeacherId: 't_001',
    streak: { current: 3, longest: 5, lastActiveAt: '2026-04-17T18:00:00Z' },
    badges: ['b_first_step', 'b_on_fire', 'b_math_star'],
    goal: {
      id: 'g_001',
      childId: 'c_001',
      title: 'Pass JSS3 Maths with an A',
      targetDate: '2026-06-30',
      progress: 35,
    },
    intake: {
      subject: 'Maths',
      subjects: ['Maths'],
      learningGoal: 'Exam prep',
      currentLevel: 'Average',
      specificTopics: 'Algebra and word problems',
      teacherGenderPref: 'No preference',
      specialNotes: 'Shy at first, warms up after a few sessions',
      preferredSchedule: {
        Mon: 'Evening',
        Wed: 'Evening',
        Fri: 'Afternoon',
      },
      preferredDays: ['Mon', 'Wed', 'Fri'],
      preferredTime: 'Evening',
      timezone: 'Europe/London',
      sessionsPerWeek: 3,
      budget: '$20–$35',
    },
  },
  {
    id: 'c_002',
    parentId: 'p_001',
    fullName: 'Kayin Okafor',
    age: 17,
    grade: 'SSS',
    school: 'Bright Future Academy',
    assignedTeacherId: 't_002',
    streak: { current: 1, longest: 2, lastActiveAt: '2026-04-16T16:00:00Z' },
    badges: ['b_first_step'],
    goal: {
      id: 'g_002',
      childId: 'c_002',
      title: 'Prep for SAT in October',
      progress: 12,
    },
  },
  {
    id: 'c_003',
    parentId: 'p_001',
    fullName: 'Tobi Okafor',
    age: 10,
    grade: 'Primary',
    school: 'Bright Future Academy',
    streak: { current: 0, longest: 0, lastActiveAt: '2026-04-18T09:00:00Z' },
    badges: [],
    intake: {
      subject: 'Reading',
      subjects: ['Reading'],
      learningGoal: 'General improvement',
      currentLevel: 'Struggling',
      specificTopics: 'Reading comprehension and spelling',
      teacherGenderPref: 'Female',
      preferredSchedule: {
        Tue: 'Afternoon',
        Thu: 'Evening',
      },
      preferredDays: ['Tue', 'Thu'],
      preferredTime: 'Afternoon',
      timezone: 'Africa/Lagos',
      sessionsPerWeek: 2,
      budget: 'Under $20',
    },
  },
];

export const teachers: Teacher[] = [
  {
    id: 't_001',
    name: 'Daniel Adeyemi',
    firstName: 'Daniel',
    lastName: 'Adeyemi',
    email: 'daniel.adeyemi@example.com',
    phoneCountry: '+234',
    phoneNumber: '801 234 5678',
    bio: 'Maths specialist with 8 years teaching across Nigeria and the UK.',
    subjects: ['Maths', 'Further Maths'],
    qualifications: ['BSc Mathematics', 'PGCE'],
    hourlyRate: 20,
    rating: 4.9,
    totalSessions: 312,
    joinedAt: '2025-01-15',
    status: 'Active',
  },
  {
    id: 't_002',
    name: 'Priya Menon',
    firstName: 'Priya',
    lastName: 'Menon',
    email: 'priya.menon@example.com',
    phoneCountry: '+44',
    phoneNumber: '7700 900456',
    bio: 'SAT prep coach. Helped 40+ students score 1400+.',
    subjects: ['SAT', 'English'],
    qualifications: ['MA English Lit', 'Certified SAT Tutor'],
    hourlyRate: 25,
    rating: 4.8,
    totalSessions: 188,
    joinedAt: '2025-06-02',
    status: 'Active',
  },
  {
    id: 't_003',
    name: 'Chinedu Eze',
    firstName: 'Chinedu',
    lastName: 'Eze',
    email: 'chinedu.eze@example.com',
    phoneCountry: '+234',
    phoneNumber: '809 876 5432',
    bio: 'Science and coding tutor. Makes abstract topics feel concrete.',
    subjects: ['Science', 'Coding'],
    qualifications: ['BSc Computer Science'],
    hourlyRate: 22,
    rating: 4.7,
    totalSessions: 97,
    joinedAt: '2025-09-20',
    status: 'Active',
  },
];

export const sessions: Session[] = [
  {
    id: 's_001',
    childId: 'c_001',
    teacherId: 't_001',
    subject: 'Maths',
    startsAt: '2026-04-19T18:00:00Z',
    durationMins: 60,
    meetLink: 'https://meet.google.com/abc-defg-hij',
    status: 'Upcoming',
    amount: 35,
  },
  {
    id: 's_002',
    childId: 'c_001',
    teacherId: 't_001',
    subject: 'Maths',
    startsAt: '2026-04-17T18:00:00Z',
    durationMins: 60,
    meetLink: 'https://meet.google.com/xyz-uvw-rst',
    status: 'Completed',
    noteId: 'n_002',
    amount: 35,
    attendance: {
      teacherConfirmedAt: '2026-04-17T19:02:00Z',
      familyConfirmedAt: '2026-04-17T19:08:00Z',
    },
  },
  {
    id: 's_003',
    childId: 'c_002',
    teacherId: 't_002',
    subject: 'SAT',
    startsAt: '2026-04-20T16:00:00Z',
    durationMins: 90,
    meetLink: 'https://meet.google.com/lmn-opq-rst',
    status: 'Upcoming',
    amount: 50,
  },
  {
    id: 's_004',
    childId: 'c_001',
    teacherId: 't_001',
    subject: 'Maths',
    startsAt: '2026-04-18T18:00:00Z',
    durationMins: 60,
    meetLink: 'https://meet.google.com/demo-note-session',
    status: 'Completed',
    amount: 35,
    attendance: {
      teacherConfirmedAt: '2026-04-18T19:01:00Z',
      familyConfirmedAt: '2026-04-18T19:06:00Z',
    },
  },
];

export const sessionNotes: SessionNote[] = [
  {
    id: 'n_002',
    sessionId: 's_002',
    covered: 'Linear equations, solving for x with one variable',
    performance: 'Good',
    rating: 4,
    focusNext: 'Quadratic equations and factorisation',
    createdAt: '2026-04-17T19:05:00Z',
  },
];

export const badges: Badge[] = [
  {
    id: 'b_first_step',
    name: 'First Step',
    description: 'Completed your first session',
    icon: '🎯',
    earnedAt: '2026-03-15',
  },
  {
    id: 'b_on_fire',
    name: 'On Fire',
    description: '3 sessions in a row',
    icon: '🔥',
    earnedAt: '2026-04-05',
  },
  {
    id: 'b_math_star',
    name: 'Math Star',
    description: '5 Maths sessions completed',
    icon: '⭐',
    earnedAt: '2026-04-12',
  },
  {
    id: 'b_consistent',
    name: 'Consistent',
    description: '4 weeks straight learning',
    icon: '📅',
  },
  {
    id: 'b_champion',
    name: 'DoLearn Champion',
    description: '20 sessions milestone',
    icon: '🏆',
  },
  {
    id: 'b_night_owl',
    name: 'Night Owl',
    description: 'Five evening sessions in a month',
    icon: '🦉',
  },
];

export const earnings: EarningEntry[] = [
  {
    sessionId: 's_002',
    date: '2026-04-17',
    studentName: 'Zara Okafor',
    subject: 'Maths',
    durationMins: 60,
    amount: 20,
    status: 'Paid',
  },
];

export const payouts: Payout[] = [
  { id: 'po_001', date: '2026-04-12', amount: 220, method: 'Wise' },
  { id: 'po_002', date: '2026-04-05', amount: 180, method: 'Wise' },
];

export const payments: Payment[] = [
  {
    id: 'pay_001',
    parentId: 'p_001',
    plan: 'Starter Bundle',
    amount: 150,
    gateway: 'Stripe',
    createdAt: '2026-04-01',
    sessionsIncluded: 5,
    sessionsUsed: 2,
  },
];

export const notifications: Notification[] = [
  {
    id: 'nt_001',
    userId: 'p_001',
    role: 'parent',
    title: 'Session tomorrow at 6:00 PM',
    body: 'Zara has Maths with Daniel Adeyemi.',
    createdAt: '2026-04-18T08:00:00Z',
    read: false,
  },
  {
    id: 'nt_002',
    userId: 'p_001',
    role: 'parent',
    title: 'New feedback from Daniel Adeyemi',
    body: 'Zara made great progress on linear equations.',
    createdAt: '2026-04-17T19:10:00Z',
    read: true,
  },
];

export function getChild(id: string) {
  return children.find((c) => c.id === id);
}

export function getTeacher(id: string) {
  return teachers.find((t) => t.id === id);
}

export function getSessionsForChild(childId: string) {
  return sessions.filter((s) => s.childId === childId);
}

export function getSessionsForTeacher(teacherId: string) {
  return sessions.filter((s) => s.teacherId === teacherId);
}

export function getBadge(id: string) {
  return badges.find((b) => b.id === id);
}
