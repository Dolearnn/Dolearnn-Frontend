import { apiFetch } from '@/lib/api/client';

export interface AdminReportTeacherRow {
  teacherId: string;
  teacherName: string;
  subjects: string[];
  hourlyRate: number;
  month: string;
  sessionCount: number;
  verifiedHours: number;
  amount: number;
  status: 'Paid' | 'Pending';
  paidAt?: string | null;
  payoutId?: string | null;
}

export interface AdminReportItem {
  id: string;
  label: string;
  sub: string;
  tone?: 'danger' | 'warning' | 'muted';
}

export interface AdminReport {
  month: string;
  monthOptions: string[];
  summary: {
    revenue: number;
    paymentCount: number;
    verifiedHours: number;
    teacherPayoutDue: number;
    paidTeacherPayout: number;
    margin: number;
    confirmationRate: number;
    cancellationRequests: number;
    approvedCancellations: number;
    activeStudents: number;
    deactivatedStudents: number;
    totalSessions: number;
    completedSessions: number;
    verifiedSessions: number;
  };
  teacherRows: AdminReportTeacherRow[];
  sessionsNeedingAttendance: AdminReportItem[];
  cancellationActivity: AdminReportItem[];
}

export const reportKeys = {
  admin: (month?: string) => ['admin', 'reports', month ?? 'current'] as const,
};

export async function getAdminReport(month?: string) {
  const query = month ? `?month=${encodeURIComponent(month)}` : '';
  const response = await apiFetch<{ report: AdminReport }>(`/admin/reports${query}`);
  return response.report;
}

export interface ImpactReport {
  generatedAt: string;
  people: { families: number; learnerProfiles: number; activeTeachers: number };
  practice: {
    publishedQuestions: number;
    attemptsStarted: number;
    attemptsSubmitted: number;
    attemptsLast30Days: number;
    attemptsLast7Days: number;
    learnersWhoPractised: number;
    activeLearners30Days: number;
    activeLearners7Days: number;
    repeatLearners: number;
    repeatRatePercent: number;
  };
  learning: {
    comparablePairs: number;
    improvedPairs: number;
    improvedPercent: number;
    averageFirstScore: number | null;
    averageLatestScore: number | null;
    averageChangePoints: number | null;
  };
  tutoring: {
    completedSessions: number;
    bookingRequests: number;
    practisedBeforeTutoring: number;
    practisedAfterTutoring: number;
    matchedLearners: number;
    averageScoreBeforeTutoring: number | null;
    averageScoreAfterTutoring: number | null;
  };
  revenue: { totalRevenue: number; paymentCount: number; teacherPayoutsPaid: number };
}

export const impactKeys = { admin: ['admin', 'impact'] as const };

export async function getImpactReport() {
  const response = await apiFetch<{ impact: ImpactReport }>('/admin/reports/impact');
  return response.impact;
}
