'use client';

import { motion } from 'framer-motion';

export default function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6"
    >
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-brand dark:text-accent2-400">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </div>
      {action}
    </motion.div>
  );
}
