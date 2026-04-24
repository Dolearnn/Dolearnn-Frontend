'use client';

import { useMemo, useState } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Search,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import RecordPaymentDialog from '@/components/admin/RecordPaymentDialog';
import PageHeader from '@/components/dashboard/PageHeader';
import StatTile from '@/components/dashboard/StatTile';
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
import { adminKeys, listAdminStudents } from '@/lib/api/admin';
import {
  listAdminLessonPackages,
  listAdminLessonPackagesPage,
  listAdminPaymentParents,
  listAdminPayments,
  listAdminPaymentsPage,
  listAdminTeacherPayouts,
  markAdminTeacherPayoutPaid,
  paymentKeys,
  type PaymentParent,
  type TeacherPayoutSummary,
} from '@/lib/api/payments';
import { cn } from '@/lib/utils';
import type { Child, Payment, StudentLessonPackage } from '@/lib/types';

const EMPTY_PAYMENTS: Payment[] = [];
const EMPTY_PARENTS: PaymentParent[] = [];
const EMPTY_PAYOUT_SUMMARIES: TeacherPayoutSummary[] = [];
const EMPTY_PACKAGES: StudentLessonPackage[] = [];
const EMPTY_CHILDREN: Child[] = [];

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function formatCurrency(value: number) {
  return `$${value.toFixed(0)}`;
}

export default function AdminPaymentsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [month] = useState(currentMonth);
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [packageSearch, setPackageSearch] = useState('');
  const [packageStatus, setPackageStatus] = useState<
    'All' | 'Active' | 'Exhausted' | 'Cancelled'
  >('All');
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [packagesPage, setPackagesPage] = useState(1);

  const paymentsQuery = useQuery({
    queryKey: paymentKeys.adminPaymentsPage({
      page: paymentsPage,
      pageSize: 10,
      search: ledgerSearch,
    }),
    queryFn: () =>
      listAdminPaymentsPage({
        page: paymentsPage,
        pageSize: 10,
        search: ledgerSearch,
      }),
    placeholderData: keepPreviousData,
  });
  const paymentsSummaryQuery = useQuery({
    queryKey: paymentKeys.adminPayments,
    queryFn: listAdminPayments,
  });
  const parentsQuery = useQuery({
    queryKey: paymentKeys.adminParents,
    queryFn: listAdminPaymentParents,
  });
  const studentsQuery = useQuery({
    queryKey: adminKeys.students,
    queryFn: listAdminStudents,
  });
  const packagesQuery = useQuery({
    queryKey: paymentKeys.adminLessonPackagesPage({
      page: packagesPage,
      pageSize: 6,
      search: packageSearch,
      status: packageStatus,
    }),
    queryFn: () =>
      listAdminLessonPackagesPage({
        page: packagesPage,
        pageSize: 6,
        search: packageSearch,
        status: packageStatus,
      }),
    placeholderData: keepPreviousData,
  });
  const packagesSummaryQuery = useQuery({
    queryKey: paymentKeys.adminLessonPackages,
    queryFn: listAdminLessonPackages,
  });
  const payoutsQuery = useQuery({
    queryKey: paymentKeys.adminPayouts(month),
    queryFn: () => listAdminTeacherPayouts(month),
  });

  const payments = paymentsQuery.data?.payments ?? EMPTY_PAYMENTS;
  const paymentsMeta = paymentsQuery.data?.pagination;
  const paymentsSummary = paymentsSummaryQuery.data;
  const parents = parentsQuery.data ?? EMPTY_PARENTS;
  const children = studentsQuery.data ?? EMPTY_CHILDREN;
  const packages = packagesQuery.data?.packages ?? EMPTY_PACKAGES;
  const packagesMeta = packagesQuery.data?.pagination;
  const packagesSummary = packagesSummaryQuery.data;
  const teacherPayouts = payoutsQuery.data ?? EMPTY_PAYOUT_SUMMARIES;
  const isLoading =
    paymentsQuery.isLoading ||
    paymentsSummaryQuery.isLoading ||
    parentsQuery.isLoading ||
    studentsQuery.isLoading ||
    packagesQuery.isLoading ||
    packagesSummaryQuery.isLoading ||
    payoutsQuery.isLoading;
  const isError =
    paymentsQuery.isError ||
    paymentsSummaryQuery.isError ||
    parentsQuery.isError ||
    studentsQuery.isError ||
    packagesQuery.isError ||
    packagesSummaryQuery.isError ||
    payoutsQuery.isError;

  const markPaidMutation = useMutation({
    mutationFn: (teacherId: string) => markAdminTeacherPayoutPaid(teacherId, month),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: paymentKeys.adminPayouts(month),
      });
      toast({
        title: 'Payout marked paid',
        description: 'The teacher can now see this payout as paid.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Could not mark payout paid',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const revenue = paymentsSummary?.reduce((sum, payment) => sum + payment.amount, 0) ?? 0;
  const teacherOwed = teacherPayouts.reduce(
    (sum, row) => sum + (row.status === 'Paid' ? 0 : row.amount),
    0,
  );
  const paidOut = teacherPayouts.reduce(
    (sum, row) => sum + (row.status === 'Paid' ? row.amount : 0),
    0,
  );
  const totalTeacherPayouts = teacherPayouts.reduce(
    (sum, row) => sum + row.amount,
    0,
  );
  const margin = revenue - totalTeacherPayouts;
  const marginPct = revenue > 0 ? Math.round((margin / revenue) * 100) : 0;
  const monthLabel = new Date(`${month}-01T00:00:00`).toLocaleDateString(
    undefined,
    {
      month: 'long',
      year: 'numeric',
    },
  );

  const ledgerRows = useMemo(() => {
    type Row =
      | { kind: 'in'; date: string; amount: number; label: string; sub: string }
      | { kind: 'out'; date: string; amount: number; label: string; sub: string };
    const rows: Row[] = [];

    for (const payment of payments) {
      const parent = parents.find((item) => item.id === payment.parentId);
      rows.push({
        kind: 'in',
        date: payment.createdAt,
        amount: payment.amount,
        label: `${payment.plan} - ${parent?.name ?? 'Parent'}`,
        sub: `${payment.gateway} - ${payment.sessionsUsed}/${payment.sessionsIncluded} used`,
      });
    }

    for (const payout of teacherPayouts.filter((item) => item.status === 'Paid')) {
      rows.push({
        kind: 'out',
        date: payout.paidAt ?? `${payout.month}-01T00:00:00Z`,
        amount: payout.amount,
        label: `${payout.teacherName} payout`,
        sub: `${payout.month} teacher earnings`,
      });
    }

    return rows.sort((a, b) => b.date.localeCompare(a.date));
  }, [payments, teacherPayouts, parents]);

  if (isLoading) {
    return <PageShellSkeleton />;
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Payments" description="" />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          We could not load payments right now. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Revenue, teacher payouts and active plans."
        action={<RecordPaymentDialog parents={parents} students={children} />}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          icon={Wallet}
          label="Revenue"
          value={formatCurrency(revenue)}
          sub={`${paymentsSummary?.length ?? 0} payment records`}
          accent
        />
        <StatTile
          icon={ArrowUpRight}
          label="Teacher payout due"
          value={formatCurrency(teacherOwed)}
          sub={`${teacherPayouts.length} teacher rows`}
        />
        <StatTile
          icon={TrendingUp}
          label="Gross margin"
          value={formatCurrency(margin)}
          sub={`${marginPct}% retained`}
        />
        <StatTile
          icon={ArrowDownRight}
          label="Paid to teachers"
          value={formatCurrency(paidOut)}
          sub="this payout month"
        />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90">
              Teacher payouts for {monthLabel}
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-muted-foreground">
              Pay teachers individually from verified sessions only.
            </p>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-border dark:bg-card">
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-background dark:text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Teacher</th>
                  <th className="px-4 py-3 text-right font-medium">Sessions</th>
                  <th className="px-4 py-3 text-right font-medium">Verified hours</th>
                  <th className="px-4 py-3 text-right font-medium">Rate</th>
                  <th className="px-4 py-3 text-right font-medium">Amount due</th>
                  <th className="px-4 py-3 text-right font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-border">
                {teacherPayouts.map((row) => (
                  <tr key={row.teacherId} className="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 dark:text-foreground">
                        {row.teacherName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-muted-foreground">
                        {row.subjects.join(', ')}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-foreground/90">
                      {row.sessionCount}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-foreground/90">
                      {row.verifiedHours.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-foreground/90">
                      ${row.hourlyRate}/hr
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-foreground">
                      {formatCurrency(row.amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[11px] font-medium',
                          row.status === 'Paid'
                            ? 'bg-accent2-50 text-accent2-700'
                            : row.amount > 0
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-gray-100 text-gray-500',
                        )}
                      >
                        {row.status === 'Paid'
                          ? 'Paid'
                          : row.amount > 0
                            ? 'Pending'
                            : 'No payout'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant={row.status === 'Paid' ? 'outline' : 'default'}
                        className={cn(
                          'rounded-full',
                          row.status !== 'Paid' && 'bg-brand hover:bg-brand-600',
                        )}
                        disabled={
                          row.status === 'Paid' ||
                          row.amount === 0 ||
                          markPaidMutation.isPending
                        }
                        onClick={() => markPaidMutation.mutate(row.teacherId)}
                      >
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                        {row.status === 'Paid' ? 'Paid' : 'Mark paid'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90">
              Student lesson packages
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-muted-foreground">
              Track package usage without loading the full history into one page.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px] lg:w-[520px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-muted-foreground" />
              <Input
                value={packageSearch}
                onChange={(event) => {
                  setPackageSearch(event.target.value);
                  setPackagesPage(1);
                }}
                placeholder="Search parent, student or subject"
                className="rounded-full pl-9"
              />
            </div>

            <Select
              value={packageStatus}
              onValueChange={(value) => {
                setPackageStatus(value as typeof packageStatus);
                setPackagesPage(1);
              }}
            >
              <SelectTrigger className="rounded-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Exhausted">Exhausted</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <MiniMetric label="Total" value={String(packagesSummary?.length ?? 0)} />
          <MiniMetric
            label="Active"
            value={String(
              packagesSummary?.filter((item) => item.status === 'Active').length ?? 0,
            )}
          />
          <MiniMetric
            label="Exhausted"
            value={String(
              packagesSummary?.filter((item) => item.status === 'Exhausted').length ?? 0,
            )}
          />
          <MiniMetric
            label="Cancelled"
            value={String(
              packagesSummary?.filter((item) => item.status === 'Cancelled').length ?? 0,
            )}
          />
        </div>

        {packages.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-muted-foreground">
            No student packages found.
          </p>
        ) : (
          <>
            <div className="grid gap-3 lg:grid-cols-2">
              {packages.map((lessonPackage) => (
                <PackageRow key={lessonPackage.id} lessonPackage={lessonPackage} />
              ))}
            </div>
            {packagesMeta && packagesMeta.totalPages > 1 ? (
              <PaginationBar
                page={packagesMeta.page}
                totalPages={packagesMeta.totalPages}
                onPrevious={() => setPackagesPage((current) => current - 1)}
                onNext={() => setPackagesPage((current) => current + 1)}
              />
            ) : null}
          </>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90">
              Ledger
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-muted-foreground">
              Revenue entries are paged from the backend; paid teacher payouts stay visible here for context.
            </p>
          </div>

          <div className="relative lg:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-muted-foreground" />
            <Input
              value={ledgerSearch}
              onChange={(event) => {
                setLedgerSearch(event.target.value);
                setPaymentsPage(1);
              }}
              placeholder="Search parent name or email"
              className="rounded-full pl-9"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-border dark:bg-card">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-background dark:text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Description</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-border">
              {ledgerRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-foreground/90">
                    {new Date(row.date).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        row.kind === 'in'
                          ? 'rounded-full bg-accent2-50 px-2 py-0.5 text-[11px] font-medium text-accent2-700'
                          : 'rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand'
                      }
                    >
                      {row.kind === 'in' ? 'Revenue' : 'Payout'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-foreground/90">
                    <p className="font-medium text-gray-900 dark:text-foreground">
                      {row.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-muted-foreground">
                      {row.sub}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold whitespace-nowrap text-gray-900 dark:text-foreground">
                    {row.kind === 'in' ? '+' : '-'}{formatCurrency(row.amount)}
                  </td>
                </tr>
              ))}
              {ledgerRows.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    No ledger entries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {paymentsMeta && paymentsMeta.totalPages > 1 ? (
          <PaginationBar
            page={paymentsMeta.page}
            totalPages={paymentsMeta.totalPages}
            onPrevious={() => setPaymentsPage((current) => current - 1)}
            onNext={() => setPaymentsPage((current) => current + 1)}
          />
        ) : null}
      </section>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
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

function PaginationBar({
  page,
  totalPages,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex justify-end">
      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(event) => {
                event.preventDefault();
                if (page > 1) onPrevious();
              }}
              className={cn(page <= 1 && 'pointer-events-none opacity-50')}
            />
          </PaginationItem>
          <PaginationItem>
            <Button variant="ghost" size="sm" className="rounded-full px-4">
              Page {page} of {totalPages}
            </Button>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(event) => {
                event.preventDefault();
                if (page < totalPages) onNext();
              }}
              className={cn(page >= totalPages && 'pointer-events-none opacity-50')}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

function PackageRow({
  lessonPackage,
}: {
  lessonPackage: StudentLessonPackage;
}) {
  const percent =
    lessonPackage.paidSessions > 0
      ? (lessonPackage.usedSessions / lessonPackage.paidSessions) * 100
      : 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-border dark:bg-card">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-foreground">
            {lessonPackage.parentName ?? 'Parent'}
          </p>
          <p className="text-xs text-gray-500 dark:text-muted-foreground">
            {lessonPackage.childName ?? 'Student'} - {lessonPackage.subject}
          </p>
        </div>
        <p className="text-sm font-semibold text-gray-900 dark:text-foreground">
          ${lessonPackage.amountPaid}
        </p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
        <div className="h-full bg-accent2-500" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-[11px] text-gray-500 dark:text-muted-foreground">
        {lessonPackage.usedSessions}/{lessonPackage.paidSessions} scheduled -{' '}
        {lessonPackage.availableSessions} remaining - {lessonPackage.status}
      </p>
    </div>
  );
}
