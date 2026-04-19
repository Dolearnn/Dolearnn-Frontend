'use client';

import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ComingSoon({ phase }: { phase: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="bg-white dark:bg-card border border-dashed border-gray-300 dark:border-border rounded-2xl p-10 text-center"
    >
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent2-100 dark:bg-accent2-500/15 text-brand dark:text-accent2-400 mb-3"
      >
        <Sparkles className="w-5 h-5" />
      </motion.div>
      <p className="text-sm text-gray-700 dark:text-foreground font-medium">
        Coming in {phase}
      </p>
      <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
        Phase 0 scaffolding — real UI lands in the next phases.
      </p>
    </motion.div>
  );
}
