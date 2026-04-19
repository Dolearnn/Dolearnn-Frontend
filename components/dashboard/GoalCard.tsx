'use client';

import { Target } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Goal } from '@/lib/types';

export default function GoalCard({ goal }: { goal?: Goal }) {
  if (!goal) {
    return (
      <div className="bg-white dark:bg-card rounded-2xl border border-dashed border-gray-300 dark:border-border p-5 text-center">
        <Target className="w-6 h-6 text-gray-400 dark:text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-gray-600 dark:text-foreground font-medium">
          No goal set yet
        </p>
        <p className="text-xs text-gray-400 dark:text-muted-foreground mt-1">
          Goals help us tailor every session.
        </p>
      </div>
    );
  }
  return (
    <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-lg bg-accent2-100 dark:bg-accent2-500/20 text-brand dark:text-accent2-400 flex items-center justify-center">
          <Target className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-muted-foreground">
            Current goal
          </p>
          <p className="font-semibold text-gray-900 dark:text-foreground text-sm">
            {goal.title}
          </p>
        </div>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-accent2-500"
          initial={{ width: 0 }}
          animate={{ width: `${goal.progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-muted-foreground">
        <span>{goal.progress}% complete</span>
        {goal.targetDate && (
          <span>
            by{' '}
            {new Date(goal.targetDate).toLocaleDateString(undefined, {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        )}
      </div>
    </div>
  );
}
