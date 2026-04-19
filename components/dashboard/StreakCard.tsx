'use client';

import { Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Streak } from '@/lib/types';

export default function StreakCard({ streak }: { streak: Streak }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-500/10 dark:to-red-500/10 rounded-2xl border border-orange-100 dark:border-orange-500/20 p-5"
    >
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2 }}
          className="w-12 h-12 rounded-full bg-white dark:bg-card flex items-center justify-center"
        >
          <Flame className="w-6 h-6 text-orange-500" />
        </motion.div>
        <div>
          <p className="text-xs text-gray-500 dark:text-muted-foreground">
            Learning streak
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-foreground">
            {streak.current}{' '}
            <span className="text-sm font-medium">
              week{streak.current === 1 ? '' : 's'}
            </span>
          </p>
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-muted-foreground mt-3">
        Longest: {streak.longest} week{streak.longest === 1 ? '' : 's'} · Don&apos;t
        break the chain 🔥
      </p>
    </motion.div>
  );
}
