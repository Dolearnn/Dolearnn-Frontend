import { apiFetch } from '@/lib/api/client';
import type { Lead, LeadSource, LeadStatus, LeadUserType } from '@/lib/types';

type ApiLeadSource = 'WAITLIST' | 'NEWSLETTER';
type ApiLeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'ARCHIVED';

interface ApiLead {
  id: string;
  source: ApiLeadSource;
  status: ApiLeadStatus;
  fullName?: string | null;
  email: string;
  phone?: string | null;
  userType?: LeadUserType | null;
  submissionCount: number;
  lastSubmittedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface LeadPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface LeadFilters {
  sources: ApiLeadSource[];
  statuses: ApiLeadStatus[];
}

interface ListAdminLeadsResponse {
  leads: ApiLead[];
  pagination: LeadPagination;
  filters: LeadFilters;
}

export interface ListAdminLeadsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  source?: LeadSource | 'All';
  status?: LeadStatus | 'All';
}

export const leadKeys = {
  admin: (params: ListAdminLeadsParams = {}) => ['admin', 'leads', params] as const,
};

function mapLeadSource(source: ApiLeadSource): LeadSource {
  return source === 'NEWSLETTER' ? 'Newsletter' : 'Waitlist';
}

function mapLeadStatus(status: ApiLeadStatus): LeadStatus {
  switch (status) {
    case 'CONTACTED':
      return 'Contacted';
    case 'QUALIFIED':
      return 'Qualified';
    case 'ARCHIVED':
      return 'Archived';
    default:
      return 'New';
  }
}

function toApiSource(source?: ListAdminLeadsParams['source']) {
  if (!source || source === 'All') return undefined;
  return source === 'Newsletter' ? 'NEWSLETTER' : 'WAITLIST';
}

function toApiStatus(status?: ListAdminLeadsParams['status']) {
  if (!status || status === 'All') return undefined;
  switch (status) {
    case 'Contacted':
      return 'CONTACTED';
    case 'Qualified':
      return 'QUALIFIED';
    case 'Archived':
      return 'ARCHIVED';
    default:
      return 'NEW';
  }
}

function mapLead(lead: ApiLead): Lead {
  return {
    id: lead.id,
    source: mapLeadSource(lead.source),
    status: mapLeadStatus(lead.status),
    fullName: lead.fullName ?? undefined,
    email: lead.email,
    phone: lead.phone ?? undefined,
    userType: lead.userType ?? undefined,
    submissionCount: lead.submissionCount,
    lastSubmittedAt: lead.lastSubmittedAt,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  };
}

function buildQuery(params: ListAdminLeadsParams) {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params.search?.trim()) searchParams.set('search', params.search.trim());

  const source = toApiSource(params.source);
  if (source) searchParams.set('source', source);

  const status = toApiStatus(params.status);
  if (status) searchParams.set('status', status);

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function listAdminLeads(params: ListAdminLeadsParams = {}) {
  const response = await apiFetch<ListAdminLeadsResponse>(
    `/admin/leads${buildQuery(params)}`,
  );

  return {
    leads: response.leads.map(mapLead),
    pagination: response.pagination,
    filters: {
      sources: response.filters.sources.map(mapLeadSource),
      statuses: response.filters.statuses.map(mapLeadStatus),
    },
  };
}

export async function updateAdminLeadStatus(
  leadId: string,
  status: Exclude<ListAdminLeadsParams['status'], 'All' | undefined>,
) {
  const response = await apiFetch<{ lead: ApiLead }>(`/admin/leads/${leadId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: toApiStatus(status),
    }),
  });

  return mapLead(response.lead);
}
