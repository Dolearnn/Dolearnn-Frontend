import { clearAuthSession, getAuthToken } from '@/lib/api/auth-storage';

const DEFAULT_API_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:4000/api'
    : 'https://dolearnn-backend-oi4r.onrender.com/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || DEFAULT_API_URL;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// The backend's answer when a sign-in token is invalid, expired or revoked
// (src/middleware/auth.ts). Other 401s, such as a wrong password at login, are
// normal errors and must not sign anyone out.
const EXPIRED_SESSION = /invalid or expired token/i;
let signingOut = false;

/** Clears the stored session and leaves for the home page (once). */
function endExpiredSession() {
  if (signingOut || typeof window === 'undefined') return;
  signingOut = true;
  clearAuthSession();
  // A full page load also drops any cached private data from memory.
  window.location.replace('/');
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message: string = data?.message ?? data?.error ?? 'Something went wrong';
    // Signed in, but the server no longer accepts the token: sign out.
    if (response.status === 401 && token && EXPIRED_SESSION.test(message)) {
      endExpiredSession();
    }
    throw new ApiError(response.status, message);
  }

  return data as T;
}
