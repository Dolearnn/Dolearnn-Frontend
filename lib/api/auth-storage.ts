'use client';

const TOKEN_KEY = 'dolearn.auth.token';
const USER_KEY = 'dolearn.auth.user';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'PARENT' | 'STUDENT' | 'TEACHER' | 'ADMIN';
  status: string;
  authProvider?: string;
  mustChangePassword?: boolean;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getAuthUser() {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSession) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, session.token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}
