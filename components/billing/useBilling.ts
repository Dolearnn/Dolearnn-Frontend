'use client';

import { useQuery } from '@tanstack/react-query';
import { billingKeys, getMyBilling } from '@/lib/api/billing';

/** The learner's plan and free-plan usage, shared by every screen that shows it. */
export function useBilling(enabled = true) {
  return useQuery({ queryKey: billingKeys.me, queryFn: getMyBilling, staleTime: 60_000, enabled });
}
