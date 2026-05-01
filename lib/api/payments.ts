import { apiFetch } from '@/lib/api/client';
import type {
  Payment,
  PaymentGateway,
  PaymentPlan,
  PayoutStatus,
  StudentLessonPackage,
} from '@/lib/types';

interface ApiPayment {
  id: string;
  parentId: string;
  plan: string;
  amount: string | number;
  gateway: string;
  createdAt: string;
  sessionsIncluded: number;
  sessionsUsed: number;
  parent?: {
    user?: {
      name: string;
      email: string;
    };
  };
}

interface ApiLessonPackage {
  id: string;
  parentId: string;
  studentId: string;
  subject: string;
  hoursPurchased: number;
  hoursScheduled: number;
  hoursCompleted: number;
  amountPaid: string | number;
  gateway: string;
  status: string;
  createdAt: string;
  parent?: {
    user?: {
      name: string;
    };
  };
  student?: {
    fullName: string;
  };
}

interface ApiParent {
  id: string;
  user?: {
    name: string;
    email: string;
  };
  whatsapp?: string | null;
}

export interface PaymentParent {
  id: string;
  name: string;
  email: string;
  whatsapp?: string;
}

export interface TeacherPayoutSummary {
  teacherId: string;
  teacherName: string;
  subjects: string[];
  hourlyRate: number;
  month: string;
  sessionCount: number;
  verifiedHours: number;
  amount: number;
  status: PayoutStatus;
  paidAt?: string;
  payoutId?: string;
}

export interface TeacherPayoutRecord {
  id: string;
  date: string;
  month: string;
  amount: number;
  status: PayoutStatus;
}

interface ApiPayoutSummary {
  teacherId: string;
  teacherName: string;
  subjects: string[];
  hourlyRate: string | number;
  month: string;
  sessionCount: number;
  verifiedHours: number;
  amount: string | number;
  status: string;
  paidAt?: string | null;
  payoutId?: string | null;
}

interface ApiTeacherPayout {
  id: string;
  teacherId: string;
  month: string;
  amount: string | number;
  status: string;
  paidAt?: string | null;
  createdAt: string;
}

export const paymentKeys = {
  adminPayments: ['admin', 'payments'] as const,
  adminPaymentsPage: (params: ListAdminPaymentsParams = {}) =>
    ['admin', 'payments', params] as const,
  adminLessonPackages: ['admin', 'payments', 'lesson-packages'] as const,
  adminLessonPackagesPage: (params: ListAdminLessonPackagesParams = {}) =>
    ['admin', 'payments', 'lesson-packages', params] as const,
  adminParents: ['admin', 'payments', 'parents'] as const,
  adminPayouts: (month: string) => ['admin', 'payments', 'payouts', month] as const,
  familyPayments: ['family', 'payments'] as const,
  teacherPayouts: ['teacher', 'payouts'] as const,
};

const planFromApi: Record<string, PaymentPlan> = {
  SINGLE_SESSION: 'Single Session',
  STARTER_BUNDLE: 'Starter Bundle',
};

const planToApi: Record<PaymentPlan, string> = {
  'Single Session': 'SINGLE_SESSION',
  'Starter Bundle': 'STARTER_BUNDLE',
};

const gatewayFromApi: Record<string, PaymentGateway> = {
  OFFLINE: 'Offline transfer',
  STRIPE: 'Offline transfer',
  FLUTTERWAVE: 'Offline transfer',
};

const gatewayToApi: Record<PaymentGateway, string> = {
  'Offline transfer': 'STRIPE',
};

function asNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) return 0;
  return typeof value === 'number' ? value : Number(value);
}

function mapLessonPackage(item: ApiLessonPackage): StudentLessonPackage {
  return {
    id: item.id,
    parentId: item.parentId,
    parentName: item.parent?.user?.name,
    childId: item.studentId,
    childName: item.student?.fullName,
    subject: item.subject,
    paidSessions: item.hoursPurchased,
    usedSessions: item.hoursScheduled,
    completedSessions: item.hoursCompleted,
    availableSessions: Math.max(0, item.hoursPurchased - item.hoursScheduled),
    amountPaid: asNumber(item.amountPaid),
    gateway: gatewayFromApi[item.gateway] ?? 'Offline transfer',
    status:
      item.status === 'EXHAUSTED'
        ? 'Exhausted'
        : item.status === 'CANCELLED'
          ? 'Cancelled'
          : 'Active',
    createdAt: item.createdAt,
  };
}

export function mapPayment(payment: ApiPayment): Payment {
  return {
    id: payment.id,
    parentId: payment.parentId,
    plan: planFromApi[payment.plan] ?? 'Starter Bundle',
    amount: asNumber(payment.amount),
    gateway: gatewayFromApi[payment.gateway] ?? 'Offline transfer',
    createdAt: payment.createdAt,
    sessionsIncluded: payment.sessionsIncluded,
    sessionsUsed: payment.sessionsUsed,
  };
}

function mapPayoutSummary(payout: ApiPayoutSummary): TeacherPayoutSummary {
  return {
    teacherId: payout.teacherId,
    teacherName: payout.teacherName,
    subjects: payout.subjects,
    hourlyRate: asNumber(payout.hourlyRate),
    month: payout.month,
    sessionCount: payout.sessionCount,
    verifiedHours: payout.verifiedHours,
    amount: asNumber(payout.amount),
    status: payout.status === 'PAID' ? 'Paid' : 'Pending',
    paidAt: payout.paidAt ?? undefined,
    payoutId: payout.payoutId ?? undefined,
  };
}

export function mapTeacherPayout(payout: ApiTeacherPayout): TeacherPayoutRecord {
  return {
    id: payout.id,
    date: payout.paidAt ?? payout.createdAt,
    month: payout.month,
    amount: asNumber(payout.amount),
    status: payout.status === 'PAID' ? 'Paid' : 'Pending',
  };
}

export async function listAdminPayments() {
  const response = await apiFetch<{
    payments: ApiPayment[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
    summary: {
      total: number;
      amount: number;
      sessionsIncluded: number;
      sessionsUsed: number;
    };
  }>('/admin/payments');
  return response.payments.map(mapPayment);
}

export async function listAdminLessonPackages() {
  const response = await apiFetch<{
    packages: ApiLessonPackage[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
    summary: {
      total: number;
      active: number;
      exhausted: number;
      cancelled: number;
    };
  }>(
    '/admin/payments/lesson-packages',
  );
  return response.packages.map(mapLessonPackage);
}

export interface ListAdminPaymentsParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface ListAdminLessonPackagesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: 'All' | 'Active' | 'Exhausted' | 'Cancelled';
}

function buildPaymentsQuery(params: ListAdminPaymentsParams) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params.search?.trim()) searchParams.set('search', params.search.trim());
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

function buildLessonPackagesQuery(params: ListAdminLessonPackagesParams) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params.search?.trim()) searchParams.set('search', params.search.trim());
  if (params.status && params.status !== 'All') {
    searchParams.set('status', params.status.toUpperCase());
  }
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function listAdminPaymentsPage(
  params: ListAdminPaymentsParams = {},
) {
  const response = await apiFetch<{
    payments: ApiPayment[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
    summary: {
      total: number;
      amount: number;
      sessionsIncluded: number;
      sessionsUsed: number;
    };
  }>(`/admin/payments${buildPaymentsQuery(params)}`);

  return {
    payments: response.payments.map(mapPayment),
    pagination: response.pagination,
    summary: response.summary,
  };
}

export async function listAdminLessonPackagesPage(
  params: ListAdminLessonPackagesParams = {},
) {
  const response = await apiFetch<{
    packages: ApiLessonPackage[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
    summary: {
      total: number;
      active: number;
      exhausted: number;
      cancelled: number;
    };
  }>(`/admin/payments/lesson-packages${buildLessonPackagesQuery(params)}`);

  return {
    packages: response.packages.map(mapLessonPackage),
    pagination: response.pagination,
    summary: response.summary,
  };
}

export async function listAdminPaymentParents() {
  const response = await apiFetch<{ parents: ApiParent[] }>(
    '/admin/payments/parents',
  );
  return response.parents.map((parent) => ({
    id: parent.id,
    name: parent.user?.name ?? 'Parent',
    email: parent.user?.email ?? '',
    whatsapp: parent.whatsapp ?? undefined,
  }));
}

export async function createAdminPayment(input: {
  parentId: string;
  studentId: string;
  subject: string;
  plan: PaymentPlan;
  amount: number;
  gateway: PaymentGateway;
  sessionsIncluded: number;
}) {
  const response = await apiFetch<{
    payment: ApiPayment;
    lessonPackage: ApiLessonPackage;
  }>('/admin/payments', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      plan: planToApi[input.plan],
      gateway: gatewayToApi[input.gateway],
    }),
  });
  return {
    payment: mapPayment(response.payment),
    lessonPackage: mapLessonPackage(response.lessonPackage),
  };
}

export async function listAdminTeacherPayouts(month: string) {
  const response = await apiFetch<{ payouts: ApiPayoutSummary[] }>(
    `/admin/payments/payouts?month=${encodeURIComponent(month)}`,
  );
  return response.payouts.map(mapPayoutSummary);
}

export async function markAdminTeacherPayoutPaid(
  teacherId: string,
  month: string,
) {
  await apiFetch('/admin/payments/payouts/mark-paid', {
    method: 'POST',
    body: JSON.stringify({ teacherId, month }),
  });
}

export async function listFamilyPayments() {
  const response = await apiFetch<{ payments: ApiPayment[] }>('/family/payments');
  return response.payments.map(mapPayment);
}

export async function listTeacherPayouts() {
  const response = await apiFetch<{ payouts: ApiTeacherPayout[] }>(
    '/teacher/payouts',
  );
  return response.payouts.map(mapTeacherPayout);
}
