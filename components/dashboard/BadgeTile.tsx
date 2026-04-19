'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Badge } from '@/lib/types';

export default function BadgeTile({
  badge,
  earned,
}: {
  badge: Badge;
  earned: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={earned ? { y: -3, scale: 1.02 } : undefined}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'rounded-2xl p-4 text-center border transition-colors',
        earned
          ? 'bg-accent2-50 dark:bg-accent2-500/10 border-accent2-200 dark:border-accent2-500/30'
          : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-border opacity-60',
      )}
    >
      <div
        className={cn(
          'w-14 h-14 rounded-full mx-auto flex items-center justify-center text-2xl',
          earned ? 'bg-white dark:bg-card' : 'bg-gray-100 dark:bg-white/10 grayscale',
        )}
      >
        {badge.icon}
      </div>
      <p
        className={cn(
          'mt-3 text-sm font-semibold',
          earned
            ? 'text-brand dark:text-accent2-400'
            : 'text-gray-600 dark:text-muted-foreground',
        )}
      >
        {badge.name}
      </p>
      <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1 leading-snug">
        {badge.description}
      </p>
      {earned && badge.earnedAt && (
        <p className="text-[11px] text-accent2-600 dark:text-accent2-400 font-medium mt-2">
          Earned{' '}
          {new Date(badge.earnedAt).toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
          })}
        </p>
      )}
    </motion.div>
  );
}
