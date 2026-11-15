import { apiFetch } from '@/lib/api/client';

/**
 * Tells the server a signed-in user opened a page, for the admin activity log.
 * Never blocks or breaks the page: failures are ignored.
 */
export function trackPageView(path: string, title?: string) {
  apiFetch<null>('/activity/page-view', {
    method: 'POST',
    body: JSON.stringify({ path, ...(title ? { title } : {}) }),
  }).catch(() => undefined);
}
