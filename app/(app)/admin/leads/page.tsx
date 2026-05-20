'use client';

import { useMemo, useState } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Inbox, Search } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import {
  leadKeys,
  listAdminLeads,
  updateAdminLeadStatus,
} from '@/lib/api/leads';
import type { Lead, LeadSource, LeadStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

type SourceFilter = 'All' | LeadSource;
type StatusFilter = 'All' | LeadStatus;

const PAGE_SIZE_OPTIONS = ['20', '50', '100'] as const;

const STATUS_STYLES: Record<LeadStatus, string> = {
  New: 'bg-amber-50 text-amber-700 border-amber-200',
  Contacted: 'bg-sky-50 text-sky-700 border-sky-200',
  Qualified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Archived: 'bg-slate-100 text-slate-700 border-slate-200',
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminLeadsPage() {
  const [source, setSource] = useState<SourceFilter>('All');
  const [status, setStatus] = useState<StatusFilter>('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>('20');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const params = useMemo(
    () => ({
      page,
      pageSize: Number(pageSize),
      search,
      source,
      status,
    }),
    [page, pageSize, search, source, status],
  );

  const leadsQuery = useQuery({
    queryKey: leadKeys.admin(params),
    queryFn: () => listAdminLeads(params),
    placeholderData: keepPreviousData,
  });

  const statusMutation = useMutation({
    mutationFn: ({ leadId, status }: { leadId: string; status: LeadStatus }) =>
      updateAdminLeadStatus(leadId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'leads'] });
      toast({ title: 'Lead status updated' });
    },
    onError: (error) => {
      toast({
        title: 'Could not update lead status',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const counts = useMemo(() => {
    const leads = leadsQuery.data?.leads ?? [];
    return {
      All: leadsQuery.data?.pagination.total ?? 0,
      Waitlist: leads.filter((lead) => lead.source === 'Waitlist').length,
      Newsletter: leads.filter((lead) => lead.source === 'Newsletter').length,
    };
  }, [leadsQuery.data]);

  if (leadsQuery.isLoading && !leadsQuery.data) {
    return <PageShellSkeleton />;
  }

  if (leadsQuery.isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Leads" description="" />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {leadsQuery.error instanceof Error
            ? leadsQuery.error.message
            : 'Could not load leads.'}
        </div>
      </div>
    );
  }

  const result = leadsQuery.data;
  const leads = result?.leads ?? [];
  const pagination = result?.pagination ?? {
    page: 1,
    pageSize: Number(pageSize),
    total: 0,
    totalPages: 1,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Waitlist and newsletter signups from the landing page."
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white p-1 dark:border-border dark:bg-card">
          {(['All', 'Waitlist', 'Newsletter'] as SourceFilter[]).map((item) => (
            <button
              key={item}
              onClick={() => {
                setSource(item);
                setPage(1);
              }}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm transition',
                source === item
                  ? 'bg-brand text-white'
                  : 'text-gray-600 hover:text-gray-900 dark:text-muted-foreground dark:hover:text-foreground',
              )}
            >
              {item}
              <span className="ml-2 text-xs opacity-70">
                {counts[item] ?? 0}
              </span>
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_140px] lg:w-[720px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search name, email, phone or user type"
              className="rounded-full pl-9"
            />
          </div>

          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as StatusFilter);
              setPage(1);
            }}
          >
            <SelectTrigger className="rounded-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All statuses</SelectItem>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Contacted">Contacted</SelectItem>
              <SelectItem value="Qualified">Qualified</SelectItem>
              <SelectItem value="Archived">Archived</SelectItem>
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
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total leads" value={String(pagination.total)} />
        <MetricCard
          label="New"
          value={String(
            leads.filter((lead) => lead.status === 'New').length,
          )}
        />
        <MetricCard
          label="Contacted"
          value={String(
            leads.filter((lead) => lead.status === 'Contacted').length,
          )}
        />
        <MetricCard
          label="Qualified"
          value={String(
            leads.filter((lead) => lead.status === 'Qualified').length,
          )}
        />
      </div>

      {leads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-border dark:bg-card">
          <Inbox className="mx-auto mb-2 h-6 w-6 text-gray-400 dark:text-muted-foreground" />
          <p className="text-sm font-semibold text-gray-700 dark:text-foreground/90">
            No leads found
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-muted-foreground">
            New waitlist and newsletter signups will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-border dark:bg-card">
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-background dark:text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Source</th>
                  <th className="px-4 py-3 text-left font-medium">Full name</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Phone</th>
                  <th className="px-4 py-3 text-left font-medium">User type</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Submissions</th>
                  <th className="px-4 py-3 text-left font-medium">First captured</th>
                  <th className="px-4 py-3 text-left font-medium">Last submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-border">
                {leads.map((lead) => {
                  const isUpdating =
                    statusMutation.isPending &&
                    statusMutation.variables?.leadId === lead.id;

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-gray-50 dark:hover:bg-white/5"
                    >
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[11px] font-medium',
                            lead.source === 'Waitlist'
                              ? 'bg-brand/10 text-brand'
                              : 'bg-accent2-50 text-accent2-700',
                          )}
                        >
                          {lead.source}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-foreground/90">
                        {lead.fullName ?? '--'}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-foreground/90">
                        {lead.email}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-foreground/90">
                        {lead.phone ?? '--'}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-foreground/90 capitalize">
                        {lead.userType ?? '--'}
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={lead.status}
                          onValueChange={(value) =>
                            statusMutation.mutate({
                              leadId: lead.id,
                              status: value as LeadStatus,
                            })
                          }
                          disabled={isUpdating}
                        >
                          <SelectTrigger
                            className={cn(
                              'h-9 w-[150px] rounded-full border text-xs',
                              STATUS_STYLES[lead.status],
                            )}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="New">New</SelectItem>
                            <SelectItem value="Contacted">Contacted</SelectItem>
                            <SelectItem value="Qualified">Qualified</SelectItem>
                            <SelectItem value="Archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-muted-foreground">
                        {lead.submissionCount}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-muted-foreground">
                        {formatDateTime(lead.createdAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-muted-foreground">
                        {formatDateTime(lead.lastSubmittedAt)}
                      </td>
                    </tr>
                  );
                })}
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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-border dark:bg-card">
      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-foreground">
        {value}
      </div>
    </div>
  );
}
