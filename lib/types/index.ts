export type Role = 'parent' | 'student' | 'teacher' | 'admin';

export type GradeLevel =
  | 'Primary'
  | 'JSS'
  | 'SSS'
  | 'College Year 1'
  | 'College Year 2'
  | 'College Year 3'
  | 'College Year 4'
  | 'Other';

export type LearningGoal =
  | 'Exam prep'
  | 'Catch up with school'
  | 'Learn a new skill'
  | 'General improvement';

export type CurrentLevel = 'Struggling' | 'Average' | 'Above average';
export type GenderPreference = 'No preference' | 'Male' | 'Female';
export type TimeBlock = 'Morning' | 'Afternoon' | 'Evening';
export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
export type BudgetTier = 'Under $20' | '$20–$35' | '$35–$50' | '$50+';

export interface Parent {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  createdAt: string;
  childrenIds: string[];
}

export interface Child {
  id: string;
  parentId: string;
  fullName: string;
  age: number;
  grade: GradeLevel;
  gradeOther?: string;
  school?: string;
  avatarUrl?: string;
  assignedTeacherId?: string;
  subjectAssignments?: StudentSubjectAssignment[];
  intake?: IntakeForm;
  goal?: Goal;
  streak: Streak;
  badges: string[];
  status?: ChildStatus;
  deactivationReason?: string;
  deactivatedAt?: string;
}

export interface StudentSubjectAssignment {
  id: string;
  childId: string;
  teacherId: string;
  teacherName?: string;
  teacherEmail?: string;
  meetLink?: string;
  subject: string;
  createdAt: string;
}

export type ChildStatus = 'Active' | 'Deactivated';

export function displayGrade(child: Pick<Child, 'grade' | 'gradeOther'>): string {
  if (child.grade === 'Other' && child.gradeOther?.trim()) {
    return child.gradeOther.trim();
  }
  return child.grade;
}

export type PreferredSchedule = Partial<Record<DayOfWeek, TimeBlock>>;

export interface IntakeForm {
  subject: string;
  subjects?: string[];
  subjectOther?: string;
  learningGoal: LearningGoal;
  currentLevel: CurrentLevel;
  specificTopics?: string;
  teacherGenderPref: GenderPreference;
  specialNotes?: string;
  preferredSchedule?: PreferredSchedule;
  preferredDays: DayOfWeek[];
  preferredTime: TimeBlock;
  timezone?: string;
  sessionsPerWeek: 1 | 2 | 3 | 'Flexible';
  budget: BudgetTier;
}

export const DAY_ORDER: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function scheduleEntries(
  schedule: PreferredSchedule,
): Array<{ day: DayOfWeek; time: TimeBlock }> {
  return DAY_ORDER.filter((d) => schedule[d]).map((d) => ({
    day: d,
    time: schedule[d] as TimeBlock,
  }));
}

export function formatSchedule(schedule: PreferredSchedule): string {
  const entries = scheduleEntries(schedule);
  if (entries.length === 0) return 'No days selected';
  return entries.map((e) => `${e.day} · ${e.time}`).join(', ');
}

export function displaySchedule(
  intake: Pick<
    IntakeForm,
    'preferredSchedule' | 'preferredDays' | 'preferredTime' | 'timezone'
  >,
): string {
  const schedule = intake.preferredSchedule;
  const scheduleText =
    schedule && scheduleEntries(schedule).length > 0
      ? formatSchedule(schedule)
      : `${intake.preferredDays.join(', ')} - ${intake.preferredTime}`;
  return intake.timezone ? `${scheduleText} (${intake.timezone})` : scheduleText;
}

export function displaySubject(
  intake: Pick<IntakeForm, 'subject' | 'subjectOther' | 'subjects'>,
): string {
  if (intake.subjects && intake.subjects.length > 0) {
    const subjects = intake.subjects.map((subject) =>
      subject === 'Other' && intake.subjectOther?.trim()
        ? intake.subjectOther.trim()
        : subject,
    );
    return subjects.join(', ');
  }
  if (intake.subject === 'Other' && intake.subjectOther?.trim()) {
    return intake.subjectOther.trim();
  }
  return intake.subject;
}

export type TeacherStatus = 'Active' | 'Terminated';

export interface Teacher {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneCountry?: string;
  phoneNumber?: string;
  gender?: 'Male' | 'Female';
  photoUrl?: string;
  bio: string;
  subjects: string[];
  qualifications: string[];
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  hourlyRate: number;
  rating: number;
  totalSessions: number;
  studentCount?: number;
  upcomingCount?: number;
  joinedAt: string;
  status?: TeacherStatus;
  terminationReason?: string;
  terminatedAt?: string;
}

export type SessionStatus = 'Upcoming' | 'Completed' | 'Cancelled';

export interface Session {
  id: string;
  childId: string;
  teacherId: string;
  lessonPackageId?: string;
  childName?: string;
  teacherName?: string;
  subject: string;
  startsAt: string;
  durationMins: number;
  meetLink: string;
  status: SessionStatus;
  noteId?: string;
  amount: number;
  attendance?: SessionAttendance;
  cancellation?: SessionCancellation;
  note?: SessionNote;
}

export interface SessionAttendance {
  teacherConfirmedAt?: string;
  familyConfirmedAt?: string;
}

export type CancellationRequester = 'family' | 'teacher';
export type CancellationStatus = 'Pending' | 'Approved' | 'Rejected';

export interface SessionCancellation {
  id?: string;
  requestedBy: CancellationRequester;
  requestedAt: string;
  reason: string;
  status: CancellationStatus;
  resolvedAt?: string;
}

export type SessionProposalStatus = 'Pending' | 'Accepted' | 'Declined';

export interface SessionProposal {
  id: string;
  childId: string;
  teacherId: string;
  childName?: string;
  teacherName?: string;
  subject: string;
  startsAt: string;
  durationMins: number;
  timeBlock: TimeBlock;
  note?: string;
  status: SessionProposalStatus;
  declineReason?: string;
  preferredAlternative?: {
    day: DayOfWeek;
    time: TimeBlock;
    exactTime?: string;
  };
  createdAt: string;
  resolvedAt?: string;
}

export type BookingRequestStatus = 'Pending' | 'Scheduled' | 'Cancelled';

export interface SessionBookingRequest {
  id: string;
  childId: string;
  childName?: string;
  subject: string;
  day: DayOfWeek;
  timeBlock: TimeBlock;
  startTime: string;
  startDate: string;
  sessionsRequested: number;
  status: BookingRequestStatus;
  createdAt: string;
}

export interface SessionCreditSummary {
  paidSessions: number;
  usedSessions: number;
  pendingSessions: number;
  availableSessions: number;
  packages: LessonPackageCredit[];
}

export type LessonPackageStatus = 'Active' | 'Exhausted' | 'Cancelled';

export interface LessonPackageCredit {
  id: string;
  childId: string;
  subject: string;
  paidSessions: number;
  usedSessions: number;
  completedSessions: number;
  availableSessions: number;
  status: LessonPackageStatus;
}

export interface StudentLessonPackage extends LessonPackageCredit {
  childName?: string;
  parentId: string;
  parentName?: string;
  amountPaid: number;
  gateway: PaymentGateway;
  createdAt: string;
}

export function isSessionPayoutEligible(
  attendance?: SessionAttendance,
): boolean {
  return !!attendance?.teacherConfirmedAt && !!attendance?.familyConfirmedAt;
}

export type Performance = 'Excellent' | 'Good' | 'Needs Work';

export type Rating = 1 | 2 | 3 | 4 | 5;

export interface SessionNote {
  id: string;
  sessionId: string;
  covered: string;
  performance: Performance;
  rating: Rating;
  focusNext: string;
  concerns?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  childId: string;
  title: string;
  targetDate?: string;
  progress: number;
}

export interface Streak {
  current: number;
  longest: number;
  lastActiveAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: string;
}

export type PayoutStatus = 'Paid' | 'Pending';

export interface EarningEntry {
  sessionId: string;
  date: string;
  studentName: string;
  subject: string;
  durationMins: number;
  amount: number;
  status: PayoutStatus;
}

export interface Payout {
  id: string;
  date: string;
  amount: number;
  method: 'Bank' | 'Wise' | 'Flutterwave';
}

export type PaymentPlan = 'Single Session' | 'Starter Bundle';
export type PaymentGateway = 'Stripe' | 'Flutterwave';

export interface Payment {
  id: string;
  parentId: string;
  plan: PaymentPlan;
  amount: number;
  gateway: PaymentGateway;
  createdAt: string;
  sessionsIncluded: number;
  sessionsUsed: number;
}

export interface Notification {
  id: string;
  userId: string;
  role: Role;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  childId?: string;
  teacherId?: string;
}

export type LeadSource = 'Waitlist' | 'Newsletter';
export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Archived';

export interface Lead {
  id: string;
  source: LeadSource;
  status: LeadStatus;
  fullName?: string;
  email: string;
  phone?: string;
  submissionCount: number;
  lastSubmittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type AuditAction =
  | 'STUDENT_CREATED'
  | 'PAYMENT_RECORDED'
  | 'PAYOUT_MARKED_PAID'
  | 'MEETING_LINK_UPDATED'
  | 'CANCELLATION_APPROVED'
  | 'CANCELLATION_REJECTED'
  | 'TEACHER_RATE_UPDATED'
  | 'TEACHER_TERMINATED'
  | 'FAMILY_ATTENDANCE_CONFIRMED'
  | 'TEACHER_ATTENDANCE_CONFIRMED';

export type AuditEntityType =
  | 'STUDENT'
  | 'PAYMENT'
  | 'PAYOUT'
  | 'SESSION'
  | 'CANCELLATION'
  | 'TEACHER'
  | 'ATTENDANCE';

export interface AuditLog {
  id: string;
  actorUserId: string;
  actorRole: Role;
  actorName?: string;
  actorEmail?: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  summary: string;
  metadata?: Record<string, unknown> | null;
  childId?: string;
  childName?: string;
  teacherId?: string;
  teacherName?: string;
  createdAt: string;
}
