import { apiFetch } from '@/lib/api/client';
import type {
  Child,
  CurrentLevel,
  DayOfWeek,
  GenderPreference,
  Goal,
  GradeLevel,
  IntakeForm,
  LearningGoal,
  Parent,
  Performance,
  PreferredSchedule,
  Rating,
  Session,
  SessionBookingRequest,
  SessionCreditSummary,
  SessionNote,
  SessionProposal,
  TimeBlock,
} from '@/lib/types';

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

const gradeFromApi: Record<string, GradeLevel> = {
  PRIMARY: 'Primary',
  JSS: 'JSS',
  SSS: 'SSS',
  COLLEGE_YEAR_1: 'College Year 1',
  COLLEGE_YEAR_2: 'College Year 2',
  COLLEGE_YEAR_3: 'College Year 3',
  COLLEGE_YEAR_4: 'College Year 4',
  OTHER: 'Other',
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

const dayFromApi: Record<string, DayOfWeek> = {
  MON: 'Mon',
  TUE: 'Tue',
  WED: 'Wed',
  THU: 'Thu',
  FRI: 'Fri',
  SAT: 'Sat',
  SUN: 'Sun',
};

const timeToApi: Record<TimeBlock, string> = {
  Morning: 'MORNING',
  Afternoon: 'AFTERNOON',
  Evening: 'EVENING',
};

const timeFromApi: Record<string, TimeBlock> = {
  MORNING: 'Morning',
  AFTERNOON: 'Afternoon',
  EVENING: 'Evening',
};

const learningGoalToApi: Record<LearningGoal, string> = {
  'Exam prep': 'EXAM_PREP',
  'Catch up with school': 'CATCH_UP_WITH_SCHOOL',
  'Learn a new skill': 'LEARN_A_NEW_SKILL',
  'General improvement': 'GENERAL_IMPROVEMENT',
};

const learningGoalFromApi: Record<string, LearningGoal> = {
  EXAM_PREP: 'Exam prep',
  CATCH_UP_WITH_SCHOOL: 'Catch up with school',
  LEARN_A_NEW_SKILL: 'Learn a new skill',
  GENERAL_IMPROVEMENT: 'General improvement',
};

const currentLevelToApi: Record<CurrentLevel, string> = {
  Struggling: 'STRUGGLING',
  Average: 'AVERAGE',
  'Above average': 'ABOVE_AVERAGE',
};

const currentLevelFromApi: Record<string, CurrentLevel> = {
  STRUGGLING: 'Struggling',
  AVERAGE: 'Average',
  ABOVE_AVERAGE: 'Above average',
};

const genderToApi: Record<GenderPreference, string> = {
  'No preference': 'NO_PREFERENCE',
  Male: 'MALE',
  Female: 'FEMALE',
};

const genderFromApi: Record<string, GenderPreference> = {
  NO_PREFERENCE: 'No preference',
  MALE: 'Male',
  FEMALE: 'Female',
};

const performanceFromApi: Record<string, Performance> = {
  EXCELLENT: 'Excellent',
  GOOD: 'Good',
  NEEDS_WORK: 'Needs Work',
};

interface ApiParentProfile {
  id: string;
  name: string;
  email: string;
  whatsapp?: string | null;
  createdAt: string;
}

interface ApiIntakeSchedule {
  day: string;
  time: string;
}

interface ApiIntake {
  subject: string;
  subjects: string[];
  subjectOther?: string | null;
  learningGoal: string;
  currentLevel: string;
  specificTopics?: string | null;
  teacherGenderPref: string;
  specialNotes?: string | null;
  timezone: string;
  sessionsPerWeek: string;
  budget: string;
  schedule: ApiIntakeSchedule[];
}

interface ApiGoal {
  id: string;
  studentId: string;
  title: string;
  targetDate?: string | null;
  progress: number;
}

interface ApiTeacherProfile {
  id: string;
  phoneCountry?: string | null;
  phoneNumber?: string | null;
  user?: {
    name: string;
    email?: string;
  };
}

interface ApiStudentSubjectAssignment {
  id: string;
  studentId: string;
  teacherId: string;
  lessonPackageId?: string | null;
  subject: string;
  meetLink?: string | null;
  createdAt: string;
  teacher?: ApiTeacherProfile | null;
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
  intake?: ApiIntake | null;
  goals?: ApiGoal[];
  subjectAssignments?: ApiStudentSubjectAssignment[];
}

interface ApiSession {
  id: string;
  studentId: string;
  teacherId: string;
  lessonPackageId?: string | null;
  subject: string;
  startsAt: string;
  durationMins: number;
  meetLink?: string | null;
  status: string;
  amount?: string | number | null;
  student?: ApiStudent | null;
  teacher?: ApiTeacherProfile | null;
  attendance?: {
    teacherConfirmedAt?: string | null;
    familyConfirmedAt?: string | null;
  } | null;
  note?: {
    id: string;
    sessionId?: string;
    covered?: string;
    performance?: string;
    rating?: number;
    focusNext?: string;
    concerns?: string | null;
    createdAt?: string;
  } | null;
  cancellations?: Array<{
    id: string;
    requestedBy: string;
    requestedAt: string;
    reason: string;
    status: string;
    resolvedAt?: string | null;
  }>;
}

interface ApiSessionProposal {
  id: string;
  studentId: string;
  teacherId: string;
  subject: string;
  startsAt: string;
  durationMins: number;
  timeBlock: string;
  note?: string | null;
  status: string;
  createdAt: string;
  resolvedAt?: string | null;
  declineReason?: string | null;
  preferredAlternativeDay?: string | null;
  preferredAlternativeTime?: string | null;
  preferredAlternativeExactTime?: string | null;
  student?: ApiStudent | null;
  teacher?: ApiTeacherProfile | null;
}

export const familyKeys = {
  profile: ['family', 'profile'] as const,
  students: ['family', 'students'] as const,
  student: (studentId: string) => ['family', 'students', studentId] as const,
  sessions: ['family', 'sessions'] as const,
  proposals: ['family', 'session-proposals'] as const,
  credits: ['family', 'session-credits'] as const,
  bookingRequests: ['family', 'booking-requests'] as const,
};

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
  student?: ApiStudent | null;
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

export interface CreateStudentInput {
  fullName: string;
  age: number;
  grade: GradeLevel;
  gradeOther?: string;
  school?: string;
}

export async function getFamilyProfile() {
  const response = await apiFetch<{ profile: ApiParentProfile }>('/family/me');
  return {
    id: response.profile.id,
    name: response.profile.name,
    email: response.profile.email,
    whatsapp: response.profile.whatsapp ?? '',
    createdAt: response.profile.createdAt,
    childrenIds: [],
  } satisfies Parent;
}

function mapIntake(intake: ApiIntake): IntakeForm {
  const preferredSchedule = intake.schedule.reduce<PreferredSchedule>(
    (schedule, entry) => {
      const day = dayFromApi[entry.day];
      const time = timeFromApi[entry.time];
      if (day && time) schedule[day] = time;
      return schedule;
    },
    {},
  );
  const preferredDays = Object.keys(preferredSchedule) as DayOfWeek[];
  const firstDay = preferredDays[0];

  return {
    subject: intake.subject,
    subjects: intake.subjects,
    subjectOther: intake.subjectOther ?? undefined,
    learningGoal: learningGoalFromApi[intake.learningGoal] ?? 'General improvement',
    currentLevel: currentLevelFromApi[intake.currentLevel] ?? 'Average',
    specificTopics: intake.specificTopics ?? undefined,
    teacherGenderPref: genderFromApi[intake.teacherGenderPref] ?? 'No preference',
    specialNotes: intake.specialNotes ?? undefined,
    preferredSchedule,
    preferredDays,
    preferredTime: firstDay ? preferredSchedule[firstDay] ?? 'Evening' : 'Evening',
    timezone: intake.timezone,
    sessionsPerWeek:
      intake.sessionsPerWeek === 'Flexible'
        ? 'Flexible'
        : ((Number(intake.sessionsPerWeek) || 1) as 1 | 2 | 3),
    budget: intake.budget as IntakeForm['budget'],
  };
}

function mapGoal(goal: ApiGoal): Goal {
  return {
    id: goal.id,
    childId: goal.studentId,
    title: goal.title,
    targetDate: goal.targetDate ?? undefined,
    progress: goal.progress,
  };
}

export function mapStudent(student: ApiStudent): Child {
  const goal = student.goals?.[0];

  return {
    id: student.id,
    parentId: student.parentId,
    fullName: student.fullName,
    age: student.age,
    grade: gradeFromApi[student.grade] ?? 'Other',
    gradeOther: student.gradeOther ?? undefined,
    school: student.school ?? undefined,
    assignedTeacherId: student.assignedTeacherId ?? undefined,
    subjectAssignments: student.subjectAssignments?.map((assignment) => ({
      id: assignment.id,
      childId: assignment.studentId,
      teacherId: assignment.teacherId,
      teacherName: assignment.teacher?.user?.name,
      teacherEmail: assignment.teacher?.user?.email,
      meetLink: assignment.meetLink ?? undefined,
      subject: assignment.subject,
      createdAt: assignment.createdAt,
    })),
    intake: student.intake ? mapIntake(student.intake) : undefined,
    goal: goal ? mapGoal(goal) : undefined,
    streak: { current: 0, longest: 0, lastActiveAt: new Date().toISOString() },
    badges: [],
    status: student.status === 'DEACTIVATED' ? 'Deactivated' : 'Active',
    deactivationReason: student.deactivationReason ?? undefined,
    deactivatedAt: student.deactivatedAt ?? undefined,
  };
}

function mapSessionStatus(status: string): Session['status'] {
  if (status === 'COMPLETED') return 'Completed';
  if (status === 'CANCELLED') return 'Cancelled';
  return 'Upcoming';
}

function mapProposalStatus(status: string): SessionProposal['status'] {
  if (status === 'ACCEPTED') return 'Accepted';
  if (status === 'DECLINED') return 'Declined';
  return 'Pending';
}

function mapCancellationRequester(requester: string) {
  return requester === 'TEACHER' ? 'teacher' : 'family';
}

function mapCancellationStatus(status: string) {
  if (status === 'APPROVED') return 'Approved';
  if (status === 'REJECTED') return 'Rejected';
  return 'Pending';
}

function numberFromAmount(amount: ApiSession['amount']) {
  if (amount === null || amount === undefined) return 0;
  return typeof amount === 'number' ? amount : Number(amount);
}

function mapSessionNote(note: NonNullable<ApiSession['note']>): SessionNote {
  return {
    id: note.id,
    sessionId: note.sessionId ?? '',
    covered: note.covered ?? 'Session completed',
    performance: performanceFromApi[note.performance ?? 'GOOD'] ?? 'Good',
    rating: Math.min(5, Math.max(1, note.rating ?? 3)) as Rating,
    focusNext: note.focusNext ?? 'Continue with the next lesson plan',
    concerns: note.concerns ?? undefined,
    createdAt: note.createdAt ?? new Date().toISOString(),
  };
}

export function mapSession(session: ApiSession): Session {
  const pendingOrLatestCancellation = session.cancellations?.[0];

  return {
    id: session.id,
    childId: session.studentId,
    teacherId: session.teacherId,
    lessonPackageId: session.lessonPackageId ?? undefined,
    childName: session.student?.fullName,
    teacherName: session.teacher?.user?.name,
    subject: session.subject,
    startsAt: session.startsAt,
    durationMins: session.durationMins,
    meetLink: session.meetLink ?? '',
    status: mapSessionStatus(session.status),
    noteId: session.note?.id,
    note: session.note ? mapSessionNote(session.note) : undefined,
    amount: numberFromAmount(session.amount),
    attendance: session.attendance
      ? {
          teacherConfirmedAt:
            session.attendance.teacherConfirmedAt ?? undefined,
          familyConfirmedAt:
            session.attendance.familyConfirmedAt ?? undefined,
        }
      : undefined,
    cancellation: pendingOrLatestCancellation
      ? {
          id: pendingOrLatestCancellation.id,
          requestedBy: mapCancellationRequester(
            pendingOrLatestCancellation.requestedBy,
          ),
          requestedAt: pendingOrLatestCancellation.requestedAt,
          reason: pendingOrLatestCancellation.reason,
          status: mapCancellationStatus(pendingOrLatestCancellation.status),
          resolvedAt: pendingOrLatestCancellation.resolvedAt ?? undefined,
        }
      : undefined,
  };
}

function mapProposal(proposal: ApiSessionProposal): SessionProposal {
  return {
    id: proposal.id,
    childId: proposal.studentId,
    teacherId: proposal.teacherId,
    childName: proposal.student?.fullName,
    teacherName: proposal.teacher?.user?.name,
    subject: proposal.subject,
    startsAt: proposal.startsAt,
    durationMins: proposal.durationMins,
    timeBlock: timeFromApi[proposal.timeBlock] ?? 'Evening',
    note: proposal.note ?? undefined,
    status: mapProposalStatus(proposal.status),
    declineReason: proposal.declineReason ?? undefined,
    preferredAlternative:
      proposal.preferredAlternativeDay && proposal.preferredAlternativeTime
        ? {
            day: dayFromApi[proposal.preferredAlternativeDay],
            time: timeFromApi[proposal.preferredAlternativeTime],
            exactTime: proposal.preferredAlternativeExactTime ?? undefined,
          }
        : undefined,
    createdAt: proposal.createdAt,
    resolvedAt: proposal.resolvedAt ?? undefined,
  };
}

export async function listFamilyStudents() {
  const response = await apiFetch<{ students: ApiStudent[] }>('/family/students');
  return response.students.map(mapStudent);
}

export async function getFamilyStudent(studentId: string) {
  const students = await listFamilyStudents();
  return students.find((student) => student.id === studentId) ?? null;
}

export async function createFamilyStudent(input: CreateStudentInput) {
  const response = await apiFetch<{ student: ApiStudent }>('/family/students', {
    method: 'POST',
    body: JSON.stringify({
      fullName: input.fullName,
      age: input.age,
      grade: gradeToApi[input.grade],
      gradeOther: input.grade === 'Other' ? input.gradeOther : undefined,
      school: input.school,
    }),
  });
  return mapStudent(response.student);
}

export async function updateFamilyStudent(
  studentId: string,
  input: CreateStudentInput,
) {
  const response = await apiFetch<{ student: ApiStudent }>(
    `/family/students/${studentId}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        fullName: input.fullName,
        age: input.age,
        grade: gradeToApi[input.grade],
        gradeOther: input.grade === 'Other' ? input.gradeOther : undefined,
        school: input.school,
      }),
    },
  );
  return mapStudent(response.student);
}

export async function saveFamilyStudentIntake(
  studentId: string,
  intake: IntakeForm,
) {
  const schedule = Object.entries(intake.preferredSchedule ?? {}).map(
    ([day, time]) => ({
      day: dayToApi[day as DayOfWeek],
      time: timeToApi[time],
    }),
  );

  const response = await apiFetch<{ intake: ApiIntake }>(
    `/family/students/${studentId}/intake`,
    {
      method: 'PUT',
      body: JSON.stringify({
        subject: intake.subject,
        subjects: intake.subjects?.length ? intake.subjects : [intake.subject],
        subjectOther: intake.subjectOther,
        learningGoal: learningGoalToApi[intake.learningGoal],
        currentLevel: currentLevelToApi[intake.currentLevel],
        specificTopics: intake.specificTopics,
        teacherGenderPref: genderToApi[intake.teacherGenderPref],
        specialNotes: intake.specialNotes,
        timezone: intake.timezone ?? 'UTC',
        sessionsPerWeek: String(intake.sessionsPerWeek),
        budget: intake.budget,
        schedule,
      }),
    },
  );

  return mapIntake(response.intake);
}

export interface SaveFamilyGoalInput {
  title: string;
  targetDate?: string;
  progress?: number;
}

export async function saveFamilyStudentGoal(
  studentId: string,
  input: SaveFamilyGoalInput,
) {
  const response = await apiFetch<{ goal: ApiGoal }>(
    `/family/students/${studentId}/goal`,
    {
      method: 'PUT',
      body: JSON.stringify({
        title: input.title,
        targetDate: input.targetDate || undefined,
        progress: input.progress,
      }),
    },
  );
  return mapGoal(response.goal);
}

export async function deactivateFamilyStudent(studentId: string, reason: string) {
  const response = await apiFetch<{ student: ApiStudent }>(
    `/family/students/${studentId}/deactivate`,
    {
      method: 'POST',
      body: JSON.stringify({ reason }),
    },
  );
  return mapStudent(response.student);
}

export async function reactivateFamilyStudent(studentId: string) {
  const response = await apiFetch<{ student: ApiStudent }>(
    `/family/students/${studentId}/reactivate`,
    {
      method: 'POST',
    },
  );
  return mapStudent(response.student);
}

export async function listFamilySessions() {
  const response = await apiFetch<{ sessions: ApiSession[] }>('/family/sessions');
  return response.sessions.map(mapSession);
}

export async function getFamilySessionCredits() {
  const response = await apiFetch<{
    credits: Omit<SessionCreditSummary, 'packages'> & {
      packages: Array<{
        id: string;
        childId: string;
        subject: string;
        paidSessions: number;
        usedSessions: number;
        completedSessions: number;
        availableSessions: number;
        status: string;
      }>;
    };
  }>('/family/session-credits');
  return {
    ...response.credits,
    packages: response.credits.packages.map((lessonPackage) => ({
      ...lessonPackage,
      status:
        lessonPackage.status === 'EXHAUSTED'
          ? 'Exhausted'
          : lessonPackage.status === 'CANCELLED'
            ? 'Cancelled'
            : 'Active',
    })),
  } satisfies SessionCreditSummary;
}

export async function listFamilyBookingRequests() {
  const response = await apiFetch<{ requests: ApiBookingRequest[] }>(
    '/family/booking-requests',
  );
  return response.requests.map(mapBookingRequest);
}

export async function createFamilyBookingRequest(input: {
  studentId: string;
  subject: string;
  day: DayOfWeek;
  timeBlock: TimeBlock;
  startTime: string;
  startDate: string;
  sessionsRequested: number;
}) {
  const response = await apiFetch<{ request: ApiBookingRequest }>(
    '/family/booking-requests',
    {
      method: 'POST',
      body: JSON.stringify({
        studentId: input.studentId,
        subject: input.subject,
        day: dayToApi[input.day],
        timeBlock: timeToApi[input.timeBlock],
        startTime: input.startTime,
        startDate: input.startDate,
        sessionsRequested: input.sessionsRequested,
      }),
    },
  );
  return mapBookingRequest(response.request);
}

export async function listFamilySessionProposals() {
  const response = await apiFetch<{ proposals: ApiSessionProposal[] }>(
    '/family/session-proposals',
  );
  return response.proposals.map(mapProposal);
}

export async function acceptFamilySessionProposal(proposalId: string) {
  await apiFetch(`/family/session-proposals/${proposalId}/accept`, {
    method: 'POST',
  });
}

export interface DeclineSessionProposalInput {
  reason: string;
  preferredAlternative?: {
    day: DayOfWeek;
    time: TimeBlock;
  };
  preferredAlternativeExactTime?: string;
}

export async function declineFamilySessionProposal(
  proposalId: string,
  input: DeclineSessionProposalInput,
) {
  await apiFetch(`/family/session-proposals/${proposalId}/decline`, {
    method: 'POST',
    body: JSON.stringify({
      reason: input.reason,
      preferredAlternative: input.preferredAlternative
        ? {
            day: dayToApi[input.preferredAlternative.day],
            time: timeToApi[input.preferredAlternative.time],
          }
        : undefined,
      preferredAlternativeExactTime:
        input.preferredAlternativeExactTime || undefined,
    }),
  });
}

export async function confirmFamilySessionAttendance(sessionId: string) {
  const response = await apiFetch<{ session: ApiSession }>(
    `/family/sessions/${sessionId}/attendance/confirm`,
    { method: 'POST' },
  );
  return mapSession(response.session);
}

export async function requestFamilySessionCancellation(
  sessionId: string,
  reason: string,
) {
  await apiFetch(`/family/sessions/${sessionId}/cancellations`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}
