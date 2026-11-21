'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-3xl p-4 border transition-colors',
        accent
          ? 'bg-brand text-white border-brand dark:bg-accent2-500 dark:border-accent2-500 dark:text-brand'
          : 'bg-white border-gray-200/80 dark:bg-card dark:border-border',
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className={cn(
            'text-xs font-medium',
            accent
              ? 'text-white/80 dark:text-brand/80'
              : 'text-gray-500 dark:text-muted-foreground',
          )}
        >
          {label}
        </span>
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            accent
              ? 'bg-white/15 text-white dark:bg-brand/15 dark:text-brand'
              : 'bg-accent2-100 text-brand dark:bg-accent2-500/20 dark:text-accent2-400',
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p
        className={cn(
          'font-display text-[28px] font-extrabold leading-none tracking-tight tabular-nums',
          accent ? '' : 'text-gray-900 dark:text-foreground',
        )}
      >
        {value}
      </p>
      {sub && (
        <p
          className={cn(
            'text-xs mt-1',
            accent
              ? 'text-white/70 dark:text-brand/70'
              : 'text-gray-500 dark:text-muted-foreground',
          )}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
