'use client';

import { Check, Star, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const milestones = [
  { at: 1, label: 'First session', icon: Star },
  { at: 5, label: 'Math Star', icon: Star },
  { at: 10, label: 'Committed', icon: Trophy },
  { at: 20, label: 'DoLearn Champion', icon: Trophy },
];

export default function JourneyMap({
  sessionsCompleted,
}: {
  sessionsCompleted: number;
}) {
  const total = milestones[milestones.length - 1].at;
  const percent = Math.min(100, (sessionsCompleted / total) * 100);

  return (
    <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-gray-500 dark:text-muted-foreground">
            Learning Journey
          </p>
          <p className="font-semibold text-gray-900 dark:text-foreground">
            {sessionsCompleted} of {total} milestones
          </p>
        </div>
      </div>
      <div className="relative pb-8">
        <div className="absolute left-4 right-4 top-5 h-1 bg-gray-100 dark:bg-white/10 rounded-full" />
        <motion.div
          className="absolute left-4 top-5 h-1 bg-accent2-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `calc((100% - 32px) * ${percent / 100})` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        <ol className="relative flex justify-between items-start">
          {milestones.map((m, i) => {
            const reached = sessionsCompleted >= m.at;
            const Icon = reached ? Check : m.icon;
            return (
              <motion.li
                key={m.at}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1, ease: 'easeOut' }}
                className="flex flex-col items-center w-20 text-center"
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 bg-white dark:bg-card',
                    reached
                      ? 'border-accent2-500 text-accent2-500'
                      : 'border-gray-200 dark:border-border text-gray-400 dark:text-muted-foreground',
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <p
                  className={cn(
                    'mt-2 text-xs font-medium leading-tight',
                    reached
                      ? 'text-brand dark:text-accent2-400'
                      : 'text-gray-400 dark:text-muted-foreground',
                  )}
                >
                  {m.label}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-muted-foreground">
                  Session {m.at}
                </p>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
