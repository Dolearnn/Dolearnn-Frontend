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
