import { apiFetch } from '@/lib/api/client';
import type { AuditLog, Role } from '@/lib/types';

type ApiRole = 'PARENT' | 'STUDENT' | 'TEACHER' | 'ADMIN';

interface ApiAuditLog {
  id: string;
  actorUserId: string | null;
  actorRole: ApiRole | null;
  entityType: string;
  action: string;
  entityId: string;
  category: string;
  outcome: 'SUCCESS' | 'FAILED';
  summary: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  studentId?: string | null;
  teacherId?: string | null;
  createdAt: string;
  actor?: { id: string; name: string; email: string; role: ApiRole } | null;
  student?: { id: string; fullName: string } | null;
  teacher?: { id: string; user: { name: string } } | null;
}

export interface AuditPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AuditStats {
  eventsToday: number;
  failedToday: number;
  activeUsersToday: number;
  categoriesToday: Record<string, number>;
}

export interface AuditActorProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: string;
  createdAt: string;
}

interface ListAdminAuditResponse {
  logs: ApiAuditLog[];
  pagination: AuditPagination;
  stats: AuditStats;
  actor: (Omit<AuditActorProfile, 'role'> & { role: ApiRole }) | null;
  filters: { categories: string[]; actions: string[]; roles: ApiRole[] };
}

export interface ListAdminAuditParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  action?: string;
  actorRole?: ApiRole | 'ALL';
  actorUserId?: string;
  outcome?: 'SUCCESS' | 'FAILED' | 'ALL';
  /** yyyy-mm-dd, inclusive, in the viewer's time zone. */
  from?: string;
  to?: string;
  hidePageViews?: boolean;
}

export const auditKeys = {
  admin: (params: ListAdminAuditParams = {}) => ['admin', 'audit', params] as const,
};

function mapRole(role: ApiRole | null | undefined): Role | undefined {
  switch (role) {
    case 'ADMIN':
      return 'admin';
    case 'TEACHER':
      return 'teacher';
    case 'STUDENT':
    case 'PARENT':
      return 'student';
    default:
      return undefined;
  }
}

function dayStart(day: string) {
  return new Date(`${day}T00:00:00`).toISOString();
}

function dayEnd(day: string) {
  return new Date(`${day}T23:59:59.999`).toISOString();
}

function buildQuery(params: ListAdminAuditParams) {
  const query = new URLSearchParams();
  const set = (key: string, value: string | undefined) => {
    if (value && value !== 'ALL') query.set(key, value);
  };

  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  set('search', params.search?.trim());
  set('category', params.category);
  set('action', params.action);
  set('actorRole', params.actorRole);
  set('actorUserId', params.actorUserId);
  set('outcome', params.outcome);
  if (params.from) query.set('from', dayStart(params.from));
  if (params.to) query.set('to', dayEnd(params.to));
  if (params.hidePageViews) query.set('hidePageViews', 'true');

  const text = query.toString();
  return text ? `?${text}` : '';
}

function mapAuditLog(log: ApiAuditLog): AuditLog {
  return {
    id: log.id,
    actorUserId: log.actorUserId ?? undefined,
    actorRole: mapRole(log.actor?.role ?? log.actorRole),
    actorName: log.actor?.name ?? undefined,
    actorEmail: log.actor?.email ?? undefined,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    category: log.category ?? 'ADMIN',
    outcome: log.outcome ?? 'SUCCESS',
    summary: log.summary,
    metadata: log.metadata ?? null,
    ipAddress: log.ipAddress ?? undefined,
    userAgent: log.userAgent ?? undefined,
    childId: log.student?.id ?? log.studentId ?? undefined,
    childName: log.student?.fullName ?? undefined,
    teacherId: log.teacher?.id ?? log.teacherId ?? undefined,
    teacherName: log.teacher?.user.name ?? undefined,
    createdAt: log.createdAt,
  };
}

export async function listAdminAuditLogs(params: ListAdminAuditParams = {}) {
  const response = await apiFetch<ListAdminAuditResponse>(`/admin/audit${buildQuery(params)}`);

  return {
    logs: response.logs.map(mapAuditLog),
    pagination: response.pagination,
    stats: response.stats,
    actor: response.actor
      ? { ...response.actor, role: mapRole(response.actor.role) ?? 'student' }
      : null,
    filters: response.filters,
  };
}
