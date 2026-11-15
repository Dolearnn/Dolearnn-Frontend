'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  FileSearch,
  RefreshCw,
  Search,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import StatTile from '@/components/dashboard/StatTile';
import { PageShellSkeleton } from '@/components/dashboard/Skeletons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
import { auditKeys, listAdminAuditLogs, type ListAdminAuditParams } from '@/lib/api/audit';
import type { AuditLog } from '@/lib/types';
import { cn } from '@/lib/utils';

const PAGE_SIZE_OPTIONS = ['25', '50', '100'] as const;
const LIVE_REFRESH_MS = 30_000;

const CATEGORY_LABELS: Record<string, string> = {
  AUTH: 'Sign-in',
  ACCOUNT: 'Account',
  PRACTICE: 'Practice',
  ARENA: 'Arena',
  DAILY: 'Daily quiz',
  TUTORING: 'Tutoring',
  PAYMENTS: 'Payments',
  NOTIFICATIONS: 'Notifications',
  CONTENT: 'Question bank',
  ADMIN: 'Admin',
  PUBLIC: 'Website',
  NAVIGATION: 'Page views',
  OTHER: 'Other',
};

const CATEGORY_TONES: Record<string, string> = {
  AUTH: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/30',
  ACCOUNT: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/30',
  PRACTICE: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/30',
  ARENA: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/30',
  DAILY: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',
  TUTORING: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30',
  PAYMENTS: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/30',
  NOTIFICATIONS: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-white/5 dark:text-muted-foreground dark:border-border',
  CONTENT: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/30',
  ADMIN: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30',
  PUBLIC: 'bg-lime-50 text-lime-700 border-lime-200 dark:bg-lime-500/10 dark:text-lime-300 dark:border-lime-500/30',
  NAVIGATION: 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-white/5 dark:text-muted-foreground dark:border-border',
  OTHER: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-white/5 dark:text-muted-foreground dark:border-border',
};

const ROLE_LABELS: Record<string, string> = {
  STUDENT: 'Learners',
  TEACHER: 'Teachers',
  ADMIN: 'Admins',
  PARENT: 'Parents (old accounts)',
};

function labelize(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((chunk, index) => (index === 0 ? chunk.charAt(0).toUpperCase() + chunk.slice(1) : chunk))
    .join(' ');
}

function categoryLabel(value: string) {
  return CATEGORY_LABELS[value] ?? labelize(value);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function timeAgo(value: string) {
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (Number.isNaN(seconds)) return '';
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return `${days} d ago`;
}

/** "Chrome on Android" from a user-agent string; rough on purpose. */
function deviceLabel(userAgent?: string) {
  if (!userAgent) return undefined;
  const ua = userAgent;
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\/|Opera/.test(ua)
      ? 'Opera'
      : /SamsungBrowser/.test(ua)
        ? 'Samsung Internet'
        : /Chrome\//.test(ua)
          ? 'Chrome'
          : /Firefox\//.test(ua)
            ? 'Firefox'
            : /Safari\//.test(ua)
              ? 'Safari'
              : undefined;
  const os = /Android/.test(ua)
    ? 'Android'
    : /iPhone|iPad|iPod/.test(ua)
      ? 'iOS'
      : /Windows/.test(ua)
        ? 'Windows'
        : /Mac OS X|Macintosh/.test(ua)
          ? 'macOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : undefined;
  if (browser && os) return `${browser} on ${os}`;
  return browser ?? os ?? 'Unknown device';
}

function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

function relatedTo(log: AuditLog) {
  const parts: string[] = [];
  if (log.childName) parts.push(`Learner: ${log.childName}`);
  if (log.teacherName) parts.push(`Tutor: ${log.teacherName}`);
  return parts.join(' · ');
}

export default function AdminAuditPage() {
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounced(searchInput, 300);
  const [category, setCategory] = useState('ALL');
  const [action, setAction] = useState('ALL');
  const [actorRole, setActorRole] = useState<NonNullable<ListAdminAuditParams['actorRole']>>('ALL');
  const [outcome, setOutcome] = useState<NonNullable<ListAdminAuditParams['outcome']>>('ALL');
  const [actorUserId, setActorUserId] = useState<string | undefined>();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [hidePageViews, setHidePageViews] = useState(false);
  const [live, setLive] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>('50');
  const [expanded, setExpanded] = useState<string | null>(null);

  // Any filter change starts again from the first page.
  useEffect(() => {
    setPage(1);
  }, [search, category, action, actorRole, outcome, actorUserId, from, to, hidePageViews, pageSize]);

  const params = useMemo<ListAdminAuditParams>(
    () => ({
      page,
      pageSize: Number(pageSize),
      search,
      category,
      action,
      actorRole,
      outcome,
      actorUserId,
      from: from || undefined,
      to: to || undefined,
      hidePageViews,
    }),
    [action, actorRole, actorUserId, category, from, hidePageViews, outcome, page, pageSize, search, to],
  );

  const auditQuery = useQuery({
    queryKey: auditKeys.admin(params),
    queryFn: () => listAdminAuditLogs(params),
    placeholderData: keepPreviousData,
    // Newest activity streams in while you watch the first page.
    refetchInterval: live && page === 1 ? LIVE_REFRESH_MS : false,
    refetchIntervalInBackground: false,
  });

  const filtersActive =
    Boolean(search) ||
    category !== 'ALL' ||
    action !== 'ALL' ||
    actorRole !== 'ALL' ||
    outcome !== 'ALL' ||
    Boolean(actorUserId) ||
    Boolean(from) ||
    Boolean(to) ||
    hidePageViews;

  const clearFilters = () => {
    setSearchInput('');
    setCategory('ALL');
    setAction('ALL');
    setActorRole('ALL');
    setOutcome('ALL');
    setActorUserId(undefined);
    setFrom('');
    setTo('');
    setHidePageViews(false);
  };

  if (auditQuery.isLoading && !auditQuery.data) {
    return <PageShellSkeleton />;
  }

  if (auditQuery.isError && !auditQuery.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Activity log" description="" />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {auditQuery.error instanceof Error ? auditQuery.error.message : 'Could not load the activity log.'}
        </div>
      </div>
    );
  }

  const result = auditQuery.data;
  const logs = result?.logs ?? [];
  const pagination = result?.pagination ?? { page: 1, pageSize: Number(pageSize), total: 0, totalPages: 1 };
  // Defaults keep the page working against an older backend that lacks these fields.
  const stats = {
    eventsToday: result?.stats?.eventsToday ?? 0,
    failedToday: result?.stats?.failedToday ?? 0,
    activeUsersToday: result?.stats?.activeUsersToday ?? 0,
    categoriesToday: result?.stats?.categoriesToday ?? {},
  };
  const filters = {
    categories: result?.filters?.categories ?? [],
    actions: result?.filters?.actions ?? [],
    roles: result?.filters?.roles ?? [],
  };
  const actor = result?.actor ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity log"
        description="Everything people do on DoLearnn: sign-ins, practice, Arena, the daily quiz, tutoring, payments, admin work and the pages they open."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile icon={Activity} label="Events, last 24 hours" value={stats.eventsToday.toLocaleString()} accent />
        <StatTile icon={Users} label="Active people, last 24 hours" value={stats.activeUsersToday.toLocaleString()} />
        <button
          type="button"
          className="text-left"
          onClick={() => setOutcome(outcome === 'FAILED' ? 'ALL' : 'FAILED')}
          title="Show only failed actions"
        >
          <StatTile
            icon={AlertTriangle}
            label="Failed actions, last 24 hours"
            value={stats.failedToday.toLocaleString()}
            sub={outcome === 'FAILED' ? 'Showing failures only' : 'Click to see them'}
          />
        </button>
      </div>

      {/* Areas of the platform, with how busy each was in the last 24 hours. */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory('ALL')}
          className={cn(
            'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
            category === 'ALL'
              ? 'border-brand bg-brand text-white dark:border-accent2-500 dark:bg-accent2-500 dark:text-brand'
              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-border dark:bg-card dark:text-muted-foreground dark:hover:bg-white/5',
          )}
        >
          All areas
        </button>
        {filters.categories.map((value) => {
          const count = stats.categoriesToday[value] ?? 0;
          const active = category === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(active ? 'ALL' : value)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                active
                  ? 'border-brand bg-brand text-white dark:border-accent2-500 dark:bg-accent2-500 dark:text-brand'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-border dark:bg-card dark:text-muted-foreground dark:hover:bg-white/5',
              )}
            >
              {categoryLabel(value)}
              <span className={cn('ml-1.5 tabular-nums', active ? 'opacity-80' : 'text-gray-400 dark:text-muted-foreground/70')}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-border dark:bg-card">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_170px_150px_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search name, email, activity, id or IP"
              className="rounded-full pl-9"
            />
          </div>

          <Select value={actorRole} onValueChange={(value) => setActorRole(value as typeof actorRole)}>
            <SelectTrigger className="rounded-full">
              <SelectValue placeholder="Who" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Everyone</SelectItem>
              {filters.roles.map((value) => (
                <SelectItem key={value} value={value}>
                  {ROLE_LABELS[value] ?? labelize(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={outcome} onValueChange={(value) => setOutcome(value as typeof outcome)}>
            <SelectTrigger className="rounded-full">
              <SelectValue placeholder="Outcome" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Any outcome</SelectItem>
              <SelectItem value="SUCCESS">Succeeded</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="rounded-full">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              <SelectItem value="ALL">All actions</SelectItem>
              {filters.actions.map((value) => (
                <SelectItem key={value} value={value}>
                  {labelize(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2 text-gray-600 dark:text-muted-foreground">
            From
            <Input type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} className="h-9 w-[150px] rounded-full" />
          </label>
          <label className="flex items-center gap-2 text-gray-600 dark:text-muted-foreground">
            To
            <Input type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} className="h-9 w-[150px] rounded-full" />
          </label>
          <label className="flex items-center gap-2 text-gray-600 dark:text-muted-foreground">
            <Switch checked={hidePageViews} onCheckedChange={setHidePageViews} />
            Hide page views
          </label>
          <label className="flex items-center gap-2 text-gray-600 dark:text-muted-foreground" title="Refresh the first page every 30 seconds">
            <Switch checked={live} onCheckedChange={setLive} />
            Live
          </label>
          <div className="ml-auto flex items-center gap-2">
            {filtersActive ? (
              <Button variant="ghost" size="sm" className="rounded-full" onClick={clearFilters}>
                <X className="mr-1 h-4 w-4" /> Clear filters
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => void auditQuery.refetch()}
              disabled={auditQuery.isFetching}
            >
              <RefreshCw className={cn('mr-1 h-4 w-4', auditQuery.isFetching && 'animate-spin')} /> Refresh
            </Button>
            <Select value={pageSize} onValueChange={(value) => setPageSize(value as typeof pageSize)}>
              <SelectTrigger className="h-9 w-[130px] rounded-full">
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
        </div>
      </div>

      {actorUserId ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm dark:border-sky-500/30 dark:bg-sky-500/10">
          <UserRound className="h-5 w-5 text-sky-700 dark:text-sky-300" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 dark:text-foreground">
              Everything by {actor?.name ?? 'this person'}
            </p>
            {actor ? (
              <p className="text-xs text-gray-600 dark:text-muted-foreground">
                {actor.email} · {labelize(actor.role)} · {labelize(actor.status)} · joined{' '}
                {new Date(actor.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            ) : null}
          </div>
          <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setActorUserId(undefined)}>
            <X className="mr-1 h-4 w-4" /> Show everyone
          </Button>
        </div>
      ) : null}

      {logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-border dark:bg-card">
          <FileSearch className="mx-auto mb-2 h-6 w-6 text-gray-400 dark:text-muted-foreground" />
          <p className="text-sm font-semibold text-gray-700 dark:text-foreground/90">No activity found</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-muted-foreground">
            {filtersActive ? 'Try clearing some filters.' : 'As people use the platform, what they do will show up here.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-border dark:bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-background dark:text-muted-foreground">
                <tr>
                  <th className="w-8 px-2 py-3" />
                  <th className="px-4 py-3 text-left font-medium">When</th>
                  <th className="px-4 py-3 text-left font-medium">Who</th>
                  <th className="px-4 py-3 text-left font-medium">What they did</th>
                  <th className="px-4 py-3 text-left font-medium">Area</th>
                  <th className="px-4 py-3 text-left font-medium">Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-border">
                {logs.map((log) => {
                  const open = expanded === log.id;
                  const failed = log.outcome === 'FAILED';
                  const related = relatedTo(log);
                  return (
                    <Fragment key={log.id}>
                      <tr
                        className={cn(
                          'cursor-pointer align-top hover:bg-gray-50 dark:hover:bg-white/5',
                          failed && 'bg-red-50/40 dark:bg-red-500/5',
                        )}
                        onClick={() => setExpanded(open ? null : log.id)}
                      >
                        <td className="px-2 py-3 text-gray-400">
                          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <p className="text-gray-700 dark:text-foreground/90">{timeAgo(log.createdAt)}</p>
                          <p className="text-xs text-gray-500 dark:text-muted-foreground">{formatDateTime(log.createdAt)}</p>
                        </td>
                        <td className="px-4 py-3">
                          {log.actorUserId ? (
                            <button
                              type="button"
                              className="text-left"
                              title="Show everything this person did"
                              onClick={(event) => {
                                event.stopPropagation();
                                setActorUserId(log.actorUserId);
                              }}
                            >
                              <p className="font-semibold text-gray-900 hover:underline dark:text-foreground">
                                {log.actorName ?? 'Unknown user'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-muted-foreground">
                                {log.actorRole ? `${labelize(log.actorRole)} · ` : ''}
                                {log.actorEmail ?? '--'}
                              </p>
                            </button>
                          ) : (
                            <>
                              <p className="font-semibold text-gray-500 dark:text-muted-foreground">Visitor</p>
                              <p className="text-xs text-gray-500 dark:text-muted-foreground">
                                {typeof log.metadata?.attemptedEmail === 'string' ? log.metadata.attemptedEmail : 'not signed in'}
                              </p>
                            </>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-800 dark:text-foreground/90">
                            {failed ? (
                              <span className="mr-2 inline-flex rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                                Failed
                              </span>
                            ) : null}
                            {log.summary}
                          </p>
                          {related ? (
                            <p className="mt-0.5 text-xs text-gray-500 dark:text-muted-foreground">{related}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setCategory(log.category);
                            }}
                            className={cn(
                              'inline-flex whitespace-nowrap rounded-full border px-2 py-1 text-[11px] font-medium',
                              CATEGORY_TONES[log.category] ?? CATEGORY_TONES.OTHER,
                            )}
                          >
                            {categoryLabel(log.category)}
                          </button>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500 dark:text-muted-foreground">
                          <p>{deviceLabel(log.userAgent) ?? '--'}</p>
                          {log.ipAddress ? <p className="font-mono">{log.ipAddress}</p> : null}
                        </td>
                      </tr>
                      {open ? (
                        <tr className="bg-gray-50/70 dark:bg-white/[0.03]">
                          <td />
                          <td colSpan={5} className="px-4 py-4">
                            <dl className="grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2 lg:grid-cols-3">
                              <Detail label="Action" value={log.action} mono />
                              <Detail label="About" value={`${labelize(log.entityType)} · ${log.entityId}`} mono />
                              <Detail label="Outcome" value={failed ? 'Failed' : 'Succeeded'} />
                              {typeof log.metadata?.method === 'string' ? (
                                <Detail
                                  label="Request"
                                  value={`${log.metadata.method} ${String(log.metadata.path ?? '')} → ${String(log.metadata.status ?? '')}`}
                                  mono
                                />
                              ) : null}
                              {typeof log.metadata?.error === 'string' ? (
                                <Detail label="Error shown" value={log.metadata.error} />
                              ) : null}
                              {log.actorUserId ? <Detail label="User id" value={log.actorUserId} mono /> : null}
                              {log.userAgent ? (
                                <div className="sm:col-span-2 lg:col-span-3">
                                  <Detail label="Browser" value={log.userAgent} mono />
                                </div>
                              ) : null}
                            </dl>
                            {log.metadata && !('method' in log.metadata) ? (
                              <pre className="mt-3 overflow-x-auto rounded-lg bg-white p-3 text-[11px] text-gray-700 dark:bg-background dark:text-foreground/80">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            ) : null}
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-4 text-sm text-gray-500 dark:border-border dark:text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div>
              Showing {(pagination.page - 1) * pagination.pageSize + 1}-
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total.toLocaleString()}
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
                    className={cn(pagination.page <= 1 && 'pointer-events-none opacity-50')}
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
                      if (pagination.page < pagination.totalPages) setPage((current) => current + 1);
                    }}
                    className={cn(pagination.page >= pagination.totalPages && 'pointer-events-none opacity-50')}
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

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-gray-500 dark:text-muted-foreground">{label}</dt>
      <dd className={cn('break-all text-gray-800 dark:text-foreground/90', mono && 'font-mono')}>{value}</dd>
    </div>
  );
}
