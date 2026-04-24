'use client';

import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { FileSearch, Search } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import { PageShellSkeleton } from '@/components/dashboard/Skeletons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  auditKeys,
  listAdminAuditLogs,
  type ListAdminAuditParams,
} from '@/lib/api/audit';
import type { AuditAction, AuditEntityType, AuditLog } from '@/lib/types';
import { cn } from '@/lib/utils';

const PAGE_SIZE_OPTIONS = ['20', '50', '100'] as const;

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function labelize(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
}

function actionTone(action: AuditAction) {
  if (action.includes('TERMINATED') || action.includes('REJECTED')) {
    return 'bg-red-50 text-red-700 border-red-200';
  }
  if (action.includes('UPDATED') || action.includes('RECORDED')) {
    return 'bg-sky-50 text-sky-700 border-sky-200';
  }
  if (action.includes('APPROVED') || action.includes('CONFIRMED')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

function entitySummary(log: AuditLog) {
  const parts = [labelize(log.entityType)];
  if (log.childName) parts.push(log.childName);
  if (log.teacherName) parts.push(log.teacherName);
  return parts.join(' · ');
}

export default function AdminAuditPage() {
  const [search, setSearch] = useState('');
  const [action, setAction] = useState<AuditAction | 'ALL'>('ALL');
  const [entityType, setEntityType] = useState<AuditEntityType | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>('20');

  const params = useMemo<ListAdminAuditParams>(
    () => ({
      page,
      pageSize: Number(pageSize),
      search,
      action,
      entityType,
    }),
    [action, entityType, page, pageSize, search],
  );

  const auditQuery = useQuery({
    queryKey: auditKeys.admin(params),
    queryFn: () => listAdminAuditLogs(params),
    placeholderData: keepPreviousData,
  });

  if (auditQuery.isLoading && !auditQuery.data) {
    return <PageShellSkeleton />;
  }

  if (auditQuery.isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Audit trail" description="" />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {auditQuery.error instanceof Error
            ? auditQuery.error.message
            : 'Could not load audit logs.'}
        </div>
      </div>
    );
  }

  const result = auditQuery.data;
  const logs = result?.logs ?? [];
  const pagination = result?.pagination ?? {
    page: 1,
    pageSize: Number(pageSize),
    total: 0,
    totalPages: 1,
  };
  const filters = result?.filters ?? { actions: [], entityTypes: [] };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit trail"
        description="Sensitive admin and attendance actions across the platform."
      />

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px_140px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search actor, summary or entity id"
            className="rounded-full pl-9"
          />
        </div>

        <Select
          value={action}
          onValueChange={(value) => {
            setAction(value as AuditAction | 'ALL');
            setPage(1);
          }}
        >
          <SelectTrigger className="rounded-full">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All actions</SelectItem>
            {filters.actions.map((value) => (
              <SelectItem key={value} value={value}>
                {labelize(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={entityType}
          onValueChange={(value) => {
            setEntityType(value as AuditEntityType | 'ALL');
            setPage(1);
          }}
        >
          <SelectTrigger className="rounded-full">
            <SelectValue placeholder="Entity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All entities</SelectItem>
            {filters.entityTypes.map((value) => (
              <SelectItem key={value} value={value}>
                {labelize(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={pageSize}
          onValueChange={(value) => {
            setPageSize(value as (typeof PAGE_SIZE_OPTIONS)[number]);
            setPage(1);
          }}
        >
          <SelectTrigger className="rounded-full">
            <SelectValue placeholder="Rows" />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option} per page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-border dark:bg-card">
          <FileSearch className="mx-auto mb-2 h-6 w-6 text-gray-400 dark:text-muted-foreground" />
          <p className="text-sm font-semibold text-gray-700 dark:text-foreground/90">
            No audit logs found
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-muted-foreground">
            As sensitive actions happen, they will show up here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-border dark:bg-card">
          <div className="overflow-x-auto">
            <table className="min-w-[1040px] w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-background dark:text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">When</th>
                  <th className="px-4 py-3 text-left font-medium">Actor</th>
                  <th className="px-4 py-3 text-left font-medium">Action</th>
                  <th className="px-4 py-3 text-left font-medium">Entity</th>
                  <th className="px-4 py-3 text-left font-medium">Summary</th>
                  <th className="px-4 py-3 text-left font-medium">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-muted-foreground">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 dark:text-foreground">
                        {log.actorName ?? '--'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-muted-foreground">
                        {(log.actorRole ?? '').toUpperCase()} · {log.actorEmail ?? '--'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-2 py-1 text-[11px] font-medium',
                          actionTone(log.action),
                        )}
                      >
                        {labelize(log.action)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-foreground/90">
                      {entitySummary(log)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-foreground/90">
                      {log.summary}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 dark:text-muted-foreground">
                      {log.entityId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-4 text-sm text-gray-500 dark:border-border dark:text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div>
              Showing {(pagination.page - 1) * pagination.pageSize + 1}-
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
              {pagination.total}
            </div>

            <Pagination className="mx-0 w-auto justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      if (pagination.page > 1) setPage((current) => current - 1);
                    }}
                    className={cn(
                      pagination.page <= 1 && 'pointer-events-none opacity-50',
                    )}
                  />
                </PaginationItem>
                <PaginationItem>
                  <Button variant="ghost" size="sm" className="rounded-full px-4">
                    Page {pagination.page} of {pagination.totalPages}
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      if (pagination.page < pagination.totalPages) {
                        setPage((current) => current + 1);
                      }
                    }}
                    className={cn(
                      pagination.page >= pagination.totalPages &&
                        'pointer-events-none opacity-50',
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
    </div>
  );
}
