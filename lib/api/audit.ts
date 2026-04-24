import { apiFetch } from '@/lib/api/client';
import type { AuditAction, AuditEntityType, AuditLog, Role } from '@/lib/types';

interface ApiAuditLog {
  id: string;
  actorUserId: string;
  actorRole: 'PARENT' | 'STUDENT' | 'TEACHER' | 'ADMIN';
  entityType: AuditEntityType;
  action: AuditAction;
  entityId: string;
  summary: string;
  metadata?: Record<string, unknown> | null;
  studentId?: string | null;
  teacherId?: string | null;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    email: string;
  };
  student?: {
    id: string;
    fullName: string;
  } | null;
  teacher?: {
    id: string;
    user: {
      name: string;
    };
  } | null;
}

interface AuditPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface AuditFilters {
  actions: AuditAction[];
  entityTypes: AuditEntityType[];
}

interface ListAdminAuditResponse {
  logs: ApiAuditLog[];
  pagination: AuditPagination;
  filters: AuditFilters;
}

export interface ListAdminAuditParams {
  page?: number;
  pageSize?: number;
  search?: string;
  action?: AuditAction | 'ALL';
  entityType?: AuditEntityType | 'ALL';
}

export const auditKeys = {
  admin: (params: ListAdminAuditParams = {}) => ['admin', 'audit', params] as const,
};

function mapRole(role: ApiAuditLog['actorRole']): Role {
  switch (role) {
    case 'ADMIN':
      return 'admin';
    case 'TEACHER':
      return 'teacher';
    case 'STUDENT':
      return 'student';
    default:
      return 'parent';
  }
}

function buildQuery(params: ListAdminAuditParams) {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params.search?.trim()) searchParams.set('search', params.search.trim());
  if (params.action && params.action !== 'ALL') {
    searchParams.set('action', params.action);
  }
  if (params.entityType && params.entityType !== 'ALL') {
    searchParams.set('entityType', params.entityType);
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

function mapAuditLog(log: ApiAuditLog): AuditLog {
  return {
    id: log.id,
    actorUserId: log.actorUserId,
    actorRole: mapRole(log.actorRole),
    actorName: log.actor.name,
    actorEmail: log.actor.email,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    summary: log.summary,
    metadata: log.metadata ?? null,
    childId: log.student?.id ?? log.studentId ?? undefined,
    childName: log.student?.fullName ?? undefined,
    teacherId: log.teacher?.id ?? log.teacherId ?? undefined,
    teacherName: log.teacher?.user.name ?? undefined,
    createdAt: log.createdAt,
  };
}

export async function listAdminAuditLogs(params: ListAdminAuditParams = {}) {
  const response = await apiFetch<ListAdminAuditResponse>(
    `/admin/audit${buildQuery(params)}`,
  );

  return {
    logs: response.logs.map(mapAuditLog),
    pagination: response.pagination,
    filters: response.filters,
  };
}
