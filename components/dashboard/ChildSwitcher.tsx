'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Child } from '@/lib/types';

export default function ChildSwitcher({
  students,
  activeId,
  onChange,
}: {
  students: Child[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  if (students.length <= 1) return null;
  return (
    <div className="flex items-center gap-2 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-full p-1 w-fit">
      {students.map((c) => {
        const active = activeId === c.id;
        const deactivated = c.status === 'Deactivated';
        return (
          <button
            key={c.id}
            onClick={() => onChange(c.id)}
            className={cn(
              'relative px-4 py-1.5 rounded-full text-sm transition',
              active
                ? 'text-white dark:text-background'
                : 'text-gray-600 dark:text-muted-foreground hover:text-gray-900 dark:hover:text-foreground',
            )}
          >
            {active && (
              <motion.span
                layoutId="child-switcher-pill"
                className="absolute inset-0 rounded-full bg-brand dark:bg-accent2-400"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {c.fullName.split(' ')[0]}
              {deactivated && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                    active
                      ? 'bg-white/20 text-white dark:text-background'
                      : 'bg-amber-50 text-amber-700',
                  )}
                >
                  Paused
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
