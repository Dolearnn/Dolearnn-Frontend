import { Skeleton } from '@/components/ui/skeleton';

export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <Skeleton className="h-9 w-32 rounded-full" />
    </div>
  );
}

export function StatTileSkeleton() {
  return (
    <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-3 w-10" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export function SessionRowSkeleton() {
  return (
    <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-4 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-20 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>
    </div>
  );
}

export function HeroCardSkeleton() {
  return (
    <section className="bg-brand/10 dark:bg-white/5 rounded-3xl p-6 lg:p-8 relative overflow-hidden">
      <div className="space-y-3 max-w-lg">
        <Skeleton className="h-3 w-24 bg-white/30" />
        <Skeleton className="h-8 w-full bg-white/30" />
        <Skeleton className="h-4 w-2/3 bg-white/30" />
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-9 w-28 rounded-full bg-white/30" />
          <Skeleton className="h-9 w-32 rounded-full bg-white/30" />
        </div>
      </div>
    </section>
  );
}

export function DashboardHomeSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <PageHeaderSkeleton />
      <HeroCardSkeleton />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTileSkeleton />
        <StatTileSkeleton />
        <StatTileSkeleton />
        <StatTileSkeleton />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
          <SessionRowSkeleton />
          <SessionRowSkeleton />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
          <SessionRowSkeleton />
          <SessionRowSkeleton />
        </div>
      </div>
    </div>
  );
}

export function PageShellSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <PageHeaderSkeleton />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <SessionRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
