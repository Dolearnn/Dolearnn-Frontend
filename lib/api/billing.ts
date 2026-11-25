import { apiFetch, ApiError } from '@/lib/api/client';

export type PlanProduct = 'PRO_MONTH' | 'EXAM_PASS';

export interface PlanOffer {
  product: PlanProduct;
  name: string;
  months: number;
  price: number;
  // The usual price; higher than `price` while the founding offer runs.
  fullPrice: number;
  foundingEndsAt: string | null;
}

export interface PlanPurchase {
  id: string;
  product: PlanProduct;
  amount: number;
  gateway: 'PAYSTACK' | 'OFFLINE' | string;
  channel: string | null;
  reference: string;
  paidAt: string | null;
  startsAt: string | null;
  endsAt: string | null;
}

export interface MyBilling {
  plan: 'FREE' | 'PRO';
  product: PlanProduct | null;
  proUntil: string | null;
  // True for a free learner account (the limits below apply).
  limited: boolean;
  limits: { quizzesPerDay: number; utmePapersPerMonth: number };
  usage: { quizzesToday: number; utmePapersThisMonth: number };
  products: PlanOffer[];
  onlinePayment: boolean;
  purchases: PlanPurchase[];
}

export interface CheckoutResult {
  status: 'PENDING' | 'PAID' | 'FAILED';
  product: PlanProduct;
  endsAt: string | null;
}

export interface AdminPlanPurchase extends Omit<PlanPurchase, 'reference'> {
  reference: string;
  learner: { name: string; email: string };
  note: string | null;
}

export interface AdminPlanReport {
  purchases: AdminPlanPurchase[];
  totals: Array<{ product: PlanProduct; count: number; amount: number }>;
  activeProLearners: number;
}

export const billingKeys = {
  me: ['billing', 'me'] as const,
  confirm: (reference: string) => ['billing', 'confirm', reference] as const,
  adminPurchases: ['billing', 'admin', 'purchases'] as const,
};

export const PRODUCT_NAMES: Record<PlanProduct, string> = {
  PRO_MONTH: 'Pro, 1 month',
  EXAM_PASS: 'Exam Season Pass',
};

/** True when the server turned a quiz down because the free plan's limit is used. */
export function isPlanLimitError(error: unknown) {
  return error instanceof ApiError && error.code === 'PLAN_LIMIT';
}

export function getMyBilling() {
  return apiFetch<MyBilling>('/billing/me');
}

export function startCheckout(product: PlanProduct) {
  return apiFetch<{ authorizationUrl: string; reference: string }>('/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({ product }),
  });
}

export function confirmCheckout(reference: string) {
  return apiFetch<CheckoutResult>('/billing/confirm', {
    method: 'POST',
    body: JSON.stringify({ reference }),
  });
}

export function getAdminPlanPurchases() {
  return apiFetch<AdminPlanReport>('/admin/plans/purchases');
}

export function recordOfflinePlanPurchase(input: {
  email: string;
  product: PlanProduct;
  amount?: number;
  note?: string;
}) {
  return apiFetch<AdminPlanPurchase>('/admin/plans/purchases', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
