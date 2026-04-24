import { apiFetch } from '@/lib/api/client';

export async function joinWaitlist(input: {
  fullName: string;
  email: string;
  phone: string;
}) {
  return apiFetch<{ ok: boolean }>('/public/waitlist', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function subscribeNewsletter(input: { email: string }) {
  return apiFetch<{ ok: boolean }>('/public/newsletter', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
