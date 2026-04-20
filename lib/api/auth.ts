import { apiFetch } from '@/lib/api/client';
import {
  clearAuthSession,
  saveAuthSession,
  type AuthSession,
  type AuthUser,
} from '@/lib/api/auth-storage';

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput extends LoginInput {
  name: string;
  whatsapp?: string;
}

interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

export function dashboardPathForRole(role: AuthUser['role']) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'TEACHER') return '/teacher';
  return '/family';
}

function storeSession(response: AuthResponse): AuthSession {
  saveAuthSession(response);
  return response;
}

export async function login(input: LoginInput) {
  const response = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return storeSession(response);
}

export async function register(input: RegisterInput) {
  const response = await apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return storeSession(response);
}

export async function getCurrentUser() {
  const response = await apiFetch<{ user: AuthUser }>('/auth/me');
  return response.user;
}

export async function changePassword(input: ChangePasswordInput) {
  const response = await apiFetch<AuthResponse>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return storeSession(response);
}

export async function logout() {
  await apiFetch<null>('/auth/logout', { method: 'POST' }).catch(() => null);
  clearAuthSession();
}
